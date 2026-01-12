import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-600 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-orange-400">
              PERSONA
            </h2>
            <div className="w-32 h-1 bg-gray-300" />
          </div>

          {/* <div className="flex-1 bg-gray-200 text-gray-600 rounded-md h-32 flex items-center justify-center text-sm">
            Design prototype by Fosoft
          </div> */}
        </div>

        <div className="border-t border-white/30" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-400 rounded" />
          <div className="h-32 bg-gray-400 rounded" />
          <div className="h-32 bg-gray-400 rounded" />
          <div className="h-32 bg-gray-400 rounded" />
        </div>
      </div>

      <div className="w-full bg-zinc-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-gray-300 inline-block" />
            <span className="w-4 h-4 bg-gray-300 inline-block" />
            <span className="w-4 h-4 bg-gray-300 inline-block" />
          </div>

          <span className="opacity-70">
            Design prototype by Fosoft
          </span>

        <Link href="https://stripe.com" className="flex items-center gap-3 text-sm text-gray-600">
  <span>Powered by</span>
  <Image
    src="/images/stripe.png"
    width={36}
    height={24}
    alt="Stripe"
    priority
  />
</Link>

        </div>
      </div>
    </footer>
  )
}
