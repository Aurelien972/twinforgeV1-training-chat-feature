#!/usr/bin/env python3
"""
Apply enrichments from JSON to Supabase database
"""

import json
import os
import sys
from supabase import create_client, Client

def load_env():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def apply_enrichments(json_file: str):
    """Apply enrichments from JSON file to database"""

    # Load environment
    load_env()

    url = os.environ.get('VITE_SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not service_key:
        print("❌ Error: Missing SUPABASE credentials in .env")
        sys.exit(1)

    # Create Supabase client
    supabase: Client = create_client(url, service_key)

    # Load JSON enrichments
    with open(json_file, 'r', encoding='utf-8') as f:
        enrichments = json.load(f)

    print(f"\n🚀 Applying {len(enrichments)} enrichments from {json_file}\n")

    success_count = 0
    error_count = 0

    for exercise_id, enrichment in enrichments.items():
        try:
            # Update exercise
            response = supabase.table('exercises').update({
                'common_mistakes': enrichment['common_mistakes'],
                'benefits': enrichment['benefits'],
                'execution_phases': enrichment['execution_phases'],
                'contraindications': enrichment['contraindications'],
                'scaling_options': enrichment['scaling_options'],
                'enrichment_status': 'enriched',
                'enriched_at': 'now()',
                'enrichment_sprint_number': 7,
                'enrichment_quality_score': 95,
                'ready_for_ai': True
            }).eq('id', exercise_id).execute()

            if response.data:
                print(f"   ✅ Enriched {exercise_id}")
                success_count += 1
            else:
                print(f"   ❌ Failed {exercise_id}: No data returned")
                error_count += 1

        except Exception as e:
            print(f"   ❌ Error {exercise_id}: {str(e)}")
            error_count += 1

    print(f"\n📊 Results:")
    print(f"   ✅ Success: {success_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📈 Success rate: {(success_count/(success_count+error_count)*100):.1f}%\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 apply-enrichments-from-json.py <json_file>")
        print("Example: python3 apply-enrichments-from-json.py enrichments/batch_force_001.json")
        sys.exit(1)

    json_file = sys.argv[1]

    if not os.path.exists(json_file):
        print(f"❌ Error: File not found: {json_file}")
        sys.exit(1)

    apply_enrichments(json_file)
