import { Suspense } from "react"
import SuccessClient from "./SuccessClient"

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SuccessClient />
    </Suspense>
  )
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading…
    </div>
  )
}
