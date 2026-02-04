"use client"

import { useParams } from "next/navigation"
import { useCustomizationData } from "@/hooks/useCustomizationData"

export default function GeneralPrintPage() {
  const { slug } = useParams()
  const { product, config, loading, error } =
    useCustomizationData(slug, "general")

  if (loading) return <div>Loading…</div>
  if (error) return <div>{error}</div>

  return (
    <div>
      <h1>General Print</h1>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  )
}
