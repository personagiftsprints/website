"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  getProductBySlug, 
  getSimilarProducts,
  getProductCustomization,
  uploadImagesAPI 
} from "@/services/product.service";
import KidssizeChart from "@/assets/images/sizeChart.jpg";
import sizeChart from "@/assets/sizeChart.jpg";
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
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  
  // NEW: State for customization
  const [customization, setCustomization] = useState(null);
  const [customFormData, setCustomFormData] = useState({});
  const [customFiles, setCustomFiles] = useState({});
  const [customPreviews, setCustomPreviews] = useState({});
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

useEffect(() => {
  if (!slug) return;

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Fetch product details
      const productRes = await getProductBySlug(slug);
      const productData = productRes.data;
      setProduct(productData);

      // 🔍 CONSOLE LOG THE FULL PRODUCT DATA
      // console.log('📦 PRODUCT DATA:', {
      //   id: productData._id,
      //   name: productData.name,
      //   type: productData.type,
      //   customizationType: productData.customizationType,
      //   customFields: productData.customFields,
      //   customization: productData.customization,
      //   hasPrintConfig: productData.customization?.enabled,
      //   isPrintConfigType: ['tshirt', 'mug', 'mobileCase', 'hoodie'].includes(productData.type)
      // });

      // Fetch customization info using service
      const customizationRes = await getProductCustomization(slug);
      if (customizationRes.success) {
        setCustomization(customizationRes.data);
        
        // 🔍 CONSOLE LOG THE CUSTOMIZATION DATA
        // console.log('🎨 CUSTOMIZATION DATA:', customizationRes.data);
        
        // Initialize form data for custom fields
        if (customizationRes.data.type === 'custom_fields') {
          const initialData = {};
          customizationRes.data.fields.forEach(field => {
            initialData[field.name] = '';
          });
          setCustomFormData(initialData);
        }
      }

      const main = productData.images?.find((i) => i.isMain)?.url || productData.thumbnail;
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

  // NEW: Handle image upload for custom fields
  const handleCustomImageUpload = (field, file) => {
    if (!file) return;
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setCustomPreviews({ ...customPreviews, [field.name]: previewUrl });
    setCustomFiles({ ...customFiles, [field.name]: file });
    setCustomFormData({ ...customFormData, [field.name]: 'uploading' });
  };

  // NEW: Handle text input for custom fields
  const handleCustomTextChange = (field, value) => {
    setCustomFormData({ ...customFormData, [field.name]: value });
  };

  // NEW: Handle next field in step form
  const handleNextField = () => {
    const fields = customization.fields;
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  };

  // NEW: Handle previous field
  const handlePrevField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  // NEW: Handle submit for custom fields product
  const handleCustomFieldsSubmit = async () => {
    const fields = customization.fields;
    // Validate: At least one field must be filled
    const isAtLeastOneFilled = fields.some(f => 
      f.type === 'image' ? !!customFiles[f.name] : !!customFormData[f.name]?.trim()
    );
    
    if (!isAtLeastOneFilled) {
      alert(`Please fill at least one field to customize your product.`);
      return;
    }

    setUploadingCustom(true);

    try {
      // Get all image files that need to be uploaded
      const imageFiles = Object.values(customFiles);
      
      // Upload images using your existing API
      let uploadedImages = [];
      if (imageFiles.length > 0) {
        uploadedImages = await uploadImagesAPI(imageFiles);
      }
      
      // Create map of field names to uploaded URLs
      const uploadedUrls = {};
      let imgIndex = 0;
      Object.keys(customFiles).forEach((fieldName) => {
        uploadedUrls[fieldName] = uploadedImages[imgIndex]?.url;
        imgIndex++;
      });

      // Prepare cart item
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      const cartItem = {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        productType: product.type,
        name: product.name,
        image: product.thumbnail || product.images?.[0]?.url,
        price: product.pricing?.specialPrice || product.pricing?.basePrice,
        currency: product.pricing?.currency || "GBP",
        quantity: 1,
        variant: {},
        designData: {
          type: 'custom_fields',
          fields: customization.fields,
          data: customFormData,
          uploaded_images: uploadedUrls,
          fieldCount: customization.fieldCount
        },
        addedAt: new Date().toISOString()
      };

      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${product._id}`;
      cartItem.id = uniqueId;

      existingCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));

      setAdded(true);
      setTimeout(() => {
        router.push("/cart");
      }, 1000);

    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    } finally {
      setUploadingCustom(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!product) return <div className="p-10 text-center">Not found</div>;

  const { pricing, customization: productCustomization, inventory, productConfig } = product;
  const price = (pricing.specialPrice && pricing.specialPrice > 0) ? pricing.specialPrice : pricing.basePrice;
  const hasDiscount = pricing.specialPrice && pricing.specialPrice > 0 && pricing.specialPrice < pricing.basePrice;

const isVariantProduct = productConfig?.attributes?.length > 0;

const isCustomFields = customization?.type === 'custom_fields';

const isPrintConfig =
  !isCustomFields &&
  (
    productCustomization?.enabled ||
    ['tshirt', 'mug', 'mobileCase', 'hoodie'].includes(product.type)
  );

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

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');

      const cartItem = {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        productType: product.type,
        name: product.name,
        image: product.thumbnail || product.images?.[0]?.url,
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

      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${product._id}_${selectedAttributes.size}_${selectedAttributes.color?.toLowerCase()}`;
      cartItem.id = uniqueId;

      const existingIndex = existingCart.findIndex(item => 
        item.productId === cartItem.productId &&
        item.variant?.size === cartItem.variant.size &&
        item.variant?.color === cartItem.variant.color
      );

      if (existingIndex > -1) {
        existingCart[existingIndex].quantity += quantity;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));
    } 
    // For simple products (no variants, no customization)
    else {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');

      const cartItem = {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        productType: product.type,
        name: product.name,
        image: product.thumbnail || product.images?.[0]?.url,
        price: price,
        currency: pricing.currency || "GBP",
        quantity: quantity,
        variant: {},
        addedAt: new Date().toISOString()
      };

      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${product._id}`;
      cartItem.id = uniqueId;

      const existingIndex = existingCart.findIndex(item => 
        item.productId === cartItem.productId
      );

      if (existingIndex > -1) {
        existingCart[existingIndex].quantity += quantity;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));
    }

    setAdded(true);
    
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

  // Render custom fields step form
// Render custom fields step form - FIXED VERSION
const renderCustomFields = () => {
  if (!customization?.fields || customization.fields.length === 0) return null;
  
  const fields = customization.fields;
  const currentField = fields[currentFieldIndex];
  const progress = ((currentFieldIndex + 1) / fields.length) * 100;
  
  // Check if current field is completed
  const isCurrentFieldCompleted = () => {
    const field = currentField;
    if (field.type === 'image') {
      return !!customFiles[field.name];
    } else {
      return !!customFormData[field.name]?.trim();
    }
  };

  const isAtLeastOneFilled = fields.some(f => 
    f.type === 'image' ? !!customFiles[f.name] : !!customFormData[f.name]?.trim()
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentFieldIndex + 1} of {fields.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#F9A51B] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Field */}
      <div className="border border-gray-300 rounded-xl p-6 bg-gray-50">
        <label className="block mb-4">
          <span className="text-lg font-medium">{currentField.label}</span>
          {currentField.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {currentField.type === 'image' ? (
          <div>
            {!customPreviews[currentField.name] ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-black transition-colors cursor-pointer"
                onClick={() => document.getElementById(`file-${currentField.name}`).click()}
              >
                <input
                  id={`file-${currentField.name}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCustomImageUpload(currentField, e.target.files[0])}
                />
                <div className="text-4xl mb-2">🖼️</div>
                <p className="font-medium">Click to upload</p>
                <p className="text-sm text-gray-500 mt-1">
                  Max size: {currentField.imageConstraints?.maxSize || 5}MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={customPreviews[currentField.name]}
                  alt="Preview"
                  className="max-h-64 mx-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomPreviews({ ...customPreviews, [currentField.name]: '' });
                    setCustomFiles({ ...customFiles, [currentField.name]: '' });
                    setCustomFormData({ ...customFormData, [currentField.name]: '' });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={customFormData[currentField.name] || ''}
            onChange={(e) => handleCustomTextChange(currentField, e.target.value)}
            placeholder={ `Enter the text here `}
            maxLength={currentField.textConstraints?.maxLength}
            className="w-full p-3 border rounded-lg text-lg"
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentFieldIndex > 0 && (
          <button
            type="button"
            onClick={handlePrevField}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
        )}
        
        {currentFieldIndex < fields.length - 1 ? (
          <div className="flex-1 flex gap-3">
            {!isCurrentFieldCompleted() ? (
              <button
                type="button"
                onClick={handleNextField}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                Skip this step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextField}
                className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCustomFieldsSubmit}
            disabled={uploadingCustom || (!isAtLeastOneFilled && !isCurrentFieldCompleted())}
            className={`flex-1 py-3 rounded-lg transition-colors ${
              uploadingCustom || (!isAtLeastOneFilled && !isCurrentFieldCompleted())
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {uploadingCustom ? 'Adding to Cart...' : 'Add to Cart'}
          </button>
        )}
      </div>

      {/* Show field indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {fields.map((field, idx) => {
          const isCompleted = field.type === 'image' 
            ? !!customFiles[field.name]
            : !!customFormData[field.name]?.trim();
          
          return (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentFieldIndex
                  ? 'bg-black w-4'
                  : isCompleted
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              } transition-all`}
            />
          );
        })}
      </div>
    </div>
  );
};

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* LEFT IMAGES */}
      <div>
        <img
          src={activeImage || product.thumbnail || product.images?.[0]?.url}
          className="w-full h-[460px] object-contain bg-gray-50 rounded-xl"
          alt={product.name}
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

          {hasDiscount && (
            <span className="line-through text-gray-400">
              {formattedBasePrice}
            </span>
          )}
        </div>

        {/* Show field summary for custom fields products */}
        {isCustomFields && customization?.fieldCount && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium mb-2">This product includes:</p>
            <ul className="space-y-1 text-sm">
              {customization.fieldCount.images > 0 && (
                <li>🖼️ {customization.fieldCount.images} image upload{customization.fieldCount.images > 1 ? 's' : ''}</li>
              )}
              {customization.fieldCount.texts > 0 && (
                <li>📝 {customization.fieldCount.texts} text input{customization.fieldCount.texts > 1 ? 's' : ''}</li>
              )}
            </ul>
          </div>
        )}

        {/* VARIANTS - Only show for products with variants */}
        {productConfig?.attributes?.length > 0 && !isCustomFields && (
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
        {!isPrintConfig && !isCustomFields && !isVariantProduct && inventory.manageStock && (
          <p className="text-sm text-gray-600">
            {inventory.stockQuantity > 0
              ? `${inventory.stockQuantity} in stock`
              : "Out of stock"}
          </p>
        )}

        {/* Quantity selector for non-custom, non-fields products */}
        {!isPrintConfig && !isCustomFields && (
          <div className="space-y-2">
            <span className="font-medium text-sm">Quantity</span>

            <div className="flex items-center w-fit border border-gray-300 rounded-xl overflow-hidden">
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

              <div className="px-6 py-3 min-w-[50px] text-center font-semibold">
                {quantity}
              </div>

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
          {/* PRINT CONFIG PRODUCTS - Go to designer */}
          {isPrintConfig && (
            <button
              disabled={!isConfigSelected}
              onClick={() =>
                router.push(
                  `/products/customize/${product.slug}?variant=${encodeURIComponent(
                    JSON.stringify(selectedVariant?.attributes || {})
                  )}&type=${product.type}`
                )
              }
              className={`w-full py-4 rounded-xl cursor-pointer text-lg ${
                isConfigSelected
                  ? "bg-black text-white"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Customize Now
            </button>
          )}

          {/* CUSTOM FIELDS PRODUCTS - Show step form */}
          {isCustomFields && renderCustomFields()}

          {/* NORMAL PRODUCTS - Add to cart directly */}
          {!isPrintConfig && !isCustomFields && !added && (
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
          )}

          {added && (
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
          <h2 className="text-2xl font-semibold mb-6 text-[#F9A956]">
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
                  className="cursor-pointer p-4 transition"
                >
                  <img
                    src={item.thumbnail}
                    className="h-32 mb-4"
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
              src={product?.isKids ? KidssizeChart : sizeChart}
              alt="Size Chart"
              className="w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}