import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://france-distribution-flyers.fr'
  const lastModified = new Date()

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/distribution-flyer-paris`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/tournees`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/plan-du-site`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/mentions-legales`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/politique-confidentialite`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
