import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ContactPayload = {
  name?: string
  email?: string
  phone?: string
  company?: string
  message?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload

    const name = body.name?.trim()
    const email = body.email?.trim()
    const phone = body.phone?.trim() || null
    const company = body.company?.trim() || null
    const message = body.message?.trim()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error } = await supabase
      .from('france_distri_contacts_submissions')
      .insert({
        name,
        email,
        phone,
        company,
        message
      })

    if (error) {
      console.error('Erreur Supabase contact submission:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur API contact-submission:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}


