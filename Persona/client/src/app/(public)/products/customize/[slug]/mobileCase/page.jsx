"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { getProductBySlug, uploadImagesAPI } from "@/services/product.service";
import { getPrintConfigBySlug } from "@/services/printArea.service";

export default function MobileCaseDesigner() {
  const { slug } = useParams();
  const searchParams = useSearchParams();

  // State management
  const [selectedArea, setSelectedArea] = useState(null);
  const [uploadedImages, setUploadedImages] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [isStudioLoading, setIsStudioLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPreviews, setSuccessPreviews] = useState({ back: null });
  const [confirmedPreviewUrls, setConfirmedPreviewUrls] = useState({
    back: null
  });
  const [isConfirming, setIsConfirming] = useState(false);

  // Image position controls
  const [imagePositions, setImagePositions] = useState({});

  // Cloudinary state
  const [showCloudinaryUrls, setShowCloudinaryUrls] = useState(false);
  const [cloudinaryUrls, setCloudinaryUrls] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // Product data
  const [product, setProduct] = useState(null);
  const [printConfig, setPrintConfig] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);

  // Refs
  const caseContainerRef = useRef(null);
  const caseCanvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentAreaRef = useRef(null);

  // Cart state
  const [cartItemCount, setCartItemCount] = useState(0);
  const [savedDesignsCount, setSavedDesignsCount] = useState(0);

  // View state (mobile cases only have back view)
  const [view, setView] = useState("back");
  const [isLoading, setIsLoading] = useState(true);

  // Load product data
  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setIsStudioLoading(true);
        const [productRes, configRes] = await Promise.all([
          getProductBySlug(slug),
          getPrintConfigBySlug("mobileCase")
        ]);

        setProduct(productRes?.data || null);
        setPrintConfig(configRes || null);
        
        // Set available models from config
        if (configRes?.models) {
          setAvailableModels(configRes.models);
          // Set first model as default
          setSelectedModel(configRes.models[0]);
        }

        console.log("Print Config:", configRes);
      } finally {
        setIsStudioLoading(false);
      }
    };

    load();
  }, [slug]);

  // Load cart counts
  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItemCount(cartItems.reduce((total, item) => total + (item.quantity || 1), 0));

    const designs = JSON.parse(localStorage.getItem("caseDesigns") || "[]");
    setSavedDesignsCount(designs.length);
  }, []);

  useEffect(() => {
    setIsLoading(true);
  }, [selectedModel, view]);

  useEffect(() => {
    setSelectedArea(null);
  }, [view, selectedModel]);

  // Filter current view areas
  const currentViewAreas = useMemo(() => {
    if (!selectedModel) return [];
    return selectedModel?.view?.areas || [];
  }, [selectedModel]);

  // Cart manager
  const addToCart = (item) => {
    try {
      console.log("🛒 Adding to cart:", item);

      // Get existing cart from localStorage
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");

      // Generate a unique ID
      const uniqueId = `cart_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}_${item.productId}_${selectedModel?.modelCode}`;

      // Check if item already exists
      const existingIndex = cartItems.findIndex(
        (cartItem) =>
          cartItem.productId === item.productId &&
          cartItem.modelCode === selectedModel?.modelCode &&
          JSON.stringify(cartItem.designData?.cloudinary_urls) ===
            JSON.stringify(item.designData?.cloudinary_urls)
      );

      if (existingIndex > -1) {
        // Update quantity if exists
        cartItems[existingIndex].quantity += item.quantity;
      } else {
        // Add new item with unique ID
        cartItems.push({
          ...item,
          id: uniqueId,
          modelCode: selectedModel?.modelCode,
          modelName: selectedModel?.modelName,
          addedAt: new Date().toISOString()
        });
      }

      // Save back to localStorage
      localStorage.setItem("cart", JSON.stringify(cartItems));
      window.dispatchEvent(new Event("cart-updated"));

      // Save to separate designs storage
      const designs = JSON.parse(localStorage.getItem("caseDesigns") || "[]");
      designs.push({
        ...item,
        id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelCode: selectedModel?.modelCode,
        modelName: selectedModel?.modelName,
        saved_at: new Date().toISOString()
      });
      localStorage.setItem("caseDesigns", JSON.stringify(designs));

      console.log("✅ Cart saved:", cartItems);

      return {
        success: true,
        message: "Added to cart successfully",
        cartCount: cartItems.length
      };
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Structured product data for cart
  const getStructuredProductDataForCart = (cloudinaryUrlsData) => {
    if (!product || !selectedModel) return null;

    const printAreas = {};

    // Back areas
    const backAreas = selectedModel?.view?.areas || [];
    backAreas.forEach((area) => {
      if (uploadedImages[area.id] && cloudinaryUrlsData[area.id]) {
        printAreas.back = {
          enabled: true,
          area: area.name.toLowerCase().replace(/\s+/g, "_"),
          model: selectedModel.modelCode,
          image: {
            url: cloudinaryUrlsData[area.id],
            width: 1200,
            height: 800,
            source: "cloudinary",
            position: imagePositions[area.id] || {
              x: 0,
              y: 0,
              scale: 0.5,
              rotate: 0
            }
          },
          view: "back"
        };
      }
    });

    return {
      productSnapshot: {
        id: product._id,
        slug: product.slug || slug,
        name: product.name || "Custom Mobile Case",
        type: product.type || "mobileCase",
        description: product.description || "",
        basePrice: product.pricing?.price || 0,
        specialPrice: product.pricing?.specialPrice || 0,
        currency: product.pricing?.currency || "GBP",
        image: product.images?.[0]?.url || product.image || null,
        material: product.material || "Silicon"
      },
      model: {
        code: selectedModel.modelCode,
        name: selectedModel.modelName,
        year: selectedModel.year,
        displaySize: selectedModel.displaySize
      },
      quantity: 1,
      print_areas: printAreas,
      cloudinary_urls: cloudinaryUrlsData,
      metadata: {
        product_type: "mobileCase",
        model: selectedModel,
        image_positions: imagePositions,
        uploaded_areas: Object.keys(uploadedImages).map((key) => ({
          id: key,
          position: imagePositions[key] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
        })),
        design_timestamp: new Date().toISOString()
      },
      currency: product.pricing?.currency || "GBP"
    };
  };

  // Add to cart function
  const addDesignToCart = async (cloudinaryUrlsData) => {
    if (!product || !cloudinaryUrlsData || !selectedModel) {
      alert("Product data not loaded.");
      return;
    }

    if (Object.keys(cloudinaryUrlsData).length === 0) {
      alert("Please upload a design first.");
      return;
    }

    if (!confirmedPreviewUrls.back) {
      alert("Please confirm your design first.");
      return;
    }

    try {
      setIsAddingToCart(true);

      const previewUrls = {
        back: confirmedPreviewUrls.back
      };

      const mainPreviewUrl = previewUrls.back || null;
      if (mainPreviewUrl) setPreviewImageUrl(mainPreviewUrl);

      const cartData = getStructuredProductDataForCart(cloudinaryUrlsData);
      if (!cartData) throw new Error("No cart data");

      const cartItem = {
        productId: cartData.productSnapshot.id,
        productSlug: cartData.productSnapshot.slug,
        productName: cartData.productSnapshot.name,
        productType: "mobileCase",
        name: cartData.productSnapshot.name,
        image: cartData.productSnapshot.image,
        price: cartData.productSnapshot.specialPrice || cartData.productSnapshot.basePrice,
        currency: cartData.currency,
        quantity: cartData.quantity,
        modelCode: selectedModel.modelCode,
        modelName: selectedModel.modelName,
        designData: {
          cloudinary_urls: cartData.cloudinary_urls,
          preview_url: mainPreviewUrl,
          preview_urls: previewUrls,
          print_areas: cartData.print_areas,
          positions: cartData.metadata?.image_positions || {},
          model: cartData.model
        },
        metadata: cartData.metadata,
        productSnapshot: cartData.productSnapshot
      };

      console.log("Final cartItem:", JSON.stringify(cartItem, null, 2));

      const result = addToCart(cartItem);

      if (result.success) {
        setSuccessPreviews({ back: previewUrls.back });
        setShowSuccessModal(true);

        const designs = JSON.parse(localStorage.getItem("caseDesigns") || "[]");
        setSavedDesignsCount(designs.length);

        const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItemCount(cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0));

        setShowPreviewModal(false);
        setShowCloudinaryUrls(false);
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
      alert("Failed to add: " + (err.message || "Unknown error"));
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Draw design on canvas
  const drawDesignOnCanvas = async () => {
    if (!caseCanvasRef.current || !selectedModel) return;

    const canvas = caseCanvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 800;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Get case image from selected model
      const caseImageUrl = selectedModel?.view?.baseImage;
      if (!caseImageUrl) throw new Error("Case image not found");

      const caseImg = new Image();
      caseImg.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        caseImg.onload = resolve;
        caseImg.onerror = reject;
        caseImg.src = caseImageUrl;
      });

      ctx.drawImage(caseImg, 0, 0, canvas.width, canvas.height);

      const areas = selectedModel?.view?.areas || [];

      for (const area of areas) {
        const previewUrl = imagePreviews[area.id];
        if (!previewUrl) continue;

        const position = imagePositions[area.id] || {
          x: 0,
          y: 0,
          scale: 0.5,
          rotate: 0
        };

        // Calculate position and size
        const areaX = (area.position?.x || 25) / 100 * canvas.width;
        const areaY = (area.position?.y || 30) / 100 * canvas.height;
        const areaWidth = (area.width || 50) / 100 * canvas.width;
        const areaHeight = (area.height || 40) / 100 * canvas.height;

        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = previewUrl;
        });

        ctx.save();
        ctx.translate(areaX + areaWidth / 2, areaY + areaHeight / 2);
        ctx.rotate((position.rotate * Math.PI) / 180);

        const scale = position.scale || 0.5;
        ctx.drawImage(
          img,
          position.x - (areaWidth * scale) / 2,
          position.y - (areaHeight * scale) / 2,
          areaWidth * scale,
          areaHeight * scale
        );

        ctx.restore();
      }

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error drawing on canvas:", error);
      throw new Error("Failed to generate design preview");
    }
  };

  // Generate preview image
  const generatePreviewImage = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      throw new Error("Please add a design.");
    }

    try {
      return await drawDesignOnCanvas();
    } catch (error) {
      console.error("Canvas generation failed, trying html-to-image...", error);

      if (!caseContainerRef.current) {
        throw new Error("Cannot capture preview. Please try again.");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const dataUrl = await toPng(caseContainerRef.current, {
          backgroundColor: null,
          pixelRatio: 1,
          cacheBust: true,
          skipFonts: true,
          style: { transform: "translateZ(0)", willChange: "transform" }
        });
        return dataUrl;
      } catch (fallbackError) {
        console.error("html-to-image also failed:", fallbackError);
        throw new Error("Failed to generate preview.");
      }
    }
  };

  // Confirm design
  const handleConfirmDesign = async () => {
    if (!caseContainerRef.current || !selectedArea) return;

    setIsConfirming(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const dataUrl = await generatePreviewImage();
      const cloudUrl = await uploadPreviewImageToCloudinary(dataUrl);

      if (!cloudUrl) throw new Error("Preview upload failed");

      setConfirmedPreviewUrls((prev) => ({
        ...prev,
        back: cloudUrl
      }));

      console.log("Preview confirmed:", cloudUrl);
    } catch (err) {
      console.error("Confirm failed:", err);
      alert("Failed to confirm design: " + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  // Upload to Cloudinary
  const uploadPreviewImageToCloudinary = async (dataUrl) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `preview-${Date.now()}.png`, {
        type: "image/png"
      });

      const uploadResults = await uploadImagesAPI([file]);

      if (
        !uploadResults ||
        !Array.isArray(uploadResults) ||
        uploadResults.length === 0
      ) {
        throw new Error("Invalid upload response");
      }

      const url = uploadResults[0].url;
      if (!url) throw new Error("No URL returned");

      return url;
    } catch (error) {
      console.error("Preview Cloudinary upload failed:", error);
      return null;
    }
  };

  // Upload all images
  const uploadAllImagesToCloudinary = async () => {
    const uploadedUrls = {};

    try {
      const imageFiles = Object.values(uploadedImages);

      if (imageFiles.length === 0) {
        return uploadedUrls;
      }

      const uploadResults = await uploadImagesAPI(imageFiles);

      if (!uploadResults || !Array.isArray(uploadResults)) {
        throw new Error("Invalid response from upload API");
      }

      const areaIds = Object.keys(uploadedImages);

      uploadResults.forEach((imageData, index) => {
        const areaId = areaIds[index];
        if (areaId && imageData.url) {
          uploadedUrls[areaId] = imageData.url;
        }
      });

      return uploadedUrls;
    } catch (error) {
      console.error("❌ Cloudinary upload error:", error);
      alert(`Upload failed: ${error.message}. Using local previews instead.`);

      Object.entries(imagePreviews).forEach(([areaId, previewUrl]) => {
        uploadedUrls[areaId] = previewUrl;
      });

      return uploadedUrls;
    }
  };

  // Handle preview and add to cart
  const handlePreviewAndAddToCart = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      alert("Please add a design.");
      return;
    }

    try {
      setIsUploading(true);

      const userDesignUrls = await uploadAllImagesToCloudinary();
      setCloudinaryUrls(userDesignUrls);

      const localPreviewDataUrl = await generatePreviewImage();
      const previewCloudinaryUrl = await uploadPreviewImageToCloudinary(
        localPreviewDataUrl
      );
      const finalPreviewUrl = previewCloudinaryUrl || localPreviewDataUrl;

      setPreviewImageUrl(finalPreviewUrl);
      setShowPreviewModal(true);

      await addDesignToCart(userDesignUrls);
    } catch (err) {
      console.error("Preview/cart preparation failed:", err);
      alert("Failed to prepare design: " + (err.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  // Drag handlers
  const handleDragStart = useCallback(
    (e, areaId) => {
      if (!uploadedImages[areaId]) return;

      isDraggingRef.current = true;
      currentAreaRef.current = areaId;
      dragStartRef.current = {
        x: e.clientX - (imagePositions[areaId]?.x || 0),
        y: e.clientY - (imagePositions[areaId]?.y || 0)
      };

      e.preventDefault();
      setSelectedArea(currentViewAreas.find((a) => a.id === areaId) || null);
    },
    [uploadedImages, imagePositions, currentViewAreas]
  );

  const handleDrag = useCallback(
    (e) => {
      if (!isDraggingRef.current || !currentAreaRef.current) return;

      const areaId = currentAreaRef.current;
      const currentPos = imagePositions[areaId] || {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0
      };

      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      const constrainedX = Math.max(-100, Math.min(100, newX));
      const constrainedY = Math.max(-100, Math.min(100, newY));

      setImagePositions((prev) => ({
        ...prev,
        [areaId]: {
          ...currentPos,
          x: constrainedX,
          y: constrainedY
        }
      }));
    },
    [imagePositions]
  );

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    currentAreaRef.current = null;
  }, []);

  // Wheel for zoom
  const handleWheel = useCallback(
    (e, areaId) => {
      if (!uploadedImages[areaId]) return;

      e.preventDefault();
      const currentPos = imagePositions[areaId] || {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0
      };
      const scaleDelta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.1, Math.min(5, currentPos.scale + scaleDelta));

      setImagePositions((prev) => ({
        ...prev,
        [areaId]: { ...currentPos, scale: newScale }
      }));
    },
    [uploadedImages, imagePositions]
  );

  // Zoom controls
  const zoomIn = useCallback(
    (areaId) => {
      if (!uploadedImages[areaId]) return;
      const currentPos = imagePositions[areaId] || {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0
      };
      setImagePositions((prev) => ({
        ...prev,
        [areaId]: { ...currentPos, scale: Math.min(5, currentPos.scale + 0.1) }
      }));
    },
    [uploadedImages, imagePositions]
  );

  const zoomOut = useCallback(
    (areaId) => {
      if (!uploadedImages[areaId]) return;
      const currentPos = imagePositions[areaId] || {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0
      };
      setImagePositions((prev) => ({
        ...prev,
        [areaId]: { ...currentPos, scale: Math.max(0.1, currentPos.scale - 0.1) }
      }));
    },
    [uploadedImages, imagePositions]
  );

  const handleRotate = useCallback(
    (areaId) => {
      if (!uploadedImages[areaId]) return;
      const currentPos = imagePositions[areaId] || {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0
      };
      setImagePositions((prev) => ({
        ...prev,
        [areaId]: { ...currentPos, rotate: (currentPos.rotate + 45) % 360 }
      }));
    },
    [uploadedImages, imagePositions]
  );

  const resetPosition = (areaId) => {
    setImagePositions((prev) => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }));
  };

  // Global mouse listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleDrag(e);
    const handleGlobalMouseUp = () => handleDragEnd();

    if (isDraggingRef.current) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleDrag, handleDragEnd]);

  // Handle image upload
  const handleImageUpload = (e, areaId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    if (!file.type.match("image/(jpeg|png|jpg|webp)")) {
      alert("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    if (imagePreviews[areaId]) {
      URL.revokeObjectURL(imagePreviews[areaId]);
    }

    const previewUrl = URL.createObjectURL(file);

    setImagePreviews((prev) => ({ ...prev, [areaId]: previewUrl }));
    setUploadedImages((prev) => ({ ...prev, [areaId]: file }));
    setImagePositions((prev) => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }));

    const area = currentViewAreas.find((a) => a.id === areaId);
    setSelectedArea(area || null);
  };

  // Remove image
  const removeImage = (areaId) => {
    const previewUrl = imagePreviews[areaId];
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setUploadedImages((prev) => {
      const newState = { ...prev };
      delete newState[areaId];
      return newState;
    });

    setImagePreviews((prev) => {
      const newState = { ...prev };
      delete newState[areaId];
      return newState;
    });

    setImagePositions((prev) => {
      const newState = { ...prev };
      delete newState[areaId];
      return newState;
    });

    if (selectedArea?.id === areaId) setSelectedArea(null);
  };

  // Render case with overlay
  const renderCaseWithOverlay = () => {
    const caseImageUrl = selectedModel?.view?.baseImage;

    return (
      <>
        <canvas
          ref={caseCanvasRef}
          style={{ display: "none" }}
          width={800}
          height={800}
        />

        <div
          ref={caseContainerRef}
          className="relative w-full max-w-md mx-auto aspect-square case-container"
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 rounded-lg">
              <div className="h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {caseImageUrl && (
            <img
              key={`${selectedModel?.modelCode}`}
              src={caseImageUrl}
              alt="Case preview"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              crossOrigin="anonymous"
            />
          )}

          {currentViewAreas.map((area) => {
            const previewUrl = imagePreviews[area.id];
            if (!previewUrl) return null;

            const position = imagePositions[area.id] || {
              x: 0,
              y: 0,
              scale: 0.5,
              rotate: 0
            };
            const isSelected = selectedArea?.id === area.id;

            return (
              <div
                key={area.id}
                className="absolute"
                style={{
                  top: `${area.position?.y || 25}%`,
                  left: `${area.position?.x || 15}%`,
                  width: `${area.width || 70}%`,
                  height: `${area.height || 50}%`,
                  pointerEvents: "none"
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale}) rotate(${position.rotate}deg)`,
                    transformOrigin: "center center",
                    cursor: uploadedImages[area.id] ? "move" : "default"
                  }}
                  onMouseDown={(e) => handleDragStart(e, area.id)}
                  onWheel={(e) => handleWheel(e, area.id)}
                >
                  <img
                    src={previewUrl}
                    alt="Custom design"
                    className="absolute object-contain select-none"
                    style={{
                      mixBlendMode: "multiply",
                      pointerEvents: "none",
                      width: "100%",
                      height: "100%"
                    }}
                    crossOrigin="anonymous"
                  />

                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const totalUploadedAreas = Object.keys(uploadedImages).length;

  // Check if Add to Cart should be enabled
  const isAddToCartEnabled = useMemo(() => {
    return totalUploadedAreas > 0 && confirmedPreviewUrls.back;
  }, [totalUploadedAreas, confirmedPreviewUrls]);

  if (isStudioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-300 border-t-black animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Design your custom Phone Case</h2>
            <p className="text-sm text-gray-500">Preparing design studio…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-x-hidden lg:px-32">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">Design Added Successfully!</h2>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-white text-2xl hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              <p className="text-center text-gray-700 mb-6">
                Your custom phone case has been added to cart.
              </p>
              <div className="border rounded-xl overflow-hidden shadow-md">
                <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                  Design Preview
                </div>
                {successPreviews.back ? (
                  <img
                    src={successPreviews.back}
                    alt="Case preview"
                    className="w-full h-96 object-contain p-4 bg-gray-50"
                    onError={(e) => (e.target.src = "/placeholder-case.png")}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center text-red-500 bg-gray-100">
                    Preview upload failed
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-4">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = "/cart";
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewImageUrl && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Design Preview</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowCloudinaryUrls(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-3 overflow-auto max-h-[70vh]">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/2">
                  <div className="bg-gray-50 p-2 rounded-lg border flex justify-center">
                    <img
                      src={previewImageUrl}
                      alt="Design Preview"
                      className="max-w-full max-h-[250px] object-contain rounded"
                    />
                  </div>
                </div>

                <div className="md:w-1/2">
                  <h3 className="text-xs font-medium text-gray-700 mb-2">
                    Uploaded Images
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {Object.entries(cloudinaryUrls).map(([areaId, url]) => {
                      const area = currentViewAreas.find((a) => a.id === areaId);
                      const areaName = area?.name || areaId;

                      return (
                        <div
                          key={areaId}
                          className="flex gap-2 border rounded-lg p-1.5 bg-gray-50"
                        >
                          <div className="w-12 h-12 bg-white rounded border flex-shrink-0 overflow-hidden">
                            <img
                              src={url}
                              alt={areaName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{areaName}</p>
                            <p className="text-[10px] text-gray-500">
                              {imagePositions[areaId]
                                ? `${Math.round(imagePositions[areaId].scale * 100)}%`
                                : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => addDesignToCart(cloudinaryUrls)}
                disabled={!isAddToCartEnabled || isUploading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  !isAddToCartEnabled || isUploading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : !isAddToCartEnabled ? (
                  "Confirm design first"
                ) : (
                  "Add to Cart"
                )}
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowCloudinaryUrls(false);
                }}
                className="px-4 py-2.5 border rounded-lg font-medium text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="lg:grid lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,380px)] lg:gap-6 lg:p-6 p-4 space-y-6 lg:space-y-0 max-w-full">
        {/* Left Sidebar - Product Info & Model Selection */}
        <aside className="hidden lg:block space-y-6 w-full border-r border-r-gray-200 p-4 mr-2">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {product?.name || "Custom Phone Case"}
            </h1>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {product?.description || "Design your own phone case"}
            </p>
          </div>

          <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 w-full">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500">Price:</span>
                <span className="font-bold text-2xl text-black">
                  £{product?.pricing?.specialPrice || product?.pricing?.basePrice }
                </span>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Select Phone Model</h4>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
              {availableModels.map((model) => (
                <button
                  key={model.modelCode}
                  onClick={() => setSelectedModel(model)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    selectedModel?.modelCode === model.modelCode
                      ? "border-black bg-gray-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold">{model.modelName}</p>
                  <p className="text-xs text-gray-500">
                    {model.displaySize} • {model.year}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200">
            {selectedArea && uploadedImages[selectedArea.id] && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => zoomOut(selectedArea.id)}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-50"
                    disabled={imagePositions[selectedArea.id]?.scale <= 0.1}
                  >
                    <span className="text-lg">−</span>
                  </button>

                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Smaller</span>
                      <span>
                        {(imagePositions[selectedArea.id]?.scale || 0.5).toFixed(1)}x
                      </span>
                      <span>Larger</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={imagePositions[selectedArea.id]?.scale || 0.5}
                      onChange={(e) => {
                        const newScale = parseFloat(e.target.value);
                        setImagePositions((prev) => ({
                          ...prev,
                          [selectedArea.id]: {
                            ...prev[selectedArea.id],
                            scale: newScale
                          }
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => zoomIn(selectedArea.id)}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-50"
                    disabled={imagePositions[selectedArea.id]?.scale >= 5}
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleRotate(selectedArea.id)}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  >
                    ↻ Rotate 45°
                  </button>
                  <button
                    onClick={() => resetPosition(selectedArea.id)}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center mt-2">
              {selectedArea && uploadedImages[selectedArea.id]
                ? "Drag to move • Scroll or use slider to zoom"
                : "Select an area and upload a design"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePreviewAndAddToCart}
              disabled={isUploading || totalUploadedAreas === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isUploading || totalUploadedAreas === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : totalUploadedAreas === 0 ? (
                "Add a design"
              ) : (
                "Add to Cart"
              )}
            </button>

            {showCloudinaryUrls && previewImageUrl && (
              <button
                onClick={() => addDesignToCart(cloudinaryUrls)}
                disabled={isAddingToCart}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isAddingToCart
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 active:scale-[0.98] shadow-lg hover:shadow-xl"
                }`}
              >
                {isAddingToCart ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </div>
                ) : (
                  "🛒 Add to Cart"
                )}
              </button>
            )}
          </div>
        </aside>

        {/* Main Preview */}
        <main className="bg-white p-4 lg:p-2 flex items-center justify-center relative w-full">
          <div className="w-full max-w-2xl mx-auto">
            {renderCaseWithOverlay()}

            {/* Mobile Controls */}
            <div className="mt-4 p-4 lg:hidden bg-white/90 backdrop-blur-sm rounded-xl border shadow-sm">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white">
                  Back View
                </button>
              </div>

              {selectedArea && uploadedImages[selectedArea.id] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => zoomOut(selectedArea.id)}
                      className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-50"
                      disabled={imagePositions[selectedArea.id]?.scale <= 0.1}
                    >
                      <span className="text-lg">−</span>
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Smaller</span>
                        <span>
                          {(imagePositions[selectedArea.id]?.scale || 0.5).toFixed(1)}x
                        </span>
                        <span>Larger</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={imagePositions[selectedArea.id]?.scale || 0.5}
                        onChange={(e) => {
                          const newScale = parseFloat(e.target.value);
                          setImagePositions((prev) => ({
                            ...prev,
                            [selectedArea.id]: {
                              ...prev[selectedArea.id],
                              scale: newScale
                            }
                          }));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => zoomIn(selectedArea.id)}
                      className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-50"
                      disabled={imagePositions[selectedArea.id]?.scale >= 5}
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleRotate(selectedArea.id)}
                      className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    >
                      ↻ Rotate 45°
                    </button>
                    <button
                      onClick={() => resetPosition(selectedArea.id)}
                      className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    >
                      ↺ Reset
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center mt-2">
                {selectedArea && uploadedImages[selectedArea.id]
                  ? "Drag to move • Scroll or use slider to zoom"
                  : "Select an area and upload a design"}
              </p>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Print Areas */}
        <aside className="space-y-6 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Print Area</h2>
              {totalUploadedAreas > 0 && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {totalUploadedAreas} design
                </span>
              )}
            </div>

            {/* Model Selection for Mobile */}
            <div className="lg:hidden">
              <h4 className="font-semibold text-sm mb-2">Select Phone Model</h4>
              <select
                value={selectedModel?.modelCode}
                onChange={(e) => {
                  const model = availableModels.find(
                    (m) => m.modelCode === e.target.value
                  );
                  setSelectedModel(model);
                }}
                className="w-full p-3 border rounded-xl"
              >
                {availableModels.map((model) => (
                  <option key={model.modelCode} value={model.modelCode}>
                    {model.modelName} ({model.displaySize}, {model.year})
                  </option>
                ))}
              </select>
            </div>

            {/* Area Selector */}
            <div className="grid grid-cols-1 gap-3">
              {currentViewAreas.map((area) => {
                const active = selectedArea?.id === area.id;
                const hasImage = !!uploadedImages[area.id];

                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      active
                        ? "border-black bg-gray-100"
                        : hasImage
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">{area.name}</p>
                    <p className="text-xs text-gray-500">{area.max}</p>
                    {area.description && (
                      <p className="text-xs text-gray-400 mt-1">{area.description}</p>
                    )}
                    {hasImage && (
                      <div className="mt-2">
                        <span className="text-xs text-green-600 font-medium inline-block">
                          ✓ Design added
                        </span>
                        {imagePositions[area.id]?.scale && (
                          <span className="text-xs text-gray-500 block">
                            Size: {(imagePositions[area.id].scale * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upload Area */}
            {selectedArea && (
              <div className="border rounded-2xl border-gray-200 p-4 space-y-6 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{selectedArea.name}</h3>
                    <p className="text-sm text-gray-600">{selectedArea.max}</p>
                  </div>
                  {uploadedImages[selectedArea.id] && (
                    <button
                      onClick={() => removeImage(selectedArea.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label className="h-40 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors relative overflow-hidden bg-white">
                  {uploadedImages[selectedArea.id] ? (
                    <img
                      src={imagePreviews[selectedArea.id]}
                      alt="Design preview"
                      className="object-contain p-4 max-h-full"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-gray-500 block mb-2">
                        Click to upload design
                      </span>
                      <span className="text-xs text-gray-400">
                        PNG, JPG, WebP • Max 5MB
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, selectedArea.id)}
                  />
                </label>

                {/* Confirm button */}
                {uploadedImages[selectedArea.id] && (
                  <button
                    onClick={handleConfirmDesign}
                    disabled={isConfirming || confirmedPreviewUrls.back}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all shadow-md ${
                      confirmedPreviewUrls.back
                        ? "bg-green-600 cursor-not-allowed ring-2 ring-green-300"
                        : isConfirming
                        ? "bg-gray-400 cursor-wait"
                        : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
                    }`}
                  >
                    {confirmedPreviewUrls.back
                      ? "✓ Design Confirmed"
                      : isConfirming
                      ? "Confirming..."
                      : "Confirm Design & Save Preview"}
                  </button>
                )}
              </div>
            )}

            {/* Mobile action buttons */}
            <div className="space-y-3 lg:hidden">
              <button
                onClick={handlePreviewAndAddToCart}
                disabled={isUploading || totalUploadedAreas === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isUploading || totalUploadedAreas === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : totalUploadedAreas === 0 ? (
                  "Add a design"
                ) : (
                  "Add to Cart"
                )}
              </button>

              {showCloudinaryUrls && previewImageUrl && (
                <button
                  onClick={() => addDesignToCart(cloudinaryUrls)}
                  disabled={isAddingToCart}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isAddingToCart
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800 active:scale-[0.98] shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isAddingToCart ? "Adding..." : "🛒 Add to Cart"}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}