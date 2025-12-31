import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cette route nécessite le service role key pour accéder aux utilisateurs
// Elle doit être protégée et accessible uniquement par l'admin

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Créer un client Supabase avec le service role key (accès admin)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Récupérer tous les utilisateurs
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      )
    }

    // Créer une map user_id -> email
    const userEmailMap: Record<string, string> = {}
    usersData.users.forEach(user => {
      userEmailMap[user.id] = user.email || 'Email non disponible'
    })

    return NextResponse.json(userEmailMap)
  } catch (error: any) {
    console.error('Erreur dans l\'API admin/users:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

