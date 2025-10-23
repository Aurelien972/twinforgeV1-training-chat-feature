# Guide de Démarrage Rapide - Apple Health & Sign-In

Configuration rapide en 30 minutes pour tester Apple Health sur votre iPhone.

## Prérequis Express

- [ ] Compte Apple Developer (99€/an) → [S'inscrire](https://developer.apple.com/programs/)
- [ ] Mac avec Xcode installé
- [ ] iPhone physique (iOS 14+)
- [ ] Email de votre compte Apple Developer

## Étape 1 : Configuration Apple (10 min)

### A. Créer l'App ID
1. Allez sur https://developer.apple.com/account/
2. **Identifiers** → **+** → **App IDs**
3. Remplissez :
   - Bundle ID : `com.twinforge.app`
   - Cochez : **HealthKit** et **Sign in with Apple**
4. **Register**

### B. Créer le Services ID
1. **Identifiers** → **+** → **Services IDs**
2. Remplissez :
   - Identifier : `com.twinforge.app.web`
   - Cochez **Sign in with Apple**
3. Configurez :
   - Domains : `VOTRE_PROJET.supabase.co`
   - Return URL : `https://VOTRE_PROJET.supabase.co/auth/v1/callback`
4. **Save** → **Register**

### C. Générer la clé
1. **Keys** → **+**
2. Name : `TwinForge Auth Key`
3. Cochez **Sign in with Apple**
4. **Register** → **Download** (fichier .p8)
5. ⚠️ **IMPORTANT** : Notez le **Key ID** et votre **Team ID**

## Étape 2 : Configuration Supabase (5 min)

1. Ouvrez votre [Supabase Dashboard](https://app.supabase.com/)
2. **Authentication** → **Providers** → **Apple**
3. Activez Apple et remplissez :
   - **Services ID** : `com.twinforge.app.web`
   - **Team ID** : (de l'étape 1C)
   - **Key ID** : (de l'étape 1C)
   - **Private Key** : (contenu du fichier .p8)
4. **Save**

## Étape 3 : Build iOS (10 min)

### Installation

```bash
# Dans le dossier du projet
npm install

# Ajouter Capacitor (si pas déjà fait)
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Build et générer iOS
npm run build
npx cap add ios
npx cap sync ios
```

### Ouvrir dans Xcode

```bash
npm run ios:open
```

## Étape 4 : Configuration Xcode (5 min)

### Dans Xcode qui vient de s'ouvrir :

1. **Sélectionnez le projet "App"** (icône bleue en haut à gauche)
2. **Signing & Capabilities** :
   - Team : Sélectionnez votre équipe Apple Developer
   - ✅ Vérifiez que "Automatically manage signing" est coché

3. **Cliquez sur "+ Capability"** et ajoutez :
   - ✅ HealthKit
   - ✅ Sign in with Apple

4. **Info.plist** :
   - Clic droit sur `App` → **New File** → **Property List**
   - Ou éditez le fichier existant
   - Ajoutez :

```xml
<key>NSHealthShareUsageDescription</key>
<string>TwinForge accède à vos données de santé pour optimiser vos entraînements</string>

<key>NSHealthUpdateUsageDescription</key>
<string>TwinForge peut enregistrer vos entraînements dans Apple Health</string>
```

## Étape 5 : Test sur iPhone (5 min)

### Option A : Test direct (nécessite câble)
1. Branchez votre iPhone au Mac
2. Dans Xcode, sélectionnez votre iPhone en haut
3. Cliquez sur **▶️ Run**
4. Autorisez le développeur sur iPhone : **Réglages** → **Général** → **Gestion VPN et appareils**

### Option B : Test via TestFlight (recommandé)
1. Dans Xcode : **Product** → **Archive**
2. **Distribute App** → **App Store Connect**
3. Attendez 15-30 min
4. Installez TestFlight sur iPhone
5. Installez TwinForge depuis TestFlight

## Étape 6 : Tester les fonctionnalités

### A. Test Apple Sign-In
1. Ouvrez TwinForge sur iPhone
2. Cliquez sur **"Se connecter avec Apple"**
3. Autorisez
4. ✅ Vous devriez être connecté

### B. Test Apple Health
1. Dans TwinForge : **Settings** → **Connected Devices**
2. Cliquez sur **"Connecter Apple Health"**
3. Autorisez toutes les permissions
4. Cliquez sur **"Synchroniser maintenant"**
5. Attendez quelques secondes
6. ✅ Vos données Apple Watch/iPhone s'affichent dans **Activity**

## Checklist de Validation

- [ ] App compile sans erreur dans Xcode
- [ ] App s'installe sur iPhone
- [ ] Bouton "Sign in with Apple" visible sur écran de connexion
- [ ] Connexion Apple fonctionne
- [ ] Apple Health Card visible dans Settings
- [ ] Demande de permissions HealthKit s'affiche
- [ ] Synchronisation récupère des données
- [ ] Données visibles dans l'onglet Activity

## Problèmes Courants

### "No bundle identifier found"
→ Vérifiez que `capacitor.config.ts` a `appId: 'com.twinforge.app'`

### "Code signing failed"
→ Dans Xcode : **Signing & Capabilities** → Sélectionnez votre Team

### "HealthKit not available"
→ Ajoutez la capability HealthKit dans Xcode

### "Authorization denied"
→ Vérifiez Info.plist et les Usage Descriptions

### Aucune donnée après sync
→ Vérifiez que vous avez des données dans Apple Health/Santé
→ Lancez l'app Activité ou Santé pour générer des données

## Prochaines Étapes

Une fois le test validé :

1. **Améliorer le plugin natif** : Ajoutez les méthodes manquantes (HRV, workouts détaillés, etc.)
2. **Synchronisation automatique** : Implémentez Background Fetch
3. **Soumettre sur App Store** : Suivez le guide complet `APPLE_HEALTH_SETUP.md`
4. **Ajouter d'autres providers** : Garmin, Strava, Fitbit, etc.

## Support Rapide

### Xcode ne s'ouvre pas
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

### Réinitialiser Capacitor
```bash
rm -rf ios
npx cap add ios
npx cap sync ios
```

### Voir les logs en temps réel
Dans Xcode : **View** → **Debug Area** → **Activate Console**

## Ressources Express

- [Docs Capacitor](https://capacitorjs.com/docs/ios)
- [Docs HealthKit](https://developer.apple.com/healthkit/)
- [Docs Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [TestFlight Guide](https://developer.apple.com/testflight/)

---

**Temps total estimé** : 30-45 minutes

**Prêt à commencer ?** Suivez les étapes dans l'ordre et vous aurez Apple Health fonctionnel sur votre iPhone ! 🚀
