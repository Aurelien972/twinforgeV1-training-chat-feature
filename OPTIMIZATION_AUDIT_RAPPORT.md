# Rapport d'Audit - Optimisation Génération de Trainings

**Date:** 2025-10-25
**Objectif:** Réduire le temps de génération de 3+ minutes à moins de 1 minute
**Budget:** 10€+ pour enrichissement batch
**Approche:** Progressive Enhancement (30s base + 15s enrichissement)

---

## 1. État Actuel de la Base de Données

### Statistiques Globales
- **Total exercices:** 2,665
- **Exercices actifs & validés:** 2,655 (99.6%)
- **Exercices par discipline:**
  - Force: 977 (36.8%)
  - Competitions: 436 (16.4%)
  - Calisthenics: 415 (15.6%)
  - Functional: 379 (14.3%)
  - Endurance: 359 (13.5%)
  - Mobility: 63 (2.4%)
  - Rehab: 26 (1.0%)

### Complétude des Métadonnées

#### ✅ EXCELLENT (>95%)
- **Tempo:** 2,665/2,665 (100%) ✅
- **Visual Keywords:** 2,665/2,665 (100%) ✅
- **Safety Notes:** 2,665/2,665 (100%) ✅
- **Muscle Groups:** 2,587/2,665 (97.1%) ✅

#### ⚠️ BON (70-95%)
- **Sets/Reps Range:** 2,147/2,655 (80.9%) ⚠️
- **Equipment:** 1,777/2,655 (66.9%) ⚠️
- **Coaching Cues:** 1,687/2,655 (63.5%) ⚠️

#### ❌ INSUFFISANT (<70%)
- **Progressions/Alternatives:** 261/2,655 (9.8%) ❌

### Trous Critiques à Combler

#### 🔴 PRIORITÉ HAUTE (bloquant pour IA)
- **879 exercices sans équipement assigné** (33.1%)
- **78 exercices sans muscle groups** (2.9%)

#### 🟡 PRIORITÉ MOYENNE (qualité réduite)
- **517 exercices sans sets/reps typiques** (19.5%)
- **2,394 exercices sans progressions** (90.2%)

#### 🟢 PRIORITÉ BASSE (nice-to-have)
- **978 exercices sans coaching cues** (36.8%)

---

## 2. Problèmes de Performance Identifiés

### 2.1 Context Collector - Requêtes DB Massives

**Problème actuel:**
- Charge 30 exercices x 5 disciplines = 150 exercices
- Chaque exercice = 6-8 requêtes SQL (muscle groups, equipment, translations, cues, progressions)
- Total: **~1,200 requêtes SQL par génération** ❌
- Temps estimé: 60-90 secondes

**Solution:**
- Vue matérialisée pré-jointe: 1 requête par exercice
- Filtrage intelligent pré-IA: 40-60 exercices max
- Nouveau total: **~60 requêtes SQL** ✅
- Temps cible: 15-20 secondes

### 2.2 Prompts AI Géants

**Problème actuel:**
- Coach Force prompt: 850 lignes système + 150 exercices formatés
- Format verbeux: 6-8 lignes par exercice
- Total: **~12,000-15,000 tokens par génération** ❌

**Solution:**
- Format compact: 1 ligne par exercice
- Filtrage intelligent: 40-60 exercices max
- Nouveau total: **~4,000-6,000 tokens** ✅
- Réduction: 60% de la taille

### 2.3 Pas de Progressive Enhancement

**Problème actuel:**
- L'utilisateur attend 3+ minutes sans feedback
- Tout est généré d'un coup (all-or-nothing)

**Solution:**
- Phase 1 (30s): Génération rapide avec exercices basiques
- Phase 2 (15s): Enrichissement background (cues, progressions, illustrations)
- L'utilisateur peut commencer à lire en 30s ✅

---

## 3. Plan d'Optimisation - 9 Phases

### Phase 1: Audit ✅ COMPLÉTÉ
- Analyse de la base actuelle
- Identification des trous critiques
- Mesure des performances actuelles

### Phase 2: Vue Matérialisée (NEXT)
- Créer `exercise_catalog_optimized` avec tous les joins
- Réduire 6-8 requêtes → 1 requête par exercice
- Gain estimé: 80% de réduction du temps DB

### Phase 3: Indexes & Cache
- Index GIN sur (discipline, difficulty, is_active, is_validated)
- Colonne `ready_for_ai` (boolean)
- Table `exercise_catalog_snapshots` avec TTL 24h

### Phase 4: Filtrage Intelligent Pré-IA
- Fonction `filter_exercises_smart()` avec scoring
- Limite: 40-60 exercices max (au lieu de 150+)
- Priorité: composés > variété > nouveauté

### Phase 5: Optimisation Prompts AI
- Format compact: `Squat | Inter | Quad,Fess | Barre | 3-0-1-0 | 3-5x5-8`
- Réduction prompts système: 850 → 400 lignes
- Gain: 60% de réduction tokens

### Phase 6: Progressive Enhancement
- Edge function `training-coach-fast` (30s - base)
- Edge function `training-coach-enrich` (15s - background)
- WebSocket ou polling pour update UI

### Phase 7: Enrichissement Batch Nocturne
- Script GPT-4o-mini pour combler les trous
- Priorité: equipment (879) > sets/reps (517) > progressions (2,394)
- Budget estimé: $8-12 pour 2,655 exercices

### Phase 8: Monitoring
- Table `generation_performance_logs`
- Timestamps détaillés par étape
- Dashboard métriques temps réel

### Phase 9: Tests & Validation
- Comparaison avant/après
- Cible: < 1 minute pour 95% des générations

---

## 4. Gains Attendus

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Temps total | 180-240s | 45-60s | 75% ⬇️ |
| Requêtes DB | ~1,200 | ~60 | 95% ⬇️ |
| Taille prompts | 12,000 tokens | 4,000 tokens | 67% ⬇️ |
| Exercices chargés | 150+ | 40-60 | 65% ⬇️ |
| Time to first byte | 180s | 30s | 83% ⬇️ |

---

## 5. Coûts Estimés

### Développement
- Phase 2-3 (DB): 4-6h
- Phase 4-5 (Filtrage + Prompts): 6-8h
- Phase 6 (Progressive Enhancement): 8-10h
- Phase 7 (Batch Enrichment): 2-4h
- Phase 8-9 (Monitoring + Tests): 4-6h
- **Total:** 24-34 heures

### Infrastructure
- Enrichissement batch: $8-12 (one-time)
- Vue matérialisée: refresh quotidien ~$0.01/jour
- Cache snapshots: ~5MB stockage
- **Total:** ~$10 one-time + $0.30/mois

---

## 6. Prochaines Étapes Immédiates

1. ✅ **FAIT:** Audit complet de la base
2. **NEXT:** Créer la vue matérialisée `exercise_catalog_optimized`
3. **NEXT:** Ajouter les indexes de performance
4. **NEXT:** Implémenter le filtrage intelligent

**Prêt à démarrer la Phase 2 !** 🚀
