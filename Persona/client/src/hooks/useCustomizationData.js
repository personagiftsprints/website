import { useEffect, useState, useMemo } from "react"
import { getProductBySlug } from "@/services/product.service"
import { getPrintConfigBySlug } from "@/services/printArea.service"

export function useCustomizationData(slug, typeFromQuery) {
  const [product, setProduct] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const printConfigType = useMemo(() => {
    if (typeFromQuery) return typeFromQuery
    if (product?.customization?.enabled)
      return product.customization.printConfig?.configType
    if (product?.type) return product.type
    return "general"
  }, [typeFromQuery, product])

  useEffect(() => {
    if (!slug) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await getProductBySlug(slug)
        if (!res?.success) {
          setError("Product not found")
          return
        }
        setProduct(res.data)
      } catch {
        setError("Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  useEffect(() => {
    if (!printConfigType) return

    const loadConfig = async () => {
      const cfg = await getPrintConfigBySlug(printConfigType)
      setConfig(cfg)
    }

    loadConfig()
  }, [printConfigType])

  return { product, config, loading, error }
}
