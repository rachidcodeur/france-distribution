'use client'

import { useState, useRef } from 'react'

interface FlyerConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (hasFlyer: boolean, flyerFile?: File | null, flyerUrl?: string) => void
  totalLogements: number
  coutDistribution: number
}

export default function FlyerConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  totalLogements,
  coutDistribution
}: FlyerConfirmationModalProps) {
  const [hasFlyer, setHasFlyer] = useState<boolean | null>(null)
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerUrl, setFlyerUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('Veuillez sélectionner un fichier image (JPG, PNG) ou PDF')
        return
      }
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB')
        return
      }
      setFlyerFile(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlyerUrl(e.target.value)
  }

  const handleConfirm = async () => {
    if (hasFlyer === null) {
      alert('Veuillez indiquer si vous avez un flyer')
      return
    }

    if (hasFlyer) {
      // Si l'utilisateur a un flyer, vérifier qu'il a fourni un fichier ou une URL
      if (!flyerFile && !flyerUrl.trim()) {
        alert('Veuillez fournir un fichier flyer ou une URL')
        return
      }
    }

    onConfirm(hasFlyer, flyerFile, flyerUrl || undefined)
  }

  const handleCancel = () => {
    setHasFlyer(null)
    setFlyerFile(null)
    setFlyerUrl('')
    onClose()
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--spacing-lg)'
      }}
      onClick={handleCancel}
    >
      <div 
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: 'var(--spacing-xl)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-soft)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-lg)',
          fontSize: '24px',
          fontWeight: 600
        }}>
          Confirmer votre sélection
        </h2>

        <div style={{
          background: 'var(--bg-accent)',
          borderRadius: '12px',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total logements :</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {Math.round(totalLogements).toLocaleString('fr-FR')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Coût de distribution :</span>
            <span style={{ color: 'var(--orange-primary)', fontWeight: 600, fontSize: '18px' }}>
              {coutDistribution.toFixed(2)}€
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--spacing-md)',
            fontSize: '16px'
          }}>
            Avez-vous déjà un flyer prêt pour cette distribution ?
          </p>

          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <button
              onClick={() => setHasFlyer(true)}
              style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                borderRadius: '8px',
                border: hasFlyer === true ? '2px solid var(--orange-primary)' : '2px solid var(--border-subtle)',
                background: hasFlyer === true ? 'rgba(251, 109, 37, 0.1)' : 'var(--bg-accent)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: hasFlyer === true ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              Oui, j'ai un flyer
            </button>
            <button
              onClick={() => setHasFlyer(false)}
              style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                borderRadius: '8px',
                border: hasFlyer === false ? '2px solid var(--orange-primary)' : '2px solid var(--border-subtle)',
                background: hasFlyer === false ? 'rgba(251, 109, 37, 0.1)' : 'var(--bg-accent)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: hasFlyer === false ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              Non, je dois en créer un
            </button>
          </div>

          {hasFlyer === true && (
            <div style={{
              background: 'var(--bg-accent)',
              borderRadius: '12px',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <p style={{ 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--spacing-md)',
                fontSize: '14px'
              }}>
                Importez votre flyer (JPG, PNG ou PDF - max 10MB)
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '2px dashed var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.borderColor = 'var(--orange-primary)'
                  e.currentTarget.background = 'rgba(251, 109, 37, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.borderColor = 'var(--border-subtle)'
                  e.currentTarget.background = 'var(--bg-secondary)'
                }}
              >
                {flyerFile ? `Fichier sélectionné : ${flyerFile.name}` : 'Cliquez pour sélectionner un fichier'}
              </button>

              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--spacing-md)',
                fontSize: '14px',
                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
              }}>
                ou
              </div>

              <input
                type="url"
                placeholder="Ou entrez une URL vers votre flyer"
                value={flyerUrl}
                onChange={handleUrlChange}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          {hasFlyer === false && (
            <div style={{
              background: 'var(--bg-accent)',
              borderRadius: '12px',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <h3 style={{
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-md)',
                fontSize: '18px'
              }}>
                Grille tarifaire pour la création de flyer
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: 'var(--orange-primary)',
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    50€
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Design simple
                  </div>
                </div>
                
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: 'var(--orange-primary)',
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-xs)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    100€
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Design avancé
                  </div>
                </div>
                
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: 'var(--spacing-md)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: 'var(--orange-primary)',
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-xs)',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif'
                  }}>
                    Sur mesure
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                  }}>
                    Devis personnalisé
                  </div>
                </div>
              </div>

              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                Après confirmation de votre sélection, notre équipe vous contactera pour discuter de vos besoins en création de flyer.
              </p>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={hasFlyer === null || uploading}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderRadius: '8px',
              border: 'none',
              background: hasFlyer === null || uploading ? 'var(--border-subtle)' : 'var(--orange-primary)',
              color: 'var(--text-primary)',
              cursor: hasFlyer === null || uploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              opacity: hasFlyer === null || uploading ? 0.5 : 1
            }}
          >
            {uploading ? 'Traitement...' : 'Confirmer et continuer'}
          </button>
        </div>
      </div>
    </div>
  )
}

