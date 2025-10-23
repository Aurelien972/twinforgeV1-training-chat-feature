import type { UserProfile } from '../../../../domain/profile';
import { calculateRecipeWorkshopCompletion } from '../../../../system/profile/profileCompletionService';

/**
 * Vérifie si un champ possède une valeur "valide" et "significative".
 * - Chaîne : non vide
 * - Tableau : length > 0
 * - Objet : au moins 1 clé
 * - Nombre : > 0, sauf exceptions où 0 est acceptable (ex: enfants, piment)
 * - Booléen : toujours valide (true/false)
 */
function hasValidValue(profile: any, fieldKey: string): boolean {
  const keys = fieldKey.split('.');
  let current = profile;

  for (const key of keys) {
    if (!current || current[key] === undefined || current[key] === null) {
      return false;
    }
    current = current[key];
  }

  // Special handling for allergies - complete if noKnownAllergies is true OR allergies array has items
  if (fieldKey === 'nutrition.allergies') {
    const noKnownAllergies = profile?.nutrition?.noKnownAllergies;
    if (noKnownAllergies === true) {
      return true; // User explicitly stated no allergies
    }
    // Otherwise check if allergies array has items
    return Array.isArray(current) && current.length > 0;
  }

  // Special handling for intolerances - complete if it's an array (even empty means "no intolerances")
  if (fieldKey === 'nutrition.intolerances') {
    return Array.isArray(current); // Empty array is valid (means no intolerances)
  }

  // Chaînes non vides
  if (typeof current === 'string') {
    return current.trim() !== '';
  }

  // Tableaux non vides
  if (Array.isArray(current)) {
    return current.length > 0;
  }

  // Booléens : true/false sont considérés comme des valeurs "renseignées"
  if (typeof current === 'boolean') {
    return true;
  }

  // Objets non vides
  if (typeof current === 'object') {
    return Object.keys(current).length > 0;
  }

  // Nombres
  if (typeof current === 'number') {
    // Champs pour lesquels 0 est une valeur valide
    const zeroAllowed = new Set<string>([
      'householdDetails.children',
      'sensoryPreferences.spiceTolerance',
    ]);

    if (zeroAllowed.has(fieldKey)) {
      return Number.isFinite(current) && current >= 0;
    }
    return Number.isFinite(current) && current > 0;
  }

  // Par défaut, on considère valide
  return true;
}

/**
 * Complétion de l'onglet Identité
 */
export function calculateIdentityCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  const identityFields = [
    'displayName',
    'sex',
    'height_cm',
    'weight_kg',
    'birthdate',
    'target_weight_kg',
    'activity_level',
    'objective',
    'job_category',
    'phoneNumber',
  ];

  const completedFields = identityFields.filter((field) => hasValidValue(profile, field));
  return Math.round((completedFields.length / identityFields.length) * 100);
}

/**
 * Complétion de l'onglet Nutrition
 * - Retire les champs vraiment optionnels du dénominateur (ex: macroTargets.kcal)
 * - Allergies : considéré "complété" si tableau rempli OU noKnownAllergies = true
 * - Intolérances : si vide, ne pénalise pas (ne compte pas dans le dénominateur)
 * - Gère correctement les valeurs 0 (enfants, tolérance au piment)
 */
export function calculateNutritionCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  // Champs essentiels réellement requis pour finaliser l'onglet
  const requiredFields: string[] = [
    'nutrition.diet',
    'nutrition.budgetLevel',
    'nutrition.allergies', // Now handled by hasValidValue with special logic
    'nutrition.intolerances', // Now handled by hasValidValue with special logic

    'householdDetails.adults',
    'householdDetails.children',

    'mealPrepPreferences.weekdayTimeMin',
    'mealPrepPreferences.weekendTimeMin',
    'mealPrepPreferences.cookingSkill',

    // Équipement de base
    'kitchenEquipment.oven',
    'kitchenEquipment.stove',
    'kitchenEquipment.microwave',

    // Préférences utiles
    'foodPreferences.cuisines',
    'foodPreferences.ingredients',

    // Échelle 0–3 : 0 est valide
    'sensoryPreferences.spiceTolerance',

    'shoppingPreferences.frequencyPerWeek',
  ];

  let completed = 0;
  const total = requiredFields.length;

  // Check all required fields using the enhanced hasValidValue function
  for (const field of requiredFields) {
    if (hasValidValue(profile, field)) completed++;
  }

  const pct = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  return pct;
}

/**
 * Complétion de l'onglet Jeûne
 */
export function calculateFastingCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  const fastingFields = [
    'fastingWindow.protocol',
    'fastingWindow.start',
    'fastingWindow.end',
    'fastingWindow.windowHours',
    'fastingWindow.mealsPerDay',
    'nutrition.proteinTarget_g',
    'macroTargets.kcal',
  ];

  const completedFields = fastingFields.filter((field) => hasValidValue(profile, field));
  return Math.round((completedFields.length / fastingFields.length) * 100);
}

/**
 * Complétion de l'onglet Santé
 * Supports both V1 (basic) and V2 (enriched) schemas
 * Takes into account "everything is fine" declarations
 */
export function calculateHealthCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  const health = (profile as any).health;

  if (!health) {
    return 0;
  }

  if (health.version === '2.0') {
    // Check for "everything is fine" declarations
    const hasDeclaredNoConditions = health.no_medical_conditions === true;
    const hasDeclaredNoMedications = health.no_medications === true;
    const hasDeclaredNoAllergies = health.no_allergies === true;
    const hasDeclaredNoLimitations = health.no_physical_limitations === true;
    const hasDeclaredNoConstraints = health.no_dietary_constraints === true;

    const fields = [
      {
        key: 'health.medical_history.conditions',
        alternativeCheck: () => hasDeclaredNoConditions
      },
      {
        key: 'health.medical_history.medications',
        alternativeCheck: () => hasDeclaredNoMedications
      },
      {
        key: 'health.medical_history.allergies',
        alternativeCheck: () => hasDeclaredNoAllergies
      },
      {
        key: 'health.physical_limitations',
        alternativeCheck: () => hasDeclaredNoLimitations
      },
      // Standard fields without alternatives
      { key: 'health.basic.bloodType' },
      { key: 'health.medical_history.family_history' },
      { key: 'health.vital_signs.blood_pressure_systolic' },
      { key: 'health.vital_signs.resting_heart_rate' },
      { key: 'health.lifestyle.smoking_status' },
      { key: 'health.lifestyle.alcohol_frequency' },
      { key: 'health.lifestyle.sleep_hours_avg' },
      { key: 'health.lifestyle.stress_level' },
      { key: 'health.lifestyle.physical_activity_level' },
      { key: 'health.vaccinations.up_to_date' },
      { key: 'health.last_checkup_date' },
    ];

    let completedCount = 0;
    for (const field of fields) {
      // Check if field has value OR alternative check passes
      if (hasValidValue(profile, field.key) || (field.alternativeCheck && field.alternativeCheck())) {
        completedCount++;
      }
    }

    // Also check dietary constraints from profile root
    const constraints = (profile as any).constraints;
    if ((constraints && Object.keys(constraints).length > 0) || hasDeclaredNoConstraints) {
      completedCount++;
    }

    // Add 1 to total for constraints field
    return Math.round((completedCount / (fields.length + 1)) * 100);
  }

  const v1Fields = [
    'health.bloodType',
    'health.conditions',
    'health.medications',
    'health.physicalLimitations',
    'constraints',
  ];

  const completedFields = v1Fields.filter((field) => hasValidValue(profile, field));
  return Math.round((completedFields.length / v1Fields.length) * 100);
}


/**
 * Complétion de l'onglet Avatar
 */
export function calculateAvatarCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  const avatarFields = [
    'avatarStatus',
    'avatarUrl',
    'preferences.final_shape_params',
    'preferences.final_limb_masses',
    'preferences.skin_tone',
    'preferences.avatar_version',
  ];

  const completedFields = avatarFields.filter((field) => hasValidValue(profile, field));
  return Math.round((completedFields.length / avatarFields.length) * 100);
}

/**
 * @deprecated Utiliser calculateRecipeWorkshopCompletion de profileCompletionService
 * Calcule un pourcentage global via le nouveau service (préserve l'API existante)
 */
export function calculateProfileCompletion(profile: UserProfile | null): number {
  const completion = calculateRecipeWorkshopCompletion(profile);
  return completion.completionPercentage;
}

/**
 * Complétion de l'onglet Training
 */
export function calculateTrainingCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  const trainingFields = [
    'preferences.workout.type',
    'preferences.workout.fitnessLevel',
    'preferences.workout.sessionsPerWeek',
    'preferences.workout.preferredDuration',
  ];

  const completedFields = trainingFields.filter((field) => hasValidValue(profile, field));
  return Math.round((completedFields.length / trainingFields.length) * 100);
}

/**
 * @deprecated Utiliser calculateRecipeWorkshopCompletion du service
 */
export function calculateRecipeWorkshopCompletionLegacy(profile: UserProfile | null): number {
  const completion = calculateRecipeWorkshopCompletion(profile);
  return completion.completionPercentage;
}