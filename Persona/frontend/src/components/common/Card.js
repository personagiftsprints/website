"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function Card({ title, image }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative h-80 rounded-md overflow-hidden bg-gray-200 cursor-pointer"
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

      <div className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
        {title}
      </div>
    </motion.div>
  )
}
