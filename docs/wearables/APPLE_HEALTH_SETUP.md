# Configuration Apple Health et Apple Sign-In

Guide complet pour intégrer Apple Health (HealthKit) et Apple Sign-In dans TwinForge.

## Prérequis

- Compte Apple Developer actif (99€/an)
- Accès à App Store Connect
- Xcode installé sur Mac (pour la compilation iOS)
- Node.js et npm installés

## 1. Configuration Apple Developer Console

### 1.1 Créer l'App ID

1. Allez sur [Apple Developer Portal](https://developer.apple.com/account/)
2. Naviguez vers **Certificates, Identifiers & Profiles** → **Identifiers**
3. Cliquez sur le **+** pour créer un nouvel App ID
4. Sélectionnez **App IDs** et cliquez sur **Continue**
5. Configuration :
   - **Description** : `TwinForge iOS App`
   - **Bundle ID** : `com.twinforge.app` (doit correspondre à `appId` dans `capacitor.config.ts`)
   - **Capabilities** :
     - ✅ Sign in with Apple
     - ✅ HealthKit
     - ✅ Push Notifications (optionnel)

6. Cliquez sur **Continue** puis **Register**

### 1.2 Créer le Services ID (pour Sign in with Apple)

1. Dans **Identifiers**, cliquez sur le **+**
2. Sélectionnez **Services IDs** et cliquez sur **Continue**
3. Configuration :
   - **Description** : `TwinForge Web Auth`
   - **Identifier** : `com.twinforge.app.web`

4. Cochez **Sign in with Apple**
5. Cliquez sur **Configure** à côté de Sign in with Apple
6. Ajoutez vos domaines autorisés :
   - **Primary App ID** : Sélectionnez `com.twinforge.app`
   - **Domains and Subdomains** :
     - `your-domain.com`
     - `your-project.supabase.co`
   - **Return URLs** :
     - `https://your-project.supabase.co/auth/v1/callback`
     - `https://your-domain.com/auth/callback`

7. Cliquez sur **Save** puis **Continue** et **Register**

### 1.3 Générer la clé d'authentification Apple

1. Allez dans **Keys** dans le menu de gauche
2. Cliquez sur le **+** pour créer une nouvelle clé
3. Configuration :
   - **Key Name** : `TwinForge Auth Key`
   - Cochez **Sign in with Apple**
   - Cliquez sur **Configure** et sélectionnez `com.twinforge.app` comme Primary App ID

4. Cliquez sur **Continue** puis **Register**
5. **IMPORTANT** : Téléchargez la clé immédiatement (fichier `.p8`)
   - Vous ne pourrez plus la télécharger après !
   - Notez le **Key ID** affiché (format : `ABC123XYZ`)
   - Notez votre **Team ID** (visible en haut à droite)

6. Conservez ces informations en sécurité :
   - Fichier `.p8` (Private Key)
   - Key ID
   - Team ID

## 2. Configuration App Store Connect

### 2.1 Créer l'application

1. Allez sur [App Store Connect](https://appstoreconnect.apple.com/)
2. Cliquez sur **My Apps** puis sur le **+** → **New App**
3. Configuration :
   - **Platform** : iOS
   - **Name** : `TwinForge`
   - **Primary Language** : French
   - **Bundle ID** : Sélectionnez `com.twinforge.app`
   - **SKU** : `twinforge-ios-001`
   - **User Access** : Full Access

4. Cliquez sur **Create**

### 2.2 Remplir les informations de l'app

1. Dans **App Information** :
   - **Category** : Health & Fitness
   - **Content Rights** : Ne contient pas de contenu tiers

2. Dans **Pricing and Availability** :
   - **Price** : Free (ou votre modèle de pricing)
   - **Availability** : Tous les pays

### 2.3 Configurer TestFlight

1. Allez dans l'onglet **TestFlight**
2. Créez un groupe de testeurs internes
3. Ajoutez les emails de vos testeurs

## 3. Configuration Supabase

### 3.1 Activer Apple comme provider OAuth

1. Allez dans votre [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Naviguez vers **Authentication** → **Providers**
4. Trouvez **Apple** et cliquez sur le toggle pour l'activer
5. Configuration :
   - **Services ID** : `com.twinforge.app.web`
   - **Team ID** : Votre Team ID Apple (ABC123)
   - **Key ID** : Votre Key ID (XYZ789)
   - **Private Key** : Collez le contenu du fichier `.p8` téléchargé

6. Cliquez sur **Save**

### 3.2 Vérifier les URLs de callback

Dans **URL Configuration**, assurez-vous que ces URLs sont configurées :
- Site URL : `https://your-domain.com`
- Redirect URLs :
  - `https://your-domain.com/**`
  - `com.twinforge.app://callback`
  - `twinforge://callback`

## 4. Configuration du projet Capacitor

### 4.1 Installer les dépendances

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

### 4.2 Initialiser Capacitor (déjà fait)

Le fichier `capacitor.config.ts` est déjà configuré avec :
```typescript
{
  appId: 'com.twinforge.app',
  appName: 'TwinForge',
  webDir: 'dist',
  // ...
}
```

### 4.3 Générer le projet iOS

```bash
npm run build
npx cap add ios
npx cap sync ios
```

### 4.4 Ouvrir dans Xcode

```bash
npx cap open ios
```

## 5. Configuration Xcode

### 5.1 Signing & Capabilities

1. Dans Xcode, sélectionnez le projet `App` dans le navigateur
2. Sélectionnez la target `App`
3. Dans l'onglet **Signing & Capabilities** :
   - **Team** : Sélectionnez votre équipe Apple Developer
   - **Bundle Identifier** : Vérifiez que c'est bien `com.twinforge.app`
   - **Signing Certificate** : Laissez Xcode gérer automatiquement

### 5.2 Ajouter les Capabilities

1. Cliquez sur **+ Capability** en haut à gauche
2. Ajoutez :
   - ✅ **HealthKit**
   - ✅ **Sign in with Apple**

### 5.3 Configurer Info.plist

Ajoutez les permissions HealthKit dans `ios/App/App/Info.plist` :

```xml
<key>NSHealthShareUsageDescription</key>
<string>TwinForge souhaite accéder à vos données de santé pour alimenter votre Forge Énergétique et optimiser vos entraînements.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>TwinForge peut écrire vos données d'entraînement dans Apple Health.</string>

<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>healthkit</string>
</array>
```

### 5.4 Configurer les types de données HealthKit

Dans Xcode, allez dans **HealthKit** capability et sélectionnez les types de données :

**Read Permissions** :
- Heart Rate
- Heart Rate Variability
- Step Count
- Active Energy Burned
- Basal Energy Burned
- Walking + Running Distance
- Cycling Distance
- Workout
- Sleep Analysis
- VO2 Max
- Resting Heart Rate
- Blood Oxygen Saturation

## 6. Implémenter le plugin natif HealthKit

### 6.1 Créer le fichier Swift

Créez `ios/App/App/AppleHealthPlugin.swift` :

```swift
import Foundation
import Capacitor
import HealthKit

@objc(AppleHealthPlugin)
public class AppleHealthPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()

    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = HKHealthStore.isHealthDataAvailable()
        call.resolve(["available": available])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard let readTypesArray = call.getArray("readTypes", String.self) else {
            call.reject("Missing readTypes parameter")
            return
        }

        let typesToRead = Set(readTypesArray.compactMap { getHealthType(from: $0) })

        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if let error = error {
                call.reject("Authorization failed", error.localizedDescription)
                return
            }
            call.resolve(["granted": success])
        }
    }

    @objc func getHeartRateData(_ call: CAPPluginCall) {
        guard let startDateString = call.getString("startDate"),
              let endDateString = call.getString("endDate"),
              let startDate = ISO8601DateFormatter().date(from: startDateString),
              let endDate = ISO8601DateFormatter().date(from: endDateString) else {
            call.reject("Invalid date parameters")
            return
        }

        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            call.reject("Heart rate type not available")
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let limit = call.getInt("limit") ?? HKObjectQueryNoLimit

        let query = HKSampleQuery(sampleType: heartRateType, predicate: predicate, limit: limit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { query, samples, error in
            if let error = error {
                call.reject("Query failed", error.localizedDescription)
                return
            }

            guard let samples = samples as? [HKQuantitySample] else {
                call.resolve(["data": []])
                return
            }

            let data = samples.map { sample -> [String: Any] in
                let value = sample.quantity.doubleValue(for: HKUnit(from: "count/min"))
                return [
                    "value": value,
                    "unit": "bpm",
                    "startDate": ISO8601DateFormatter().string(from: sample.startDate),
                    "endDate": ISO8601DateFormatter().string(from: sample.endDate),
                    "sourceApp": sample.sourceRevision.source.bundleIdentifier,
                    "device": sample.device?.name ?? "Unknown"
                ]
            }

            call.resolve(["data": data])
        }

        healthStore.execute(query)
    }

    // Implémentez les autres méthodes de façon similaire
    // (HRV, steps, calories, distance, workouts, etc.)

    private func getHealthType(from string: String) -> HKObjectType? {
        switch string {
        case "heartRate":
            return HKObjectType.quantityType(forIdentifier: .heartRate)
        case "heartRateVariability":
            return HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
        case "steps":
            return HKObjectType.quantityType(forIdentifier: .stepCount)
        case "activeCalories":
            return HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)
        case "restingCalories":
            return HKObjectType.quantityType(forIdentifier: .basalEnergyBurned)
        case "distance":
            return HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)
        case "workout":
            return HKObjectType.workoutType()
        case "sleep":
            return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
        case "vo2Max":
            return HKObjectType.quantityType(forIdentifier: .vo2Max)
        case "restingHeartRate":
            return HKObjectType.quantityType(forIdentifier: .restingHeartRate)
        case "oxygenSaturation":
            return HKObjectType.quantityType(forIdentifier: .oxygenSaturation)
        default:
            return nil
        }
    }
}
```

### 6.2 Enregistrer le plugin

Dans `ios/App/App/AppDelegate.swift`, enregistrez le plugin :

```swift
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    // ...

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Register the plugin
        if let bridge = (self.window?.rootViewController as? CAPBridgeViewController) {
            bridge.registerPluginInstance(AppleHealthPlugin())
        }
        return true
    }
}
```

## 7. Build et déploiement

### 7.1 Build web

```bash
npm run build
npx cap sync ios
```

### 7.2 Build iOS dans Xcode

1. Dans Xcode, sélectionnez un device iOS (physique ou simulateur)
2. Cliquez sur **Product** → **Build**
3. Vérifiez qu'il n'y a pas d'erreurs

### 7.3 Archive pour TestFlight

1. Dans Xcode, sélectionnez **Any iOS Device (arm64)** comme destination
2. Cliquez sur **Product** → **Archive**
3. Une fois l'archive créée, cliquez sur **Distribute App**
4. Sélectionnez **App Store Connect**
5. Suivez les étapes et uploadez

### 7.4 Configurer TestFlight

1. Dans App Store Connect, allez dans votre app
2. Naviguez vers **TestFlight**
3. Votre build apparaîtra après traitement (15-30 minutes)
4. Ajoutez des testeurs et distribuez

## 8. Test sur device iOS

### 8.1 Installer via TestFlight

1. Installez l'app TestFlight sur votre iPhone
2. Acceptez l'invitation de test par email
3. Installez TwinForge depuis TestFlight

### 8.2 Tester Apple Sign-In

1. Ouvrez TwinForge
2. Cliquez sur "Se connecter avec Apple"
3. Autorisez l'accès
4. Vérifiez que vous êtes connecté

### 8.3 Tester Apple Health

1. Dans TwinForge, allez dans Settings → Connected Devices
2. Cliquez sur "Connecter Apple Health"
3. Autorisez tous les types de données
4. Cliquez sur "Synchroniser maintenant"
5. Vérifiez que les données apparaissent dans Activity

## 9. Soumission App Store (après tests)

### 9.1 Préparer les assets

- Screenshots (obligatoire pour 6.5", 5.5" devices)
- App Icon (1024x1024)
- Privacy Policy URL
- Description complète

### 9.2 Soumettre pour review

1. Dans App Store Connect, allez dans **App Store**
2. Créez une nouvelle version
3. Remplissez toutes les informations
4. Ajoutez votre build TestFlight
5. Répondez aux questions de compliance (notamment HealthKit)
6. Soumettez pour review

## 10. Checklist finale

- ✅ App ID créé avec HealthKit et Sign in with Apple
- ✅ Services ID configuré
- ✅ Clé d'authentification Apple générée et sauvegardée
- ✅ Supabase configuré avec les credentials Apple
- ✅ Projet Capacitor iOS généré
- ✅ Capabilities HealthKit et Sign in with Apple ajoutées dans Xcode
- ✅ Info.plist configuré avec permissions HealthKit
- ✅ Plugin natif AppleHealthPlugin implémenté
- ✅ Build TestFlight uploadé
- ✅ Tests effectués sur device iOS physique
- ✅ Apple Sign-In fonctionnel
- ✅ Apple Health synchronisation fonctionnelle

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Xcode lors du build
2. Consultez les logs dans App Store Connect
3. Vérifiez que tous les identifiers correspondent (Bundle ID)
4. Assurez-vous que votre compte Apple Developer est actif
5. Vérifiez les permissions dans Réglages → Santé sur l'iPhone

## Ressources

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Sign in with Apple Documentation](https://developer.apple.com/documentation/sign_in_with_apple)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Supabase Apple OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)
