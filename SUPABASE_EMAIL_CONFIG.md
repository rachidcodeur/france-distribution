# Configuration des emails Supabase

## Problème : Pas d'email de confirmation reçu

### Solutions possibles

#### Solution 1 : Désactiver la confirmation d'email (Recommandé pour le développement)

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Settings** → **Email Auth**
3. Désactivez **"Enable email confirmations"**
4. Les utilisateurs seront automatiquement connectés après la création du compte

**Avantages :**
- Connexion immédiate après création de compte
- Pas besoin de configurer SMTP
- Expérience utilisateur plus fluide

#### Solution 2 : Configurer un service SMTP personnalisé

Si vous voulez garder la confirmation d'email, vous devez configurer un service SMTP :

1. Allez dans **Supabase Dashboard**
2. **Settings** → **Auth** → **SMTP Settings**
3. Configurez un service SMTP (Gmail, SendGrid, Mailgun, etc.)

**Services SMTP recommandés :**
- **SendGrid** (gratuit jusqu'à 100 emails/jour)
- **Mailgun** (gratuit jusqu'à 5000 emails/mois)
- **Gmail SMTP** (nécessite un mot de passe d'application)

#### Solution 3 : Vérifier les emails dans Supabase

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Users**
3. Vérifiez si l'utilisateur a été créé
4. Vous pouvez manuellement confirmer l'email depuis l'interface

#### Solution 4 : Utiliser l'URL de confirmation directe (pour les tests)

Dans Supabase, vous pouvez générer une URL de confirmation pour tester :
1. **Authentication** → **Users**
2. Cliquez sur l'utilisateur
3. Utilisez "Send magic link" ou générez une URL de confirmation

### Configuration SMTP avec Gmail (exemple)

Si vous choisissez d'utiliser Gmail SMTP :

```
Host: smtp.gmail.com
Port: 587
Username: votre-email@gmail.com
Password: [Mot de passe d'application Gmail]
Sender email: votre-email@gmail.com
Sender name: France Distribution
```

**Note :** Pour Gmail, vous devez créer un "Mot de passe d'application" dans les paramètres de sécurité de votre compte Google.

### Recommandation

Pour le développement et les tests, **désactivez la confirmation d'email**. Vous pourrez la réactiver plus tard en production avec un service SMTP configuré.

