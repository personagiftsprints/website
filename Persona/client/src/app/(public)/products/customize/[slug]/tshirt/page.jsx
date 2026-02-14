"use client"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { toPng } from 'html-to-image'
import Link from "next/link"
import tshirtData from "@/assets/print-models/tshirt.json"
import { getProductBySlug, uploadImagesAPI } from "@/services/product.service"
import { getPrintConfigBySlug } from "@/services/printArea.service"

export default function TshirtColorPreview() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const [selectedArea, setSelectedArea] = useState(null)
  const [uploadedImages, setUploadedImages] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})
  const [isStudioLoading, setIsStudioLoading] = useState(true)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [previewGenerated, setPreviewGenerated] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [savedDesignId, setSavedDesignId] = useState(null)
  const [selectedSize, setSelectedSize] = useState('M')
  const [showSuccessModal, setShowSuccessModal] = useState(false);
const [successPreviews, setSuccessPreviews] = useState({ front: null, back: null });
const [confirmedPreviewUrls, setConfirmedPreviewUrls] = useState({
  front: null,
  back: null
});
const [isConfirming, setIsConfirming] = useState(false);

  // New state for controlling area visibility
  const [showCenterChest, setShowCenterChest] = useState(false)
  const [showLeftChest, setShowLeftChest] = useState(false)

  // Image position controls
  const [imagePositions, setImagePositions] = useState({})

  // State for showing Cloudinary URLs
  const [showCloudinaryUrls, setShowCloudinaryUrls] = useState(false)
  const [cloudinaryUrls, setCloudinaryUrls] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  const data = tshirtData.tshirt


const handleConfirmDesign = async () => {
  if (!tshirtContainerRef.current) return;

  setIsConfirming(true);

  try {
    // 1. Capture current view preview
    await new Promise(r => setTimeout(r, 800)); // small wait for stability
    const dataUrl = await generatePreviewImage(); // your existing function

    // 2. Upload to Cloudinary
    const cloudUrl = await uploadPreviewImageToCloudinary(dataUrl);

    if (!cloudUrl) throw new Error("Preview upload failed");

    // 3. Save to state
    setConfirmedPreviewUrls(prev => ({
      ...prev,
      [view]: cloudUrl
    }));

    console.log(`${view.toUpperCase()} preview confirmed & uploaded:`, cloudUrl);

    // Optional: show toast/alert
    alert(`✓ ${view.toUpperCase()} design confirmed and preview uploaded!`);

  } catch (err) {
    console.error("Confirm failed:", err);
    alert("Failed to confirm design: " + err.message);
  } finally {
    setIsConfirming(false);
  }
};
const uploadPreviewImageToCloudinary = async (dataUrl) => {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `preview-${Date.now()}.png`, { type: 'image/png' });

    // ────────────────────────────────────────
    // This is the critical change
    const uploadResults = await uploadImagesAPI([file]);
    // ────────────────────────────────────────

    if (!uploadResults || !Array.isArray(uploadResults) || uploadResults.length === 0) {
      throw new Error("Invalid upload response");
    }

    const url = uploadResults[0].url;
    if (!url) throw new Error("No URL returned");

    console.log("Preview uploaded successfully:", url);
    return url;

  } catch (error) {
    console.error("Preview Cloudinary upload failed:", error);
    return null;
  }
};


  const COLOR_STYLE = {
    black: "bg-black",
    white: "bg-white",
    red: "bg-red-500",
    blue: "bg-blue-500"
  }

  const [product, setProduct] = useState(null)
  const [printConfig, setPrintConfig] = useState(null)

  // Refs
  const tshirtContainerRef = useRef(null)
  const tshirtCanvasRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const currentAreaRef = useRef(null)

  // Cart state
  const [cartItemCount, setCartItemCount] = useState(0)
  const [savedDesignsCount, setSavedDesignsCount] = useState(0)

// Simple cart manager
const cartManager = {
  addItem: async (item) => {
    try {
      console.log('🛒 Adding to cart:', item);
      
      // Get existing cart from localStorage
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // ✅ FIX: Check if variant exists before accessing properties
      const variantSize = item.variant?.size || 'N/A';
      const variantColor = item.variant?.color || 'N/A';
      
      // Generate a unique ID based on product, variant, and timestamp
      const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${item.productId}_${variantSize}_${variantColor}`;
      
      // Check if item already exists (compare without the ID)
      const existingIndex = cartItems.findIndex(cartItem => 
        cartItem.productId === item.productId &&
        cartItem.variant?.size === item.variant?.size &&
        cartItem.variant?.color === item.variant?.color &&
        JSON.stringify(cartItem.designData?.cloudinary_urls) === JSON.stringify(item.designData?.cloudinary_urls)
      );
      
      if (existingIndex > -1) {
        // Update quantity if exists
        cartItems[existingIndex].quantity += item.quantity;
      } else {
        // Add new item with unique ID
        cartItems.push({
          ...item,
          id: uniqueId, // Always generate a new unique ID
          addedAt: new Date().toISOString()
        });
      }
      
      // Save back to localStorage
      localStorage.setItem('cart', JSON.stringify(cartItems));
      
      // Also save to a separate designs storage
      const designs = JSON.parse(localStorage.getItem('tshirtDesigns') || '[]');
      designs.push({
        ...item,
        id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        saved_at: new Date().toISOString()
      });
      localStorage.setItem('tshirtDesigns', JSON.stringify(designs));
      
      console.log('✅ Cart saved to localStorage:', cartItems);
      console.log('✅ Unique ID generated:', uniqueId);
      
      return {
        success: true,
        message: 'Added to cart successfully',
        cartCount: cartItems.length
      };
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  getItems: () => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  },
  
  getItemCount: () => {
    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    return items.reduce((total, item) => total + item.quantity, 0);
  },
  
  clearCart: () => {
    localStorage.removeItem('cart');
    return { success: true, message: 'Cart cleared' };
  }
};

const getStructuredProductDataForCart = (cloudinaryUrlsData) => {
  console.log("Get Strctured Data")
  if (!product) {
    console.warn("No product loaded - cannot build cart data");
    return null;
  }

  const printAreas = {};

  // Front areas
  const frontAreas = printConfig?.views?.front?.areas || [];
  frontAreas.forEach(area => {
    if (uploadedImages[area.id] && cloudinaryUrlsData[area.id]) {
      printAreas.front = {
        enabled: true,
        area: area.name.toLowerCase().replace(/\s+/g, '_'),
        orientation_id: `ori_${area.name.toLowerCase().replace(/\s+/g, '_')}`,
        image: {
          url: cloudinaryUrlsData[area.id],
          width: 1200,
          height: 1400,
          source: 'cloudinary',
          position: imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
        },
        view: 'front'
      };
    }
  });

  // Back areas - FIXED: now properly adds back areas
  const backAreas = printConfig?.views?.back?.areas || [];
  backAreas.forEach(area => {
    if (uploadedImages[area.id] && cloudinaryUrlsData[area.id]) {
      printAreas.back = {
        enabled: true,
        area: area.name.toLowerCase().replace(/\s+/g, '_'),
        orientation_id: `ori_${area.name.toLowerCase().replace(/\s+/g, '_')}`,
        image: {
          url: cloudinaryUrlsData[area.id],
          width: 1600,
          height: 2000,
          source: 'cloudinary',
          position: imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
        },
        view: 'back'
      };
    }
  });

  const cartData = {
    productSnapshot: {
      id: product._id,
      slug: product.slug || slug,
      name: product.name || "Custom T-Shirt",
      type: product.productType || "tshirt",
      description: product.description || "",
      basePrice: product.pricing?.price || 0,
      specialPrice: product.pricing?.specialPrice || 0,
      currency: product.pricing?.currency || "INR",
      image: product.images?.[0]?.url || product.image || null,
      material: product.material || ""
    },
    variant: {
      size: selectedSize || 'M',
      color: selectedColor || 'default',
      color_label: data[selectedColor]?.label || selectedColor || 'Default'
    },
    quantity: 1,
    print_areas: printAreas,
    cloudinary_urls: cloudinaryUrlsData,
    metadata: {
      view_configuration: {
        show_center_chest: showCenterChest,
        show_left_chest: showLeftChest,
        current_view: view
      },
      image_positions: imagePositions,
      uploaded_areas: Object.keys(uploadedImages).map(areaId => {
        const area = [...frontAreas, ...backAreas].find(a => a.id === areaId);
        return {
          id: areaId,
          name: area?.name || 'Unknown Area',
          view: frontAreas.some(a => a.id === areaId) ? 'front' : 'back',
          position: imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
        };
      }),
      design_timestamp: new Date().toISOString()
    },
    currency: product.pricing?.currency || 'INR'
  };

  console.log("Generated cartData:", JSON.stringify(cartData, null, 2));
  return cartData;
};
const addDesignToCart = async (cloudinaryUrlsData) => {
  console.log("Adding to cart...");
  if (!product || !cloudinaryUrlsData) {
    alert("Product data not loaded.");
    return;
  }
  if (Object.keys(cloudinaryUrlsData).length === 0) {
    alert("Please upload designs first.");
    return;
  }

  // Check if at least one side is confirmed
  if (!confirmedPreviewUrls.front && !confirmedPreviewUrls.back) {
    alert("Please confirm at least one side's design first.");
    return;
  }

  try {
    setIsAddingToCart(true);

    // Use already confirmed preview URLs (no generation here!)
    const previewUrls = {
      front: confirmedPreviewUrls.front,
      back: confirmedPreviewUrls.back
    };

    console.log("Using confirmed preview URLs:", previewUrls);

    // Main preview: prefer front, fallback to back
    const mainPreviewUrl = previewUrls.front || previewUrls.back || null;
    if (mainPreviewUrl) {
      setPreviewImageUrl(mainPreviewUrl);
    } else {
      setPreviewImageUrl("/placeholder-tshirt.png"); // or product image
    }

    // Build cart data (your existing function)
    const cartData = getStructuredProductDataForCart(cloudinaryUrlsData);
    if (!cartData) throw new Error("No cart data");

    // Create cart item with confirmed previews
    const cartItem = {
      productId: cartData.productSnapshot.id,
      productSlug: cartData.productSnapshot.slug,
      name: cartData.productSnapshot.name,
      image: cartData.productSnapshot.image,
      price: cartData.productSnapshot.specialPrice || cartData.productSnapshot.basePrice,
      currency: cartData.currency,
      variant: cartData.variant,
      quantity: cartData.quantity,
      designData: {
        cloudinary_urls: cartData.cloudinary_urls,
        preview_url: mainPreviewUrl,
        preview_urls: previewUrls,           // ← confirmed ones here
        print_areas: cartData.print_areas,
        positions: cartData.metadata?.image_positions || {}
      },
      metadata: {
        ...cartData.metadata,
        preview_uploaded_to_cloudinary: !!(previewUrls.front || previewUrls.back)
      },
      productSnapshot: cartData.productSnapshot
    };

    console.log("Final cartItem to save:", JSON.stringify(cartItem, null, 2));

    const result = await cartManager.addItem(cartItem);

    if (result.success) {
      console.log("Cart save success:", result);

      // Use confirmed previews for modal
      setSuccessPreviews({
        front: previewUrls.front,
        back: previewUrls.back
      });

      setShowSuccessModal(true);
      alert(`Added! Cart now has ${result.cartCount} item(s)`);

      // Update counts...
      const designs = JSON.parse(localStorage.getItem('tshirtDesigns') || '[]');
      setSavedDesignsCount(designs.length);

      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
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
  // Function to log structured product data
  const logStructuredProductData = (cloudinaryUrlsData) => {
    const structuredData = getStructuredProductDataForCart(cloudinaryUrlsData);
    
    if (!structuredData) return null;
    
    // Log to console with nice formatting
    console.log('%c📦 STRUCTURED PRODUCT DATA', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
    console.log('%c════════════════════════════════════════════', 'color: #888');
    console.log(JSON.stringify(structuredData, null, 2));
    console.log('%c════════════════════════════════════════════', 'color: #888');
    console.log('%c📊 Summary:', 'color: #2196F3; font-weight: bold;');
    console.log(`  • Product: ${structuredData.product.name}`);
    console.log(`  • Size: ${structuredData.variant.size}, Color: ${structuredData.variant.color_label}`);
    console.log(`  • Print Areas: ${Object.keys(structuredData.print_areas).length} area(s)`);
    console.log('%c════════════════════════════════════════════', 'color: #888');
    
    return structuredData;
  };



  // Function to draw the t-shirt design on canvas
  const drawDesignOnCanvas = async () => {
    if (!tshirtCanvasRef.current) return;
    
    const canvas = tshirtCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 800;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
      // Draw t-shirt base image
      const tshirtImg = new Image();
      tshirtImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        tshirtImg.onload = resolve;
        tshirtImg.onerror = reject;
        tshirtImg.src = current[view];
      });
      
      ctx.drawImage(tshirtImg, 0, 0, canvas.width, canvas.height);
      
      // Draw uploaded images on their positions
      for (const area of currentViewAreas) {
        const previewUrl = imagePreviews[area.id];
        if (!previewUrl) continue;
        
        const position = imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
        
        // Calculate position and size
        const areaX = (area.position?.x || 0) / 100 * canvas.width;
        const areaY = (area.position?.y || 0) / 100 * canvas.height;
        const areaWidth = (area.width || 100) / 100 * canvas.width;
        const areaHeight = (area.height || 100) / 100 * canvas.height;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = previewUrl;
        });
        
        // Save context state
        ctx.save();
        
        // Translate to area center
        ctx.translate(areaX + areaWidth / 2, areaY + areaHeight / 2);
        
        // Apply rotation
        ctx.rotate((position.rotate * Math.PI) / 180);
        
        // Apply scale
        const scale = position.scale || 0.5;
        
        // Draw image with position offset
        ctx.drawImage(
          img,
          position.x - (areaWidth * scale) / 2,
          position.y - (areaHeight * scale) / 2,
          areaWidth * scale,
          areaHeight * scale
        );
        
        // Restore context state
        ctx.restore();
      }
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error drawing on canvas:", error);
      throw new Error("Failed to generate design preview");
    }
  };

  // Function to generate preview
  const generatePreviewImage = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      throw new Error("Please add at least one design.");
    }

    try {
      // Use canvas method for better reliability
      const dataUrl = await drawDesignOnCanvas();
      return dataUrl;
    } catch (error) {
      console.error("Canvas generation failed, trying html-to-image...", error);
      
      // Fallback to html-to-image with better error handling
      if (!tshirtContainerRef.current) {
        throw new Error("Cannot capture preview. Please try again.");
      }

      // First, hide all Next.js Image components and show regular img tags
      const container = tshirtContainerRef.current;
      const nextImages = container.querySelectorAll('img[data-nimg]');
      nextImages.forEach(img => {
        img.style.opacity = '0';
      });
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const dataUrl = await toPng(container, {
          backgroundColor: null,
          pixelRatio: 1,
          cacheBust: true,
          skipFonts: true,
          imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          style: {
            transform: 'translateZ(0)',
            willChange: 'transform'
          }
        });

        // Restore Next.js images
        nextImages.forEach(img => {
          img.style.opacity = '1';
        });
        
        return dataUrl;
      } catch (fallbackError) {
        console.error("html-to-image also failed:", fallbackError);
        throw new Error("Failed to generate preview. Please try with different images.");
      }
    }
  };



const generateViewPreview = async (targetView) => {
  if (!["front", "back"].includes(targetView)) {
    throw new Error("Invalid view for preview");
  }

  const originalView = view;
  console.log(`[Preview Gen] Starting for ${targetView} (current view: ${originalView})`);

  try {
    // Switch view
    setView(targetView);

    // Wait for render (increased delay)
    await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 seconds — should be enough

    // Optional: simple check with timeout (max 5 seconds total wait)
    const renderCheck = new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10; // ~3 seconds

      const check = () => {
        attempts++;
        if (tshirtContainerRef.current) {
          const bgImg = tshirtContainerRef.current.querySelector('img[src*="tshirt"]'); // more flexible selector
          if (bgImg) {
            console.log(`[Preview Gen] Background image found for ${targetView}`);
            resolve(true);
            return;
          }
        }
        if (attempts >= maxAttempts) {
          console.warn(`[Preview Gen] Timeout waiting for render on ${targetView} — proceeding anyway`);
          resolve(false);
          return;
        }
        setTimeout(check, 300);
      };
      check();
    });

    await renderCheck; // will resolve even on timeout

    console.log(`[Preview Gen] View switched and rendered for ${targetView}`);

    const dataUrl = await generatePreviewImage();
    console.log(`[Preview Gen] ${targetView} preview generated (length: ${dataUrl?.length || 'failed'})`);

    return dataUrl;
  } catch (err) {
    console.error(`[Preview Gen] Failed for ${targetView}:`, err);
    return null;
  } finally {
    setView(originalView);
    await new Promise(resolve => setTimeout(resolve, 800));
  }
};

  // Function to upload images to Cloudinary
  const uploadAllImagesToCloudinary = async () => {
    const uploadedUrls = {};
    
    try {
      // Check if there are any images to upload
      const imageFiles = Object.values(uploadedImages);
      
      if (imageFiles.length === 0) {
        console.log('No images to upload');
        return uploadedUrls;
      }

      console.log('🔄 Starting Cloudinary upload...', {
        fileCount: imageFiles.length
      });

      // Use your existing uploadImagesAPI function
      const uploadResults = await uploadImagesAPI(imageFiles);
      
      console.log('📦 Upload API response:', uploadResults);
      
      if (!uploadResults || !Array.isArray(uploadResults)) {
        console.error('❌ Invalid response from upload API:', uploadResults);
        throw new Error('Invalid response from upload API');
      }

      // Map uploaded URLs back to area IDs
      const areaIds = Object.keys(uploadedImages);
      
      uploadResults.forEach((imageData, index) => {
        const areaId = areaIds[index];
        if (areaId && imageData.url) {
          uploadedUrls[areaId] = imageData.url;
          console.log(`✅ Uploaded image for area ${areaId}:`, imageData.url);
        }
      });

      console.log('🎉 Upload completed successfully:', uploadedUrls);
      return uploadedUrls;
      
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      
      // Show error to user
      alert(`Upload failed: ${error.message}. Using local previews instead.`);
      
      // Fallback: Use local preview URLs if upload fails
      Object.entries(imagePreviews).forEach(([areaId, previewUrl]) => {
        uploadedUrls[areaId] = previewUrl;
      });
      
      return uploadedUrls;
    }
  };


  const handlePreviewAndAddToCart = async () => {
  if (Object.keys(uploadedImages).length === 0) {
    alert("Please add at least one design.");
    return;
  }

  try {
    setIsUploading(true);

    // 1. Upload user designs
    const userDesignUrls = await uploadAllImagesToCloudinary();
    setCloudinaryUrls(userDesignUrls);

    // 2. Generate & upload preview
    const localPreviewDataUrl = await generatePreviewImage();
    const previewCloudinaryUrl = await uploadPreviewImageToCloudinary(localPreviewDataUrl);
    const finalPreviewUrl = previewCloudinaryUrl || localPreviewDataUrl;
    setPreviewImageUrl(finalPreviewUrl);

    // 3. Now call the full add-to-cart logic
    await addDesignToCart(userDesignUrls);

  } catch (err) {
    console.error("Preview/cart preparation failed:", err);
    alert("Failed to prepare design: " + (err.message || "Unknown error"));
  } finally {
    setIsUploading(false);
  }
};


  // Load saved designs count and cart count
  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItemCount(cartItems.reduce((total, item) => total + item.quantity, 0));
    
    const designs = JSON.parse(localStorage.getItem('tshirtDesigns') || '[]');
    setSavedDesignsCount(designs.length);
  }, [previewGenerated]);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setIsStudioLoading(true);

        const [productRes, configRes] = await Promise.all([
          getProductBySlug(slug),
          getPrintConfigBySlug("tshirt")
        ]);

        setProduct(productRes?.data || null);
        setPrintConfig(configRes || null);
      } finally {
        setIsStudioLoading(false);
      }
    };

    load();
  }, [slug]);

  const availableColors = useMemo(() => {
    if (!product) return [];
    const colorAttr = product.productConfig?.attributes?.find(a => a.code === "color");
    if (!colorAttr) return [];
    return colorAttr.values.map(c => c.toLowerCase()).filter(c => data[c]);
  }, [product, data]);

  const initialColor = useMemo(() => {
    try {
      const raw = searchParams.get("variant");
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw));
        const normalized = parsed?.color?.toLowerCase();
        if (data[normalized]) return normalized;
      }
      return availableColors[0] || Object.keys(data)[0];
    } catch {
      return availableColors[0] || Object.keys(data)[0];
    }
  }, [searchParams, data, availableColors]);

  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [view, setView] = useState("front");
  const [isLoading, setIsLoading] = useState(true);

  const colors = availableColors.map(key => [key, data[key]]);
  const current = data[selectedColor];

  useEffect(() => {
    setIsLoading(true);
  }, [selectedColor, view]);

  useEffect(() => {
    setSelectedArea(null);
  }, [view]);

  // Filter current view areas based on visibility settings
  const currentViewAreas = useMemo(() => {
    const allAreas = printConfig?.views?.[view]?.areas || [];
    
    if (view !== "front") return allAreas;
    
    return allAreas.filter(area => {
      if (area.name === "Center Chest" && !showCenterChest) return false;
      if (area.name === "Chest Left" && !showLeftChest) return false;
      return true;
    });
  }, [printConfig, view, showCenterChest, showLeftChest]);

  // Check if user can upload to a specific area
  const canUploadToArea = (areaId) => {
    if (view !== "front") return true;
    
    const hasUploadInFrontView = Object.keys(uploadedImages).some(id => {
      const frontAreas = printConfig?.views?.front?.areas || [];
      return frontAreas.some(area => area.id === id) && uploadedImages[id];
    });
    
    if (hasUploadInFrontView) {
      return uploadedImages[areaId] !== undefined;
    }
    
    return true;
  };

  const handleImageUpload = (e, areaId) => {
    if (!canUploadToArea(areaId)) {
      alert("You can only choose one area in the front view. Please remove the existing upload first.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    if (!file.type.match('image/(jpeg|png|jpg|webp)')) {
      alert("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    if (imagePreviews[areaId]) {
      URL.revokeObjectURL(imagePreviews[areaId]);
    }

    if (view === "front") {
      const frontAreas = printConfig?.views?.front?.areas || [];
      frontAreas.forEach(area => {
        if (area.id !== areaId && uploadedImages[area.id]) {
          removeImage(area.id);
        }
      });
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreviews(prev => ({
      ...prev,
      [areaId]: previewUrl
    }));

    setUploadedImages(prev => ({
      ...prev,
      [areaId]: file
    }));

    // Reset position for new image
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }));

    const area = currentViewAreas.find(a => a.id === areaId);
    setSelectedArea(area || null);
  };

  const removeImage = (areaId) => {
    const previewUrl = imagePreviews[areaId];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setUploadedImages(prev => {
      const newState = { ...prev };
      delete newState[areaId];
      return newState;
    });

    setImagePreviews(prev => {
      const newState = { ...prev };
      delete newState[areaId];
      return newState;
    });

    setImagePositions(prev => {
      const newState = { ...prev };
      delete newState[areaId];
      return newState;
    });
    
    if (selectedArea?.id === areaId) {
      setSelectedArea(null);
    }
  };

  // Drag functionality
  const handleDragStart = useCallback((e, areaId) => {
    if (!uploadedImages[areaId]) return;
    
    isDraggingRef.current = true;
    currentAreaRef.current = areaId;
    dragStartRef.current = {
      x: e.clientX - (imagePositions[areaId]?.x || 0),
      y: e.clientY - (imagePositions[areaId]?.y || 0)
    };
    
    e.preventDefault();
    setSelectedArea(currentViewAreas.find(a => a.id === areaId) || null);
  }, [uploadedImages, imagePositions, currentViewAreas]);

  const handleDrag = useCallback((e) => {
    if (!isDraggingRef.current || !currentAreaRef.current) return;
    
    const areaId = currentAreaRef.current;
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 };
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Constrain movement within bounds (±100px for more movement)
    const constrainedX = Math.max(-100, Math.min(100, newX));
    const constrainedY = Math.max(-100, Math.min(100, newY));
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: {
        ...currentPos,
        x: constrainedX,
        y: constrainedY
      }
    }));
  }, [imagePositions]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    currentAreaRef.current = null;
  }, []);

  // Enhanced wheel for zoom functionality with smaller increments
  const handleWheel = useCallback((e, areaId) => {
    if (!uploadedImages[areaId]) return;
    
    e.preventDefault();
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 };
    const scaleDelta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.1, Math.min(5, currentPos.scale + scaleDelta));
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  // Zoom control functions
  const zoomIn = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return;
    
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 };
    const newScale = Math.max(0.1, Math.min(5, currentPos.scale + 0.1));
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  const zoomOut = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return;
    
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 };
    const newScale = Math.max(0.1, Math.min(5, currentPos.scale - 0.1));
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  // Handle zoom slider change
  const handleZoomChange = useCallback((areaId, value) => {
    if (!uploadedImages[areaId]) return;
    
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 };
    const newScale = Math.max(0.1, Math.min(5, value));
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  // Click to rotate functionality
  const handleRotate = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return;
    
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 };
    const newRotate = (currentPos.rotate + 45) % 360;
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, rotate: newRotate }
    }));
  }, [uploadedImages, imagePositions]);

  const resetPosition = (areaId) => {
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }));
  };

  // Add global mouse move and up listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleDrag(e);
    const handleGlobalMouseUp = () => handleDragEnd();
    
    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [handleDrag, handleDragEnd]);

  // Clean up preview image URL
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  if (isStudioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-300 border-t-black animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">
              Design your customized T-shirt
            </h2>
            <p className="text-sm text-gray-500">
              Preparing design studio…
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderTshirtWithOverlay = () => {
    return (
      <>
        {/* Hidden canvas for rendering */}
        <canvas
          ref={tshirtCanvasRef}
          style={{ display: 'none' }}
          width={500}
          height={500}
        />
       <div 
  ref={tshirtContainerRef}
  className="relative w-full max-w-105 sm:max-w-130 lg:mt-10 md:max-w-[660px] aspect-square mx-auto tshirt-container"
  onMouseMove={handleDrag}
  onMouseUp={handleDragEnd}
  onMouseLeave={handleDragEnd}
>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10 rounded-lg">
              <div className="h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* Use regular img tag for t-shirt to avoid CORS issues */}
          <img
            key={`${selectedColor}-${view}`}
            src={current[view]}
            alt="T-shirt preview"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            crossOrigin="anonymous"
          />

          {currentViewAreas.map(area => {
            const previewUrl = imagePreviews[area.id];
            if (!previewUrl) return null;

            const position = imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
            const isSelected = selectedArea?.id === area.id;

            return (
              <div
                key={area.id}
                className="absolute"
                style={{
                  top: `${area.position?.y || 0}%`,
                  left: `${area.position?.x || 0}%`,
                  width: `${area.width || 100}%`,
                  height: `${area.height || 100}%`,
                  pointerEvents: "none"
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale}) rotate(${position.rotate}deg)`,
                    transformOrigin: 'center center',
                    cursor: uploadedImages[area.id] ? 'move' : 'default'
                  }}
                  onMouseDown={(e) => handleDragStart(e, area.id)}
                  onWheel={(e) => handleWheel(e, area.id)}
                >
                  {/* Use regular img tag for uploaded images */}
                  <img
                    src={previewUrl}
                    alt="Custom design"
                    className="absolute object-contain select-none"
                    style={{ 
                      mixBlendMode: "multiply",
                      pointerEvents: "none",
                      width: '100%',
                      height: '100%'
                    }}
                    crossOrigin="anonymous"
                  />
                  
                  {/* Selection outline */}
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

  const hasUploadInFrontView = view === "front" && Object.keys(uploadedImages).some(id => {
    const frontAreas = printConfig?.views?.front?.areas || [];
    return frontAreas.some(area => area.id === id);
  });

  const totalUploadedAreas = Object.keys(uploadedImages).length;

  // Size options
  const sizes = ['S', 'M', 'L', 'XL'];

  return (
    <div className="bg-white overflow-x-hidden lg:px-32">

     {showSuccessModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
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
          Your custom t-shirt design has been added to cart.<br/>
          Here are the previews of both sides:
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Front */}
          <div className="border rounded-xl overflow-hidden shadow-md">
            <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
              Front View Preview
            </div>
            {successPreviews.front ? (
              <img
                src={successPreviews.front}
                alt="Front preview"
                className="w-full h-96 object-contain p-4 bg-gray-50"
                onError={(e) => {
                  e.target.src = "/placeholder-tshirt.png";
                  console.log("Front preview failed to load:", successPreviews.front);
                }}
              />
            ) : (
              <div className="h-96 flex items-center justify-center text-red-500 bg-gray-100">
                Front preview upload failed
              </div>
            )}
          </div>

          {/* Back */}
          <div className="border rounded-xl overflow-hidden shadow-md">
            <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
              Back View Preview
            </div>
            {successPreviews.back ? (
              <img
                src={successPreviews.back}
                alt="Back preview"
                className="w-full h-96 object-contain p-4 bg-gray-50"
                onError={(e) => {
                  e.target.src = "/placeholder-tshirt.png";
                  console.log("Back preview failed to load:", successPreviews.back);
                }}
              />
            ) : (
              <div className="h-96 flex items-center justify-center text-red-500 bg-gray-100">
                Back preview upload failed
              </div>
            )}
          </div>
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
            // router.push('/cart'); // optional
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
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
          &times;
        </button>
      </div>
      
      <div className="p-3 overflow-auto max-h-[70vh]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* LEFT SIDE - Product Preview */}
          <div className="md:w-1/2">
            <div className="bg-gray-50 p-2 rounded-lg border flex justify-center">
              <img
                src={previewImageUrl}
                alt="Design Preview"
                className="max-w-full max-h-[250px] object-contain rounded"
              />
            </div>
            
            {/* Product Info */}
            <div className="mt-2 flex gap-2 text-xs">
              <span className="bg-gray-100 px-2 py-0.5 rounded">{selectedSize}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{selectedColor}</span>
            </div>
          </div>
          
          {/* RIGHT SIDE - Uploaded Images */}
          <div className="md:w-1/2">
            <h3 className="text-xs font-medium text-gray-700 mb-2">Uploaded Images</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {Object.entries(cloudinaryUrls).map(([areaId, url]) => {
                const area = currentViewAreas.find(a => a.id === areaId);
                const areaName = area?.name || areaId;
                
                return (
                  <div key={areaId} className="flex gap-2 border rounded-lg p-1.5 bg-gray-50">
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
                        {imagePositions[areaId] ? `${Math.round(imagePositions[areaId].scale * 100)}%` : ''}
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
  onClick={() => addDesignToCart(cloudinaryUrls)} // your existing function
  disabled={isUploading || totalUploadedAreas === 0 || (!confirmedPreviewUrls.front && !confirmedPreviewUrls.back)}
  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
    isUploading || totalUploadedAreas === 0 || (!confirmedPreviewUrls.front && !confirmedPreviewUrls.back)
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
  }`}
>
  {isUploading ? (
    <div className="flex items-center justify-center gap-2">
      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Processing...
    </div>
  ) : !confirmedPreviewUrls.front && !confirmedPreviewUrls.back ? (
    'Confirm designs first'
  ) : (
    'Add to Cart'
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

      {/* Mobile Responsive Layout */}
      <div className="lg:grid lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,380px)] lg:gap-6 lg:p-1 p-4 space-y-6 lg:space-y-0 max-w-full">
        
        {/* Left Sidebar - Product Info & Colors (Hidden on mobile) */}
        <aside className="hidden lg:block space-y-6 w-full border-r border-r-gray-200 p-4 mr-2">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{product?.name}</h1>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product?.description}</p>
          </div>

          <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 w-full">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Material:</span>
                <span className="font-medium text-right truncate max-w-[180px]">
                  {product?.material
                    ?.split(",")
                    .map(m => m.trim())
                    .join(" • ")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500">Price:</span>
                <span className="font-bold text-2xl text-black">
                  £{product?.pricing?.specialPrice}
                </span>
              </div>
            </div>

            <div className="w-full">
              <h4 className="font-semibold mb-3 text-sm">Color</h4>
              <div className="flex gap-3 flex-wrap">
                {colors.map(([key, c]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedColor(key)}
                    className="flex flex-col items-center gap-1 p-2 -m-2 rounded-lg hover:bg-gray-100 transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-4 shadow-md transition-all ${
                        COLOR_STYLE[key]
                      } ${
                        selectedColor === key
                          ? "ring-4 ring-gray-500 ring-offset-1 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 "
                      }`}
                    />
                    <span className="text-xs text-gray-600 group-hover:text-gray-900 truncate max-w-[60px]">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="w-full mt-6">
              <h4 className="font-semibold mb-3 text-sm">Size</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-lg transition-all ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

           <div className="mt-4 p-4  bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 ">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {["front", "back"].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      view === v 
                        ? "bg-black text-white" 
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)} View
                  </button>
                ))}
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
                        <span>{(imagePositions[selectedArea.id]?.scale || 0.5).toFixed(1)}x</span>
                        <span>Larger</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={imagePositions[selectedArea.id]?.scale || 0.5}
                        onChange={(e) => handleZoomChange(selectedArea.id, parseFloat(e.target.value))}
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
              
              <p className="text-[8px] text-gray-500 text-center mt-2">
                {selectedArea && uploadedImages[selectedArea.id] 
                  ? "Drag to move • Scroll or use slider to zoom"
                  : "Click on an area with design to adjust size and position"}
              </p>
            </div>

             <div className="space-y-3 lg:block hidden">
              {/* Preview Button */}
              <button
                onClick={handlePreviewAndAddToCart}
                disabled={isUploading || totalUploadedAreas === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isUploading || totalUploadedAreas === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading Images...
                  </div>
                ) : totalUploadedAreas === 0 ? (
                  'Add a design to preview'
                ) : (
                  'Add to Cart'
                )}
              </button>
              
              {/* Direct Add to Cart Button (when preview already generated) */}
              {showCloudinaryUrls && previewImageUrl && (
                <button
                  onClick={() => addDesignToCart(cloudinaryUrls)}
                  disabled={isAddingToCart}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isAddingToCart
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98] shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding to Cart...
                    </div>
                  ) : (
                    '🛒 Add to Cart'
                  )}
                </button>
              )}
{/*               
              {totalUploadedAreas > 0 && !showCloudinaryUrls && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Click to generate preview, upload images to Cloudinary, and add to cart
                </p>
              )} */}
              
              {showCloudinaryUrls && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-blue-700">
                      Images uploaded to Cloudinary successfully!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm"
                    >
                      View Preview
                    </button>
                    <button
                      onClick={() => logStructuredProductData(cloudinaryUrls)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Log Data
                    </button>
                  </div>
                </div>
              )}
            </div>
        </aside>

        {/* Main T-shirt Preview */}
        <main className="bg-white p-4 lg:p-2 flex items-center justify-center relative w-full">
          <div className="w-full  max-w-2xl mx-auto">
            {renderTshirtWithOverlay()}
            
            {/* Enhanced Controls overlay */}
            <div className="mt-4 p-4 lg:hidden bg-white/90 backdrop-blur-sm rounded-xl border shadow-sm">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {["front", "back"].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      view === v 
                        ? "bg-black text-white" 
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)} View
                  </button>
                ))}
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
                        <span>{(imagePositions[selectedArea.id]?.scale || 0.5).toFixed(1)}x</span>
                        <span>Larger</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={imagePositions[selectedArea.id]?.scale || 0.5}
                        onChange={(e) => handleZoomChange(selectedArea.id, parseFloat(e.target.value))}
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
                  : "Click on an area with design to adjust size and position"}
              </p>
            </div>
          </div>
          
          {/* Mobile Controls Overlay */}
          <div className="lg:hidden fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border px-6 py-4 z-50 w-11/12 max-w-sm">
            <div className="flex flex-wrap gap-2 justify-center">
              {["front", "back"].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md flex-1 min-w-[120px] ${
                    view === v
                      ? "bg-gradient-to-r from-black to-gray-900 text-white shadow-black/25"
                      : "bg-white border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </main>

        <aside className="space-y-6 w-full ">
         
          <div className="bg-white rounded-2xl  border border-gray-100 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Print Areas</h2>
              {totalUploadedAreas > 0 && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {totalUploadedAreas} design{totalUploadedAreas > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
              {["front", "back"].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    view === v ? "bg-black text-white" : "border"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Front visibility */}
            {view === "front" && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShowCenterChest(v => !v)} 
                  className={`border p-3 rounded-xl ${showCenterChest ? 'bg-black text-white' : ''}`}
                >
                  Center Chest
                </button>
                {/* <button 
                  onClick={() => setShowLeftChest(v => !v)} 
                  className={`border p-3 rounded-xl ${showLeftChest ? 'bg-black text-white' : ''}`}
                >
                  Left Chest
                </button> */}
              </div>
            )}

            {/* Rules */}
            {view === "front" && hasUploadInFrontView && (
              <div className="  p-2 rounded-xl text-sm">
                Only ONE area allowed on front view.
              </div>
            )}

            {view === "back" && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-sm">
                Multiple areas allowed on back.
              </div>
            )}

            {/* AREA SELECTOR */}
            <div className="grid grid-cols-2 gap-3">
              {currentViewAreas.map(area => {
                const active = selectedArea?.id === area.id;
                const hasImage = !!uploadedImages[area.id];
                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area)}
                    className={`p-4 rounded-xl border-2 border-gray-200 text-left transition ${
                      active 
                        ? "border-black bg-gray-100" 
                        : hasImage
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">{area.name}</p>
                    <p className="text-xs text-gray-500">Max size: {area.max}</p>
                    {hasImage && (
                      <div className="mt-1">
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

           {selectedArea && canUploadToArea(selectedArea.id) && (
  <div className="border rounded-2xl border-gray-200 p-4 space-y-6 bg-gray-50">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">{selectedArea.name}</h3>
        <p className="text-sm text-gray-600">Max size: {selectedArea.max}</p>
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

    {/* Upload area */}
    <label className="h-40 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors relative overflow-hidden bg-white">
      {uploadedImages[selectedArea.id] ? (
        <img
          src={imagePreviews[selectedArea.id]}
          alt="Design preview"
          className="object-contain p-4 max-h-full"
        />
      ) : (
        <div className="text-center">
          <span className="text-gray-500 block mb-2">Click to upload design</span>
          <span className="text-xs text-gray-400">PNG, JPG, WebP • Max 5MB</span>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, selectedArea.id)}
        disabled={confirmedPreviewUrls[view]} // ← optional: lock after confirm
      />
    </label>

    {/* Controls + Confirm button - only show if uploaded */}
    {uploadedImages[selectedArea.id] && (
      <div className="space-y-5">
        {/* Zoom / Rotate / Reset controls - keep your existing ones */}
        <div className="flex items-center gap-3">
          {/* your zoom buttons */}
        </div>

        <div className="flex gap-3 justify-center">
          {/* your rotate & reset buttons */}
        </div>

        {/* Confirm Design Button - THIS IS THE MAIN ONE */}
        <button
          onClick={handleConfirmDesign}
          disabled={isConfirming || confirmedPreviewUrls[view]}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all shadow-md ${
            confirmedPreviewUrls[view]
              ? 'bg-green-600 cursor-not-allowed ring-2 ring-green-300'
              : isConfirming
                ? 'bg-gray-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
          }`}
        >
          {confirmedPreviewUrls[view]
            ? '✓ Design Confirmed for ' + view.toUpperCase()
            : isConfirming
              ? 'Confirming...'
              : 'Confirm Design & Save Preview'}
        </button>

        {confirmedPreviewUrls[view] && (
          <p className="text-sm text-green-700 text-center font-medium">
            Preview saved successfully ✓ Ready for cart
          </p>
        )}
      </div>
    )}
  </div>
)}

            {/* Size Selector for Mobile */}
            <div className="lg:hidden">
              <h3 className="font-semibold mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-lg transition-all ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 lg:hidden">
              {/* Preview Button */}
              <button
                onClick={handlePreviewAndAddToCart}
                disabled={isUploading || totalUploadedAreas === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isUploading || totalUploadedAreas === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading Images...
                  </div>
                ) : totalUploadedAreas === 0 ? (
                  'Add a design to preview'
                ) : (
                  'Add to Cart'
                )}
              </button>
              
              {/* Direct Add to Cart Button (when preview already generated) */}
              {showCloudinaryUrls && previewImageUrl && (
                <button
                  onClick={() => addDesignToCart(cloudinaryUrls)}
                  disabled={isAddingToCart}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isAddingToCart
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98] shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding to Cart...
                    </div>
                  ) : (
                    '🛒 Add to Cart'
                  )}
                </button>
              )}
{/*               
              {totalUploadedAreas > 0 && !showCloudinaryUrls && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Click to generate preview, upload images to Cloudinary, and add to cart
                </p>
              )} */}
              
              {showCloudinaryUrls && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-blue-700">
                      Images uploaded to Cloudinary successfully!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm"
                    >
                      View Preview
                    </button>
                    <button
                      onClick={() => logStructuredProductData(cloudinaryUrls)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Log Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}