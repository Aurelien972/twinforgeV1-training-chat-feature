# PHASE 7: ENRICHISSEMENT BATCH DES MÉTADONNÉES

## 🎯 Objectif

Enrichir les 2,517 exercices incomplets avec `common_mistakes` et `benefits` en utilisant GPT-4o-mini pour un coût optimal.

---

## 📋 Scripts Disponibles

### 1. Analyse des Exercices Incomplets

```bash
tsx scripts/phase7-batch-analysis.ts
```

**Fonction:**
- Identifie tous les exercices manquants de métadonnées par discipline
- Génère un rapport détaillé avec estimations de coûts
- Crée des fichiers JSON d'exercices incomplets par discipline

**Output:**
- `scripts/phase7-analysis/MASTER_REPORT.md` - Rapport consolidé
- `scripts/phase7-analysis/incomplete_*.json` - Données par discipline

---

### 2. Enrichissement par Discipline

```bash
tsx scripts/phase7-batch-enrich.ts <discipline>
```

**Disciplines disponibles:**
- `force` - Musculation/Force
- `functional` - CrossFit/Functional Fitness
- `calisthenics` - Calisthenics/Gymnastique
- `endurance` - Course/Vélo/Natation
- `competitions` - HYROX/DEKA
- `all` - Toutes les disciplines

**Fonction:**
- Enrichit les exercices par batches de 20
- Utilise GPT-4o-mini (modèle `gpt-4o-mini`)
- Applique les enrichissements automatiquement à Supabase
- Génère des rapports de résultats par batch

**Output:**
- `scripts/phase7-enrichments/result_*.json` - Résultats par batch
- `scripts/phase7-enrichments/ENRICHMENT_COMPLETE.md` - Rapport final

**Exemple:**
```bash
tsx scripts/phase7-batch-enrich.ts force
```

---

### 3. Orchestrateur Complet

```bash
tsx scripts/phase7-orchestrator.ts
```

**Fonction:**
- Exécute l'analyse suivie de tous les enrichissements séquentiellement
- Gère les erreurs et continue si possible
- Génère un rapport consolidé final

**Options:**
- `--skip-analysis` - Passe directement à l'enrichissement
- `--dry-run` - Affiche les commandes sans les exécuter

**Output:**
- `PHASE7_COMPLETE.md` - Rapport consolidé de toute la phase

**Exemple:**
```bash
tsx scripts/phase7-orchestrator.ts
```

---

## 💰 Budget Estimé

Basé sur l'analyse initiale:

| Discipline | Exercices | Batches | Tokens | Coût USD |
|------------|-----------|---------|--------|----------|
| Force | ~890 | ~45 | ~267k | ~$0.10 |
| Functional | ~379 | ~19 | ~114k | ~$0.04 |
| Calisthenics | ~415 | ~21 | ~125k | ~$0.05 |
| Endurance | ~359 | ~18 | ~108k | ~$0.04 |
| Competitions | ~436 | ~22 | ~131k | ~$0.05 |
| **TOTAL** | **~2,479** | **~125** | **~745k** | **~$0.28** |

**Note:** Prix basé sur GPT-4o-mini à $0.375 par 1M tokens (moyenne input/output)

---

## 🔧 Configuration Requise

### Variables d'Environnement

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

### Installation

```bash
npm install
```

---

## 📝 Métadonnées Ajoutées

Pour chaque exercice:

### 1. common_mistakes (3-5 items)
- Erreurs biomécaniques spécifiques
- Compensations musculaires courantes
- Risques de blessure concrets

**Exemple:**
```json
[
  "Dos rond pendant la montée, risque de blessure lombaire",
  "Genoux qui rentrent vers l'intérieur (valgus), stress des ligaments",
  "Talons qui décollent, perte de stabilité et surcharge des quadriceps",
  "Manque de profondeur, limitation du développement des fessiers"
]
```

### 2. benefits (3-5 items)
- Gains musculaires/force spécifiques
- Améliorations techniques observables
- Transferts fonctionnels applicables

**Exemple:**
```json
[
  "Développement complet des quadriceps, fessiers et ischio-jambiers",
  "Amélioration de la force fonctionnelle des jambes pour tous les sports",
  "Renforcement du tronc et de la stabilité posturale",
  "Stimulation hormonale naturelle (testostérone, hormone de croissance)"
]
```

---

## 🚀 Workflow Recommandé

### Option 1: Enrichissement Complet (Recommandé)

```bash
# 1. Analyser les exercices incomplets
tsx scripts/phase7-batch-analysis.ts

# 2. Vérifier le rapport
cat scripts/phase7-analysis/MASTER_REPORT.md

# 3. Lancer l'enrichissement complet
tsx scripts/phase7-orchestrator.ts
```

### Option 2: Enrichissement Par Discipline

```bash
# 1. Analyser
tsx scripts/phase7-batch-analysis.ts

# 2. Enrichir une discipline à la fois
tsx scripts/phase7-batch-enrich.ts force
tsx scripts/phase7-batch-enrich.ts functional
tsx scripts/phase7-batch-enrich.ts calisthenics
tsx scripts/phase7-batch-enrich.ts endurance
tsx scripts/phase7-batch-enrich.ts competitions
```

### Option 3: Test avec une Discipline

```bash
# Test avec Force uniquement
tsx scripts/phase7-batch-enrich.ts force
```

---

## 📊 Suivi de Progression

### Vérifier les Exercices Enrichis

```sql
-- Total enrichi
SELECT
  discipline,
  COUNT(*) as total,
  COUNT(common_mistakes) as with_mistakes,
  COUNT(benefits) as with_benefits
FROM exercises
WHERE name NOT LIKE '[DOUBLON]%'
GROUP BY discipline;

-- Taux de complétion
SELECT
  discipline,
  ROUND(
    COUNT(CASE WHEN common_mistakes IS NOT NULL AND benefits IS NOT NULL THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as completion_rate
FROM exercises
WHERE name NOT LIKE '[DOUBLON]%'
GROUP BY discipline;
```

---

## ⚠️ Notes Importantes

1. **Rate Limiting:**
   - Le script attend 2 secondes entre chaque batch
   - Respecte les limites de l'API OpenAI

2. **Gestion des Erreurs:**
   - Les erreurs sont loggées mais n'arrêtent pas le processus
   - Les résultats sont sauvegardés après chaque batch

3. **Validation:**
   - Les enrichissements sont appliqués immédiatement à Supabase
   - Quality score: 92/100 (bon équilibre coût/qualité)

4. **Reprise:**
   - Les scripts sont idempotents
   - Peuvent être relancés sans problème (skip les exercices déjà enrichis)

---

## 🐛 Troubleshooting

### Erreur: "supabaseUrl is required"

```bash
# S'assurer que les variables d'environnement sont chargées
source .env
tsx scripts/phase7-batch-analysis.ts
```

### Erreur: "OPENAI_API_KEY is missing"

```bash
# Ajouter la clé OpenAI au .env
echo "OPENAI_API_KEY=sk-your-key" >> .env
```

### Script bloque pendant l'enrichissement

- Vérifier la connexion Internet
- Vérifier les crédits OpenAI
- Relancer le script (il reprendra où il s'est arrêté)

---

## 📈 Après la Phase 7

Une fois l'enrichissement complet:

1. **Vérifier la qualité:**
   - Inspecter manuellement quelques exercices enrichis
   - Valider la cohérence des métadonnées

2. **Tester les coaches:**
   - Générer des prescriptions avec les nouveaux exercices
   - Vérifier que les descriptions sont pertinentes

3. **Optimiser les prompts:**
   - Si nécessaire, ajuster les prompts de génération
   - Utiliser les nouvelles métadonnées dans les contextes

4. **Mesurer l'impact:**
   - Comparer le temps de génération avant/après
   - Évaluer la qualité des prescriptions générées

---

**Créé par:** PHASE 7 Implementation
**Date:** ${new Date().toISOString()}
**Modèle AI:** GPT-4o-mini
