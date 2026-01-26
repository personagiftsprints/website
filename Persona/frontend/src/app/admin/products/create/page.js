"use client";

import { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  Package,
  Settings,
  Eye,
  Check,
  AlertCircle,
  X,
  Upload,
  Percent,
  Package as PackageIcon,
} from "lucide-react";

import {
  getAvailablePrintConfigs,
  getPrintConfigBySlug,
} from "@/services/printArea.service";
import TabButton from "@/components/TabButton";
import GeneralRenderer from "@/components/GeneralRenderer";
import ViewRenderer from "@/components/ViewRenderer";
import ModelRenderer from "@/components/ModelRenderer";
import Toggle from "@/components/Toggle";
import { createProductAPI, uploadImagesAPI,getProductAttribute } from "@/services/product.service";
import {
  validateNumberInput,
} from "@/utils/productUtils";

export default function CreateProductPage() {
  // State management
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "",
    description: "",
    price: "",
    specialPrice: "",
    material: "",
    stockQuantity: "0",
    manageStock: false,
    isActive: true,
    images: [],
  });

  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [printConfigs, setPrintConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [activeTab, setActiveTab] = useState("product-info");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [productConfig, setProductConfig] = useState(null)

useEffect(() => {
  if (!formData.type) {
    setProductConfig(null)
    return
  }

  const fetchAttributes = async () => {
    const res = await getProductAttribute(formData.type)

    const variants = generateVariants(res.data)

    setProductConfig({
      attributes: res.data,
      variants
    })
  }

  fetchAttributes()
}, [formData.type])



  const fileInputRef = useRef(null);


  useEffect(() => {
  if (productConfig?.variants?.length) {
    setFormData(prev => ({
      ...prev,
      manageStock: false,
      stockQuantity: '0'
    }))
  }
}, [productConfig])

  // Effects
  useEffect(() => {
    if (!customizationEnabled) {
      setPrintConfigs([]);
      setSelectedConfig(null);
      setActiveTab("product-info");
      return;
    }

    getAvailablePrintConfigs()
      .then(setPrintConfigs)
      .catch(() => setPrintConfigs([]));
  }, [customizationEnabled]);

  useEffect(() => {
    if (customizationEnabled && !selectedConfig) {
      setActiveTab("select-config");
    } else if (customizationEnabled && selectedConfig) {
      setActiveTab("preview");
    }
  }, [customizationEnabled, selectedConfig]);

  const generateVariants = (attributes) => {
  const combine = (index, current, result) => {
    if (index === attributes.length) {
      result.push({
        attributes: current,
        stockQuantity: 0
      })
      return
    }

    attributes[index].values.forEach(value => {
      combine(index + 1, {
        ...current,
        [attributes[index].code]: value
      }, result)
    })
  }

  const result = []
  combine(0, {}, result)
  return result
}

  // Event handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePriceInput = (field, value) => {
    const validatedValue = validateNumberInput(value, "price");
    setFormData((prev) => ({ ...prev, [field]: validatedValue }));
  };

  const handleStockQuantityChange = (value) => {
    const validatedValue = validateNumberInput(value, "quantity");
    setFormData((prev) => ({ ...prev, stockQuantity: validatedValue }));
  };

  const handleConfigSelect = async (slug) => {
    if (!slug) {
      setSelectedConfig(null);
      return;
    }

    try {
      const config = await getPrintConfigBySlug(slug);
      setSelectedConfig(config);
    } catch {
      setSelectedConfig(null);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);

    // Validation
    if (formData.images.length + files.length > 5) {
      setError(
        `Maximum 5 images allowed. You already have ${formData.images.length} images.`,
      );
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type),
    );

    if (invalidFiles.length > 0) {
      setError(`Invalid file type. Only JPG, PNG, WebP and GIF are allowed.`);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError(`File size too large. Maximum 5MB per image.`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const previewUrl = URL.createObjectURL(file);

          return {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            url: previewUrl,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            isMain: formData.images.length === 0,
          };
        }),
      );

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (err) {
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
const findVariant = (variants, selected) =>
  variants.find(v =>
    Object.entries(selected).every(
      ([k, v2]) => v.attributes[k] === v2
    )
  )

  const removeImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
  };

  const setMainImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isMain: img.id === imageId,
      })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // 1️⃣ Upload images first
      const images = await uploadImagesAPI(formData.images.map((i) => i.file));

      // 2️⃣ Build JSON payload (NO FormData)
      const payload = {
        basicInfo: {
          name: formData.name,
          slug: formData.slug,
          type: formData.type,
          description: formData.description,
          material: formData.material,
          isActive: formData.isActive,
        },
        pricing: {
          basePrice: Number(formData.price) || 0,
          specialPrice: formData.specialPrice
            ? Number(formData.specialPrice)
            : null,
        },
        inventory: {
          manageStock: formData.manageStock,
          stockQuantity: Number(formData.stockQuantity) || 0,
        },
        productConfig: productConfig?.variants?.length
  ? productConfig
  : null,

        customization: {
          enabled: customizationEnabled,
          ...(customizationEnabled &&
            selectedConfig && {
              printConfig: {
                configId: selectedConfig._id,
                configName: selectedConfig.name,
                configType: selectedConfig.type, // tshirt, mobileCase, etc
              },
            }),
        },
        images: images.map((img, i) => ({
          url: img.url,
          publicId: img.publicId,
          name: img.name,
          isMain: i === 0,
          order: i + 1,
        })),
      };

      // 3️⃣ Create product (JSON ONLY)
      const response = await createProductAPI(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to create product");
      }

      setSuccess(true);

      // Cleanup blob URLs
      formData.images.forEach((img) => {
        if (img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });

      alert(`Product "${formData.name}" created successfully!`);
    } catch (err) {
      console.error("Create product error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create product. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      type: "",
      description: "",
      price: "",
      specialPrice: "",
      material: "",
      stockQuantity: "0",
      manageStock: false,
      isActive: true,
      images: [],
    });
    setCustomizationEnabled(false);
    setSelectedConfig(null);
    setActiveTab("product-info");
  };

  // Helper variables
  const isGeneralConfig = selectedConfig?.type === "general";
  const isViewsConfig = !!selectedConfig?.views;
  const isModelsConfig = !!selectedConfig?.models;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back to Products</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
        <p className="text-gray-600 mt-1">
          Configure your product details and customization settings
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-800">
              Product Created Successfully!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Your product "{formData.name}" has been saved. You can now view it
              in your product list.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex border-b">
              <TabButton
                active={activeTab === "product-info"}
                onClick={() => setActiveTab("product-info")}
                icon={<Package className="w-4 h-4" />}
                label="Product Information"
              />

              {customizationEnabled && (
                <TabButton
                  active={activeTab === "select-config"}
                  onClick={() => setActiveTab("select-config")}
                  icon={<Settings className="w-4 h-4" />}
                  label="Select Configuration"
                />
              )}

              {customizationEnabled && selectedConfig && (
                <TabButton
                  active={activeTab === "preview"}
                  onClick={() => setActiveTab("preview")}
                  icon={<Eye className="w-4 h-4" />}
                  label="Preview"
                />
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Product Info Tab */}
              {activeTab === "product-info" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter product name"
                          required
                        />
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slug *
                        </label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) =>
                            handleInputChange("slug", e.target.value)
                          }
                          className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="product-slug"
                          required
                        />
                      </div>

                      {/* Product Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            handleInputChange("type", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select product type</option>
                          <option value="tshirt">T-Shirt</option>
                          <option value="mug">Mug</option>
                          <option value="mobileCase">Mobile Case</option>
                          <option value="hoodie">Hoodie</option>
                          <option value="poster">Poster</option>
                          <option value="pillow">Pillow</option>
                        </select>
                      </div>

                     {productConfig?.variants?.length > 0 && (
  <div className="mt-6 rounded-xl border bg-white shadow-sm">
    <div className="border-b px-5 py-3">
      <h4 className="text-sm font-semibold text-gray-800">
        Variant Stock Management
      </h4>
    </div>

    <div className="divide-y">
      {productConfig.variants.map((variant, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_120px] items-center gap-4 px-5 py-3"
        >
          <div className="text-sm text-gray-700 font-medium">
            {Object.values(variant.attributes).join(" / ")}
          </div>

          <input
            type="number"
            min="0"
            className="h-9 w-full rounded-md border px-2 text-sm focus:border-black focus:outline-none"
            value={variant.stockQuantity}
            onChange={(e) => {
              const qty = Number(e.target.value)
              setProductConfig(prev => {
                const copy = structuredClone(prev)
                copy.variants[i].stockQuantity = qty
                return copy
              })
            }}
          />
        </div>
      ))}
    </div>
  </div>
)}



                      {/* Product Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe your product features, benefits, and details..."
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Provide a detailed description to help customers
                          understand your product
                        </p>
                      </div>

                      {/* Material */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Material
                        </label>
                        <input
                          type="text"
                          value={formData.material}
                          onChange={(e) =>
                            handleInputChange("material", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 100% Cotton, Ceramic, Polyester"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Specify what the product is made of
                        </p>
                      </div>

                      {/* Price and Special Price */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price ($)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">$</span>
                            </div>
                            <input
                              type="text"
                              value={formData.price}
                              onChange={(e) =>
                                handlePriceInput("price", e.target.value)
                              }
                              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Regular selling price
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Price ($)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Percent className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                              type="text"
                              value={formData.specialPrice}
                              onChange={(e) =>
                                handlePriceInput("specialPrice", e.target.value)
                              }
                              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Discounted or sale price
                          </p>
                        </div>
                      </div>

                    
                    </div>
                  </div>

                  {/* Product Images Section */}
                  <div className="pt-6 border-t">
                    <ImageUploadSection
                      formData={formData}
                      uploading={uploading}
                      fileInputRef={fileInputRef}
                      handleImageUpload={handleImageUpload}
                      removeImage={removeImage}
                      setMainImage={setMainImage}
                    />
                  </div>

                  {/* Customization Section */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Customization
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Enable custom print areas and configurations
                        </p>
                      </div>
                      <Toggle
                        enabled={customizationEnabled}
                        onToggle={() => setCustomizationEnabled((v) => !v)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Select Configuration Tab */}
              {activeTab === "select-config" && (
                <ConfigSelectionTab
                  printConfigs={printConfigs}
                  selectedConfig={selectedConfig}
                  handleConfigSelect={handleConfigSelect}
                />
              )}

              {/* Preview Tab */}
              {activeTab === "preview" && selectedConfig && (
                <PreviewTab
                  isGeneralConfig={isGeneralConfig}
                  isViewsConfig={isViewsConfig}
                  isModelsConfig={isModelsConfig}
                  selectedConfig={selectedConfig}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Action */}
        <div className="lg:col-span-1">
          <ProductSummary
            formData={formData}
            customizationEnabled={customizationEnabled}
            selectedConfig={selectedConfig}
            loading={loading}
            uploading={uploading}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

// Extracted Components for better organization

const ImageUploadSection = ({
  formData,
  uploading,
  fileInputRef,
  handleImageUpload,
  removeImage,
  setMainImage,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      Product Images (Max 5)
    </label>

    {/* Upload Area */}
    <div className="mb-6 space-y-3">
      <div
        className={`relative w-full max-w-sm rounded-2xl border-2 border-dashed transition-all
          ${
            uploading || formData.images.length >= 5
              ? "border-gray-200 bg-gray-100 cursor-not-allowed"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
          }
        `}
        onClick={() =>
          !uploading &&
          formData.images.length < 5 &&
          fileInputRef.current?.click()
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={uploading || formData.images.length >= 5}
        />

        <div className="flex flex-col items-center justify-center h-40 px-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>

          <p className="text-base font-semibold text-gray-800">
            {uploading ? "Uploading images…" : "Upload product images"}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Click to browse or drag & drop
          </p>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formData.images.length}/5 uploaded</span>
            <span>Max 5MB</span>
          </div>
        </div>
      </div>

      {formData.images.length >= 5 && (
        <p className="text-sm text-amber-600 text-center">
          You've reached the maximum of 5 images
        </p>
      )}

      <p className="text-xs text-gray-500 text-center">
        Supported formats: JPG, PNG, WebP, GIF
      </p>
    </div>

    {/* Image Previews */}
    {formData.images.length > 0 && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Images ({formData.images.length})
          </h4>
          <div className="text-xs text-gray-500">
            Click star to set as main display image
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {formData.images.map((image) => (
            <ImagePreview
              key={image.id}
              image={image}
              setMainImage={setMainImage}
              removeImage={removeImage}
            />
          ))}
        </div>

        {/* Image Order Note */}
        {formData.images.length > 1 && (
          <p className="text-xs text-gray-500 text-center">
            The first image will be used as the main product thumbnail
          </p>
        )}
      </div>
    )}
  </div>
);

const ImagePreview = ({ image, setMainImage, removeImage }) => (
  <div
    className={`relative group rounded-lg overflow-hidden border-2 ${image.isMain ? "border-blue-500" : "border-gray-200"}`}
  >
    {/* Image */}
    <div className="aspect-square bg-gray-100">
      <img
        src={image.url}
        alt={image.name}
        className="w-full h-full object-cover"
      />
    </div>

    {/* Main Image Badge */}
    {image.isMain && (
      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
        Main
      </div>
    )}

    {/* Actions Overlay */}
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMainImage(image.id)}
          className={`p-2 rounded-full ${image.isMain ? "bg-yellow-500" : "bg-gray-800"} text-white hover:bg-opacity-90 transition-colors`}
          title="Set as main image"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => removeImage(image.id)}
          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Image Info */}
    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
      <p className="text-xs text-white truncate" title={image.name}>
        {image.name}
      </p>
      <p className="text-xs text-gray-300">
        {(image.size / 1024 / 1024).toFixed(2)} MB
      </p>
    </div>
  </div>
);

const ConfigSelectionTab = ({
  printConfigs,
  selectedConfig,
  handleConfigSelect,
}) => (
  <div>
    <h3 className="font-semibold text-gray-900 mb-4">
      Select Print Configuration
    </h3>
    <p className="text-gray-600 mb-6">
      Choose a configuration to define print areas for your product
    </p>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Available Configurations
      </label>
      <select
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onChange={(e) => handleConfigSelect(e.target.value)}
        value={selectedConfig?.type || ""}
      >
        <option value="">Choose a configuration...</option>
        {printConfigs.map((cfg) => (
          <option key={cfg.type} value={cfg.type}>
            {cfg.name}
          </option>
        ))}
      </select>
    </div>

    {!printConfigs.length && (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
        <div className="w-8 h-8 text-gray-400 mx-auto mb-2 flex items-center justify-center">
          🌐
        </div>
        <p className="text-gray-600">No configurations available</p>
      </div>
    )}
  </div>
);

const PreviewTab = ({
  isGeneralConfig,
  isViewsConfig,
  isModelsConfig,
  selectedConfig,
}) => (
  <div>
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-2">
        Configuration Preview
      </h3>
      <p className="text-gray-600">Review the selected print configuration</p>
    </div>

    <div className="space-y-6">
      {isGeneralConfig && <GeneralRenderer area={selectedConfig.area} />}

      {isViewsConfig && <ViewRenderer views={selectedConfig.views} />}

      {isModelsConfig && <ModelRenderer models={selectedConfig.models} />}
    </div>
  </div>
);

const ProductSummary = ({
  formData,
  customizationEnabled,
  selectedConfig,
  loading,
  uploading,
  handleSubmit,
}) => (
  <div className="sticky top-6 space-y-4">
    <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
      <div className="relative aspect-square bg-gray-100">
        {formData.images.length > 0 ? (
          <img
            src={formData.images[0].url}
            alt={formData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No image uploaded
          </div>
        )}

        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
          {formData.type || "Product"}
        </div>

        {customizationEnabled && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
            Customizable
          </div>
        )}

        {formData.manageStock && (
          <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-md">
            Stock: {formData.stockQuantity}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {formData.name || "Unnamed product"}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            /{formData.slug || "no-slug"}
          </p>
        </div>

        {/* Price Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Price:</span>
            <div className="flex items-center gap-2">
              {formData.specialPrice ? (
                <>
                  <span className="text-lg font-bold text-red-600">
                    ${parseFloat(formData.specialPrice).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${parseFloat(formData.price || 0).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  $
                  {formData.price
                    ? parseFloat(formData.price).toFixed(2)
                    : "0.00"}
                </span>
              )}
            </div>
          </div>

          {/* Material Display */}
          {formData.material && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Material:</span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-37.5">
                {formData.material}
              </span>
            </div>
          )}

          {/* Stock Display */}
          {formData.manageStock && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Stock:</span>
              <span className="text-sm font-medium text-gray-900">
                {parseInt(formData.stockQuantity) || 0} units
              </span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {formData.description && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">Description:</p>
            <p className="text-sm text-gray-700 line-clamp-3">
              {formData.description}
            </p>
          </div>
        )}

        {selectedConfig && (
          <div className="text-sm text-gray-700">
            <span className="text-gray-500">Configuration:</span>{" "}
            <span className="font-medium">{selectedConfig.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Images</span>
          <span className="font-medium text-gray-900">
            {formData.images.length}/5
          </span>
        </div>

        {formData.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {formData.images.map((img) => (
              <div
                key={img.id}
                className="w-14 h-14 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0"
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t">
          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {loading ? "Creating…" : "Create Product"}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            {formData.images.length > 0
              ? "Ready for publishing"
              : "Add images to improve listing"}
          </p>
        </div>
      </div>
    </div>
  </div>
);
