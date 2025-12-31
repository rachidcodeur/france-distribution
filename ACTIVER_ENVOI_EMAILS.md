# Guide : Activer l'envoi d'emails lors de l'inscription

## Problème
Les emails de confirmation ne sont plus envoyés lors de l'inscription de nouveaux utilisateurs.

## Solution : Configurer l'envoi d'emails dans Supabase

### Étape 1 : Activer la confirmation d'email

1. Allez dans votre **Supabase Dashboard**
2. Naviguez vers **Authentication** → **Settings** → **Email Auth**
3. **Activez** l'option **"Enable email confirmations"**
4. Sauvegardez les modifications

### Étape 2 : Configurer un service SMTP (OBLIGATOIRE)

Supabase nécessite un service SMTP configuré pour envoyer des emails. Par défaut, Supabase n'a pas de service SMTP configuré.

#### Option A : Utiliser Gmail SMTP (Gratuit)

1. Dans **Supabase Dashboard**, allez dans **Settings** → **Auth** → **SMTP Settings**
2. Configurez les paramètres suivants :
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: votre-email@gmail.com
   Password: [Mot de passe d'application Gmail]
   Sender email: votre-email@gmail.com
   Sender name: France Distribution
   ```

3. **Créer un mot de passe d'application Gmail** :
   - Allez sur https://myaccount.google.com/security
   - Activez la "Validation en deux étapes" si ce n'est pas déjà fait
   - Allez dans "Mots de passe des applications"
   - Créez un nouveau mot de passe d'application
   - Utilisez ce mot de passe (pas votre mot de passe Gmail normal) dans Supabase

#### Option B : Utiliser SendGrid (Gratuit jusqu'à 100 emails/jour)

1. Créez un compte sur [SendGrid](https://sendgrid.com)
2. Créez une clé API dans SendGrid
3. Dans **Supabase Dashboard**, configurez :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Votre clé API SendGrid]
   Sender email: votre-email@votre-domaine.com
   Sender name: France Distribution
   ```

#### Option C : Utiliser Mailgun (Gratuit jusqu'à 5000 emails/mois)

1. Créez un compte sur [Mailgun](https://www.mailgun.com)
2. Vérifiez votre domaine
3. Dans **Supabase Dashboard**, configurez avec les informations SMTP fournies par Mailgun

### Étape 3 : Configurer les URLs de redirection

1. Dans **Supabase Dashboard**, allez dans **Authentication** → **URL Configuration**
2. Dans **Redirect URLs**, ajoutez :
   ```
   http://localhost:3000/auth/callback
   https://votre-domaine.com/auth/callback
   ```
3. Dans **Site URL**, configurez :
   ```
   http://localhost:3000
   ```
   (ou votre URL de production)

### Étape 4 : Tester l'envoi d'emails

1. Créez un nouveau compte utilisateur
2. Vérifiez que l'email de confirmation est bien reçu
3. Si l'email n'arrive pas :
   - Vérifiez le dossier spam
   - Consultez les logs dans **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Vérifiez que le service SMTP est correctement configuré

## Vérification rapide

Pour vérifier si l'envoi d'emails est activé :

1. **Supabase Dashboard** → **Authentication** → **Settings** → **Email Auth**
   - ✅ "Enable email confirmations" doit être **activé**
   
2. **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
   - ✅ Un service SMTP doit être **configuré** avec tous les champs remplis

## Note importante

Si vous désactivez la confirmation d'email, les utilisateurs seront automatiquement connectés après l'inscription, mais **aucun email ne sera envoyé**. Pour envoyer des emails, vous devez :
1. Activer la confirmation d'email
2. Configurer un service SMTP

## Dépannage

Si les emails ne sont toujours pas envoyés après configuration :

1. Vérifiez les logs dans **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Testez la configuration SMTP avec un outil externe
3. Vérifiez que votre service SMTP n'a pas atteint ses limites
4. Contactez le support Supabase si le problème persiste

