import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseServiceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Supabase service role key or URL not configured' },
      { status: 500 }
    )
  }

  const ADMIN_EMAIL = 'montes.virgile@gmail.com'
  const ADMIN_PASSWORD = 'Distrimag33@'

  try {
    // Créer un client Supabase avec la clé de rôle de service
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL)

    if (existingUser) {
      // L'utilisateur existe déjà, on peut réinitialiser le mot de passe
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: ADMIN_PASSWORD, email_confirm: true }
      )

      if (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Compte admin mis à jour avec succès',
        user: data.user 
      })
    } else {
      // Créer le nouvel utilisateur
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Confirmer l'email automatiquement
      })

      if (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Compte admin créé avec succès',
        user: data.user 
      })
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 })
  }
}

