"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronRight, LayoutGrid } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function CategoryBar({ categories = [], subcategoriesMap = {} }) {
  const [active, setActive] = useState(null)

  // Logic to show only first 5 categories and add a "View All" if more exist
  const displayedCategories = categories.length > 5 ? categories.slice(0, 5) : categories;
  const hasMore = categories.length > 5;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-t border-gray-100 bg-white relative z-40"
      onMouseLeave={() => setActive(null)}
    >
      <div className="max-w-7xl mx-auto px-4 relative">
        <ul className="flex lg:justify-center justify-start gap-6 lg:gap-10 text-sm font-medium text-gray-500 h-14 items-center lg:overflow-visible overflow-x-auto no-scrollbar scroll-smooth px-4 lg:px-0">
          
          {displayedCategories.map(cat => {
            const subs = subcategoriesMap[cat._id] || []
            const isActive = active === cat._id

            return (
              <li
                key={cat._id}
                className="relative h-full flex items-center"
                onMouseEnter={() => setActive(cat._id)}
              > 
                <Link
                  href={`/category/${cat.slug}`}
                  className={`flex items-center gap-1 transition-colors duration-200 whitespace-nowrap hover:text-orange-500 ${
                    isActive ? "text-orange-500" : ""
                  }`}
                >
                  {cat.name}

                  {subs.length > 0 && (
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-200 ${
                        isActive ? "rotate-90 text-orange-500" : ""
                      }`}
                    />
                  )}
                </Link>

                <AnimatePresence>
                  {isActive && subs.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 top-full bg-white shadow-xl border border-gray-100 rounded-b-lg p-3 min-w-[220px] z-50"
                    >
                      <ul className="space-y-1">
                        {subs.map(sub => (
                          <li key={sub._id}>
                            <Link
                              href={`/category/${cat.slug}/${sub.slug}`}
                              className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-500 hover:bg-gray-50 rounded transition-colors"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}

          {hasMore && (
            <li 
              className="relative h-full flex items-center"
              onMouseEnter={() => setActive('view-all')}
            >
              <button className={`flex items-center gap-2 transition-colors duration-200 whitespace-nowrap hover:text-orange-500 font-semibold ${
                active === 'view-all' ? 'text-orange-500' : ''
              }`}>
                <LayoutGrid size={16} />
                View All
              </button>
            </li>
          )}
        </ul>

        {/* Mega Menu for View All */}
        <AnimatePresence>
          {active === 'view-all' && (
            <motion.div 
              onMouseEnter={() => setActive('view-all')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 top-full bg-white shadow-2xl border border-gray-100 rounded-b-xl p-8 z-50 max-h-[70vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {categories.map(cat => {
                  const subs = subcategoriesMap[cat._id] || []
                  return (
                    <div key={cat._id} className="space-y-3">
                      <Link 
                        href={`/category/${cat.slug}`}
                        className="font-bold text-gray-900 hover:text-orange-500 text-base border-b border-gray-100 pb-2 block transition-colors"
                      >
                        {cat.name}
                      </Link>
                      {subs.length > 0 && (
                        <ul className="space-y-1.5">
                          {subs.map(sub => (
                            <li key={sub._id}>
                              <Link
                                href={`/category/${cat.slug}/${sub.slug}`}
                                className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

