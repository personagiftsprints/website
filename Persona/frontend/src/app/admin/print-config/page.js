"use client"

import react from "react"
import { useEffect, useState, useCallback } from "react"
import { Settings, AlertCircle, Shirt, Coffee, Box } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

function Card({ className = "", children }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
}

function CardHeader({ className = "", children }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

function CardTitle({ className = "", children }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
}

function CardDescription({ className = "", children }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
}

function CardContent({ className = "", children }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

function Button({ variant = "default", className = "", onClick, children }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

function getProductIcon(type) {
  const key = type?.toLowerCase()

  const iconMap = {
    tshirt: Shirt,
    t_shirt: Shirt,
    shirt: Shirt,
    mug: Coffee,
  }

  return iconMap[key] || Box
}

export default function PrintConfigListPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/print-model`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setConfigs(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch configs")
      toast.error("Failed to load print configurations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Print Configurations</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={fetchConfigs}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Print Configurations</h1>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No configurations found</h3>
            <p className="text-muted-foreground text-center mt-2">
              No print configurations are available at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => {
            const Icon = getProductIcon(config.type)

            return (
              <Link key={config.type} href={`/admin/print-config/${config.type}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <Icon className="h-8 w-8 text-muted-foreground mt-1" />
                    <div>
                      <CardTitle className="text-xl">{config.name}</CardTitle>
                      <CardDescription>Product Type: {config.type}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Views:</strong> {Object.keys(config.views || {}).length}
                      </p>
                      {config.recommendations && (
                        <p className="text-green-600">Recommendations set</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
