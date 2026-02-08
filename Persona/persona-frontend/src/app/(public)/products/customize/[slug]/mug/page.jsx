"use client"

import { useParams } from "next/navigation"
import { useCustomizationData } from "@/hooks/useCustomizationData"

export default function MugCustomizePage() {
  const { slug } = useParams()
  const { product, config, loading, error } =
    useCustomizationData(slug, "mug")

  if (loading) return <div>Loading…</div>
  if (error) return <div>{error}</div>

  return (
    <div>
      <h1>Mug Designer</h1>

      <pre>{JSON.stringify(product, null, 2)}</pre>
      <pre>{JSON.stringify(config, null, 2)}</pre>

      {/* Mug wrap editor */}
    </div>
  )
}
