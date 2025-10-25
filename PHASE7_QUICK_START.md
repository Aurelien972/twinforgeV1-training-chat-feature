# PHASE 7: GUIDE DE DÉMARRAGE RAPIDE

**Pour enrichir 2,517 exercices avec GPT-4o-mini**

---

## ⚡ DÉMARRAGE EN 3 ÉTAPES

### 1️⃣ Configurer OpenAI API

Ajouter au fichier `.env`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2️⃣ Analyser les Exercices

```bash
npm run phase7:verify
```

Cela affiche la progression actuelle et les exercices restants.

### 3️⃣ Lancer l'Enrichissement

```bash
npm run phase7:orchestrate
```

Cela enrichit automatiquement toutes les disciplines.

---

## 📋 TOUTES LES COMMANDES

| Commande | Description |
|----------|-------------|
| `npm run phase7:verify` | Vérifier la progression actuelle |
| `npm run phase7:analyze` | Analyser les exercices incomplets |
| `npm run phase7:enrich:force` | Enrichir Force uniquement |
| `npm run phase7:enrich:functional` | Enrichir Functional uniquement |
| `npm run phase7:enrich:calisthenics` | Enrichir Calisthenics uniquement |
| `npm run phase7:enrich:endurance` | Enrichir Endurance uniquement |
| `npm run phase7:enrich:competitions` | Enrichir Competitions uniquement |
| `npm run phase7:enrich:all` | Enrichir toutes les disciplines |
| `npm run phase7:orchestrate` | Exécution complète orchestrée |

---

## 💰 COÛT ESTIMÉ

**Total: ~$0.28 USD** avec GPT-4o-mini

- Force: ~$0.10
- Functional: ~$0.04
- Calisthenics: ~$0.05
- Endurance: ~$0.04
- Competitions: ~$0.05

---

## 📊 PROGRESSION ACTUELLE

Lancer `npm run phase7:verify` pour voir:

```
FORCE
  Total: 1,138 exercices
  Complètement enrichis: 248 (21.8%)
  Restants: 890
  ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 21.8%

FUNCTIONAL
  Total: 512 exercices
  Complètement enrichis: 133 (26.0%)
  Restants: 379
  ██████████░░░░░░░░░░░░░░░░░░░░ 26.0%

...

RÉSUMÉ GLOBAL
  Total exercices: 3,050
  Complètement enrichis: 571
  Restants à enrichir: 2,479
  Taux de complétion: 18.72%
  ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 18.72%
```

---

## 🎯 WORKFLOW RECOMMANDÉ

### Option A: Tout Enrichir (30-60 min)

```bash
# 1. Vérifier l'état actuel
npm run phase7:verify

# 2. Lancer l'enrichissement complet
npm run phase7:orchestrate

# 3. Vérifier les résultats
npm run phase7:verify
```

### Option B: Enrichir une Discipline à la Fois

```bash
# 1. Vérifier l'état
npm run phase7:verify

# 2. Enrichir Force
npm run phase7:enrich:force

# 3. Vérifier Force
npm run phase7:verify

# 4. Enrichir Functional
npm run phase7:enrich:functional

# Etc...
```

### Option C: Test Rapide

```bash
# Tester avec une seule discipline d'abord
npm run phase7:enrich:force
```

---

## 📁 FICHIERS CRÉÉS

### Scripts

- `scripts/phase7-batch-analysis.ts` - Analyse des incomplets
- `scripts/phase7-batch-enrich.ts` - Enrichissement GPT-4o-mini
- `scripts/phase7-orchestrator.ts` - Orchestration complète
- `scripts/phase7-verify-progress.ts` - Vérification progression

### Documentation

- `PHASE7_README.md` - Documentation complète
- `PHASE7_IMPLEMENTATION_COMPLETE.md` - Rapport d'implémentation
- `PHASE7_QUICK_START.md` - Ce document

### Outputs (générés après exécution)

- `scripts/phase7-analysis/MASTER_REPORT.md` - Rapport d'analyse
- `scripts/phase7-analysis/incomplete_*.json` - Données par discipline
- `scripts/phase7-enrichments/result_*.json` - Résultats par batch
- `scripts/phase7-enrichments/ENRICHMENT_COMPLETE.md` - Rapport final
- `PHASE7_COMPLETE.md` - Synthèse finale

---

## 🔍 VÉRIFICATIONS POST-ENRICHISSEMENT

### Vérifier le Nombre d'Exercices Enrichis

```bash
npm run phase7:verify
```

### Vérifier la Qualité (SQL)

```sql
-- Échantillon aléatoire d'exercices enrichis
SELECT name, discipline, common_mistakes, benefits
FROM exercises
WHERE enrichment_sprint_number = 7
ORDER BY RANDOM()
LIMIT 20;
```

### Tester un Coach

Après enrichissement, générer une prescription Force et vérifier que les métadonnées sont utilisées.

---

## ⚠️ TROUBLESHOOTING

### "supabaseUrl is required"

```bash
source .env
npm run phase7:verify
```

### "OPENAI_API_KEY is missing"

```bash
echo "OPENAI_API_KEY=sk-your-key" >> .env
source .env
```

### Script bloque

- Vérifier la connexion Internet
- Vérifier les crédits OpenAI
- Relancer (reprend automatiquement)

---

## 🎉 APRÈS L'ENRICHISSEMENT

Une fois tous les exercices enrichis:

1. ✅ Vérifier `npm run phase7:verify` affiche 100%
2. ✅ Lire `scripts/phase7-enrichments/ENRICHMENT_COMPLETE.md`
3. ✅ Tester les coaches avec les nouveaux exercices
4. ✅ Mesurer l'amélioration de la génération

---

## 🚀 PRÊT À LANCER?

```bash
# Commande unique pour tout enrichir
npm run phase7:orchestrate
```

**Durée estimée:** 30-60 minutes
**Coût estimé:** ~$0.28 USD

---

**Documentation complète:** `PHASE7_README.md`
**Statut implémentation:** ✅ READY TO USE
