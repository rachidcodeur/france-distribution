'use client'

import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GSAPAnimations from '@/components/GSAPAnimations'

export default function SecteursLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main>
      <Header />
      {children}
      <Footer />
      <GSAPAnimations />
    </main>
  )
}

