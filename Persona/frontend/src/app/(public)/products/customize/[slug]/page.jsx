"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getProductBySlug } from "@/services/product.service"

export default function CustomizeRouterPage() {
  const { slug } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const typeFromQuery = searchParams.get("type")

  useEffect(() => {
    if (!slug) return

    const route = async () => {
      const res = await getProductBySlug(slug)

      if (!res?.success) {
        router.push("/404")
        return
      }

      const product = res.data

      const printType =
        typeFromQuery ||
        (product.customization?.enabled
          ? product.customization.printConfig?.configType
          : product.type) ||
        "general"

      const qs = searchParams.toString()
      const suffix = qs ? `?${qs}` : ""

      router.replace(
        `/products/customize/${slug}/${printType}${suffix}`
      )
    }

    route()
  }, [slug, router, searchParams, typeFromQuery])

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      Preparing customization…
    </div>
  )
}
