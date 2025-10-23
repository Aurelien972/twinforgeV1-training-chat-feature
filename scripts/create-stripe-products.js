#!/usr/bin/env node

/**
 * Script de création automatique des produits Stripe
 *
 * Usage:
 *   node scripts/create-stripe-products.js --mode=test
 *   node scripts/create-stripe-products.js --mode=live
 *
 * Ce script:
 * 1. Lit la configuration depuis Supabase (token_pricing_config)
 * 2. Crée les produits Stripe pour chaque plan d'abonnement
 * 3. Met à jour la base de données avec les Price IDs
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

console.log(`\n🚀 Création des produits Stripe en mode ${mode.toUpperCase()}\n`);

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
  console.error('⚠️  Impossible de lire le fichier .env, utilisation des variables d\'environnement système');
}

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY;
const STRIPE_SECRET_KEY = mode === 'test'
  ? (process.env.STRIPE_TEST_SECRET_KEY || envVars.STRIPE_TEST_SECRET_KEY)
  : (process.env.STRIPE_LIVE_SECRET_KEY || envVars.STRIPE_LIVE_SECRET_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error(`❌ STRIPE_${mode.toUpperCase()}_SECRET_KEY non définie`);
  console.log('\n💡 Astuce: Ajoutez cette variable à votre fichier .env:');
  console.log(`   STRIPE_${mode.toUpperCase()}_SECRET_KEY=sk_${mode}_...`);
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Configuration des plans (mapping des noms)
const PLAN_CONFIGS = {
  starter_9: {
    name: 'Essential',
    description: 'Plan de démarrage idéal pour découvrir TwinForgeFit',
    features: ['150 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support par email']
  },
  pro_19: {
    name: 'Pro',
    description: 'Pour les utilisateurs réguliers qui veulent progresser',
    features: ['350 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support prioritaire']
  },
  premium_29: {
    name: 'Elite',
    description: 'Plan avancé pour les passionnés de fitness',
    features: ['600 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support prioritaire', 'Accès anticipé aux nouvelles fonctionnalités']
  },
  elite_39: {
    name: 'Champion',
    description: 'Pour les athlètes sérieux qui s\'entraînent intensément',
    features: ['900 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support VIP', 'Accès anticipé', 'Consultation mensuelle']
  },
  expert_49: {
    name: 'Master',
    description: 'Plan expert pour les professionnels du fitness',
    features: ['1 200 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support VIP 24/7', 'Accès anticipé', 'Consultations illimitées']
  },
  master_59: {
    name: 'Legend',
    description: 'Pour les légendes du fitness qui ne font aucun compromis',
    features: ['1 600 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support VIP 24/7', 'Accès anticipé', 'Consultations illimitées', 'API access']
  },
  ultimate_99: {
    name: 'Titan',
    description: 'Le plan ultime pour les titans du fitness',
    features: ['3 000 000 tokens/mois', 'Toutes les fonctionnalités IA', 'Support VIP 24/7', 'Accès anticipé', 'Consultations illimitées', 'API access', 'Fonctionnalités personnalisées']
  }
};

async function createStripeProducts() {
  console.log('📊 Récupération de la configuration depuis Supabase...');

  const { data: pricingConfig, error } = await supabase
    .from('token_pricing_config')
    .select('id, subscription_plans')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('❌ Erreur lors de la récupération de la configuration:', error);
    process.exit(1);
  }

  if (!pricingConfig) {
    console.error('❌ Aucune configuration de pricing active trouvée');
    console.log('\n💡 Vérifiez que la migration du système de tokens a été appliquée:');
    console.log('   supabase/migrations/20251020120000_create_token_system_complete.sql');
    process.exit(1);
  }

  const plans = pricingConfig.subscription_plans;
  const results = {};
  const createdProducts = [];

  console.log(`\n✨ Création de ${Object.keys(plans).length - 1} produits Stripe...\n`);

  for (const [planKey, planData] of Object.entries(plans)) {
    // Skip free plan
    if (planKey === 'free' || planData.price_eur === 0) {
      console.log(`⏭️  Plan gratuit ignoré: ${planKey}`);
      continue;
    }

    const planConfig = PLAN_CONFIGS[planKey];
    if (!planConfig) {
      console.warn(`⚠️  Configuration manquante pour le plan: ${planKey}`);
      continue;
    }

    try {
      // Support both tokens_monthly and tokens_per_month for backward compatibility
      const tokensAmount = planData.tokens_per_month || planData.tokens_monthly;

      console.log(`\n🔨 Création du produit: ${planConfig.name} (${planKey})`);
      console.log(`   Prix: ${planData.price_eur}€/mois | Tokens: ${tokensAmount.toLocaleString()}`);

      // Create Stripe Product
      const product = await stripe.products.create({
        name: `TwinForgeFit ${planConfig.name}`,
        description: planConfig.description,
        metadata: {
          plan_key: planKey,
          tokens_per_month: tokensAmount.toString(),
          environment: mode,
          created_by: 'create-stripe-products-script',
          features: planConfig.features.join(', ')
        }
      });

      console.log(`   ✅ Produit créé: ${product.id}`);

      // Create Stripe Price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(planData.price_eur * 100), // Convert to cents
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan_key: planKey,
          tokens_per_month: tokensAmount.toString(),
          environment: mode,
        },
      });

      console.log(`   ✅ Prix créé: ${price.id}`);

      results[planKey] = {
        product_id: product.id,
        price_id: price.id,
        name: planConfig.name,
        amount: planData.price_eur,
        tokens: tokensAmount
      };

      createdProducts.push({
        planKey,
        productId: product.id,
        priceId: price.id,
        name: planConfig.name
      });

    } catch (error) {
      console.error(`   ❌ Erreur lors de la création de ${planKey}:`, error.message);
      results[planKey] = { error: error.message };
    }
  }

  console.log('\n\n📝 Mise à jour de la configuration dans Supabase...');

  // Update subscription_plans with new stripe_price_id
  const updatedPlans = { ...plans };
  for (const [planKey, result] of Object.entries(results)) {
    if (result.price_id && updatedPlans[planKey]) {
      updatedPlans[planKey].stripe_price_id = result.price_id;
      updatedPlans[planKey].stripe_product_id = result.product_id;
    }
  }

  const { error: updateError } = await supabase
    .from('token_pricing_config')
    .update({
      subscription_plans: updatedPlans,
      updated_at: new Date().toISOString(),
      notes: `Stripe products created in ${mode} mode - ${new Date().toISOString()}`
    })
    .eq('id', pricingConfig.id);

  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour de Supabase:', updateError);
    console.log('\n⚠️  Les produits Stripe ont été créés mais la base de données n\'a pas été mise à jour.');
    console.log('Vous devrez peut-être mettre à jour manuellement les Price IDs.');
  } else {
    console.log('✅ Configuration mise à jour dans Supabase');
  }

  // Display summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('🎉 CRÉATION DES PRODUITS STRIPE TERMINÉE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`Date: ${new Date().toISOString()}\n`);
  console.log('Produits créés:\n');

  createdProducts.forEach(product => {
    console.log(`✅ ${product.name}`);
    console.log(`   Plan Key: ${product.planKey}`);
    console.log(`   Product ID: ${product.productId}`);
    console.log(`   Price ID: ${product.priceId}\n`);
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📋 PROCHAINES ÉTAPES:\n');
  console.log('1. Vérifiez les produits dans votre dashboard Stripe:');
  console.log(`   https://dashboard.stripe.com/${mode === 'test' ? 'test/' : ''}products\n`);
  console.log('2. Testez un paiement avec une carte test Stripe (4242 4242 4242 4242)\n');
  console.log('3. Vérifiez que les webhooks fonctionnent correctement\n');

  if (mode === 'test') {
    console.log('⚠️  Vous êtes en MODE TEST. Pour la production, exécutez:');
    console.log('   node scripts/create-stripe-products.js --mode=live\n');
  } else {
    console.log('✅ Mode PRODUCTION activé. Les paiements réels seront traités.\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  return results;
}

// Run the script
createStripeProducts()
  .then(() => {
    console.log('✨ Script terminé avec succès!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
