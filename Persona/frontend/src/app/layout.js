import "./globals.css"
import { montserrat } from "@/lib/fonts"

export const metadata = {
  title: "Persona - Custom Merchandise",
  description: "Create your own custom t-shirts and mugs",
  icons: {
    icon: "/icons/logo.ico",
    shortcut: "/icons/logo.ico",
    apple: "/icons/logo.png",
  },
}

console.log(process.env.NODE_ENV)

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={montserrat.className}>
      <body>{children}</body>
    </html>
  )
}
