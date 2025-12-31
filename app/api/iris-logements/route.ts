import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'communes_iris_logements.json')
    
    // Lire le fichier
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    // Remplacer les NaN par null (valide en JSON)
    const cleanedContent = fileContent.replace(/:\s*NaN\s*([,\}])/g, ': null$1')
    
    // Parser et re-sérialiser pour valider le JSON
    const data = JSON.parse(cleanedContent)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur lors du chargement des données IRIS:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des données' },
      { status: 500 }
    )
  }
}

