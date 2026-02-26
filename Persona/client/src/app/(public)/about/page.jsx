"use client"
import { MapPin, Gift, Star, Users, Heart, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 md:py-24 space-y-20 md:space-y-28">

        {/* HERO - more emotional + visual weight */}
        <section className="text-center space-y-6 md:space-y-8">
         <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 bg-clip-text text-transparent">
   Persona Gifts & Prints
</h1>
          <p className="text-xl sm:text-2xl font-medium text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Turning moments into memories — one thoughtful, personalised gift at a time.
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Based in Warrington, England, we craft custom mugs, apparel, crystal engravings, photo gifts, cards and unique keepsakes that celebrate the people and occasions that matter most.
          </p>
        </section>

        {/* OUR STORY - adds warmth & human touch (very popular in 2025 small biz trends) */}
        <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 md:p-12 space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-7 h-7 text-[#F9A51B]" />
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Our Story</h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">
            It all started with a simple idea: gifts should feel personal. Not mass-produced, not generic — but made with real care, reflecting someone’s personality, story or relationship.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Today we’re a small, passionate team in Warrington helping people across the UK (and beyond) celebrate birthdays, weddings, anniversaries, new babies, retirements, pet lovers, and everything in between with meaningful, high-quality personalised creations.
          </p>
        </section>

        {/* WHAT WE DO + MISSION - side by side, more visual */}
        <section className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="group bg-white border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl p-8 lg:p-10 space-y-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#F9A51B]/10 rounded-xl">
                <Gift className="w-7 h-7 text-[#F9A51B]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">What We Create</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Custom mugs • T-shirts & hoodies • Phone cases • Engraved crystal trophies & plaques • Personalised cards • Photo blankets • Acrylic prints • Wooden keepsakes • And many more thoughtful items made for your special moments.
            </p>
          </div>

          <div className="group bg-white border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl p-8 lg:p-10 space-y-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#F9A51B]/10 rounded-xl">
                <Sparkles className="w-7 h-7 text-[#F9A51B]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Our Promise</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Every piece is crafted with attention to detail and genuine care. We exist to make gifting more meaningful — turning ordinary objects into lasting, emotional keepsakes that bring joy long after the wrapping paper is gone.
            </p>
          </div>
        </section>

        {/* LOCATION */}
        <section className="bg-gradient-to-br from-[#F9A51B]/5 to-amber-50/30 border border-[#F9A51B]/20 rounded-3xl p-8 md:p-12">
          <div className="flex items-start gap-5">
            <div className="p-3 bg-[#F9A51B]/10 rounded-xl shrink-0 mt-1">
              <MapPin className="w-7 h-7 text-[#F9A51B]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">Proudly Based in Warrington</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                From our workshop in Warrington, England, we handcraft and carefully pack every order — serving local customers with same-day collection options and sending parcels nationwide with love and precision.
              </p>
            </div>
          </div>
        </section>

        {/* STATS - more modern, interactive feel */}
        <section className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Users, value: "150+", label: "Happy Regular Customers" },
            { icon: Gift, value: "1,000+", label: "Bespoke Gifts Created" },
            { icon: Star, value: "100%", label: "Made with Heart & Care" },
          ].map((stat, i) => (
            <div
              key={i}
              className="group bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-8 space-y-4"
            >
              <stat.icon className="mx-auto w-8 h-8 text-[#F9A51B] group-hover:scale-110 transition-transform" />
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center space-y-6 pt-8">
          <h2 className="text-3xl font-semibold text-gray-800">Ready to create something special?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our full range or get in touch — we’d love to help bring your idea to life.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/collections"
              className="inline-flex items-center px-8 py-4 bg-[#F9A51B] hover:bg-[#f28c1a] text-white font-semibold rounded-full text-lg transition-colors shadow-md"
            >
              Browse Gifts
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-[#F9A51B] text-[#F9A51B] hover:bg-[#F9A51B]/10 font-semibold rounded-full text-lg transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}