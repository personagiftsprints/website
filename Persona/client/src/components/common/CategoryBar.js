"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export default function CategoryBar({ categories, subcategoriesMap }) {
  const [active, setActive] = useState(null)

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="border-t border-gray-100 bg-white"
    >

      <div className="max-w-7xl mx-auto px-4">

       <ul className="flex lg:justify-center justify-start gap-6 lg:gap-10 text-sm font-medium text-gray-500 h-14 items-center lg:overflow-visible overflow-x-auto no-scrollbar scroll-smooth px-4 lg:px-0">

          {categories.map(cat => {
            const subs = subcategoriesMap[cat._id] || []

            return (
              <li
                key={cat._id}
                className="relative group"
                onMouseEnter={() => setActive(cat._id)}
                onMouseLeave={() => setActive(null)}
              > 

                <Link
                  href={`/category/${cat.slug}`}
                  className="flex items-center gap-1 hover:text-orange-500 whitespace-nowrap"
                >
                  {cat.name}

                  {subs.length > 0 && (
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-200 ${
                        active === cat._id ? "rotate-90 text-orange-500" : ""
                      }`}
                    />
                  )}
                </Link>

              {active === cat._id && subs.length > 0 && (
  <div className="absolute left-0 top-full bg-white shadow-lg border border-gray-100 rounded-lg p-3 min-w-[220px] z-50">
    <ul className="space-y-1">
      {subs.map(sub => (
        <li key={sub._id}>
          <Link
            href={`/category/${cat.slug}/${sub.slug}`}
            className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-gray-50 rounded"
          >
            {sub.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)}

              </li>
            )
          })}

        </ul>

      </div>
      
    </motion.div>
  )
}