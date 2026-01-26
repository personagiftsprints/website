'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'

export default function PublicLayout({ children }) {
  const pathname = usePathname()

  const hideFooter =
    pathname.startsWith('/products/customize')

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full">
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  )
}
