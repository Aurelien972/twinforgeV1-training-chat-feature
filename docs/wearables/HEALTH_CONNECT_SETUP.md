# Configuration Google Health Connect API

Ce guide vous explique pas à pas comment configurer l'intégration Health Connect (anciennement Google Fit) pour votre application TwinForge.

## Contexte Important

⚠️ **Google Fit API est déprécié depuis mai 2024**

- Les anciennes APIs Google Fit seront complètement arrêtées fin 2026
- Health Connect est la nouvelle plateforme officielle pour Android
- Toutes les nouvelles applications doivent utiliser Health Connect

## Prérequis

1. Un compte Google Cloud Platform
2. Un projet Google Cloud Platform créé
3. Accès aux APIs Google Cloud Console

---

## Étape 1: Configuration Google Cloud Platform

### 1.1 Créer ou sélectionner un projet

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur le sélecteur de projet en haut
3. Créez un nouveau projet ou sélectionnez votre projet existant
4. Notez l'**ID du projet** (vous en aurez besoin plus tard)

### 1.2 Activer les APIs nécessaires

Accédez à [API Library](https://console.cloud.google.com/apis/library)

**APIs à activer:**

1. **Health Connect API** (Nouvelle API recommandée)
   - URL: `https://console.cloud.google.com/apis/library/health-connect.googleapis.com`
   - Cliquez sur "Activer"

2. **Fitness API** (Pour compatibilité avec anciennes versions)
   - URL: `https://console.cloud.google.com/apis/library/fitness.googleapis.com`
   - Cliquez sur "Activer"

3. **People API** (Pour récupérer les informations utilisateur)
   - URL: `https://console.cloud.google.com/apis/library/people.googleapis.com`
   - Cliquez sur "Activer"

---

## Étape 2: Configuration OAuth 2.0

### 2.1 Configurer l'écran de consentement OAuth

1. Accédez à [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choisissez le type d'utilisateur:
   - **Interne**: Pour tests uniquement dans votre organisation
   - **Externe**: Pour production (accessible à tous les utilisateurs)
3. Remplissez les informations requises:
   - **Nom de l'application**: TwinForge
   - **E-mail d'assistance**: votre email
   - **Logo de l'application**: (optionnel)
   - **Domaine d'application autorisé**: votre domaine (ex: twinforge.app)
   - **Domaines autorisés**: Ajoutez votre domaine Netlify et domaine personnalisé
4. Cliquez sur "Enregistrer et continuer"

### 2.2 Ajouter les Scopes (Autorisations)

Dans la section "Scopes", ajoutez les autorisations suivantes:

**Health Connect Scopes (Nouveaux - Recommandés):**
```
https://www.googleapis.com/auth/fitness.activity.read
https://www.googleapis.com/auth/fitness.body.read
https://www.googleapis.com/auth/fitness.heart_rate.read
https://www.googleapis.com/auth/fitness.location.read
https://www.googleapis.com/auth/fitness.sleep.read
```

**Scopes additionnels:**
```
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

Cliquez sur "Ajouter ou supprimer des champs d'application", recherchez et ajoutez chaque scope.

### 2.3 Créer les identifiants OAuth 2.0

1. Accédez à [Credentials](https://console.cloud.google.com/apis/credentials)
2. Cliquez sur "+ CRÉER DES IDENTIFIANTS" → "ID client OAuth"
3. Sélectionnez le type d'application: **"Application Web"**
4. Configurez:

   **Nom**: TwinForge Web Client

   **Origines JavaScript autorisées**:
   ```
   http://localhost:5173
   http://localhost:3000
   https://votre-app.netlify.app
   https://votre-domaine-personnalise.com
   ```

   **URI de redirection autorisés**:
   ```
   https://kwipydbtjagypocpvbwn.supabase.co/functions/v1/wearable-oauth-callback
   http://localhost:54321/functions/v1/wearable-oauth-callback
   ```

5. Cliquez sur "Créer"
6. **IMPORTANT**: Copiez et sauvegardez:
   - **Client ID** (ID client)
   - **Client Secret** (Secret client)

---

## Étape 3: Configuration Android (Pour application mobile future)

Si vous prévoyez une application Android native:

### 3.1 Créer un identifiant Android

1. Dans [Credentials](https://console.cloud.google.com/apis/credentials)
2. Cliquez sur "+ CRÉER DES IDENTIFIANTS" → "ID client OAuth"
3. Sélectionnez: **"Android"**
4. Configurez:
   - **Nom**: TwinForge Android
   - **Nom du package**: com.twinforge.app (votre package name)
   - **Empreinte SHA-1**: Obtenez-la avec `keytool -list -v -keystore ~/.android/debug.keystore`

### 3.2 Permissions Android Manifest

Ajoutez dans votre `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_DISTANCE" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />
```

---

## Étape 4: Configuration des Variables d'Environnement

### 4.1 Fichier `.env` local

Créez ou modifiez votre fichier `.env`:

```env
# Google Health Connect / Fit Configuration
VITE_GOOGLE_OAUTH_CLIENT_ID=votre-client-id.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_REDIRECT_URI=https://kwipydbtjagypocpvbwn.supabase.co/functions/v1/wearable-oauth-callback

# Ne pas exposer le secret côté client !
GOOGLE_OAUTH_CLIENT_SECRET=votre-client-secret
```

### 4.2 Configuration Netlify (Production)

1. Accédez à votre dashboard Netlify
2. Allez dans "Site settings" → "Environment variables"
3. Ajoutez les variables:

```
VITE_GOOGLE_OAUTH_CLIENT_ID=votre-client-id.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_REDIRECT_URI=https://kwipydbtjagypocpvbwn.supabase.co/functions/v1/wearable-oauth-callback
```

**⚠️ IMPORTANT**: Ne JAMAIS exposer `GOOGLE_OAUTH_CLIENT_SECRET` côté client !

### 4.3 Configuration Supabase Edge Functions

Les secrets doivent être configurés dans Supabase:

1. Accédez à votre projet Supabase Dashboard
2. Allez dans "Edge Functions" → "Secrets"
3. Ajoutez:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`

---

## Étape 5: Mise à jour du Code

### 5.1 Fichier connectedDevices.ts

Le fichier est déjà configuré pour Health Connect. Vérifiez la configuration:

```typescript
google_fit: {
  id: 'google_fit',
  name: 'Google Fit',
  description: 'Google Fit et Android Health',
  icon: 'Activity',
  color: '#4285F4',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scopes: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
  ],
  dataTypes: ['heart_rate', 'steps', 'calories', 'distance', 'workout', 'weight'],
  supportsWebhooks: false,
  requiresApp: true,
  platform: 'android',
}
```

### 5.2 Mise à jour du ConnectedDevicesTab

Modifiez `/src/app/pages/Settings/ConnectedDevicesTab.tsx`:

```typescript
const authUrl = new URL(config.authUrl);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID); // 👈 Utilisez la variable d'env
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('scope', config.scopes.join(' '));
authUrl.searchParams.set('access_type', 'offline'); // Important pour refresh token
authUrl.searchParams.set('prompt', 'consent'); // Force le consentement
```

---

## Étape 6: Test de l'Intégration

### 6.1 Test en développement local

1. Démarrez votre serveur local: `npm run dev`
2. Accédez à Settings → Connected Devices
3. Cliquez sur "Connecter" pour Google Fit
4. Vérifiez que la redirection OAuth fonctionne
5. Acceptez les permissions demandées
6. Vérifiez que vous êtes redirigé vers l'application

### 6.2 Vérifications

✅ **Checklist de test:**
- [ ] Le bouton "Connecter" ouvre la page OAuth Google
- [ ] Les scopes demandés sont affichés correctement
- [ ] Après acceptation, retour vers l'application
- [ ] L'appareil apparaît dans la liste "Mes Appareils"
- [ ] Le statut est "Connecté"
- [ ] La synchronisation manuelle fonctionne
- [ ] Les données apparaissent dans l'onglet Activité

### 6.3 Debugging

Si des erreurs surviennent, vérifiez:

1. **Console Browser**: Ouvrez DevTools pour voir les erreurs JavaScript
2. **Network Tab**: Vérifiez les requêtes OAuth
3. **Supabase Logs**: Vérifiez les logs de l'Edge Function
4. **Google Cloud Console**: Vérifiez les quotas et erreurs API

---

## Étape 7: Quotas et Limites

### Quotas par défaut (Gratuit)

- **Requêtes par jour**: 25,000
- **Requêtes par minute**: 300
- **Requêtes par utilisateur par jour**: 500

### Augmenter les quotas

Si nécessaire, accédez à [Quotas](https://console.cloud.google.com/apis/api/fitness.googleapis.com/quotas) et demandez une augmentation.

---

## Étape 8: Passage en Production

### 8.1 Vérification OAuth

Avant de passer en production:

1. Accédez à [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Vérifiez que le statut est "En production"
3. Si nécessaire, soumettez l'application pour vérification Google

### 8.2 Vérification Domaine

1. Vérifiez la propriété de votre domaine dans Google Search Console
2. Ajoutez les domaines autorisés dans OAuth Consent Screen

### 8.3 Documentation utilisateur

Créez une page d'aide pour vos utilisateurs expliquant:
- Comment connecter leur appareil Android
- Quelles données sont collectées
- Comment désactiver la synchronisation
- Politique de confidentialité

---

## Ressources Officielles

- [Health Connect Documentation](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Migration Guide Google Fit → Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect/migrate/migration-guide)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Fitness API Reference](https://developers.google.com/fit/rest/v1/reference)

---

## Troubleshooting Courant

### Erreur: "redirect_uri_mismatch"

**Solution**: Vérifiez que l'URI de redirection dans votre code correspond EXACTEMENT à celle configurée dans Google Cloud Console.

### Erreur: "invalid_scope"

**Solution**: Vérifiez que tous les scopes demandés sont bien activés dans l'écran de consentement OAuth.

### Erreur: "access_denied"

**Solution**: L'utilisateur a refusé les permissions. Assurez-vous que les permissions demandées sont clairement expliquées.

### Les données ne se synchronisent pas

**Solution**:
1. Vérifiez que l'utilisateur a bien donné les permissions dans les paramètres Android
2. Vérifiez les logs Supabase Edge Function
3. Vérifiez que le token OAuth n'est pas expiré

---

## Support

Pour toute question sur cette configuration, consultez:
- Documentation interne: `/docs/wearables/`
- Issues GitHub du projet
- Slack channel #twinforge-dev
