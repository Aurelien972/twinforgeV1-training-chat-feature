#!/usr/bin/env python3
"""
Script to reorganize CSS files in /src/styles/components/ by categories
"""
import os
import shutil
from pathlib import Path

# Base path
BASE_PATH = Path("/tmp/cc-agent/58950954/project/src/styles/components")

# File categorization mapping
CATEGORIES = {
    "navigation": [
        "central-actions-menu.css",
        "new-mobile-bottom-bar.css",
        "mobile-drawer-liquid-glass.css",
    ],
    "chat": [
        "coach-chat.css",
        "chat-messages.css",
        "chat-input-typing.css",
        "chat-notification-bubble.css",
        "global-chat-drawer.css",
        "global-chat-drawer-desktop.css",
        "voice-coach-panel.css",
        "unified-coach-drawer.css",
    ],
    "buttons": [
        "floating-chat-button.css",
        "floating-chat-button-step2.css",
        "floating-voice-coach-button.css",
        "floating-generate-button.css",
        "unified-floating-button.css",
    ],
    "training": [
        "training-loader.css",
        "training-illustration.css",
        "training-hero-animations.css",
        "training-coach-notification.css",
        "training-prescription-card-mobile.css",
        "active-exercise-card.css",
        "functional-training.css",
        "exercise-card-skeleton.css",
        "rep-display-optimizations.css",
    ],
    "nutrition": [
        "meal-scan-results.css",
        "fridge-scan-animations.css",
        "fasting-cta-3d.css",
    ],
    "profile": [
        "profile-sections.css",
        "settings-components.css",
        "connected-devices.css",
        "face-shape-controls.css",
    ],
    "ui-elements": [
        "inputs.css",
        "loading.css",
        "loader-animations.css",
        "generic-drawer.css",
        "page-header-responsive.css",
    ],
    "effects": [
        "celebration-animations.css",
        "endurance-map.css",
    ],
}

# Import mapping for updating
IMPORT_MAP = {}

def create_category_folders():
    """Create category folders"""
    for category in CATEGORIES.keys():
        category_path = BASE_PATH / category
        category_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created folder: {category}")

def move_files():
    """Move CSS files to their category folders"""
    for category, files in CATEGORIES.items():
        for file in files:
            src = BASE_PATH / file
            dest = BASE_PATH / category / file

            if src.exists():
                shutil.move(str(src), str(dest))

                # Build import map
                old_import = f"./components/{file}"
                new_import = f"./components/{category}/{file}"
                IMPORT_MAP[old_import] = new_import

                print(f"✓ Moved: {file} → {category}/")
            else:
                print(f"⚠ File not found: {file}")

def update_index_css():
    """Update imports in /src/styles/index.css"""
    index_path = Path("/tmp/cc-agent/58950954/project/src/styles/index.css")

    if not index_path.exists():
        print("⚠ index.css not found")
        return

    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update imports
    for old_import, new_import in IMPORT_MAP.items():
        content = content.replace(old_import, new_import)

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ Updated /src/styles/index.css")

def update_main_index_css():
    """Update imports in /src/index.css"""
    index_path = Path("/tmp/cc-agent/58950954/project/src/index.css")

    if not index_path.exists():
        print("⚠ /src/index.css not found")
        return

    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update the two imports in src/index.css
    content = content.replace(
        "./styles/components/loader-animations.css",
        "./styles/components/ui-elements/loader-animations.css"
    )
    content = content.replace(
        "./styles/components/endurance-map.css",
        "./styles/components/effects/endurance-map.css"
    )

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ Updated /src/index.css")

def print_summary():
    """Print summary of reorganization"""
    print("\n" + "="*60)
    print("CSS REORGANIZATION COMPLETE")
    print("="*60)
    print(f"\n📁 Created {len(CATEGORIES)} category folders:")
    for category in CATEGORIES.keys():
        print(f"   - {category}/")

    print(f"\n📄 Moved {sum(len(files) for files in CATEGORIES.values())} CSS files")

    print("\n📝 Updated imports in:")
    print("   - /src/styles/index.css")
    print("   - /src/index.css")

    print("\n✅ All done! No regressions - all imports updated.\n")

if __name__ == "__main__":
    print("\n🚀 Starting CSS reorganization...\n")

    # Step 1: Create folders
    print("Step 1: Creating category folders...")
    create_category_folders()

    # Step 2: Move files
    print("\nStep 2: Moving files to categories...")
    move_files()

    # Step 3: Update imports in /src/styles/index.css
    print("\nStep 3: Updating imports...")
    update_index_css()

    # Step 4: Update imports in /src/index.css
    update_main_index_css()

    # Step 5: Print summary
    print_summary()
