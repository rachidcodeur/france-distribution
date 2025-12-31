'use client'

import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isSupabaseConfigured()) {
      setError('Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement.')
      return
    }
    
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        // Inscription
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0]
            }
          }
        })

        if (signUpError) throw signUpError

        if (data.user) {
          setMessage('Compte créé avec succès ! Vous pouvez maintenant confirmer votre sélection.')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 1500)
        }
      } else {
        // Connexion
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.user) {
          setMessage('Connexion réussie !')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 1000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 'var(--spacing-lg)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-accent)',
          borderRadius: '16px',
          padding: 'var(--spacing-2xl)',
          maxWidth: '500px',
          width: '100%',
          border: '2px solid #353550',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-montserrat)', 
            fontSize: '24px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: 'var(--spacing-lg)',
          lineHeight: 1.6
        }}>
          {isSignUp 
            ? 'Créez un compte pour suivre l\'évolution de vos demandes de participation aux tournées de distribution.'
            : 'Connectez-vous pour accéder à vos demandes de participation.'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid #F44336',
            borderRadius: '8px',
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            color: '#F44336'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF50',
            borderRadius: '8px',
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            color: '#4CAF50'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ 
                display: 'block', 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--spacing-sm)',
                fontSize: '14px',
                fontWeight: 500
              }}>
                Nom (optionnel)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  background: 'rgba(31, 46, 78, 0.4)',
                  border: '2px solid #353550',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-poppins)'
                }}
                placeholder="Votre nom"
              />
            </div>
          )}

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ 
              display: 'block', 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'rgba(31, 46, 78, 0.4)',
                border: '2px solid #353550',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontFamily: 'var(--font-poppins)'
              }}
              placeholder="votre@email.com"
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ 
              display: 'block', 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-sm)',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Mot de passe *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'rgba(31, 46, 78, 0.4)',
                border: '2px solid #353550',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontFamily: 'var(--font-poppins)'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginBottom: 'var(--spacing-md)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--orange-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  )
}

