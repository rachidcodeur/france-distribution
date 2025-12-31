import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Créer le client Supabase uniquement si les variables sont définies
let supabaseClient: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // En mode développement, afficher un avertissement mais ne pas faire planter l'app
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Supabase n\'est pas configuré. ' +
      'Veuillez créer un fichier .env.local à la racine du projet avec :\n' +
      'NEXT_PUBLIC_SUPABASE_URL=votre_url\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle\n\n' +
      'Les fonctionnalités d\'authentification et d\'enregistrement seront désactivées.'
    )
  }
  
  // Créer un client mock pour éviter les erreurs
  supabaseClient = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  ) as any
}

export const supabase = supabaseClient!

