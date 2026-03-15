'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import VilleDetail from '@/components/VilleDetail'

export default function VillePage({ params }: { params: { ville: string } }) {
  const villeName = decodeURIComponent(params.ville)

  return (
    <main>
      <Header />
      <VilleDetail villeName={villeName} />
      <Footer />
    </main>
  )
}

