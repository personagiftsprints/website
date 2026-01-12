"use client"

export default function ResponsiveTable() {
  const rows = [
    { id: 1, user: "John Doe", product: "Custom T-Shirt", amount: "29.99", status: "Paid" },
    { id: 2, user: "Emma Watson", product: "Photo Mug", amount: "14.50", status: "Pending" },
    { id: 3, user: "Alex Smith", product: "Hoodie", amount: "49.00", status: "Delivered" },
  ]

  return (
    <div className="bg-white p-2 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-4">
        Recent Orders
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full  border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                User
              </th>
              <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                Product
              </th>
              <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                Amount
              </th>
              <th className="text-left px-2 sm:px-3 py-2 font-medium text-gray-600">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0">
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                  {row.user}
                </td>
                <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                  {row.product}
                </td>
                <td className="px-2 sm:px-3 py-2">
                  £{row.amount}
                </td>
                <td className="px-2 sm:px-3 py-2">
                  <span
                    className={`font-medium ${
                      row.status === "Paid"
                        ? "text-green-600"
                        : row.status === "Pending"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
