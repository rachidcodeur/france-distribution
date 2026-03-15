'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

interface IrisSelection {
  id: string
  participation_id: string
  iris_code: string
  iris_name: string
  logements: number | null
}

interface Participation {
  id: string
  ville_name: string
  tournee_date_debut: string
  tournee_date_fin: string
  tournee_index: number
  total_logements: number
  cout_distribution: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'bouclee' | 'valide'
  devis_numero?: string | null
  has_flyer: boolean
  flyer_title: string | null
  flyer_entreprise: string | null
  flyer_email?: string | null
  flyer_telephone?: string | null
  flyer_address_rue: string | null
  flyer_address_code_postal: string | null
  flyer_address_ville: string | null
  flyer_format: string | null
  needs_flyer_creation: boolean
  created_at: string
  updated_at: string
  iris_selections?: (IrisSelection & { participant_count?: number })[]
  iris_counts?: Map<string, number> // Nombre de participants par IRIS
  tourneeParticipantsCount?: number // Nombre de participants uniques sur la tournée (tous secteurs confondus)
  tourneeLimiteDate?: string | null // Date limite d'inscription (J-15) formatée FR
  isTourneeBloquee?: boolean // Si la tournée est bloquée (15 jours avant)
  isTourneePassee?: boolean // Si la date de la tournée est passée
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: '#ff9800' },
  confirmed: { label: 'Confirmée', color: '#4caf50' },
  cancelled: { label: 'Annulée', color: '#f44336' },
  bouclee: { label: 'Bouclée', color: '#2196f3' },
  valide: { label: 'Validée', color: '#4caf50' }
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [participations, setParticipations] = useState<Participation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'actives' | 'toutes' | 'annulees'>('actives')
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; participationId: string | null; villeName: string }>({
    isOpen: false,
    participationId: null,
    villeName: ''
  })

  const handleDownloadDevis = async (participation: Participation) => {
    try {
      const { default: jsPDF } = await import('jspdf')

      const formatDateFR = (dateStr: string) => {
        if (!dateStr) return ''
        // Si format ISO (YYYY-MM-DD...), convertir en FR
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          const d = new Date(dateStr)
          if (!Number.isNaN(d.getTime())) {
            return d.toLocaleDateString('fr-FR')
          }
        }
        return dateStr
      }

      // Grilles tarifaires d'impression
      const printingPricesA5 = [
        { quantity: 1000, price: 117.0 },
        { quantity: 1500, price: 135.0 },
        { quantity: 2500, price: 123.0 },
        { quantity: 5000, price: 150.0 },
        { quantity: 7500, price: 222.0 },
        { quantity: 10000, price: 283.5 },
        { quantity: 15000, price: 417.0 },
        { quantity: 20000, price: 531.0 },
        { quantity: 30000, price: 789.0 },
        { quantity: 40000, price: 1015.5 },
        { quantity: 50000, price: 1252.5 },
        { quantity: 60000, price: 1503.0 },
        { quantity: 70000, price: 1752.0 },
        { quantity: 80000, price: 2002.5 },
        { quantity: 90000, price: 2241.0 },
        { quantity: 100000, price: 2490.0 },
        { quantity: 200000, price: 4965.0 },
      ]

      const printingPricesA6 = [
        { quantity: 1000, price: 73.5 },
        { quantity: 1500, price: 93.0 },
        { quantity: 2500, price: 72.0 },
        { quantity: 5000, price: 105.0 },
        { quantity: 7500, price: 117.0 },
        { quantity: 10000, price: 147.0 },
        { quantity: 15000, price: 198.0 },
        { quantity: 20000, price: 252.0 },
        { quantity: 30000, price: 375.0 },
        { quantity: 40000, price: 498.0 },
        { quantity: 50000, price: 598.5 },
        { quantity: 60000, price: 717.0 },
        { quantity: 70000, price: 835.5 },
        { quantity: 80000, price: 925.5 },
        { quantity: 90000, price: 1029.0 },
        { quantity: 100000, price: 1143.0 },
        { quantity: 200000, price: 2280.0 },
      ]

      const flyerFormat =
        participation.needs_flyer_creation && (participation.flyer_format === 'A5' || participation.flyer_format === 'A6')
          ? (participation.flyer_format as 'A5' | 'A6')
          : null

      const totalLogements = Math.round(participation.total_logements || 0)

      const calculateFlyerCreationCost = () => {
        if (!participation.needs_flyer_creation || !flyerFormat) return 0
        return flyerFormat === 'A6' ? 90 : 130
      }

      const calculatePrintingCost = () => {
        if (!participation.needs_flyer_creation || !flyerFormat) return 0
        const prices = flyerFormat === 'A6' ? printingPricesA6 : printingPricesA5
        for (const tier of prices) {
          if (totalLogements <= tier.quantity) return tier.price
        }
        return prices[prices.length - 1].price
      }

      const creationCost = calculateFlyerCreationCost()
      const printingCost = calculatePrintingCost()

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20

      // Couleurs
      const orangeColor: [number, number, number] = [249, 115, 22]
      const textColor: [number, number, number] = [51, 51, 51]

      // Charger le logo
      try {
        const logoUrl = '/logo-france-distribution.webp'
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = logoUrl
        })

        const canvas = document.createElement('canvas')
        canvas.width = logoImg.width
        canvas.height = logoImg.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(logoImg, 0, 0)
          const logoDataUrl = canvas.toDataURL('image/png')

          doc.setFillColor(20, 31, 51) // #141f33
          doc.rect(0, 0, pageWidth, 50, 'F')

          const maxLogoHeight = 35
          const logoAspectRatio = logoImg.width / logoImg.height
          const logoHeight = maxLogoHeight
          const logoWidth = logoHeight * logoAspectRatio
          const logoX = (pageWidth - logoWidth) / 2
          doc.addImage(logoDataUrl, 'PNG', logoX, 7.5, logoWidth, logoHeight)
        }
      } catch (error) {
        console.error('Erreur lors du chargement du logo:', error)
        doc.setFillColor(20, 31, 51) // #141f33
        doc.rect(0, 0, pageWidth, 50, 'F')
      }

      yPosition = 65

      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 40) {
          doc.addPage()
          yPosition = 20
          return true
        }
        return false
      }

      // Client
      const hasClientInfo =
        !!participation.flyer_title ||
        !!participation.flyer_entreprise ||
        !!participation.flyer_address_rue ||
        !!participation.flyer_address_code_postal ||
        !!participation.flyer_address_ville ||
        !!participation.flyer_email ||
        !!participation.flyer_telephone

      if (hasClientInfo) {
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...orangeColor)
        doc.text('Client:', 20, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...textColor)

        if (participation.flyer_entreprise) {
          doc.setFont('helvetica', 'bold')
          doc.text(participation.flyer_entreprise, 20, yPosition)
          yPosition += 7
        }

        if (participation.flyer_title) {
          doc.setFont('helvetica', 'normal')
          doc.text(participation.flyer_title, 20, yPosition)
          yPosition += 7
        }

        // Adresse (si présente)
        if (participation.flyer_address_rue) {
          doc.setFont('helvetica', 'normal')
          doc.text(participation.flyer_address_rue, 20, yPosition)
          yPosition += 6
        }
        const addressLine = `${participation.flyer_address_code_postal || ''} ${participation.flyer_address_ville || ''}`.trim()
        if (addressLine) {
          doc.text(addressLine, 20, yPosition)
          yPosition += 6
        }

        if (participation.flyer_email) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...orangeColor)
          const emailLabel = 'Email:'
          const emailLabelWidth = doc.getTextWidth(emailLabel)
          doc.text(emailLabel, 20, yPosition)
          doc.setDrawColor(...orangeColor)
          doc.setLineWidth(0.3)
          doc.line(20, yPosition + 1, 20 + emailLabelWidth, yPosition + 1)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...textColor)
          doc.text(participation.flyer_email, 20 + emailLabelWidth + 3, yPosition)
          yPosition += 8
        }

        if (participation.flyer_telephone) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...orangeColor)
          const phoneLabel = 'Téléphone:'
          const phoneLabelWidth = doc.getTextWidth(phoneLabel)
          doc.text(phoneLabel, 20, yPosition)
          doc.setDrawColor(...orangeColor)
          doc.setLineWidth(0.3)
          doc.line(20, yPosition + 1, 20 + phoneLabelWidth, yPosition + 1)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...textColor)
          doc.text(participation.flyer_telephone, 20 + phoneLabelWidth + 3, yPosition)
          yPosition += 8
        }

        yPosition += 10
      }

      // Informations France Distribution (droite)
      const rightColumnX = pageWidth - 80
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textColor)
      doc.text('France Distribution', rightColumnX, 65)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...orangeColor)
      const emailLabelFD = 'Email:'
      const emailLabelFDWidth = doc.getTextWidth(emailLabelFD)
      doc.text(emailLabelFD, rightColumnX, 75)
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(0.3)
      doc.line(rightColumnX, 76, rightColumnX + emailLabelFDWidth, 76)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textColor)
      doc.text('contact@distribution-flyers.fr', rightColumnX + emailLabelFDWidth + 3, 75)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...orangeColor)
      const phoneLabelFD = 'Téléphone:'
      const phoneLabelFDWidth = doc.getTextWidth(phoneLabelFD)
      doc.text(phoneLabelFD, rightColumnX, 83)
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(0.3)
      doc.line(rightColumnX, 84, rightColumnX + phoneLabelFDWidth, 84)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textColor)
      doc.text('09 78 28 84 62', rightColumnX + phoneLabelFDWidth + 3, 83)

      yPosition = Math.max(yPosition, 95)
      yPosition += 15

      checkPageBreak(30)

      // Titre devis
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...orangeColor)
      const devisText = 'DEVIS'
      const devisWidth = doc.getTextWidth(devisText)
      doc.text(devisText, pageWidth / 2, yPosition, { align: 'center' })
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(1)
      doc.line((pageWidth - devisWidth) / 2, yPosition + 2, (pageWidth + devisWidth) / 2, yPosition + 2)

      const devisNumero =
        participation.devis_numero ||
        (participation.id ? `FD-${participation.id.slice(0, 8).toUpperCase()}` : 'FD-XXXXXXX')

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textColor)
      doc.text(`N° de devis : ${devisNumero}`, pageWidth / 2, yPosition + 10, { align: 'center' })

      yPosition += 26

      // Infos tournée
      checkPageBreak(20)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...textColor)
      doc.text('Tournée:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(participation.ville_name, 20 + doc.getTextWidth('Tournée: ') + 2, yPosition)
      yPosition += 10

      doc.setFont('helvetica', 'bold')
      doc.text('Période:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Du ${formatDateFR(participation.tournee_date_debut)} au ${formatDateFR(participation.tournee_date_fin)}`,
        20 + doc.getTextWidth('Période: ') + 2,
        yPosition
      )
      yPosition += 18

      // Séparateur
      checkPageBreak(5)
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(0.8)
      doc.line(20, yPosition, pageWidth - 20, yPosition)
      yPosition += 15

      // Résumé sélection
      checkPageBreak(30)
      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...orangeColor)
      const resumeText = 'Résumé de votre sélection'
      const resumeWidth = doc.getTextWidth(resumeText)
      doc.text(resumeText, 20, yPosition)
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(0.5)
      doc.line(20, yPosition + 2, 20 + resumeWidth, yPosition + 2)
      yPosition += 15

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textColor)

      doc.setFont('helvetica', 'bold')
      doc.text('Secteurs IRIS sélectionnés:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(`${participation.iris_selections?.length || 0}`, 20 + doc.getTextWidth('Secteurs IRIS sélectionnés: ') + 2, yPosition)
      yPosition += 10

      doc.setFont('helvetica', 'bold')
      const totalLogementsFormatted = totalLogements.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      doc.text('Total logements:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(totalLogementsFormatted, 20 + doc.getTextWidth('Total logements: ') + 2, yPosition)
      yPosition += 20

      // Détails des coûts
      checkPageBreak(40)
      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...orangeColor)
      const coutsText = 'Détail des coûts'
      const coutsWidth = doc.getTextWidth(coutsText)
      doc.text(coutsText, 20, yPosition)
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(0.5)
      doc.line(20, yPosition + 2, 20 + coutsWidth, yPosition + 2)
      yPosition += 15

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...textColor)

      const distCost = participation.cout_distribution.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      doc.setFont('helvetica', 'bold')
      doc.text('Coût de distribution:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(`${distCost}€`, pageWidth - 40, yPosition, { align: 'right' })
      yPosition += 10

      if (creationCost > 0 && flyerFormat) {
        checkPageBreak(10)
        const creationCostFormatted = creationCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        doc.setFont('helvetica', 'bold')
        doc.text(`Coût de création (Format ${flyerFormat}):`, 20, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(`${creationCostFormatted}€ HT`, pageWidth - 40, yPosition, { align: 'right' })
        yPosition += 10
      }

      if (printingCost > 0 && flyerFormat) {
        checkPageBreak(10)
        const printCostFormatted = printingCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        doc.setFont('helvetica', 'bold')
        doc.text(`Coût d'impression (Format ${flyerFormat}):`, 20, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.text(`${printCostFormatted}€ HT`, pageWidth - 40, yPosition, { align: 'right' })
        yPosition += 10
      }

      yPosition += 10
      checkPageBreak(5)
      doc.setDrawColor(...orangeColor)
      doc.setLineWidth(0.8)
      doc.line(20, yPosition, pageWidth - 20, yPosition)
      yPosition += 15

      const total = (participation.cout_distribution + creationCost + printingCost).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...orangeColor)
      doc.text('TOTAL:', 20, yPosition)
      doc.setFontSize(18)
      doc.text(`${total}€`, pageWidth - 40, yPosition, { align: 'right' })

      // Pied de page
      const footerY = pageHeight - 20
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 150, 150)
      doc.text('Ce devis est valable 30 jours', pageWidth / 2, footerY, { align: 'center' })
      doc.text('France Distribution - contact@distribution-flyers.fr', pageWidth / 2, footerY + 6, { align: 'center' })

      const safeVille = participation.ville_name.replace(/\s+/g, '_')
      const safeDate = formatDateFR(participation.tournee_date_debut).replace(/[\/\s]/g, '-')
      const fileName = `Devis_France_Distribution_${safeVille}_${safeDate}.pdf`
      doc.save(fileName)
    } catch (err) {
      console.error('Erreur lors de la génération du devis:', err)
      setToast({ message: 'Impossible de générer le devis. Veuillez réessayer.', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  useEffect(() => {
    // Vérifier s'il y a un message de succès dans l'URL
    const success = searchParams.get('success')
    if (success === 'true') {
      setToast({ message: 'Votre participation a été enregistrée avec succès !', type: 'success' })
      // Nettoyer l'URL
      router.replace('/dashboard', { scroll: false })
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase n\'est pas configuré.')
      setLoading(false)
      return
    }

    // Vérifier l'authentification
    supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
      if (userError || !user) {
        router.push('/login')
        return
      }
      setUser(user)
      loadParticipations(user.id)
    })

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        loadParticipations(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, searchParams])

  const loadParticipations = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Chargement des participations pour user_id:', userId)

      // Récupérer les participations
      const { data: participationsData, error: participationsError } = await supabase
        .from('france_distri_participations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (participationsError) {
        console.error('❌ Erreur lors de la récupération des participations:', participationsError)
        throw participationsError
      }

      console.log('📊 Participations récupérées:', participationsData?.length || 0, participationsData)

      if (!participationsData || participationsData.length === 0) {
        console.log('ℹ️ Aucune participation trouvée')
        setParticipations([])
        setLoading(false)
        return
      }

      // Typage explicite des participations
      const typedParticipationsData: Participation[] = (participationsData || []).map((p: any): Participation => ({
        id: String(p.id),
        ville_name: String(p.ville_name),
        tournee_date_debut: String(p.tournee_date_debut),
        tournee_date_fin: String(p.tournee_date_fin),
        tournee_index: Number(p.tournee_index),
        total_logements: Number(p.total_logements),
        cout_distribution: Number(p.cout_distribution),
        status: (String(p.status) as 'pending' | 'confirmed' | 'cancelled' | 'bouclee'),
        devis_numero: p.devis_numero ? String(p.devis_numero) : null,
        has_flyer: p.has_flyer !== undefined ? Boolean(p.has_flyer) : false,
        needs_flyer_creation: p.needs_flyer_creation !== undefined ? Boolean(p.needs_flyer_creation) : false,
        flyer_title: p.flyer_title ? String(p.flyer_title) : null,
        flyer_entreprise: p.flyer_entreprise ? String(p.flyer_entreprise) : null,
        flyer_email: p.flyer_email ? String(p.flyer_email) : null,
        flyer_telephone: p.flyer_telephone ? String(p.flyer_telephone) : null,
        flyer_address_rue: p.flyer_address_rue
          ? String(p.flyer_address_rue)
          : p.flyer_address?.rue
            ? String(p.flyer_address.rue)
            : null,
        flyer_address_code_postal: p.flyer_address_code_postal
          ? String(p.flyer_address_code_postal)
          : p.flyer_address?.codePostal
            ? String(p.flyer_address.codePostal)
            : null,
        flyer_address_ville: p.flyer_address_ville
          ? String(p.flyer_address_ville)
          : p.flyer_address?.ville
            ? String(p.flyer_address.ville)
            : null,
        flyer_format: p.flyer_format
          ? String(p.flyer_format)
          : p.selected_flyer_format
            ? String(p.selected_flyer_format)
            : null,
        created_at: p.created_at ? String(p.created_at) : new Date().toISOString(),
        updated_at: p.updated_at ? String(p.updated_at) : new Date().toISOString()
      }))

      // Récupérer les sélections d'IRIS pour chaque participation
      const participationIds = typedParticipationsData.map(p => p.id)
      const { data: irisData, error: irisError } = await supabase
        .from('france_distri_iris_selections')
        .select('*')
        .in('participation_id', participationIds)
        .order('created_at', { ascending: true })

      if (irisError) {
        console.error('Erreur lors de la récupération des IRIS:', irisError)
        // Continuer même si on n'a pas les IRIS
      }

      // Typage explicite des sélections IRIS
      const typedIrisData: IrisSelection[] = (irisData || []).map((iris: any): IrisSelection => ({
        id: String(iris.id),
        participation_id: String(iris.participation_id),
        iris_code: String(iris.iris_code),
        iris_name: iris.iris_name ? String(iris.iris_name) : '',
        logements: iris.logements ? Number(iris.logements) : null
      }))

      // Fonction pour parser une date française (format: "DD mois YYYY")
      const parseFrenchDate = (dateStr: string): Date | null => {
        const moisMap: Record<string, number> = {
          'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
          'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
        }
        const parts = dateStr.split(' ')
        if (parts.length !== 3) return null
        const jour = parseInt(parts[0])
        const mois = moisMap[parts[1].toLowerCase()]
        const annee = parseInt(parts[2])
        if (isNaN(jour) || isNaN(annee) || mois === undefined) return null
        return new Date(annee, mois, jour)
      }

      // Fonction pour vérifier si une tournée est bloquée (15 jours avant le démarrage)
      const isTourneeBloquee = (dateDebutStr: string): boolean => {
        const dateDebut = parseFrenchDate(dateDebutStr)
        if (!dateDebut) return false
        const dateLimite = new Date(dateDebut)
        dateLimite.setDate(dateLimite.getDate() - 15)
        dateLimite.setHours(0, 0, 0, 0)
        const aujourdhui = new Date()
        aujourdhui.setHours(0, 0, 0, 0)
        return aujourdhui > dateLimite
      }

      // Fonction pour vérifier si la date de la tournée est passée
      const isTourneePassee = (dateDebutStr: string): boolean => {
        const dateDebut = parseFrenchDate(dateDebutStr)
        if (!dateDebut) return false
        const aujourdhui = new Date()
        aujourdhui.setHours(0, 0, 0, 0)
        return aujourdhui > dateDebut
      }

      const formatDateFr = (date: Date): string => {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      }

      // Calculer le nombre de participants uniques (tous utilisateurs) et la date limite par tournée (ville + date)
      const tourneeParticipantsCounts = new Map<string, number>()
      const tourneeLimiteDates = new Map<string, string>()
      const allTourneeIrisData = new Map<string, any[]>() // Stocker toutes les sélections IRIS par tournée
      const tourneeKeys = new Set<string>()

      typedParticipationsData.forEach((p) => {
        const key = `${p.ville_name}|${p.tournee_date_debut}`
        tourneeKeys.add(key)
      })

      for (const key of Array.from(tourneeKeys)) {
        const [villeName, dateDebut] = key.split('|')

        // Récupérer TOUTES les participations pour cette tournée (tous utilisateurs)
        const { data: allTourneeParticipations, error: tourneeError } = await supabase
          .from('france_distri_participations')
          .select('id, tournee_date_debut')
          .eq('ville_name', villeName)
          .eq('tournee_date_debut', dateDebut)
          .neq('status', 'cancelled')

        if (tourneeError) {
          console.error('Erreur lors du chargement du nombre de participants pour la tournée:', {
            villeName,
            dateDebut,
            tourneeError
          })
          continue
        }

        const participantCount = allTourneeParticipations?.length || 0
        tourneeParticipantsCounts.set(key, participantCount)

        // Récupérer TOUTES les sélections IRIS pour toutes les participations de cette tournée
        const allParticipationIds = (allTourneeParticipations || []).map((p: any) => p.id)
        if (allParticipationIds.length > 0) {
          const { data: allIrisForTournee, error: irisTourneeError } = await supabase
            .from('france_distri_iris_selections')
            .select('*')
            .in('participation_id', allParticipationIds)

          if (!irisTourneeError && allIrisForTournee) {
            allTourneeIrisData.set(key, allIrisForTournee)
          }
        }

        // Calculer une date limite (15 jours avant la date de début) pour le message de partage
        const tourneeDebut = parseFrenchDate(dateDebut)
        if (tourneeDebut) {
          const limite = new Date(tourneeDebut)
          limite.setDate(limite.getDate() - 15)
          tourneeLimiteDates.set(key, formatDateFr(limite))
        }
      }

      // Compter les participants par IRIS pour chaque tournée (en utilisant TOUTES les participations)
      const participationsWithIris = typedParticipationsData.map(participation => {
        const participationIris = typedIrisData.filter(iris => iris.participation_id === participation.id)
        
        // Créer une map pour compter les participants par IRIS pour cette tournée
        const irisCounts = new Map<string, number>()
        const irisParticipations = new Map<string, Set<string>>()
        
        // Récupérer toutes les sélections IRIS pour cette tournée (tous utilisateurs)
        const tourneeKey = `${participation.ville_name}|${participation.tournee_date_debut}`
        const allIrisForThisTournee = allTourneeIrisData.get(tourneeKey) || []
        
        // Compter les participants par IRIS sur TOUTES les participations de la tournée
        allIrisForThisTournee.forEach((iris: any) => {
          const irisCode = iris.iris_code
          if (!irisParticipations.has(irisCode)) {
            irisParticipations.set(irisCode, new Set())
          }
          const participationSet = irisParticipations.get(irisCode)!
          // Ajouter l'ID de participation pour compter les participants uniques par IRIS
          if (!participationSet.has(iris.participation_id)) {
            participationSet.add(iris.participation_id)
            irisCounts.set(irisCode, participationSet.size)
          }
        })
        
        // Ajouter le nombre de participants à chaque IRIS de cette participation
        const irisSelectionsWithCounts = participationIris.map(iris => ({
          ...iris,
          participant_count: irisCounts.get(iris.iris_code) || 0
        }))

        // Nombre de participants uniques sur la tournée (tous utilisateurs, tous secteurs confondus)
        // tourneeKey est déjà défini plus haut
        const tourneeParticipantsCount = tourneeParticipantsCounts.get(tourneeKey) ?? 0
        const tourneeLimiteDate = tourneeLimiteDates.get(tourneeKey) ?? null

        return {
          ...participation,
          iris_selections: irisSelectionsWithCounts,
          iris_counts: irisCounts,
          tourneeParticipantsCount,
          tourneeLimiteDate,
          isTourneeBloquee: isTourneeBloquee(participation.tournee_date_debut),
          isTourneePassee: isTourneePassee(participation.tournee_date_debut)
        }
      })

      // Filtrer les participations annulées
      const activeParticipations = participationsWithIris.filter(p => p.status !== 'cancelled')

      setParticipations(activeParticipations)
    } catch (err: any) {
      console.error('Erreur lors du chargement des participations:', err)
      setError('Erreur lors du chargement de vos participations.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (participationId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(participationId)) {
        newSet.delete(participationId)
      } else {
        newSet.add(participationId)
      }
      return newSet
    })
  }

  const openCancelModal = (participationId: string, villeName: string) => {
    setCancelModal({
      isOpen: true,
      participationId,
      villeName
    })
  }

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      participationId: null,
      villeName: ''
    })
  }

  const cancelParticipation = async () => {
    if (!cancelModal.participationId || !user) {
      closeCancelModal()
      return
    }

    const participationId = cancelModal.participationId
    const villeName = cancelModal.villeName
    closeCancelModal()

    if (!user) {
      setToast({ message: 'Vous devez être connecté pour annuler une participation.', type: 'error' })
      return
    }

    try {
      console.log('🔄 Tentative d\'annulation de la participation:', { participationId, userId: user.id })
      
      // Mettre à jour le statut de la participation (sans updated_at si la colonne n'existe pas)
      const updatePayload: { status: string; updated_at?: string } = { 
        status: 'cancelled'
      }
      
      // Ajouter updated_at seulement si la colonne existe
      try {
        updatePayload.updated_at = new Date().toISOString()
      } catch (e) {
        // Ignorer si updated_at cause un problème
      }

      // @ts-ignore - TypeScript ne peut pas inférer correctement le type de la table Supabase
      const { data: updatedData, error: updateError } = await (supabase as any)
        .from('france_distri_participations')
        .update(updatePayload)
        .eq('id', participationId)
        .eq('user_id', user.id) // S'assurer que l'utilisateur ne peut annuler que ses propres participations
        .select()

      if (updateError) {
        console.error('❌ Erreur Supabase lors de l\'annulation:', updateError)
        console.error('Détails:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        throw updateError
      }

      // Vérifier que la mise à jour a bien été effectuée
      if (!updatedData || updatedData.length === 0) {
        console.error('⚠️ Aucune participation trouvée à annuler pour l\'ID:', participationId)
        // Vérifier si la participation existe
        const { data: checkData, error: checkError } = await supabase
          .from('france_distri_participations')
          .select('id, user_id, status')
          .eq('id', participationId)
          .single()
        
        console.log('Vérification de la participation:', { checkData, checkError })
        
        if (checkError || !checkData) {
          throw new Error('Participation introuvable.')
        }
        
        const typedCheckData = checkData as { user_id: string; [key: string]: any }
        if (typedCheckData.user_id !== user.id) {
          throw new Error('Vous ne pouvez annuler que vos propres participations.')
        }
        
        throw new Error('Impossible de mettre à jour la participation. Vérifiez vos permissions.')
      }

      console.log('✅ Participation annulée avec succès:', updatedData[0])

      // Mettre à jour immédiatement l'état local pour retirer la participation de la liste
      setParticipations(prev => prev.filter(p => p.id !== participationId))
      
      setToast({ 
        message: 'Votre participation a été annulée avec succès.', 
        type: 'success' 
      })
      setTimeout(() => setToast(null), 3000)

      // Recharger les participations pour s'assurer que tout est à jour
      await loadParticipations(user.id)
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'annulation:', err)
      const errorMessage = err?.message || err?.error_description || err?.details || 'Erreur inconnue'
      console.error('Détails complets de l\'erreur:', {
        message: errorMessage,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        fullError: err
      })
      setToast({ 
        message: `Erreur lors de l'annulation: ${errorMessage}. Veuillez réessayer ou contacter le support.`, 
        type: 'error' 
      })
      setTimeout(() => setToast(null), 5000)
    }
  }

  if (loading) {
    return (
      <main>
        <Header />
        <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Chargement de vos participations...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Header />
      <section className="tournees-section" style={{ marginTop: '88px', padding: 'var(--spacing-4xl) 0', background: 'var(--gradient-dark)' }}>
        <div className="container">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
              marginBottom: 'var(--spacing-4xl)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--spacing-md)'
            }}>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Mon Dashboard
                </h1>
                <Link
                  href="/parametres"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--orange-primary)',
                    color: 'var(--orange-primary)',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.25s ease',
                    marginBottom: 'var(--spacing-sm)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--orange-primary)'
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--orange-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Modifier mes informations
                </Link>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                  {user?.email && `Connecté en tant que ${user.email}`}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 'var(--spacing-xs)'
              }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                }}>
                  Pour toute question, appelez au
                </span>
                <a
                  href="tel:+33978288462"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'var(--orange-primary)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(251, 109, 37, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff8c42'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 109, 37, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--orange-primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 109, 37, 0.3)'
                  }}
                  title="Appeler"
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" 
                      fill="white"
                    />
                  </svg>
                  <span>09 78 28 84 62</span>
                </a>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '8px',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
                color: '#f44336',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {participations.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                borderRadius: '16px',
                padding: 'var(--spacing-4xl)',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: 'var(--spacing-lg)' }}>
                  Vous n'avez pas encore de participations.
                </p>
                <Link href="/tournees" className="btn btn-primary">
                  Voir les tournées disponibles
                </Link>
              </div>
            ) : (
              <>
                {/* Tabs de filtrage par statut */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-xl)'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    gap: '4px',
                    padding: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <button
                      onClick={() => setStatusFilter('actives')}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: statusFilter === 'actives' 
                          ? 'var(--orange-primary)' 
                          : 'transparent',
                        color: statusFilter === 'actives' ? 'white' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: statusFilter === 'actives' ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: statusFilter === 'actives' 
                          ? '0 2px 8px rgba(251, 109, 37, 0.3)' 
                          : 'none',
                        transform: statusFilter === 'actives' ? 'scale(1.02)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (statusFilter !== 'actives') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (statusFilter !== 'actives') {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }
                      }}
                    >
                      Actives
                    </button>
                    <button
                      onClick={() => setStatusFilter('annulees')}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: statusFilter === 'annulees' 
                          ? 'var(--orange-primary)' 
                          : 'transparent',
                        color: statusFilter === 'annulees' ? 'white' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: statusFilter === 'annulees' ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: statusFilter === 'annulees' 
                          ? '0 2px 8px rgba(251, 109, 37, 0.3)' 
                          : 'none',
                        transform: statusFilter === 'annulees' ? 'scale(1.02)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (statusFilter !== 'annulees') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (statusFilter !== 'annulees') {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }
                      }}
                    >
                      Annulées
                    </button>
                    <button
                      onClick={() => setStatusFilter('toutes')}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: statusFilter === 'toutes' 
                          ? 'var(--orange-primary)' 
                          : 'transparent',
                        color: statusFilter === 'toutes' ? 'white' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: statusFilter === 'toutes' ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: statusFilter === 'toutes' 
                          ? '0 2px 8px rgba(251, 109, 37, 0.3)' 
                          : 'none',
                        transform: statusFilter === 'toutes' ? 'scale(1.02)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (statusFilter !== 'toutes') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (statusFilter !== 'toutes') {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }
                      }}
                    >
                      Toutes
                    </button>
                  </div>
                </div>

                {/* Liste filtrée des participations */}
                {(() => {
                  // Calculer le statut réel de chaque participation et filtrer
                  const participationsWithStatus = participations.map((participation) => {
                    let tourneeStatus = participation.status
                    if (participation.isTourneePassee && participation.iris_selections) {
                      // Vérifier si au moins un IRIS a atteint le maximum (5 participants)
                      const atLeastOneIrisBoucle = participation.iris_selections.some(iris => (iris.participant_count || 0) >= 5)
                      // Vérifier si au moins un IRIS a atteint le minimum (3 participants)
                      const atLeastOneIrisValide = participation.iris_selections.some(iris => (iris.participant_count || 0) >= 3)
                      
                      if (atLeastOneIrisBoucle && participation.iris_selections.length > 0) {
                        tourneeStatus = 'bouclee' // Maximum atteint (5 participants)
                      } else if (atLeastOneIrisValide && participation.iris_selections.length > 0) {
                        tourneeStatus = 'valide' // Minimum atteint (3 participants) mais pas encore le maximum
                      } else if (participation.iris_selections.length > 0) {
                        tourneeStatus = 'cancelled' // Aucun IRIS n'a atteint le minimum
                      }
                    } else if (participation.isTourneeBloquee && participation.iris_selections) {
                      // Vérifier si au moins un IRIS a atteint le maximum (5 participants)
                      const atLeastOneIrisBoucle = participation.iris_selections.some(iris => (iris.participant_count || 0) >= 5)
                      // Vérifier si au moins un IRIS a atteint le minimum (3 participants)
                      const atLeastOneIrisValide = participation.iris_selections.some(iris => (iris.participant_count || 0) >= 3)
                      
                      if (atLeastOneIrisBoucle && participation.iris_selections.length > 0) {
                        tourneeStatus = 'bouclee' // Maximum atteint (5 participants)
                      } else if (atLeastOneIrisValide && participation.iris_selections.length > 0) {
                        tourneeStatus = 'valide' // Minimum atteint (3 participants) mais pas encore le maximum
                      }
                      // Sinon, on garde le statut initial (en attente/en cours)
                    }
                    return { ...participation, calculatedStatus: tourneeStatus }
                  })

                  // Filtrer selon le filtre sélectionné
                  const filteredParticipations = participationsWithStatus.filter((p) => {
                    if (statusFilter === 'actives') {
                      return p.calculatedStatus === 'pending' || p.calculatedStatus === 'confirmed' || p.calculatedStatus === 'valide' || p.calculatedStatus === 'bouclee'
                    } else if (statusFilter === 'annulees') {
                      return p.calculatedStatus === 'cancelled'
                    } else {
                      return true // 'toutes' : afficher toutes
                    }
                  })

                  if (filteredParticipations.length === 0) {
                    return (
                      <div style={{
                        background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                        borderRadius: '16px',
                        padding: 'var(--spacing-xl)',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                          {statusFilter === 'actives' 
                            ? 'Aucune tournée active pour le moment.' 
                            : statusFilter === 'annulees'
                            ? 'Aucune tournée annulée.'
                            : 'Aucune participation.'}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                      {filteredParticipations.map((participation) => {
                        const isExpanded = expandedCards.has(participation.id)
                        
                        // Utiliser le statut déjà calculé
                        const tourneeStatus = participation.calculatedStatus || participation.status
                        
                        // Nombre total de participants uniques sur la tournée (tous secteurs confondus)
                        const totalParticipants = participation.tourneeParticipantsCount ?? 0
                  
                  return (
                    <div
                      key={participation.id}
                      style={{
                        background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
                        borderRadius: '12px',
                        padding: 'var(--spacing-lg)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      {/* En-tête compact */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          {/* Badge nombre de participants au-dessus du titre */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(76, 175, 80, 0.12)',
                            border: '1px solid rgba(76, 175, 80, 0.6)',
                            marginBottom: '15px'
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span style={{ color: '#4CAF50', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {totalParticipants} participant{totalParticipants > 1 ? 's' : ''}
                            </span>
                          </div>
                          <h2 style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '4px',
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                          }}>
                            {participation.ville_name}
                          </h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                            {participation.tournee_date_debut} - {participation.tournee_date_fin}
                          </p>
                          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Logements: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {participation.total_logements.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Coût: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {participation.cout_distribution.toFixed(2)} €
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Secteurs: </span>
                              <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                {participation.iris_selections?.length || 0}
                              </span>
                            </div>
                            {participation.isTourneePassee && participation.iris_selections && participation.iris_selections.length > 0 && (
                              <>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Validés: </span>
                                  <span style={{ color: '#4CAF50', fontSize: '16px', fontWeight: 600 }}>
                                    {participation.iris_selections.filter(iris => (iris.participant_count || 0) >= 3).length}
                                  </span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Annulés: </span>
                                  <span style={{ color: '#F44336', fontSize: '16px', fontWeight: 600 }}>
                                    {participation.iris_selections.filter(iris => (iris.participant_count || 0) < 3).length}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                          <div style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: `${statusLabels[tourneeStatus]?.color || '#666'}20`,
                            border: `1px solid ${statusLabels[tourneeStatus]?.color || '#666'}`,
                            color: statusLabels[tourneeStatus]?.color || '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                            whiteSpace: 'nowrap'
                          }}>
                            {statusLabels[tourneeStatus]?.label || tourneeStatus}
                          </div>
                          {/* Boutons de partage tournée */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* WhatsApp */}
                            <button
                              onClick={() => {
                                const tourneeUrl = typeof window !== 'undefined'
                                  ? `${window.location.origin}/tournees/${encodeURIComponent(participation.ville_name.toLowerCase())}/${participation.tournee_index}`
                                  : ''

                                const MIN_PARTICIPANTS = 3
                                const MAX_PARTICIPANTS = 5

                                const limiteInscription = participation.tourneeLimiteDate || undefined

                                let message = `Bonjour,\n\nDécouvrez cette tournée de distribution mutualisée à ${participation.ville_name} : ${tourneeUrl}`

                                if (totalParticipants < MIN_PARTICIPANTS && limiteInscription) {
                                  message = `Bonjour,\n\nJe participe à une tournée de distribution mutualisée à ${participation.ville_name} avec France Distribution.\n` +
                                    `Il manque encore des participants pour confirmer la tournée. Les inscriptions sont ouvertes jusqu'au ${limiteInscription}.\n` +
                                    `Tu peux rejoindre la tournée ici : ${tourneeUrl}`
                                } else if (totalParticipants >= MIN_PARTICIPANTS && totalParticipants < MAX_PARTICIPANTS) {
                                  message = `Bonjour,\n\nLa tournée mutualisée à ${participation.ville_name} est confirmée et démarre le ${participation.tournee_date_debut}.\n` +
                                    `Il reste encore quelques places, tu peux nous rejoindre ici : ${tourneeUrl}`
                                }

                                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                                window.open(whatsappUrl, '_blank')
                              }}
                              style={{
                                width: '40px',
                                height: '40px',
                                background: '#25D366',
                                border: 'none',
                                color: 'white',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                padding: 0
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#20BA5A'
                                e.currentTarget.style.transform = 'scale(1.05)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#25D366'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                              title="Partager la tournée sur WhatsApp"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                            </button>
                            {/* Copie lien tournée */}
                            <button
                              onClick={async (e) => {
                                const tourneeUrl = typeof window !== 'undefined'
                                  ? `${window.location.origin}/tournees/${encodeURIComponent(participation.ville_name.toLowerCase())}/${participation.tournee_index}`
                                  : ''
                                
                                const button = e.currentTarget as HTMLButtonElement
                                const originalBackground = button.style.background
                                
                                try {
                                  await navigator.clipboard.writeText(tourneeUrl)
                                  button.style.background = '#4CAF50'
                                  // Toast de confirmation
                                  setToast({ 
                                    message: 'Lien de la tournée copié dans le presse-papiers.', 
                                    type: 'success' 
                                  })
                                  setTimeout(() => {
                                    button.style.background = originalBackground || '#242940'
                                    setToast(null)
                                  }, 2000)
                                } catch (err) {
                                  console.error('Erreur lors de la copie du lien de tournée:', err)
                                  setToast({ 
                                    message: 'Impossible de copier le lien. Veuillez réessayer.', 
                                    type: 'error' 
                                  })
                                  setTimeout(() => setToast(null), 3000)
                                }
                              }}
                              style={{
                                width: '40px',
                                height: '40px',
                                background: '#242940',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                padding: 0
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2f3654'
                                e.currentTarget.style.transform = 'scale(1.05)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#242940'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                              title="Copier le lien de la tournée"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                              </svg>
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            {participation.status !== 'cancelled' && (
                              <button
                                onClick={() => handleDownloadDevis(participation)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'transparent',
                                  border: '1px solid rgba(255, 255, 255, 0.18)',
                                  borderRadius: '8px',
                                  color: 'var(--text-primary)',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                  transition: 'all 0.2s ease',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--orange-primary)'
                                  e.currentTarget.style.transform = 'translateY(-1px)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                                title="Télécharger le devis"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Devis
                              </button>
                            )}
                            {(participation.status === 'pending' || participation.status === 'confirmed') && (
                              <button
                                onClick={() => openCancelModal(participation.id, participation.ville_name)}
                                style={{
                                  padding: '8px 16px',
                                  background: '#f44336',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                  transition: 'all 0.2s ease',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#d32f2f'
                                  e.currentTarget.style.transform = 'translateY(-1px)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#f44336'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                              >
                                Annuler
                              </button>
                            )}
                            <button
                              onClick={() => toggleCard(participation.id)}
                              style={{
                                padding: '8px 16px',
                                background: 'var(--orange-primary)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff8c42'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--orange-primary)'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              {isExpanded ? 'Masquer le détail' : 'Voir le détail'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Détails déroulables */}
                      <div
                        style={{
                          maxHeight: isExpanded ? '2000px' : '0',
                          overflow: 'hidden',
                          transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out',
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? 'var(--spacing-lg)' : '0'
                        }}
                      >
                        {isExpanded && (
                          <div style={{
                            paddingTop: 'var(--spacing-lg)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            {participation.has_flyer && participation.flyer_title && (
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-md)'
                              }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '4px' }}>Informations flyer</p>
                                <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
                                  {participation.flyer_entreprise && `${participation.flyer_entreprise} - `}
                                  {participation.flyer_title}
                                </p>
                                {participation.flyer_address_rue && (
                                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                    {participation.flyer_address_rue}, {participation.flyer_address_code_postal} {participation.flyer_address_ville}
                                  </p>
                                )}
                              </div>
                            )}

                            {participation.needs_flyer_creation && participation.flyer_format && (
                              <div style={{
                                background: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: '8px',
                                padding: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-md)'
                              }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '4px' }}>Création de flyer</p>
                                <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                                  Format : {participation.flyer_format}
                                </p>
                              </div>
                            )}

                            {participation.iris_selections && participation.iris_selections.length > 0 && (
                              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: 'var(--spacing-sm)' }}>
                                  Secteurs IRIS sélectionnés ({participation.iris_selections.length})
                                </p>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                  gap: 'var(--spacing-xs)',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  padding: 'var(--spacing-xs)',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  borderRadius: '8px'
                                }}>
                                  {participation.iris_selections.map((iris) => {
                                    const participantCount = iris.participant_count || 0
                                    const isValide = participantCount >= 3
                                    // Un IRIS est annulé seulement si la date est passée ET qu'il n'a pas >= 3 participants
                                    // Si la date n'est pas passée, l'IRIS est en cours même s'il n'a pas encore 3 participants
                                    const showStatus = participation.isTourneePassee || (participation.isTourneeBloquee && isValide)
                                    const isAnnule = participation.isTourneePassee && !isValide
                                    
                                    return (
                                      <div
                                        key={iris.id}
                                        style={{
                                          padding: '8px 12px',
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          borderRadius: '6px',
                                          fontSize: '14px',
                                          color: 'var(--text-secondary)',
                                          fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                          border: showStatus 
                                            ? (isValide ? '2px solid #4CAF50' : isAnnule ? '2px solid #F44336' : '1px solid rgba(255, 255, 255, 0.1)')
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {showStatus && (isValide || isAnnule) && (
                                          <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            background: isValide ? '#4CAF50' : '#F44336',
                                            color: 'white',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                                            borderBottomLeftRadius: '6px',
                                            zIndex: 1
                                          }}>
                                            {isValide ? 'Validé' : 'Annulé'}
                                          </div>
                                        )}
                                        <strong style={{ 
                                          color: 'var(--text-primary)',
                                          display: 'block',
                                          paddingRight: showStatus ? '60px' : '0'
                                        }}>
                                          {iris.iris_name}
                                        </strong>
                                        {iris.logements && (
                                          <span style={{ display: 'block', marginTop: '2px', fontSize: '14px' }}>
                                            {iris.logements} logements
                                          </span>
                                        )}
                                        <span style={{ 
                                          display: 'block', 
                                          marginTop: '4px', 
                                          fontSize: '12px',
                                          color: showStatus 
                                            ? (isValide ? '#4CAF50' : '#F44336')
                                            : participantCount >= 3 
                                              ? '#4CAF50' 
                                              : participantCount > 0 
                                                ? '#ff9800' 
                                                : 'var(--text-tertiary)',
                                          fontWeight: 600
                                        }}>
                                          {participantCount} participant{participantCount > 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <div style={{
                              fontSize: '14px',
                              color: 'var(--text-tertiary)',
                              paddingTop: 'var(--spacing-sm)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif'
                            }}>
                              Créée le {new Date(participation.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de confirmation d'annulation */}
      {cancelModal.isOpen && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={closeCancelModal}
          />
          
          {/* Modal */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #1F2E4E 0%, #131214 100%)',
            borderRadius: '16px',
            padding: 'var(--spacing-xl)',
            border: '2px solid #353550',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 10001,
            maxWidth: '500px',
            width: '90%',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Icône d'avertissement */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(244, 67, 54, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F44336" 
                  strokeWidth="2"
                >
                  <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>

            {/* Titre */}
            <h2 style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              Confirmer l'annulation
            </h2>

            {/* Message */}
            <p style={{
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
              fontSize: '16px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: '1.6',
              marginBottom: 'var(--spacing-xl)'
            }}>
              Êtes-vous sûr de vouloir annuler votre participation à la tournée de <strong style={{ color: 'var(--text-primary)' }}>{cancelModal.villeName}</strong> ?
            </p>

            <p style={{
              fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
              fontSize: '14px',
              color: '#F44336',
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)',
              fontWeight: 600
            }}>
              ⚠️ Cette action est irréversible.
            </p>

            {/* Boutons */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              justifyContent: 'center'
            }}>
              <button
                onClick={closeCancelModal}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #52607f',
                  background: 'var(--bg-accent)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'var(--orange-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-accent)'
                  e.currentTarget.style.borderColor = '#52607f'
                }}
              >
                Annuler
              </button>
              <button
                onClick={cancelParticipation}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#F44336',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Poppins, Montserrat, sans-serif',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d32f2f'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(244, 67, 54, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F44336'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.4)'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: 'var(--gradient-dark)', paddingTop: '88px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 88px)' }}>
          <div className="loading-spinner"></div>
        </div>
      </main>
    }>
      <DashboardContent />
    </Suspense>
  )
}

