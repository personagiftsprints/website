"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductBySlug } from "@/services/product.service";
import { getSimilarProducts } from "@/services/product.service"
import sizeChart from "@/assets/images/sizeChart.jpg";
import Image from "next/image";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([])
  const [similarLoading, setSimilarLoading] = useState(false);



useEffect(() => {
  if (!slug) return;

  const fetchProduct = async () => {
    try {
      const res = await getProductBySlug(slug);

     

      const productData = res.data;
      setProduct(productData);

      const main =
        productData.images?.find((i) => i.isMain)?.url ||
        productData.thumbnail;

      setActiveImage(main);

    } catch (err) {
      console.error("Error loading product", err);
     
    } finally {
      setLoading(false);
    }
  };

  fetchProduct();
}, [slug]);


useEffect(() => {
  if (!product?.type) return;

  const fetchSimilar = async () => {
    try {
      setSimilarLoading(true);
      const res = await getSimilarProducts(product.type);

      if (res?.success) {
        setSimilarProducts(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch similar products", err);
    } finally {
      setSimilarLoading(false);
    }
  };

  fetchSimilar();
}, [product]);



  useEffect(() => {
    if (!product?.productConfig?.variants) return;

    const match = product.productConfig.variants.find((v) =>
      Object.entries(selectedAttributes).every(
        ([k, val]) => v.attributes[k] === val
      )
    );

    setSelectedVariant(match || null);
  }, [selectedAttributes, product]);




  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!product) return <div className="p-10 text-center">Not found</div>;

  const { pricing, customization, inventory, productConfig } = product;
  const price = pricing.specialPrice ?? pricing.basePrice;

  const isVariantProduct = productConfig?.attributes?.length > 0;
  const isCustom = customization?.enabled;

const allAttributesSelected =
  productConfig?.attributes?.every(
    (attr) => selectedAttributes[attr.code]
  ) ?? false;

const isConfigSelected =
  !isVariantProduct ||
  (allAttributesSelected &&
    selectedVariant &&
    selectedVariant.stockQuantity > 0);


  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricing.currency || "USD",
  }).format(price);

  const formattedBasePrice = pricing.basePrice
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: pricing.currency || "USD",
      }).format(pricing.basePrice)
    : null;

  // Direct localStorage implementation
  const handleAddToCart = () => {
    // For products with variants (like t-shirts with size/color)
    if (isVariantProduct) {
   if (!allAttributesSelected || !selectedVariant) {
  alert("Please select all required options");
  return;
}

if (selectedVariant.stockQuantity <= 0) {
  alert("Selected variant is out of stock");
  return;
}


      // Get existing cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');

      // Create cart item with all fields
      const cartItem = {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        productType: product.type,
        name: product.name,
        image: product.images?.[0]?.url || product.thumbnail,
        price: price,
        currency: pricing.currency || "GBP",
        quantity: quantity,
        variant: {
          size: selectedAttributes.size,
          color: selectedAttributes.color?.toLowerCase(),
          color_label: selectedAttributes.color,
        },
        addedAt: new Date().toISOString()
      };

      // Generate unique ID
      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${product._id}_${selectedAttributes.size}_${selectedAttributes.color?.toLowerCase()}`;
      cartItem.id = uniqueId;

      // Check if item already exists (same product and variant)
      const existingIndex = existingCart.findIndex(item => 
        item.productId === cartItem.productId &&
        item.variant?.size === cartItem.variant.size &&
        item.variant?.color === cartItem.variant.color
      );

      if (existingIndex > -1) {
        // Update quantity if exists
        existingCart[existingIndex].quantity += quantity;
      } else {
        // Add new item
        existingCart.push(cartItem);
      }

      // Save back to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart));

      console.log('✅ Added to cart:', cartItem);
      console.log('📦 Cart now has', existingCart.length, 'items');
    } 
    // For simple products (no variants)
    else {
      // Get existing cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');

      const cartItem = {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        productType: product.type,
        name: product.name,
        image: product.images?.[0]?.url || product.thumbnail,
        price: price,
        currency: pricing.currency || "GBP",
        quantity: quantity,
        variant: {},
        addedAt: new Date().toISOString()
      };

      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${product._id}`;
      cartItem.id = uniqueId;

      // Check if item already exists
      const existingIndex = existingCart.findIndex(item => 
        item.productId === cartItem.productId
      );

      if (existingIndex > -1) {
        // Update quantity if exists
        existingCart[existingIndex].quantity += quantity;
      } else {
        // Add new item
        existingCart.push(cartItem);
      }

      // Save back to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart));

      console.log('✅ Added to cart:', cartItem);
      console.log('📦 Cart now has', existingCart.length, 'items');
    }

    setAdded(true);
    
    // Show success message and redirect after delay
    setTimeout(() => {
      router.push("/cart");
    }, 1000);
  };

  const isValueAvailable = (attrCode, value) => {
    if (!productConfig?.variants) return true;

    return productConfig.variants.some(
      (v) =>
        v.attributes[attrCode] === value &&
        Object.entries(selectedAttributes).every(
          ([k, val]) => k === attrCode || v.attributes[k] === val
        ) &&
        v.stockQuantity > 0
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* LEFT IMAGES */}
      <div>
        <img
          src={activeImage}
          className="w-full h-[460px] object-contain bg-gray-50 rounded-xl"
        />

        <div className="flex gap-3 mt-4">
          {product.images?.map((img) => (
            <img
              key={img.publicId}
              src={img.url}
              onClick={() => setActiveImage(img.url)}
              className={`w-20 h-20 rounded-lg object-contain bg-gray-50 cursor-pointer border ${
                activeImage === img.url ? "border-black" : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
        </div>

        <div className="flex items-end gap-4">
          <span className="text-4xl font-bold">{formattedPrice}</span>

          {pricing.specialPrice && (
            <span className="line-through text-gray-400">
              {formattedBasePrice}
            </span>
          )}
        </div>

        {/* VARIANTS - Only show for products with variants */}
        {productConfig?.attributes?.length > 0 && (
          <div className="space-y-6">
            {productConfig.attributes.map((attr) => (
              <div key={attr.code}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{attr.name}</p>

                  {attr.code === "size" && (
                    <button
                      onClick={() => setShowSizeChart(true)}
                      className="text-sm underline text-gray-600 hover:text-black"
                      type="button"
                    >
                      Size Chart
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {attr.values.map((value) => {
                    const active = selectedAttributes[attr.code] === value;
                    const available = isValueAvailable(attr.code, value);

                    return (
                      <button
                        key={value}
                        disabled={!available}
                        onClick={() =>
                          setSelectedAttributes((p) => ({
                            ...p,
                            [attr.code]: value,
                          }))
                        }
                        className={`px-4 py-2 rounded-full border text-sm ${
                          active
                            ? "bg-black text-white border-black"
                            : available
                            ? "border-gray-300 hover:border-black"
                            : "border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock info for variant products */}
        {selectedVariant && (
          <p
            className={`text-sm ${
              selectedVariant.stockQuantity > 0
                ? "text-gray-600"
                : "text-red-600"
            }`}
          >
            {selectedVariant.stockQuantity > 0
              ? `${selectedVariant.stockQuantity} available`
              : "Out of stock"}
          </p>
        )}

        {/* Stock info for simple products */}
        {!isCustom && !isVariantProduct && inventory.manageStock && (
          <p className="text-sm text-gray-600">
            {inventory.stockQuantity > 0
              ? `${inventory.stockQuantity} in stock`
              : "Out of stock"}
          </p>
        )}

        {/* Quantity selector for non-custom products */}
      {!isCustom && (
  <div className="space-y-2">
    <span className="font-medium text-sm">Quantity</span>

    <div className="flex items-center w-fit border border-gray-300 rounded-xl overflow-hidden">
      
      {/* Minus */}
      <button
        type="button"
        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        disabled={quantity <= 1}
        className={`px-4 py-3 text-lg transition ${
          quantity <= 1
            ? "text-gray-300 cursor-not-allowed"
            : "hover:bg-gray-100"
        }`}
      >
        −
      </button>

      {/* Value */}
      <div className="px-6 py-3 min-w-[50px] text-center font-semibold">
        {quantity}
      </div>

      {/* Plus */}
      <button
        type="button"
        onClick={() => setQuantity((q) => q + 1)}
        className="px-4 py-3 text-lg hover:bg-gray-100 transition"
      >
        +
      </button>

    </div>
  </div>
)}


        <div className="space-y-3">
          {isCustom ? (
            // CUSTOMIZABLE PRODUCT - Go to designer
            <button
              disabled={!isConfigSelected}
              onClick={() =>
                router.push(
                  `/products/customize/${product.slug}?variant=${encodeURIComponent(
                    JSON.stringify(selectedVariant?.attributes || {})
                  )}&type=${product.type}`
                )
              }
              className={`w-full py-4 rounded-xl text-lg ${
                isConfigSelected
                  ? "bg-black text-white"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Customize Now
            </button>
          ) : !added ? (
            // NORMAL PRODUCT - Add to cart directly
            <button
              disabled={isVariantProduct && !isConfigSelected}
              onClick={handleAddToCart}
              className={`w-full py-4 rounded-xl text-lg ${
                isVariantProduct && !isConfigSelected
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Add to Cart
            </button>
          ) : (
            <button
              onClick={() => router.push("/cart")}
              className="w-full py-4 rounded-xl bg-gray-100 border"
            >
              View Cart
            </button>
          )}

          {added && (
            <p className="text-green-600 text-sm text-center">
              ✓ Added to cart! Redirecting...
            </p>
          )}
        </div>
      </div>

      {/* SIMILAR PRODUCTS */}
{similarProducts.length > 0 && (
  <div className="col-span-1 lg:col-span-2 mt-16">
    <h2 className="text-2xl font-semibold mb-6">
      You May Also Like
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {similarProducts.map((item) => {
        const itemPrice =
          item.pricing?.specialPrice ?? item.pricing?.basePrice

        return (
          <div
            key={item._id}
            onClick={() => router.push(`/products/${item.slug}`)}
            className="cursor-pointer p-4  transition"
          >
            <img
              src={item.thumbnail}
              className=" h-32  mb-4"
            />

            <h3 className="text-xs font-medium line-clamp-2">
              {item.name}
            </h3>

            <p className="mt-2 font-semibold">
              {new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: item.pricing?.currency || "GBP",
              }).format(itemPrice)}
            </p>
          </div>
        )
      })}
    </div>
  </div>
)}

{similarLoading && (
  <p className="text-center mt-10">Loading similar products...</p>
)}



      {/* SIZE CHART MODAL */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">Size Chart</h2>

            <Image
              src={sizeChart}
              alt="Size Chart"
              className="w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}