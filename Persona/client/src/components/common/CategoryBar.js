"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronRight } from "lucide-react"

export default function CategoryBar({ categories, subcategoriesMap }) {
  const [active, setActive] = useState(null)

  return (
    <div className="border-t border-gray-100 bg-white">

      <div className="max-w-7xl mx-auto px-4">

       <ul className="flex justify-center gap-10 text-sm font-medium text-gray-500 h-12 items-center overflow-visible ">

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
                 <div className="absolute left-0 top-full mt-0 bg-white shadow-lg border border-gray-100 rounded-lg p-2 min-w-[250px] z-[99999]">

                    <ul className="space-y-2">

                      {subs.map(sub => (
                        <li key={sub._id}>
                          <Link
                            href={`/category/${cat.slug}/${sub.slug}`}
                            className="block text-sm text-gray-600 py-2 hover:text-orange-500"
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
      
    </div>
  )
}