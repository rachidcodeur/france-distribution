# Configuration de la redirection Supabase après confirmation d'email

## Problème résolu

Lorsqu'un utilisateur crée un compte et doit confirmer son email, le lien de confirmation le redirige vers Supabase, et les données stockées dans `sessionStorage` étaient perdues.

## Solution implémentée

1. **Remplacement de `sessionStorage` par `localStorage`** : Les données persistent même après redirection
2. **Page de callback `/auth/callback`** : Gère le retour après confirmation d'email
3. **Configuration de l'URL de redirection** : Supabase redirige vers `/auth/callback` après confirmation

## Configuration dans Supabase Dashboard

Pour que la redirection fonctionne correctement, vous devez configurer l'URL de redirection dans Supabase :

1. Allez dans **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Dans **Redirect URLs**, ajoutez :
   ```
   http://localhost:3000/auth/callback
   https://votre-domaine.com/auth/callback
   ```
   (Remplacez `votre-domaine.com` par votre domaine de production)

3. Dans **Site URL**, configurez :
   ```
   http://localhost:3000
   ```
   (ou votre URL de production)

## Fonctionnement

1. L'utilisateur crée un compte → Les données sont stockées dans `localStorage`
2. L'utilisateur reçoit un email de confirmation
3. L'utilisateur clique sur le lien → Redirection vers `/auth/callback`
4. La page de callback :
   - Restaure la session Supabase
   - Vérifie si des données sont en attente dans `localStorage`
   - Redirige vers la page de login avec les données restaurées
5. L'utilisateur se connecte → Les données sont sauvegardées automatiquement

## Avantages

- ✅ Les données persistent même après redirection
- ✅ L'utilisateur ne perd pas son parcours
- ✅ Expérience utilisateur fluide
- ✅ Pas besoin de désactiver la confirmation d'email

