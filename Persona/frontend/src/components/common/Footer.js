import Image from "next/image"
import Link from "next/link"
import Logo from "@/../public/icons/logo.png"

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-600 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Image src={Logo} alt="Persona Logo" width={40} height={40} />
            <h2 className="text-xl font-semibold text-[#f9a51b]">
              PERSONA
            </h2>
            <div className="w-32 h-1 bg-gray-300" />
            <p className="text-sm text-gray-200 leading-relaxed">
              Personalized gifts and premium custom prints designed to turn
              everyday moments into meaningful memories.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              Contact
            </h3>
<ul className="space-y-2 text-sm text-gray-200">
  <li>
    Address: The Hive Mall, Unit D, 27–31 Sankey Street, Warrington, WA1 1XG, United Kingdom
  </li>
  <li>
    Phone: <a href="tel:01925949939">01925 949939</a>
  </li>
  <li>
    WhatsApp:{" "}
    <a
      href="https://wa.me/447436131651?text=hello"
      target="_blank"
      rel="noopener noreferrer"
    >
      +44 7436 131651
    </a>
  </li>
  <li>Email: personagiftsprints@gmail.com</li>
</ul>

          </div>
        </div>

        <div className="border-t border-white/30" />
      </div>

      <div className="w-full bg-zinc-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-4">
            <Link
              href="https://www.instagram.com"
              target="_blank"
              className="hover:text-white transition"
            >
              Instagram
            </Link>
            <Link
              href="https://www.facebook.com"
              target="_blank"
              className="hover:text-white transition"
            >
              Facebook
            </Link>
          </div>

          <Link
            href="https://stripe.com"
            className="flex items-center gap-2 text-gray-300"
          >
            <span>Powered by</span>
            <Image
              src="/images/stripe.png"
              width={36}
              height={24}
              alt="Stripe"
              priority
            />
          </Link>

          <span className="opacity-70 text-right">
            Created by FABRES ORBIS PRIVATE LIMITED
          </span>
        </div>
      </div>
    </footer>
  )
}
