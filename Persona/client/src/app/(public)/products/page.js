"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

const products = [
  {
    id: 1,
    name: "Custom T-Shirts",
    price: "From £19.99",
    image: "https://thebridgestore.in/cdn/shop/files/JColeFront.jpg",
  },
  {
    id: 2,
    name: "Magic Mugs",
    price: "From £12.99",
    image:
      "https://static-assets-prod.fnp.com/images/pr/m/v300/personalised-couple-magic-mug.jpg",
  },
  {
    id: 3,
    name: "Phone Cases",
    price: "From £14.99",
    image: "https://m.media-amazon.com/images/I/71z8bQorkML.jpg",
  },
  {
    id: 4,
    name: "Gift Collections",
    price: "From £9.99",
    image:
      "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
}

export default function ProductsPage() {
  return (
    <div className="space-y-24">

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-black to-zinc-800 text-white"
      >
        <div className="max-w-7xl mx-auto px-8 py-24">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Personalized Gifts
          </h1>
          <p className="mt-4 max-w-xl text-zinc-300">
            Turn your memories into beautifully crafted products. High-quality
            prints, fast delivery, and easy customization.
          </p>

          <Link
            href="#products"
            className="inline-block mt-10 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition"
          >
            Browse Collections
          </Link>
        </div>
      </motion.section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-zinc-900">
            Featured Collections
          </h2>
          <p className="text-zinc-500 mt-2">
            Choose a category and start personalizing instantly
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          id="products"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={item}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-xl"
            >
              <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-semibold text-zinc-900">
                  {product.name}
                </h3>
                <p className="text-sm text-zinc-500">
                  {product.price}
                </p>

                <Link
                  href={`/products/${product.id}`}
                  className="block text-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition"
                >
                  Customize Now
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-zinc-50 border-t"
      >
        <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-5">
          <h3 className="text-3xl font-semibold text-zinc-900">
            Create something truly personal
          </h3>
          <p className="text-zinc-600 max-w-xl mx-auto">
            Upload your photo, add text, preview live, and order in minutes.
          </p>

          <Link
            href="/contact"
            className="inline-block rounded-full bg-black px-10 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition"
          >
            Talk to Our Team
          </Link>
        </div>
      </motion.section>
    </div>
  )
}
