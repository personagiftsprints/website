    "use client"

    import { useState, useEffect } from "react"
    import { useRouter } from "next/navigation"
    import { createCollection } from "@/services/collection.service"
    import { uploadImagesAPI, getAllProducts } from "@/services/product.service"

    const PRODUCT_TYPES = [
  { label: "T Shirt", value: "tshirt" },
  { label: "Mobile Case", value: "mobileCase" },
  { label: "Hoodie", value: "hoodie" },
  { label: "Mug", value: "mug" },
  { label: "Poster", value: "poster" },
   { label: "Normal", value: "normal" }
]

    export default function NewCollectionPage() {
    const router = useRouter()

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [mode, setMode] = useState("PRODUCT_TYPE")
    const [selectedTypes, setSelectedTypes] = useState([])
    const [thumbnail, setThumbnail] = useState(null)

    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

    const [selectedProducts, setSelectedProducts] = useState([])

    const [showBrowser, setShowBrowser] = useState(false)
    const [products, setProducts] = useState([])
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)

    const [loading, setLoading] = useState(false)

    /* ================= SEARCH ================= */

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
        }

        const delay = setTimeout(async () => {
        try {
            setSearching(true)

            const res = await getAllProducts({
            search: searchQuery,
            limit: 10
            })

            if (res.success) {
            setSearchResults(res.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSearching(false)
        }
        }, 400)

        return () => clearTimeout(delay)
    }, [searchQuery])

    /* ================= PRODUCT BROWSER ================= */

    const fetchProducts = async (pageNumber = 1) => {
        try {
        const res = await getAllProducts({
            page: pageNumber,
            limit: 20
        })

        if (res.success) {
            setProducts(res.data)
            setPage(res.pagination.page)
            setPages(res.pagination.pages)
        }
        } catch (err) {
        console.error(err)
        }
    }

    const openBrowser = async () => {
        setShowBrowser(true)
        await fetchProducts(1)
    }

    /* ================= HANDLERS ================= */

    const handleAddProduct = (product) => {
        const exists = selectedProducts.find(p => p._id === product._id)
        if (exists) return

        setSelectedProducts(prev => [...prev, product])
    }

    const handleRemoveProduct = (id) => {
        setSelectedProducts(prev =>
        prev.filter(p => p._id !== id)
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!title) return alert("Title required")

        if (mode === "MANUAL" && selectedProducts.length === 0)
        return alert("Select at least one product")

        try {
        setLoading(true)

        let uploadedImage = null

        if (thumbnail) {
            const images = await uploadImagesAPI([thumbnail])
            uploadedImage = images[0]
        }

        const payload = {
            title,
            description,
            type: mode,
            productTypes: mode === "PRODUCT_TYPE" ? selectedTypes : [],
            productIds:
            mode === "MANUAL"
                ? selectedProducts.map(p => p._id)
                : [],
            image: uploadedImage || null
        }

        const res = await createCollection(payload)

        if (!res.success) throw new Error()

        router.push("/admin/collections")
        } catch {
        alert("Failed to create collection")
        } finally {
        setLoading(false)
        }
    }

    /* ================= UI ================= */

    return (
        <div className="p-6 max-w-5xl">
        <h1 className="text-2xl font-semibold mb-6">
            Create Collection
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

            <input
            className="w-full border p-3 rounded"
            placeholder="Collection Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            />

            <textarea
            className="w-full border p-3 rounded"
            rows={4}
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            />

            <input
            type="file"
            accept="image/*"
            onChange={e => setThumbnail(e.target.files[0])}
            />

            <select
            value={mode}
            onChange={e => setMode(e.target.value)}
            className="border p-3 rounded"
            >
            <option value="PRODUCT_TYPE">By Product Type</option>
            <option value="MANUAL">By Individual Products</option>
            </select>


            {/* PRODUCT TYPE MODE */}
    {mode === "PRODUCT_TYPE" && (
    <div className="space-y-4">

        <div className="text-sm font-medium">
        Select Product Types
        </div>

       <div className="grid grid-cols-2 gap-4">
  {PRODUCT_TYPES.map(type => {
    const selected = selectedTypes.includes(type.value)

    return (
      <div
        key={type.value}
        onClick={() => {
          if (selected) {
            setSelectedTypes(prev =>
              prev.filter(t => t !== type.value)
            )
          } else {
            setSelectedTypes(prev => [...prev, type.value])
          }
        }}
        className={`p-4 border rounded cursor-pointer transition ${
          selected
            ? "bg-black text-white border-black"
            : "hover:bg-gray-100"
        }`}
      >
        {type.label}
      </div>
    )
  })}
</div>

        {selectedTypes.length > 0 && (
        <div className="text-sm text-gray-600">
            Selected: {selectedTypes.join(", ")}
        </div>
        )}

    </div>
    )}

            {/* MANUAL MODE */}
            {mode === "MANUAL" && (
            <div className="space-y-4">

                {/* SEARCH */}
                <input
                className="border p-3 w-full rounded"
                placeholder="Search by name, slug or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery.length >= 2 && (
                <div className="border rounded bg-white shadow max-h-60 overflow-y-auto">
                    {searchResults.map(product => (
                    <div
                        key={product._id}
                        onClick={() => handleAddProduct(product)}
                        className="p-3 cursor-pointer hover:bg-gray-100"
                    >
                        {product.name}
                    </div>
                    ))}
                </div>
                )}

                {/* BROWSE BUTTON */}
                <button
                type="button"
                onClick={openBrowser}
                className="px-4 py-2 border rounded"
                >
                Browse All Products
                </button>

                {/* SELECTED PRODUCTS */}
                {selectedProducts.map(product => (
                <div
                    key={product._id}
                    className="flex justify-between border p-3 rounded"
                >
                    <div>{product.name}</div>
                    <button
                    type="button"
                    onClick={() => handleRemoveProduct(product._id)}
                    className="text-red-500"
                    >
                    Remove
                    </button>
                </div>
                ))}

            </div>
            )}

            <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-black text-white rounded"
            >
            {loading ? "Creating..." : "Create Collection"}
            </button>
        </form>

        {/* PRODUCT BROWSER MODAL */}
        {showBrowser && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-3xl p-6 rounded shadow-lg">

                <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold">
                    All Products
                </h2>
                <button onClick={() => setShowBrowser(false)}>
                    Close
                </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map(product => (
                    <div
                    key={product._id}
                    onClick={() => handleAddProduct(product)}
                    className="p-3 border rounded cursor-pointer hover:bg-gray-100"
                    >
                    <div>{product.name}</div>
                    <div className="text-xs text-gray-500">
                        SKU: {product.sku}
                    </div>
                    </div>
                ))}
                </div>

                {/* PAGINATION */}
                <div className="flex justify-between mt-4">
                <button
                    disabled={page <= 1}
                    onClick={() => fetchProducts(page - 1)}
                >
                    Prev
                </button>

                <span>
                    Page {page} of {pages}
                </span>

                <button
                    disabled={page >= pages}
                    onClick={() => fetchProducts(page + 1)}
                >
                    Next
                </button>
                </div>

            </div>
            </div>
        )}
        </div>
    )
    }