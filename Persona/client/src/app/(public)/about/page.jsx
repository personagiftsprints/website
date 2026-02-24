"use client"

import { MapPin, Gift, Star, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">

      {/* HERO */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#F9A51B]">
          Persona Gifts & Prints
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          A personalised gift and print specialist based in Warrington, England,
          helping customers celebrate life’s meaningful moments with beautifully
          crafted custom products.
        </p>
      </section>

      {/* ABOUT GRID */}
      <section className="grid md:grid-cols-2 gap-10">
        <div className="bg-white border rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-[#F9A51B]"  />
            <h2 className="text-xl font-semibold text-[#F9A51B]">What We Do</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            We specialise in high-quality personalised gifts including custom mugs,
            apparel, phone covers, crystal trophies, printed cards, engraved items,
            and unique keepsakes for birthdays, weddings, anniversaries,
            corporate events, and seasonal celebrations.
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-[#F9A51B]" />
            <h2 className="text-xl font-semibold text-[#F9A51B]">Our Mission</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Our mission is to make gifting more meaningful. Every product is
            designed with attention to detail, ensuring it reflects personality,
            emotion, and occasion. We aim to transform everyday gifts into
            lasting memories.
          </p>
        </div>
      </section>

      {/* LOCATION */}
      <section className="bg-gray-50 border rounded-2xl p-10">
        <div className="flex items-start gap-4">
         <MapPin className="w-6 h-6 min-w-[24px] min-h-[24px] shrink-0 text-[#F9A51B]" />
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[#F9A51B]">Our Location</h2>
            <p className="text-gray-600 leading-relaxed">
              Persona Gifts & Prints operates from Warrington, England,
              serving local customers and online orders with care and precision.
              We are dedicated to providing a friendly and professional experience
              for every customer.
            </p>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="grid md:grid-cols-3 gap-6 text-center">
        <div className="border rounded-2xl p-8 space-y-2">
          <Users className="mx-auto w-6 h-6" />
          <h3 className="text-2xl font-semibold">150+</h3>
          <p className="text-sm text-gray-500">Growing Community</p>
        </div>

        <div className="border rounded-2xl p-8 space-y-2">
          <Gift className="mx-auto w-6 h-6" />
          <h3 className="text-2xl font-semibold">1000+</h3>
          <p className="text-sm text-gray-500">Custom Gifts Created</p>
        </div>

        <div className="border rounded-2xl p-8 space-y-2">
          <Star className="mx-auto w-6 h-6" />
          <h3 className="text-2xl font-semibold">Quality Focused</h3>
          <p className="text-sm text-gray-500">Attention to Detail</p>
        </div>
      </section>

    </div>
  )
}
