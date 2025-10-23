/*
  # Enrich Face Archetypes with Missing Facial Keys (v3 - Fixed JSONB)

  This migration enriches existing face_archetypes with missing facial parameters
  to ensure every archetype has all 21 required facial morphological keys.
*/

-- Function to generate realistic values for missing facial keys
CREATE OR REPLACE FUNCTION enrich_face_archetype_values(
  p_archetype_id text,
  p_gender gender_enum,
  p_face_shape face_shape_enum,
  p_eye_shape eye_shape_enum,
  p_nose_type nose_type_enum,
  p_lip_fullness lip_fullness_enum,
  p_existing_values jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_enriched_values jsonb := p_existing_values;
  v_value numeric;
  v_jaw_width numeric;
  v_cheekbones numeric;
BEGIN
  v_jaw_width := COALESCE((p_existing_values->>'BS_LOD0.FaceJawWidth')::numeric, 0);
  v_cheekbones := COALESCE((p_existing_values->>'BS_LOD0.FaceCheekbones')::numeric, 0);

  IF NOT (p_existing_values ? 'BS_LOD0.FaceCheeksSize') THEN
    v_value := CASE p_face_shape::text
      WHEN 'round' THEN 0.25 WHEN 'oval' THEN 0.15 WHEN 'square' THEN 0.10
      WHEN 'heart' THEN 0.20 WHEN 'diamond' THEN 0.05 WHEN 'triangle' THEN 0.15
      WHEN 'long' THEN 0.10 ELSE 0.15 END;
    v_value := LEAST(GREATEST(v_value + (v_cheekbones * 0.2), 0.0), 0.3);
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceCheeksSize}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceNoseNarrow') THEN
    v_value := CASE p_nose_type::text
      WHEN 'button' THEN 0.15 WHEN 'upturned' THEN 0.12 WHEN 'straight' THEN 0.08
      WHEN 'roman' THEN 0.05 WHEN 'aquiline' THEN 0.10 WHEN 'nubian' THEN 0.03 ELSE 0.10 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceNoseNarrow}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceNoseWide') THEN
    v_value := CASE p_nose_type::text
      WHEN 'button' THEN 0.55 WHEN 'upturned' THEN 0.57 WHEN 'straight' THEN 0.58
      WHEN 'roman' THEN 0.59 WHEN 'aquiline' THEN 0.56 WHEN 'nubian' THEN 0.60 ELSE 0.575 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceNoseWide}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceNostrilsFlare') THEN
    v_value := CASE p_nose_type::text
      WHEN 'button' THEN 0.55 WHEN 'upturned' THEN 0.58 WHEN 'straight' THEN 0.56
      WHEN 'roman' THEN 0.57 WHEN 'aquiline' THEN 0.59 WHEN 'nubian' THEN 0.60 ELSE 0.575 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceNostrilsFlare}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceEyesUp') THEN
    v_value := CASE p_eye_shape::text
      WHEN 'upturned' THEN 0.40 WHEN 'almond' THEN 0.37 WHEN 'round' THEN 0.36
      WHEN 'hooded' THEN 0.35 WHEN 'downturned' THEN 0.35 WHEN 'monolid' THEN 0.36 ELSE 0.375 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceEyesUp}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceEyesDown') THEN
    v_value := CASE p_eye_shape::text
      WHEN 'downturned' THEN 0.43 WHEN 'hooded' THEN 0.41 WHEN 'round' THEN 0.39
      WHEN 'almond' THEN 0.38 WHEN 'upturned' THEN 0.35 WHEN 'monolid' THEN 0.40 ELSE 0.40 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceEyesDown}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceRoundFace') THEN
    v_value := CASE p_face_shape::text
      WHEN 'round' THEN 0.50 WHEN 'oval' THEN 0.20 WHEN 'square' THEN -0.15
      WHEN 'heart' THEN 0.10 WHEN 'diamond' THEN -0.10 WHEN 'triangle' THEN 0.05
      WHEN 'long' THEN -0.20 ELSE 0.00 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceRoundFace}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceNoseSmall') THEN
    v_value := CASE p_nose_type::text
      WHEN 'button' THEN 0.55 WHEN 'upturned' THEN 0.50 WHEN 'straight' THEN 0.40
      WHEN 'roman' THEN 0.30 WHEN 'aquiline' THEN 0.35 WHEN 'nubian' THEN 0.25 ELSE 0.45 END;
    IF p_gender::text = 'feminine' THEN v_value := v_value + 0.10; END IF;
    v_value := LEAST(GREATEST(v_value, 0.25), 0.65);
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceNoseSmall}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceMouthWidth') THEN
    v_value := CASE p_face_shape::text
      WHEN 'square' THEN 0.05 WHEN 'round' THEN 0.03 WHEN 'long' THEN 0.02
      WHEN 'oval' THEN 0.00 WHEN 'heart' THEN -0.02 WHEN 'diamond' THEN 0.00
      WHEN 'triangle' THEN 0.01 ELSE 0.00 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceMouthWidth}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceEyebrowSize') THEN
    v_value := CASE WHEN p_gender::text = 'masculine' THEN 0.22
      WHEN p_gender::text = 'feminine' THEN 0.18 ELSE 0.20 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceEyebrowSize}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceChinSize') THEN
    v_value := CASE p_face_shape::text
      WHEN 'square' THEN 0.23 WHEN 'round' THEN 0.15 WHEN 'long' THEN 0.20
      WHEN 'oval' THEN 0.18 WHEN 'heart' THEN 0.12 WHEN 'diamond' THEN 0.14
      WHEN 'triangle' THEN 0.25 ELSE 0.20 END;
    IF v_jaw_width > 0.3 THEN v_value := v_value + 0.03;
    ELSIF v_jaw_width < -0.1 THEN v_value := v_value - 0.03; END IF;
    v_value := LEAST(GREATEST(v_value, 0.10), 0.25);
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceChinSize}', to_jsonb(v_value));
  END IF;

  IF NOT (p_existing_values ? 'BS_LOD0.FaceLongFace') THEN
    v_value := CASE p_face_shape::text
      WHEN 'long' THEN 0.40 WHEN 'oval' THEN 0.15 WHEN 'heart' THEN 0.10
      WHEN 'round' THEN -0.20 WHEN 'square' THEN 0.00 WHEN 'diamond' THEN 0.05
      WHEN 'triangle' THEN 0.08 ELSE 0.00 END;
    v_enriched_values := jsonb_set(v_enriched_values, '{BS_LOD0.FaceLongFace}', to_jsonb(v_value));
  END IF;

  RETURN v_enriched_values;
END;
$$;

-- Apply enrichment
DO $$
DECLARE
  v_archetype RECORD;
  v_enriched_values jsonb;
  v_keys_before int;
  v_keys_after int;
  v_total_enriched int := 0;
BEGIN
  FOR v_archetype IN 
    SELECT id, gender, face_shape, eye_shape, nose_type, lip_fullness, face_values
    FROM face_archetypes
    WHERE face_values IS NOT NULL
  LOOP
    SELECT COUNT(*) INTO v_keys_before FROM jsonb_object_keys(v_archetype.face_values);

    v_enriched_values := enrich_face_archetype_values(
      v_archetype.id::text,
      v_archetype.gender,
      v_archetype.face_shape,
      v_archetype.eye_shape,
      v_archetype.nose_type,
      v_archetype.lip_fullness,
      v_archetype.face_values
    );

    SELECT COUNT(*) INTO v_keys_after FROM jsonb_object_keys(v_enriched_values);

    IF v_keys_after > v_keys_before THEN
      UPDATE face_archetypes
      SET face_values = v_enriched_values,
          updated_at = now()
      WHERE id = v_archetype.id;
      
      v_total_enriched := v_total_enriched + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Face archetypes enrichment completed: % archetypes updated', v_total_enriched;
END $$;

DROP FUNCTION IF EXISTS enrich_face_archetype_values(text, gender_enum, face_shape_enum, eye_shape_enum, nose_type_enum, lip_fullness_enum, jsonb);
