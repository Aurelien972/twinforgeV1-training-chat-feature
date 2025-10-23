#!/usr/bin/env node

/**
 * Script de vérification des produits Stripe
 *
 * Usage:
 *   node scripts/verify-stripe-products.js --mode=test
 *   node scripts/verify-stripe-products.js --mode=live
 *
 * Ce script:
 * 1. Vérifie que tous les Price IDs sont configurés dans Supabase
 * 2. Valide que les produits existent dans Stripe
 * 3. Compare les prix entre Stripe et Supabase
 * 4. Affiche un rapport détaillé
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'test';

if (!['test', 'live'].includes(mode)) {
  console.error('❌ Mode invalide. Utilisez --mode=test ou --mode=live');
  process.exit(1);
}

console.log(`\n🔍 Vérification des produits Stripe en mode ${mode.toUpperCase()}\n`);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (error) {
  console.warn('⚠️  Impossible de lire le fichier .env');
}

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY;
const STRIPE_SECRET_KEY = mode === 'test'
  ? (process.env.STRIPE_TEST_SECRET_KEY || envVars.STRIPE_TEST_SECRET_KEY)
  : (process.env.STRIPE_LIVE_SECRET_KEY || envVars.STRIPE_LIVE_SECRET_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STRIPE_SECRET_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

async function verifyStripeProducts() {
  console.log('📊 Récupération de la configuration depuis Supabase...');

  const { data: pricingConfig, error } = await supabase
    .from('token_pricing_config')
    .select('subscription_plans')
    .eq('is_active', true)
    .single();

  if (error || !pricingConfig) {
    console.error('❌ Erreur lors de la récupération de la configuration:', error);
    process.exit(1);
  }

  const plans = pricingConfig.subscription_plans;
  const results = {
    configured: [],
    missing: [],
    errors: [],
    mismatch: []
  };

  console.log('\n🔍 Vérification de chaque plan...\n');

  for (const [planKey, planData] of Object.entries(plans)) {
    // Skip free plan
    if (planKey === 'free' || planData.price_eur === 0) {
      console.log(`⏭️  Plan gratuit ignoré: ${planKey}`);
      continue;
    }

    const priceId = planData.stripe_price_id;
    const productId = planData.stripe_product_id;

    console.log(`\n📦 Vérification du plan: ${planKey}`);
    console.log(`   Prix configuré: ${planData.price_eur}€/mois`);
    const tokensAmount = planData.tokens_per_month || planData.tokens_monthly;
    console.log(`   Tokens: ${tokensAmount?.toLocaleString() || 'N/A'}`);

    if (!priceId) {
      console.log('   ❌ Price ID manquant dans Supabase');
      results.missing.push({
        planKey,
        reason: 'No stripe_price_id configured',
        data: planData
      });
      continue;
    }

    console.log(`   Price ID: ${priceId}`);
    if (productId) {
      console.log(`   Product ID: ${productId}`);
    }

    try {
      // Verify price exists in Stripe
      const price = await stripe.prices.retrieve(priceId);
      console.log(`   ✅ Prix trouvé dans Stripe`);

      // Verify amount matches
      const expectedAmount = Math.round(planData.price_eur * 100);
      if (price.unit_amount !== expectedAmount) {
        console.log(`   ⚠️  Montant différent: Stripe=${price.unit_amount/100}€ vs Config=${planData.price_eur}€`);
        results.mismatch.push({
          planKey,
          field: 'amount',
          stripe: price.unit_amount / 100,
          config: planData.price_eur,
          priceId
        });
      } else {
        console.log(`   ✅ Montant correspond: ${price.unit_amount / 100}€`);
      }

      // Verify currency
      if (price.currency !== 'eur') {
        console.log(`   ⚠️  Devise incorrecte: ${price.currency} (attendu: eur)`);
        results.mismatch.push({
          planKey,
          field: 'currency',
          stripe: price.currency,
          config: 'eur',
          priceId
        });
      }

      // Verify recurring
      if (!price.recurring || price.recurring.interval !== 'month') {
        console.log(`   ⚠️  Intervalle incorrect: ${price.recurring?.interval || 'none'} (attendu: month)`);
        results.mismatch.push({
          planKey,
          field: 'interval',
          stripe: price.recurring?.interval || 'none',
          config: 'month',
          priceId
        });
      }

      // Verify product if productId is configured
      if (productId) {
        try {
          const product = await stripe.products.retrieve(productId);
          console.log(`   ✅ Produit trouvé: ${product.name}`);

          if (product.metadata?.plan_key !== planKey) {
            console.log(`   ⚠️  Metadata plan_key ne correspond pas: ${product.metadata?.plan_key} vs ${planKey}`);
          }
        } catch (productError) {
          console.log(`   ⚠️  Produit non trouvé dans Stripe: ${productId}`);
          results.errors.push({
            planKey,
            error: 'Product not found',
            productId
          });
        }
      }

      results.configured.push({
        planKey,
        priceId,
        productId,
        verified: true
      });

    } catch (error) {
      console.log(`   ❌ Erreur lors de la vérification: ${error.message}`);
      results.errors.push({
        planKey,
        priceId,
        error: error.message
      });
    }
  }

  // Display summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 RAPPORT DE VÉRIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  console.log(`✅ Plans configurés et vérifiés: ${results.configured.length}`);
  console.log(`❌ Plans avec Price ID manquant: ${results.missing.length}`);
  console.log(`⚠️  Incohérences détectées: ${results.mismatch.length}`);
  console.log(`❌ Erreurs de vérification: ${results.errors.length}\n`);

  if (results.missing.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ PLANS SANS PRICE ID');
    console.log('═══════════════════════════════════════════════════════════\n');
    results.missing.forEach(item => {
      console.log(`Plan: ${item.planKey}`);
      console.log(`Raison: ${item.reason}\n`);
    });
    console.log('💡 Action: Exécutez le script de création des produits:');
    console.log(`   node scripts/create-stripe-products.js --mode=${mode}\n`);
  }

  if (results.mismatch.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  INCOHÉRENCES DÉTECTÉES');
    console.log('═══════════════════════════════════════════════════════════\n');
    results.mismatch.forEach(item => {
      console.log(`Plan: ${item.planKey}`);
      console.log(`Champ: ${item.field}`);
      console.log(`Stripe: ${item.stripe}`);
      console.log(`Config: ${item.config}`);
      console.log(`Price ID: ${item.priceId}\n`);
    });
    console.log('💡 Action: Vérifiez et corrigez les incohérences dans Stripe ou Supabase\n');
  }

  if (results.errors.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ ERREURS DE VÉRIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');
    results.errors.forEach(item => {
      console.log(`Plan: ${item.planKey}`);
      console.log(`Erreur: ${item.error}`);
      if (item.priceId) console.log(`Price ID: ${item.priceId}`);
      if (item.productId) console.log(`Product ID: ${item.productId}`);
      console.log('');
    });
  }

  if (results.configured.length > 0 && results.missing.length === 0 && results.errors.length === 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 TOUT EST CONFIGURÉ CORRECTEMENT!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Tous les plans payants ont des Price IDs valides');
    console.log('✅ Tous les produits existent dans Stripe');
    console.log('✅ Les montants correspondent entre Stripe et Supabase\n');
    console.log('🚀 Le système de paiement est prêt à être utilisé!\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  return results;
}

// Run the script
verifyStripeProducts()
  .then((results) => {
    const hasIssues = results.missing.length > 0 || results.errors.length > 0;
    if (hasIssues) {
      console.log('⚠️  Des problèmes ont été détectés. Veuillez les corriger avant de continuer.\n');
      process.exit(1);
    } else {
      console.log('✨ Vérification terminée avec succès!\n');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
