"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { AuthProvider } from "@/context/AuthContext"
import AuthDrawer from "@/components/AuthDrawer"
import CookieConsent from "@/components/CookieConsent"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import MaintenanceOverlay from "@/components/common/MaintenanceOverlay"
import { Montserrat } from "next/font/google"
import { Instagram } from "lucide-react"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat"
})

function FloatingSocials() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3`}
    >
      <a
        href="https://www.instagram.com/persona_gifts_prints"
        target="_blank"
        rel="noopener noreferrer"
        className={`w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg transition-all duration-700 ease-out hover:scale-110 ${
          visible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"
        }`}
        style={{ transitionDelay: "0ms" }}
        aria-label="Instagram"
      >
        <Instagram size={20} />
      </a>

      <a
        href="https://wa.me/447436131651?text=hello"
        target="_blank"
        rel="noopener noreferrer"
        className={`w-11 h-11 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-700 ease-out hover:scale-110 ${
          visible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"
        }`}
        style={{ transitionDelay: "150ms" }}
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}


export default function RootLayout({ children }) {
  const [authOpen, setAuthOpen] = useState(false)
  const pathname = usePathname()

  const isAdminRoute = pathname?.startsWith("/admin")

  useEffect(() => {
    document.title = "Persona prints & gifts"
  }, [])

  useEffect(() => {
    const handler = () => setAuthOpen(true)
    window.addEventListener("open-auth", handler)
    return () => window.removeEventListener("open-auth", handler)
  }, [])

  return (
    <html lang="en" className={montserrat.variable}>

      
      <body className="font-montserrat" suppressHydrationWarning>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />

        <Script id="meta-pixel" strategy="afterInteractive">
  {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}
    (window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '1346195000698898');
    fbq('track', 'PageView');
  `}
</Script>

          

        <AuthProvider>
          <MaintenanceOverlay />
          <CelebrationOverlay />
          {children}
          <CookieConsent />
          {!isAdminRoute && <FloatingSocials />}
          <AuthDrawer
            open={authOpen}
            onClose={() => setAuthOpen(false)}
          />
        </AuthProvider>
      </body>
    </html>
  )
}