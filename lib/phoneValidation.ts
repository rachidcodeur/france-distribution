/**
 * Valide un numéro de téléphone français
 * Accepte les formats suivants :
 * - 10 chiffres (avec 0 initial) : 0123456789
 * - 9 chiffres (sans 0) : 123456789
 * - Format international avec +33 : +33612345678
 * - Format international avec 0033 : 0033612345678
 * - Avec espaces/tirets/points : 01 23 45 67 89, 01-23-45-67-89, 01.23.45.67.89
 * 
 * @param phone - Le numéro de téléphone à valider
 * @returns true si le numéro est valide, false sinon
 */
export function isValidFrenchPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  // Nettoyer le numéro : enlever espaces, tirets, points, parenthèses
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')

  // Si vide après nettoyage, invalide
  if (cleaned.length === 0) {
    return false
  }

  // Vérifier si c'est un format international avec +33
  if (cleaned.startsWith('+33')) {
    const digits = cleaned.substring(3) // Enlever +33
    // Après +33, il doit y avoir 9 chiffres (sans le 0 initial)
    if (/^\d{9}$/.test(digits)) {
      // Le premier chiffre après +33 doit être 6, 7, ou 0 (pour les numéros mobiles ou fixes)
      const firstDigit = digits[0]
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(firstDigit)
    }
    return false
  }

  // Vérifier si c'est un format international avec 0033
  if (cleaned.startsWith('0033')) {
    const digits = cleaned.substring(4) // Enlever 0033
    // Après 0033, il doit y avoir 9 chiffres (sans le 0 initial)
    if (/^\d{9}$/.test(digits)) {
      return true
    }
    return false
  }

  // Vérifier si c'est un numéro à 10 chiffres (avec 0 initial)
  if (/^\d{10}$/.test(cleaned)) {
    // Le premier chiffre doit être 0
    if (cleaned[0] === '0') {
      // Le deuxième chiffre doit être 1-9 (pas 0)
      const secondDigit = cleaned[1]
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(secondDigit)
    }
    return false
  }

  // Vérifier si c'est un numéro à 9 chiffres (sans 0 initial)
  if (/^\d{9}$/.test(cleaned)) {
    // Le premier chiffre doit être 1-9 (pas 0)
    const firstDigit = cleaned[0]
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(firstDigit)
  }

  return false
}

/**
 * Formate un numéro de téléphone français pour l'affichage
 * @param phone - Le numéro de téléphone à formater
 * @returns Le numéro formaté (ex: 01 23 45 67 89) ou le numéro original si invalide
 */
export function formatFrenchPhone(phone: string): string {
  if (!phone) return ''

  // Nettoyer le numéro
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')

  // Si c'est un format international, le convertir
  let digits = cleaned
  if (cleaned.startsWith('+33')) {
    digits = '0' + cleaned.substring(3) // Ajouter le 0 initial
  } else if (cleaned.startsWith('0033')) {
    digits = '0' + cleaned.substring(4) // Ajouter le 0 initial
  } else if (cleaned.length === 9) {
    digits = '0' + cleaned // Ajouter le 0 initial si manquant
  }

  // Formater en XX XX XX XX XX
  if (digits.length === 10 && /^\d{10}$/.test(digits)) {
    return digits.match(/.{1,2}/g)?.join(' ') || digits
  }

  return phone // Retourner le numéro original si on ne peut pas le formater
}

