"use client"

import Link from "next/link"
import Image from "next/image"

const designs = [
  {
    id: 1,
    title: "Superman Classic",
    product: "T-Shirt",
    theme: "Superhero",
    image: "https://m.media-amazon.com/images/I/61e0m1RTBEL._AC_UY1100_.jpg",
    active: true,
  },
  {
    id: 2,
    title: "Moon Knight Shadow",
    product: "T-Shirt",
    theme: "Superhero",
    image: "https://m.media-amazon.com/images/I/61e0m1RTBEL._AC_UY1100_.jpg",
    active: true,
  },
  {
    id: 3,
    title: "Belly Elise Art",
    product: "T-Shirt",
    theme: "Cartoon",
    image: "https://m.media-amazon.com/images/I/61e0m1RTBEL._AC_UY1100_.jpg",
    active: false,
  },
]

export default function DesignLibraryPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Design Library</h1>

        <Link
          href="/admin/design-library/add"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          + Add Design
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Preview</th>
              <th className="px-4 py-3 font-medium">Design</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Theme</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {designs.map((design) => (
              <tr
                key={design.id}
                className="border-b last:border-none hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="relative h-14 w-14 rounded-md overflow-hidden border">
                    <Image
                      src={design.image}
                      alt={design.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>

                <td className="px-4 py-3 font-medium">
                  {design.title}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {design.product}
                </td>

                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {design.theme}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      design.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {design.active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/design-library/${design.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}