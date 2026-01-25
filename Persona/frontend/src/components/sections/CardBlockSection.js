"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Card from "../common/Card"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      ease: "easeOut",
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

export default function CardBlockSection({ heading, items }) {
  return (
    <section className="w-full py-7 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center mb-10"
        >
          <span className="px-8 py-2 text-orange-400  text-sm font-medium rounded">
            {heading}
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="min-w-0"
            >
              <Link
                href={`/collections/${item.type}`}
                className="block cursor-pointer"
              >
                <Card title={item.title} image={item.image} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
