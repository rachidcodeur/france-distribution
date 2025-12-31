# Guide de débogage - Authentification Supabase

## Problème : Erreur lors de la création de compte

### Vérifications à effectuer

1. **Vérifier la configuration de l'email dans Supabase**
   - Allez dans Supabase Dashboard → Authentication → Settings
   - Vérifiez si "Enable email confirmations" est activé
   - Si oui, désactivez-le temporairement pour les tests OU informez les utilisateurs qu'ils doivent confirmer leur email

2. **Vérifier les politiques RLS**
   - La politique doit être : `((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))`
   - ✅ C'est correct selon votre résultat

3. **Vérifier les logs dans la console du navigateur**
   - Ouvrez la console (F12)
   - Regardez les logs qui commencent par :
     - ✅ Compte créé, user ID: ...
     - ✅ Session disponible: ...
     - ✅ Session établie après attente, sauvegarde...
     - ❌ Erreur session: ...

### Solutions possibles

#### Solution 1 : Désactiver la confirmation d'email (pour les tests)

Dans Supabase Dashboard :
1. Authentication → Settings → Email Auth
2. Désactivez "Enable email confirmations"
3. Testez à nouveau la création de compte

#### Solution 2 : Gérer la confirmation d'email

Si vous voulez garder la confirmation d'email activée :
- Les utilisateurs devront vérifier leur email avant de pouvoir se connecter
- Le code actuel gère ce cas et affiche un message approprié

#### Solution 3 : Vérifier que la session est bien établie

Le code ajoute maintenant des logs détaillés. Vérifiez dans la console :
- Si "Session disponible: true" → Le problème vient d'ailleurs
- Si "Session disponible: false" → Supabase nécessite probablement une confirmation d'email

### Test rapide

1. Ouvrez la console du navigateur (F12)
2. Créez un compte
3. Regardez les logs dans la console
4. Partagez les logs pour un diagnostic plus précis

