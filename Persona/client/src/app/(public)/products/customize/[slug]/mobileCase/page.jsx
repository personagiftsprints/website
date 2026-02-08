"use client"

import { useParams } from "next/navigation"
import { useCustomizationData } from "@/hooks/useCustomizationData"

export default function MobileCaseCustomizePage() {
  const { slug } = useParams()
  const { product, config, loading, error } =
    useCustomizationData(slug, "mobileCase")

  if (loading) return <div>Loading…</div>
  if (error) return <div>{error}</div>

  return (
    <div>
      <h1>Mobile Case Designer</h1>

      <pre>{JSON.stringify(product, null, 2)}</pre>
      <pre>{JSON.stringify(config, null, 2)}</pre>

      {/* Model selector + back-area editor */}
    </div>
  )
}
