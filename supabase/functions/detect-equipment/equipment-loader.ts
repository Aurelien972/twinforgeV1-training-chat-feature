/**
 * Equipment Catalog Loader - Supabase Edition
 *
 * Charge le catalogue d'équipements depuis Supabase au lieu du fichier TS
 * Fournit les mêmes interfaces que equipment-reference.ts pour compatibilité
 */

import { createClient } from "npm:@supabase/supabase-js@2.54.0";

export interface EquipmentItem {
  id: string;
  nameFr: string;
  nameEn: string;
  category: string;
  subcategory?: string;
  synonyms?: string[];
}

export interface EquipmentCategory {
  id: string;
  label: string;
  description: string;
  equipment: EquipmentItem[];
}

let cachedCatalog: EquipmentCategory[] | null = null;
let cachedEquipmentMap: Map<string, EquipmentItem> | null = null;
let catalogLoadTime: number | null = null;
const CACHE_TTL_MS = 300000; // 5 minutes

/**
 * Load equipment catalog from Supabase
 */
export async function loadEquipmentCatalog(supabaseUrl: string, supabaseKey: string): Promise<void> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedCatalog && catalogLoadTime && (now - catalogLoadTime) < CACHE_TTL_MS) {
    console.log('📚 Using cached equipment catalog');
    return;
  }

  console.log('📚 Loading equipment catalog from Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Load categories
    const { data: categories, error: catError } = await supabase
      .from('equipment_categories')
      .select('id, label, description, location_types')
      .order('display_order');

    if (catError) {
      throw new Error(`Failed to load categories: ${catError.message}`);
    }

    // Load all equipment
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_types')
      .select('id, name_fr, name_en, category_id, subcategory, synonyms')
      .order('name_fr');

    if (eqError) {
      throw new Error(`Failed to load equipment: ${eqError.message}`);
    }

    console.log(`✓ Loaded ${categories.length} categories and ${equipment.length} equipment types`);

    // Build catalog structure
    cachedCatalog = categories.map(cat => ({
      id: cat.id,
      label: cat.label,
      description: cat.description,
      equipment: equipment
        .filter(eq => eq.category_id === cat.id)
        .map(eq => ({
          id: eq.id,
          nameFr: eq.name_fr,
          nameEn: eq.name_en,
          category: eq.category_id,
          subcategory: eq.subcategory || undefined,
          synonyms: eq.synonyms || []
        }))
    }));

    // Build equipment map
    cachedEquipmentMap = new Map();
    equipment.forEach(eq => {
      cachedEquipmentMap!.set(eq.id, {
        id: eq.id,
        nameFr: eq.name_fr,
        nameEn: eq.name_en,
        category: eq.category_id,
        subcategory: eq.subcategory || undefined,
        synonyms: eq.synonyms || []
      });
    });

    catalogLoadTime = now;
    console.log(`✅ Equipment catalog loaded and cached (${equipment.length} items)`);

  } catch (error) {
    console.error('❌ Failed to load equipment catalog from Supabase:', error);
    throw error;
  }
}

/**
 * Get equipment catalog - ensures loaded first
 */
export function getEquipmentCatalog(): EquipmentCategory[] {
  if (!cachedCatalog) {
    throw new Error('Equipment catalog not loaded. Call loadEquipmentCatalog() first.');
  }
  return cachedCatalog;
}

/**
 * Get equipment map - ensures loaded first
 */
export function getEquipmentMap(): Map<string, EquipmentItem> {
  if (!cachedEquipmentMap) {
    throw new Error('Equipment catalog not loaded. Call loadEquipmentCatalog() first.');
  }
  return cachedEquipmentMap;
}

/**
 * Get equipment list for specific location type
 * Uses Supabase data if loaded, otherwise throws error
 */
export async function getEquipmentListForLocationType(
  locationType: 'home' | 'gym' | 'outdoor',
  supabaseUrl: string,
  supabaseKey: string
): Promise<string[]> {
  // Ensure catalog is loaded
  if (!cachedCatalog) {
    await loadEquipmentCatalog(supabaseUrl, supabaseKey);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Query equipment compatible with this location type
  const { data: compatibleEquipment, error } = await supabase
    .rpc('get_equipment_for_location_type', { p_location_type: locationType });

  if (error) {
    console.error(`Error loading equipment for ${locationType}:`, error);
    // Fallback to catalog-based filtering
    return fallbackGetEquipmentForLocation(locationType);
  }

  return compatibleEquipment.map((eq: any) => eq.name_fr);
}

/**
 * Fallback method using cached catalog
 */
function fallbackGetEquipmentForLocation(locationType: 'home' | 'gym' | 'outdoor'): string[] {
  if (!cachedCatalog) {
    throw new Error('Equipment catalog not loaded');
  }

  const relevantCategories: string[] = [];

  if (locationType === 'gym') {
    relevantCategories.push(
      'cardio', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core',
      'racks', 'benches', 'weights', 'cables', 'functional',
      'calisthenics', 'combat', 'mobility', 'accessories'
    );
  } else if (locationType === 'home') {
    relevantCategories.push(
      'cardio', 'weights', 'benches', 'racks', 'functional',
      'calisthenics', 'accessories', 'mobility',
      'home-furniture', 'home-objects'
    );
  } else if (locationType === 'outdoor') {
    relevantCategories.push(
      'calisthenics', 'functional', 'outdoor-natural', 'outdoor-urban',
      'beach', 'countryside', 'park'
    );
  }

  const equipmentList: string[] = [];
  cachedCatalog
    .filter(cat => relevantCategories.includes(cat.id))
    .forEach(category => {
      category.equipment.forEach(item => {
        equipmentList.push(item.nameFr);
      });
    });

  return equipmentList;
}

/**
 * Get equipment ID from French name
 */
export function getEquipmentIdFromFrenchName(frenchName: string): string | null {
  if (!cachedEquipmentMap) {
    throw new Error('Equipment catalog not loaded');
  }

  const normalizedInput = frenchName.toLowerCase().trim();

  for (const [id, item] of cachedEquipmentMap.entries()) {
    if (item.nameFr.toLowerCase() === normalizedInput) {
      return id;
    }

    // Check synonyms
    if (item.synonyms) {
      for (const synonym of item.synonyms) {
        if (synonym.toLowerCase() === normalizedInput) {
          return id;
        }
      }
    }
  }

  return null;
}

/**
 * Get equipment item by ID
 */
export function getEquipmentById(id: string): EquipmentItem | undefined {
  if (!cachedEquipmentMap) {
    throw new Error('Equipment catalog not loaded');
  }
  return cachedEquipmentMap.get(id);
}

/**
 * Get total equipment count
 */
export function getTotalEquipmentCount(): number {
  if (!cachedEquipmentMap) {
    throw new Error('Equipment catalog not loaded');
  }
  return cachedEquipmentMap.size;
}

/**
 * Get equipment French name from ID
 */
export function getEquipmentFrenchName(equipmentId: string): string {
  const item = getEquipmentById(equipmentId);
  return item?.nameFr || equipmentId;
}

/**
 * Clear cache (for testing or manual refresh)
 */
export function clearEquipmentCache(): void {
  cachedCatalog = null;
  cachedEquipmentMap = null;
  catalogLoadTime = null;
  console.log('🧹 Equipment catalog cache cleared');
}
