# Documentation Cerveau Central Utilisateur - TwinForge

## Vue d'ensemble du Concept

Le **Cerveau Central** est le système de mémoire unifiée de TwinForge qui agrège toutes les données utilisateur pour fournir un contexte riche et cohérent à tous les agents IA. C'est la "source de vérité" unique qui permet aux agents de connaître l'utilisateur intimement.

### Principes Fondamentaux

1. **Single Source of Truth** : Une seule source centralisée pour toutes les données utilisateur
2. **Contexte Unifié** : Tous les agents IA accèdent au même contexte enrichi
3. **Mémoire Persistante** : Conservation des conversations et préférences dans le temps
4. **Évolution Continue** : Le profil s'enrichit automatiquement à chaque interaction
5. **Performance Optimisée** : Cache intelligent avec invalidation sélective

---

## Architecture du Système

### 1. Sources de Données Centralisées

#### Base de Données Supabase
```
Tables principales du Cerveau Central:
├── user_profile (identité, objectifs, préférences)
├── training_sessions (historique entraînement, RPE, performances)
├── activities (wearable data, zones cardio, biométrie)
├── meals (nutrition, macros, photos, analyses)
├── fasting_sessions (jeûne, protocoles, phases métaboliques)
├── body_scans (morphologie, mesures, composition corporelle)
├── global_chat_messages (historique conversationnel complet)
├── training_locations (lieux, équipements, contexte géographique)
├── connected_devices (wearables, synchronisation temps réel)
└── user_preferences (UI, notifications, performance mode)
```

#### Tables de Contexte Enrichi
```sql
-- Table de contexte agrégé (CRITIQUE pour synchronisation)
CREATE TABLE user_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  snapshot_date timestamptz DEFAULT now(),

  -- Profil enrichi
  identity_context jsonb, -- sex, age, weight, height, objectives
  training_context jsonb, -- niveau, fréquence, préférences exercices
  nutrition_context jsonb, -- macros, restrictions, préférences alimentaires
  morphology_context jsonb, -- mesures, composition, évolution
  biometric_context jsonb, -- FC, HRV, VO2max, zones cardio

  -- Mémoire conversationnelle
  conversation_summary jsonb, -- résumé des 50 derniers messages
  expressed_preferences jsonb, -- préférences exprimées en conversation
  coaching_style_preference text, -- motivant/analytique/concis

  -- Contexte temporel
  last_training_date timestamptz,
  last_meal_logged timestamptz,
  last_body_scan_date timestamptz,
  current_training_phase text, -- préparation/intensif/récupération

  -- Métadonnées
  context_version int DEFAULT 1,
  last_updated timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_user_context_user_id ON user_context_snapshots(user_id);
CREATE INDEX idx_user_context_date ON user_context_snapshots(snapshot_date DESC);
```

---

## 2. Store Zustand Global Centralisé

### Structure du Store Principal

**Fichier** : `src/system/store/centralBrainStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types du Cerveau Central
interface UserIdentityContext {
  userId: string;
  sex: 'male' | 'female';
  age: number;
  weight_kg: number;
  height_cm: number;
  objective: 'fat_loss' | 'muscle_gain' | 'recomp' | 'performance';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
}

interface TrainingContext {
  last_session_date: string;
  weekly_frequency: number;
  preferred_disciplines: string[]; // ['force', 'endurance', 'calisthenics']
  current_training_phase: 'preparation' | 'intensive' | 'recovery' | 'deload';
  training_locations: Array<{
    id: string;
    name: string;
    equipment_available: string[];
  }>;
  active_goals: Array<{
    discipline: string;
    target: string;
    deadline: string;
  }>;
}

interface NutritionContext {
  macros_targets: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  diet_type: 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';
  allergies: string[];
  intolerances: string[];
  food_preferences: {
    liked: string[];
    disliked: string[];
    banned: string[];
  };
  meal_prep_preferences: {
    cooking_skill: 'beginner' | 'intermediate' | 'advanced';
    weekday_time_min: number;
    weekend_time_min: number;
  };
}

interface BiometricContext {
  hr_resting: number;
  hr_max: number;
  hrv_avg: number;
  vo2max_estimated: number;
  training_load_7d: number;
  fatigue_score: number;
  recovery_score: number;
}

interface ConversationMemory {
  recent_topics: string[]; // 10 derniers sujets abordés
  coaching_style: 'motivating' | 'analytical' | 'concise' | 'detailed';
  expressed_frustrations: string[];
  expressed_goals: string[];
  last_conversation_date: string;
  conversation_count: number;
}

interface CentralBrainState {
  // Contextes chargés
  identityContext: UserIdentityContext | null;
  trainingContext: TrainingContext | null;
  nutritionContext: NutritionContext | null;
  biometricContext: BiometricContext | null;
  conversationMemory: ConversationMemory | null;

  // Métadonnées de chargement
  isContextLoaded: boolean;
  lastContextUpdate: string;
  contextVersion: number;

  // Actions
  loadFullContext: (userId: string) => Promise<void>;
  refreshContext: (userId: string) => Promise<void>;
  updateConversationMemory: (topic: string, sentiment: string) => void;
  invalidateContext: () => void;

  // Getters optimisés pour agents IA
  getTrainingContextForAI: () => string;
  getNutritionContextForAI: () => string;
  getFullContextForAI: () => string;
}

// Store principal
export const useCentralBrainStore = create<CentralBrainState>()(
  persist(
    (set, get) => ({
      identityContext: null,
      trainingContext: null,
      nutritionContext: null,
      biometricContext: null,
      conversationMemory: null,
      isContextLoaded: false,
      lastContextUpdate: '',
      contextVersion: 1,

      loadFullContext: async (userId: string) => {
        // Charger tous les contextes depuis Supabase
        const context = await fetchUserContextFromSupabase(userId);
        set({
          identityContext: context.identity,
          trainingContext: context.training,
          nutritionContext: context.nutrition,
          biometricContext: context.biometric,
          conversationMemory: context.conversation,
          isContextLoaded: true,
          lastContextUpdate: new Date().toISOString(),
        });
      },

      refreshContext: async (userId: string) => {
        // Rafraîchir uniquement les parties modifiées
        const state = get();
        // Logic de refresh sélectif
      },

      updateConversationMemory: (topic: string, sentiment: string) => {
        const state = get();
        const memory = state.conversationMemory;
        if (!memory) return;

        set({
          conversationMemory: {
            ...memory,
            recent_topics: [topic, ...memory.recent_topics].slice(0, 10),
            last_conversation_date: new Date().toISOString(),
            conversation_count: memory.conversation_count + 1,
          },
        });
      },

      invalidateContext: () => {
        set({
          isContextLoaded: false,
          lastContextUpdate: '',
        });
      },

      getTrainingContextForAI: () => {
        const state = get();
        const { identityContext, trainingContext } = state;
        if (!identityContext || !trainingContext) return '';

        return `
PROFIL UTILISATEUR:
- Genre: ${identityContext.sex === 'male' ? 'Homme' : 'Femme'}
- Âge: ${identityContext.age} ans
- Poids: ${identityContext.weight_kg} kg
- Taille: ${identityContext.height_cm} cm
- Objectif: ${identityContext.objective}
- Niveau d'activité: ${identityContext.activity_level}

CONTEXTE ENTRAÎNEMENT:
- Fréquence hebdomadaire: ${trainingContext.weekly_frequency} sessions
- Disciplines préférées: ${trainingContext.preferred_disciplines.join(', ')}
- Phase actuelle: ${trainingContext.current_training_phase}
- Dernière session: ${trainingContext.last_session_date}
- Objectifs actifs: ${trainingContext.active_goals.map(g => g.target).join(', ')}
        `.trim();
      },

      getNutritionContextForAI: () => {
        const state = get();
        const { nutritionContext } = state;
        if (!nutritionContext) return '';

        return `
CONTEXTE NUTRITION:
- Objectifs macros: ${nutritionContext.macros_targets.kcal} kcal/jour
  - Protéines: ${nutritionContext.macros_targets.protein_g}g
  - Glucides: ${nutritionContext.macros_targets.carbs_g}g
  - Lipides: ${nutritionContext.macros_targets.fat_g}g
- Régime: ${nutritionContext.diet_type}
- Allergies: ${nutritionContext.allergies.join(', ') || 'Aucune'}
- Intolérances: ${nutritionContext.intolerances.join(', ') || 'Aucune'}
- Niveau cuisine: ${nutritionContext.meal_prep_preferences.cooking_skill}
        `.trim();
      },

      getFullContextForAI: () => {
        const state = get();
        return `${state.getTrainingContextForAI()}\n\n${state.getNutritionContextForAI()}`;
      },
    }),
    {
      name: 'central-brain-storage',
      partialize: (state) => ({
        identityContext: state.identityContext,
        lastContextUpdate: state.lastContextUpdate,
        contextVersion: state.contextVersion,
      }),
    }
  )
);

// Helper pour fetch depuis Supabase
async function fetchUserContextFromSupabase(userId: string) {
  const { data: profile } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(10);

  // Agréger les données...
  return {
    identity: { /* ... */ },
    training: { /* ... */ },
    nutrition: { /* ... */ },
    biometric: { /* ... */ },
    conversation: { /* ... */ },
  };
}
```

---

## 3. Service d'Agrégation des Contextes

**Fichier** : `src/system/services/contextAggregationService.ts`

```typescript
import { supabase } from '../supabase/client';
import { useCentralBrainStore } from '../store/centralBrainStore';

export class ContextAggregationService {
  /**
   * Agrège tous les contextes utilisateur depuis Supabase
   */
  static async aggregateUserContext(userId: string) {
    const [
      profile,
      trainingSessions,
      activities,
      meals,
      fastingSessions,
      bodyScans,
      chatHistory,
      locations,
      devices,
    ] = await Promise.all([
      this.fetchProfile(userId),
      this.fetchTrainingSessions(userId),
      this.fetchActivities(userId),
      this.fetchMeals(userId),
      this.fetchFastingSessions(userId),
      this.fetchBodyScans(userId),
      this.fetchChatHistory(userId),
      this.fetchLocations(userId),
      this.fetchDevices(userId),
    ]);

    return {
      identity: this.buildIdentityContext(profile),
      training: this.buildTrainingContext(trainingSessions, locations),
      nutrition: this.buildNutritionContext(profile, meals),
      biometric: this.buildBiometricContext(activities),
      conversation: this.buildConversationContext(chatHistory),
      morphology: this.buildMorphologyContext(bodyScans),
    };
  }

  /**
   * Construit le contexte d'identité
   */
  private static buildIdentityContext(profile: any) {
    return {
      userId: profile.user_id,
      sex: profile.sex,
      age: this.calculateAge(profile.birthdate),
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      objective: profile.objective,
      activity_level: profile.activity_level,
    };
  }

  /**
   * Construit le contexte d'entraînement
   */
  private static buildTrainingContext(sessions: any[], locations: any[]) {
    const last7Days = sessions.filter(s =>
      new Date(s.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    return {
      last_session_date: sessions[0]?.timestamp || null,
      weekly_frequency: last7Days.length,
      preferred_disciplines: this.extractPreferredDisciplines(sessions),
      current_training_phase: this.inferTrainingPhase(sessions),
      training_locations: locations.map(l => ({
        id: l.id,
        name: l.name,
        equipment_available: l.equipment_detected || [],
      })),
      active_goals: this.extractActiveGoals(sessions),
    };
  }

  /**
   * Construit le contexte nutritionnel
   */
  private static buildNutritionContext(profile: any, meals: any[]) {
    return {
      macros_targets: {
        kcal: profile.macro_targets?.kcal || 2000,
        protein_g: profile.nutrition?.proteinTarget_g || 150,
        carbs_g: profile.macro_targets?.carbs_g || 200,
        fat_g: profile.macro_targets?.fat_g || 60,
      },
      diet_type: profile.nutrition?.diet || 'omnivore',
      allergies: profile.nutrition?.allergies || [],
      intolerances: profile.nutrition?.intolerances || [],
      food_preferences: profile.food_preferences || { liked: [], disliked: [], banned: [] },
      meal_prep_preferences: profile.meal_prep_preferences || {},
    };
  }

  /**
   * Construit le contexte biométrique
   */
  private static buildBiometricContext(activities: any[]) {
    const enriched = activities.filter(a => a.wearable_device_id);
    if (enriched.length === 0) return null;

    const avgHr = enriched.reduce((sum, a) => sum + (a.hr_avg || 0), 0) / enriched.length;
    const avgHrv = enriched.reduce((sum, a) => sum + (a.hrv_pre_activity || 0), 0) / enriched.length;

    return {
      hr_resting: Math.round(avgHr * 0.7), // Estimation
      hr_max: Math.max(...enriched.map(a => a.hr_max || 0)),
      hrv_avg: Math.round(avgHrv),
      vo2max_estimated: enriched[0]?.vo2max_estimated || 0,
      training_load_7d: enriched.reduce((sum, a) => sum + (a.training_load_score || 0), 0),
      fatigue_score: this.calculateFatigueScore(enriched),
      recovery_score: enriched[0]?.recovery_score || 0,
    };
  }

  /**
   * Construit la mémoire conversationnelle
   */
  private static buildConversationContext(messages: any[]) {
    const recent = messages.slice(0, 50);

    return {
      recent_topics: this.extractTopics(recent),
      coaching_style: 'motivating', // Default, peut être inféré
      expressed_frustrations: this.extractFrustrations(recent),
      expressed_goals: this.extractGoals(recent),
      last_conversation_date: messages[0]?.created_at || null,
      conversation_count: messages.length,
    };
  }

  // Helpers privés
  private static calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private static extractPreferredDisciplines(sessions: any[]): string[] {
    const disciplineCounts: Record<string, number> = {};
    sessions.forEach(s => {
      disciplineCounts[s.discipline] = (disciplineCounts[s.discipline] || 0) + 1;
    });
    return Object.entries(disciplineCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([discipline]) => discipline);
  }

  private static inferTrainingPhase(sessions: any[]): string {
    const last7Days = sessions.filter(s =>
      new Date(s.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (last7Days.length === 0) return 'recovery';
    if (last7Days.length >= 5) return 'intensive';
    if (last7Days.length >= 3) return 'preparation';
    return 'recovery';
  }

  private static extractActiveGoals(sessions: any[]): Array<{ discipline: string; target: string; deadline: string }> {
    // Logic pour extraire les objectifs depuis training_goals ou sessions
    return [];
  }

  private static calculateFatigueScore(activities: any[]): number {
    // Calcul basé sur training load cumulé et récupération
    return 50; // Placeholder
  }

  private static extractTopics(messages: any[]): string[] {
    // NLP léger pour extraire les sujets récurrents
    return ['nutrition', 'progression', 'récupération'];
  }

  private static extractFrustrations(messages: any[]): string[] {
    // Détection de sentiments négatifs
    return [];
  }

  private static extractGoals(messages: any[]): string[] {
    // Détection d'objectifs exprimés
    return [];
  }

  // Fetch methods depuis Supabase
  private static async fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }

  private static async fetchTrainingSessions(userId: string) {
    const { data } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(30);
    return data || [];
  }

  private static async fetchActivities(userId: string) {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(30);
    return data || [];
  }

  private static async fetchMeals(userId: string) {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);
    return data || [];
  }

  private static async fetchFastingSessions(userId: string) {
    const { data } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(20);
    return data || [];
  }

  private static async fetchBodyScans(userId: string) {
    const { data } = await supabase
      .from('body_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  }

  private static async fetchChatHistory(userId: string) {
    const { data } = await supabase
      .from('global_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    return data || [];
  }

  private static async fetchLocations(userId: string) {
    const { data } = await supabase
      .from('training_locations')
      .select('*')
      .eq('user_id', userId);
    return data || [];
  }

  private static async fetchDevices(userId: string) {
    const { data } = await supabase
      .from('connected_devices')
      .select('*')
      .eq('user_id', userId);
    return data || [];
  }
}
```

---

## 4. Interface de Requêtes pour Agents IA

**Fichier** : `src/system/services/aiContextProvider.ts`

```typescript
import { useCentralBrainStore } from '../store/centralBrainStore';
import { ContextAggregationService } from './contextAggregationService';

export class AIContextProvider {
  /**
   * Récupère le contexte complet pour un agent IA
   * Utilisé par chat-ai et tous les autres agents
   */
  static async getFullContextForAI(userId: string): Promise<string> {
    // Charger depuis le store ou fetch si nécessaire
    const store = useCentralBrainStore.getState();

    if (!store.isContextLoaded) {
      await store.loadFullContext(userId);
    }

    return store.getFullContextForAI();
  }

  /**
   * Contexte spécifique training (pour agents d'entraînement)
   */
  static async getTrainingContext(userId: string): Promise<string> {
    const store = useCentralBrainStore.getState();

    if (!store.isContextLoaded) {
      await store.loadFullContext(userId);
    }

    return store.getTrainingContextForAI();
  }

  /**
   * Contexte spécifique nutrition (pour agents nutritionnels)
   */
  static async getNutritionContext(userId: string): Promise<string> {
    const store = useCentralBrainStore.getState();

    if (!store.isContextLoaded) {
      await store.loadFullContext(userId);
    }

    return store.getNutritionContextForAI();
  }

  /**
   * Mémoire conversationnelle (pour continuité du chat)
   */
  static async getConversationMemory(userId: string): Promise<string> {
    const store = useCentralBrainStore.getState();

    if (!store.isContextLoaded) {
      await store.loadFullContext(userId);
    }

    const memory = store.conversationMemory;
    if (!memory) return '';

    return `
MÉMOIRE CONVERSATIONNELLE:
- Sujets récents: ${memory.recent_topics.join(', ')}
- Style de coaching préféré: ${memory.coaching_style}
- Nombre de conversations: ${memory.conversation_count}
- Dernière conversation: ${memory.last_conversation_date}
    `.trim();
  }

  /**
   * Contexte avec filtrage temporel
   */
  static async getContextWithTimeFilter(
    userId: string,
    periodDays: number
  ): Promise<string> {
    // Fetch contexte limité à une période
    const context = await ContextAggregationService.aggregateUserContext(userId);
    // Filter par date...
    return 'Contexte filtré...';
  }
}
```

---

## 5. Intégration avec le Chat IA

### Mise à Jour du Chat pour Utiliser le Cerveau Central

**Fichier** : `src/system/services/chatAiService.ts` (modifié)

```typescript
import { AIContextProvider } from './aiContextProvider';
import { useCentralBrainStore } from '../store/centralBrainStore';

export async function sendChatMessage(
  userId: string,
  message: string,
  mode: 'training' | 'nutrition' | 'general'
) {
  // 1. Récupérer le contexte complet depuis le Cerveau Central
  const fullContext = await AIContextProvider.getFullContextForAI(userId);
  const conversationMemory = await AIContextProvider.getConversationMemory(userId);

  // 2. Construire le prompt enrichi
  const enrichedPrompt = `
${fullContext}

${conversationMemory}

MESSAGE UTILISATEUR:
${message}

INSTRUCTIONS:
- Utilise le contexte ci-dessus pour personnaliser ta réponse
- Référence les données spécifiques de l'utilisateur quand pertinent
- Maintiens la cohérence avec les conversations précédentes
  `;

  // 3. Appeler l'edge function chat-ai
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-ai`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      message: enrichedPrompt,
      mode,
      stream: true,
    }),
  });

  // 4. Mettre à jour la mémoire conversationnelle
  const store = useCentralBrainStore.getState();
  store.updateConversationMemory(
    extractTopic(message), // Helper pour extraire le sujet
    'neutral' // Sentiment analysis basique
  );

  return response;
}
```

---

## 6. Synchronisation Temps Réel

### Trigger Supabase pour Invalidation de Cache

```sql
-- Trigger pour invalider le cache quand les données changent
CREATE OR REPLACE FUNCTION invalidate_user_context_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier le frontend via Realtime
  PERFORM pg_notify(
    'context_invalidated',
    json_build_object(
      'user_id', NEW.user_id,
      'table', TG_TABLE_NAME,
      'timestamp', NOW()
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables critiques
CREATE TRIGGER user_profile_context_invalidation
  AFTER UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_context_cache();

CREATE TRIGGER training_sessions_context_invalidation
  AFTER INSERT OR UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_context_cache();

CREATE TRIGGER activities_context_invalidation
  AFTER INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_context_cache();

-- Et ainsi de suite pour meals, fasting_sessions, body_scans...
```

### Hook React pour Écouter les Invalidations

**Fichier** : `src/hooks/useCentralBrainSync.ts`

```typescript
import { useEffect } from 'react';
import { supabase } from '../system/supabase/client';
import { useCentralBrainStore } from '../system/store/centralBrainStore';

export function useCentralBrainSync(userId: string) {
  const { invalidateContext, refreshContext } = useCentralBrainStore();

  useEffect(() => {
    // S'abonner aux notifications d'invalidation
    const channel = supabase
      .channel('context_invalidation')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profile',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Context invalidated:', payload);
          invalidateContext();
          // Refresh asynchrone
          setTimeout(() => refreshContext(userId), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

---

## 7. Optimisations de Performance

### Cache Intelligent

```typescript
// Cache multi-niveaux
class ContextCache {
  private memoryCache: Map<string, any> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL_MS;
    if (isExpired) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
  }

  invalidateAll(): void {
    this.memoryCache.clear();
  }
}

export const contextCache = new ContextCache();
```

### Chargement Progressif

```typescript
// Charger d'abord les données critiques, puis enrichir
async function loadContextProgressively(userId: string) {
  // Phase 1: Identité (critique, rapide)
  const identity = await fetchProfile(userId);
  useCentralBrainStore.setState({ identityContext: identity });

  // Phase 2: Contexte training (important)
  const training = await fetchTrainingContext(userId);
  useCentralBrainStore.setState({ trainingContext: training });

  // Phase 3: Nutrition et biométrie (background)
  Promise.all([
    fetchNutritionContext(userId),
    fetchBiometricContext(userId),
  ]).then(([nutrition, biometric]) => {
    useCentralBrainStore.setState({
      nutritionContext: nutrition,
      biometricContext: biometric,
      isContextLoaded: true,
    });
  });
}
```

---

## 8. Diagrammes d'Architecture

### Flux de Chargement du Contexte

```
Utilisateur ouvre l'app
        ↓
[useCentralBrainSync hook s'initialise]
        ↓
[loadFullContext(userId) appelé]
        ↓
┌─────────────────────────────────────┐
│ ContextAggregationService           │
│  ├─ fetchProfile()                  │
│  ├─ fetchTrainingSessions()         │
│  ├─ fetchActivities()               │
│  ├─ fetchMeals()                    │
│  ├─ fetchFastingSessions()          │
│  ├─ fetchBodyScans()                │
│  ├─ fetchChatHistory()              │
│  └─ fetchLocations()                │
└─────────────────────────────────────┘
        ↓
[Agrégation et transformation]
        ↓
[Stockage dans useCentralBrainStore]
        ↓
[isContextLoaded = true]
        ↓
[Chat IA peut maintenant utiliser le contexte]
```

### Flux de Requête Agent IA

```
Agent IA (chat-ai) reçoit message
        ↓
[AIContextProvider.getFullContextForAI(userId)]
        ↓
┌───────────────────────────┐
│ Vérif cache store         │
│  ├─ isContextLoaded?      │
│  │   ├─ OUI → retour cache│
│  │   └─ NON → fetch DB    │
└───────────────────────────┘
        ↓
[Contexte formaté en texte pour prompt]
        ↓
[Envoi à OpenAI avec contexte enrichi]
        ↓
[Réponse personnalisée basée sur profil]
        ↓
[updateConversationMemory() appelé]
        ↓
[Cache contexte mis à jour]
```

### Flux d'Invalidation en Temps Réel

```
Utilisateur modifie son profil
        ↓
[UPDATE user_profile WHERE user_id = ...]
        ↓
[Trigger: invalidate_user_context_cache()]
        ↓
[pg_notify('context_invalidated', {...})]
        ↓
[Supabase Realtime broadcast]
        ↓
[Frontend: useCentralBrainSync détecte notification]
        ↓
[invalidateContext() appelé]
        ↓
[UI affiche loader subtil]
        ↓
[refreshContext(userId) fetch nouvelle data]
        ↓
[Store mis à jour avec nouvelles données]
        ↓
[UI rafraîchie avec contexte actualisé]
```

---

## 9. Guide de Migration pour Nouveau Projet Coaching

### Étapes pour le Prochain Assistant

1. **Initialiser le Cerveau Central**
   ```bash
   # Créer les fichiers core
   mkdir -p src/system/store
   mkdir -p src/system/services
   touch src/system/store/centralBrainStore.ts
   touch src/system/services/contextAggregationService.ts
   touch src/system/services/aiContextProvider.ts
   ```

2. **Setup Base de Données**
   ```sql
   -- Créer la table user_context_snapshots
   -- Créer les triggers d'invalidation
   -- Setup Realtime sur les tables critiques
   ```

3. **Intégrer au Chat**
   ```typescript
   // Dans chatAiService.ts
   import { AIContextProvider } from './aiContextProvider';

   // Enrichir tous les messages avec contexte
   const context = await AIContextProvider.getFullContextForAI(userId);
   ```

4. **Activer la Synchronisation**
   ```typescript
   // Dans AppProviders.tsx
   import { useCentralBrainSync } from '../hooks/useCentralBrainSync';

   function AppProviders() {
     const userId = useUserStore(state => state.userId);
     useCentralBrainSync(userId); // Active sync temps réel
     // ...
   }
   ```

5. **Tester le Contexte**
   ```typescript
   // Debug component
   function ContextDebugger() {
     const context = useCentralBrainStore(state => state.getFullContextForAI());
     return <pre>{context}</pre>;
   }
   ```

### Checklist de Validation

- [ ] Store centralBrainStore créé et fonctionnel
- [ ] ContextAggregationService fetch toutes les tables
- [ ] AIContextProvider expose les getters pour agents
- [ ] Chat IA intégré avec contexte enrichi
- [ ] Triggers d'invalidation configurés sur Supabase
- [ ] Hook useCentralBrainSync actif sur toutes les pages
- [ ] Cache intelligent implémenté et testé
- [ ] Performance <200ms pour loadFullContext()
- [ ] Realtime sync fonctionnel (test update profil)

---

## 10. Exemples de Contexte Généré

### Exemple pour Agent Training

```
PROFIL UTILISATEUR:
- Genre: Homme
- Âge: 32 ans
- Poids: 78 kg
- Taille: 180 cm
- Objectif: Recomposition corporelle
- Niveau d'activité: Actif

CONTEXTE ENTRAÎNEMENT:
- Fréquence hebdomadaire: 4 sessions
- Disciplines préférées: Force, Calisthenics, Endurance
- Phase actuelle: Intensive
- Dernière session: 2025-01-22 (Hier)
- Objectifs actifs:
  * Atteindre 15 tractions strictes d'ici fin février
  * Courir 10km en moins de 50 minutes d'ici mars
  * Augmenter squat à 120kg pour 5 reps

CONTEXTE BIOMÉTRIQUE:
- FC repos: 58 bpm
- FC max: 188 bpm
- HRV moyen: 62 ms
- VO2max estimé: 48 ml/kg/min
- Charge d'entraînement 7j: 1240 (élevée)
- Score de fatigue: 68/100 (attention sur-entraînement)
- Score de récupération: 72/100 (correcte)

MÉMOIRE CONVERSATIONNELLE:
- Sujets récents: progression tractions, douleur épaule gauche, nutrition pré-workout
- Style de coaching préféré: Analytique et détaillé
- Frustrations exprimées: Stagnation sur les tractions depuis 3 semaines
- Objectifs exprimés: Améliorer explosive power pour les muscle-ups
- Nombre de conversations: 47
- Dernière conversation: 2025-01-21
```

### Exemple pour Agent Nutrition

```
PROFIL UTILISATEUR:
- Genre: Femme
- Âge: 28 ans
- Poids: 62 kg
- Taille: 168 cm
- Objectif: Perte de graisse
- Niveau d'activité: Modéré

CONTEXTE NUTRITION:
- Objectifs macros: 1800 kcal/jour
  - Protéines: 130g (29%)
  - Glucides: 180g (40%)
  - Lipides: 62g (31%)
- Régime: Végétarien
- Allergies: Fruits à coque
- Intolérances: Lactose
- Niveau cuisine: Intermédiaire
- Préférences:
  * Apprécie: Tofu, légumineuses, avoine, patates douces
  * N'aime pas: Brocoli, chou-fleur
  * Bannis: Produits laitiers de vache

HISTORIQUE RÉCENT (7 derniers jours):
- Calories moyennes: 1650 kcal/jour (déficit de 150 kcal)
- Protéines moyennes: 115g/jour (légèrement sous objectif)
- Consistance: 6/7 jours trackés
- Tendance: Bonne compliance générale

MÉMOIRE CONVERSATIONNELLE:
- Sujets récents: Substituts protéiques végétariens, snacks pré-workout, recettes rapides
- Frustrations exprimées: Difficulté à atteindre objectif protéines sans whey
- Suggestions précédentes: Utiliser tofu soyeux dans smoothies, tempeh mariné
```

---

## Conclusion

Le **Cerveau Central** est le pilier de l'expérience TwinForge. En centralisant toutes les données utilisateur dans un système unifié, accessible et performant, nous permettons à tous les agents IA de connaître l'utilisateur intimement et de fournir des recommandations hyper-personnalisées.

### Points Clés à Retenir

1. **Source Unique de Vérité** : Toutes les données utilisateur agrégées dans un store Zustand central
2. **Performance Optimale** : Cache multi-niveaux avec invalidation intelligente
3. **Synchronisation Temps Réel** : Triggers Supabase + Realtime pour cohérence instantanée
4. **Interface Unifiée** : AIContextProvider expose des getters simples pour tous les agents
5. **Mémoire Évolutive** : Le contexte s'enrichit à chaque interaction utilisateur

### Pour le Prochain Assistant

Utilise ce document comme guide de référence pour implémenter le Cerveau Central dans le nouveau projet focalisé sur le coaching. Toutes les fonctionnalités (repas, frigo, activités, jeûne, twins) ont été supprimées, mais leurs **données restent dans Supabase** et sont accessibles via le Cerveau Central pour enrichir le contexte du coach IA.

---

*Document créé le 2025-01-23 | Version 1.0*
*TwinForge Engineering Team - Central Brain Architecture*
