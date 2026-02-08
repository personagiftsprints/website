"use client"

const getImageSrc = photo => {
  if (!photo) return null
  if (typeof photo === "string") return photo
  return URL.createObjectURL(photo)
}

const ProductLivePreview = ({ name, category, itemType, photos = [], price }) => {
  const mainImage = photos[0]

  return (
    <aside className="bg-white border rounded-xl p-6 h-fit sticky top-6">
      <h3 className="font-semibold mb-4">Live Preview</h3>

      <div className="space-y-4">
        <div className="aspect-square border rounded overflow-hidden bg-gray-50">
          {mainImage ? (
            <img
              src={getImageSrc(mainImage)}
              className="w-full h-full object-cover"
              alt="Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              No Image
            </div>
          )}
        </div>

        <div>
          <p className="font-medium">{name || "Product Name"}</p>
          <p className="text-sm text-gray-500">{category || "Category"}</p>
        </div>

        <div className="flex justify-between text-sm">
          <span>Type</span>
          <span className="capitalize">{itemType || "-"}</span>
        </div>

        <div className="flex justify-between font-medium">
          <span>Price</span>
          <span>{price ? `$${price}` : "-"}</span>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2">
            {photos.slice(1).map((photo, i) => (
              <img
                key={i}
                src={getImageSrc(photo)}
                className="w-12 h-12 object-cover border rounded"
                alt="Preview"
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

export default ProductLivePreview
