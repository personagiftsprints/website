"use client"

import Logo from "@/assets/icons/logo.png"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem("cookie_consent")
    if (!accepted) setVisible(true)
  }, [])

  const acceptAll = () => {
    localStorage.setItem("cookie_consent", "accepted")
    setVisible(false)
  }

  const customise = () => {
    localStorage.setItem("cookie_consent", "customised")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-overlay">
      <div className="cookie-box flex flex-col items-center justify-center gap-3">
        <Image
          src={Logo}
          alt="Personalised Gifts Shop"
          width={50}
          height={50}
          priority
        />

        <h3>We value your privacy</h3>

        <p>
          We use cookies so that we can give you the best possible experience
          when browsing and shopping our joyful gifts and to make sure
          personalised gifts shop ads you see on other websites are relevant to
          you. You can customise them yourself below or clear them from your
          browser settings anytime. More information is in our{" "}
          <a href="/cookie-policy">cookie policy</a>.
        </p>

        <div className="cookie-actions">
          <button className="outline" onClick={customise}>
            Customise
          </button>
          <button className="filled" onClick={acceptAll}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
