"use client"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { toPng } from 'html-to-image'
import Link from "next/link"
import { getProductBySlug, uploadImagesAPI } from "@/services/product.service"
import { getPrintConfigBySlug } from "@/services/printArea.service"

export default function MugDesignPage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  
  // State management
  const [product, setProduct] = useState(null)
  const [printConfig, setPrintConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStudioLoading, setIsStudioLoading] = useState(true)
  
  // View and area selection
  const [view, setView] = useState("front")
  const [selectedArea, setSelectedArea] = useState(null)
  
  // Image upload and preview
  const [uploadedImages, setUploadedImages] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})
  const [imagePositions, setImagePositions] = useState({})
  
  // Cloudinary upload
  const [cloudinaryUrls, setCloudinaryUrls] = useState({})
  const [isUploading, setIsUploading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  
  // Cart state
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [savedDesignsCount, setSavedDesignsCount] = useState(0)
  
  // Refs for canvas and drag
  const mugContainerRef = useRef(null)
  const mugCanvasRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const currentAreaRef = useRef(null)

  // Simple cart manager
  const cartManager = {
    addItem: async (item) => {
      try {
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        
        const existingIndex = cartItems.findIndex(cartItem => 
          cartItem.productId === item.productId &&
          cartItem.variant === item.variant &&
          JSON.stringify(cartItem.designData) === JSON.stringify(item.designData)
        );
        
        if (existingIndex > -1) {
          cartItems[existingIndex].quantity += item.quantity;
        } else {
          cartItems.push({
            ...item,
            id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            addedAt: new Date().toISOString()
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(cartItems));
        
        const designs = JSON.parse(localStorage.getItem('mugDesigns') || '[]');
        designs.push({
          ...item,
          id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          saved_at: new Date().toISOString()
        });
        localStorage.setItem('mugDesigns', JSON.stringify(designs));
        
        return {
          success: true,
          message: 'Added to cart successfully',
          cartCount: cartItems.length
        };
      } catch (error) {
        console.error('Error adding to cart:', error);
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
        return [];
      }
    },
    
    getItemCount: () => {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      return items.reduce((total, item) => total + item.quantity, 0);
    }
  };

  // Load product and config data
  useEffect(() => {
    if (!slug) return

    const loadData = async () => {
      try {
        setIsStudioLoading(true)
        setLoading(true)

        const [productRes, configRes] = await Promise.all([
          getProductBySlug(slug),
          getPrintConfigBySlug("mug")
        ])

        setProduct(productRes?.data || null)
        setPrintConfig(configRes || null)
      } catch (error) {
        console.error("Failed to load mug data:", error)
      } finally {
        setIsStudioLoading(false)
        setLoading(false)
      }
    }

    loadData()
  }, [slug])

  // Load cart count
  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItemCount(cartItems.reduce((total, item) => total + item.quantity, 0));
    
    const designs = JSON.parse(localStorage.getItem('mugDesigns') || '[]');
    setSavedDesignsCount(designs.length);
  }, []);

  // Get current view areas based on view type
  const currentViewAreas = useMemo(() => {
    const baseAreas = printConfig?.views?.[view]?.areas || []

    if (view !== "full_wrap") return baseAreas

    const wrapArea = baseAreas[0]
    if (!wrapArea || wrapArea.type !== "multi") return []

    return wrapArea.slots.map(slot => ({
      id: `${wrapArea.id}_${slot}`,
      name: `${wrapArea.name} - ${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
      max: wrapArea.max,
      slot,
      position: getSlotPosition(slot) // Calculate position for each slot
    }))
  }, [view, printConfig])

  // Helper function to get slot positions on mug
  const getSlotPosition = (slot) => {
    switch(slot) {
      case 'front':
        return { x: 25, y: 50, width: 25, height: 30 }
      case 'center':
        return { x: 50, y: 50, width: 25, height: 30 }
      case 'back':
        return { x: 75, y: 50, width: 25, height: 30 }
      default:
        return { x: 50, y: 50, width: 30, height: 30 }
    }
  }

  // Get base image for current view
  const currentBaseImage = printConfig?.views?.[view]?.baseImage

  // Check if user can upload to area
  const canUploadToArea = (areaId) => {
    if (view !== "full_wrap") return true;
    
    const hasUploadInWrap = Object.keys(uploadedImages).some(id => {
      const wrapAreas = printConfig?.views?.full_wrap?.areas || [];
      return wrapAreas.some(area => area.id === id.split('_')[0]) && uploadedImages[id];
    });
    
    if (hasUploadInWrap) {
      return uploadedImages[areaId] !== undefined;
    }
    
    return true;
  };

  // Handle image upload
  const handleImageUpload = (e, areaId) => {
    if (!canUploadToArea(areaId)) {
      alert("You can only upload one design for the wrap view. Please remove the existing upload first.");
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

    // For wrap view, only allow one upload
    if (view === "full_wrap") {
      const wrapAreas = currentViewAreas;
      wrapAreas.forEach(area => {
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

  // Remove uploaded image
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
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Constrain movement
    const constrainedX = Math.max(-50, Math.min(50, newX));
    const constrainedY = Math.max(-50, Math.min(50, newY));
    
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

  // Zoom functionality
  const handleWheel = useCallback((e, areaId) => {
    if (!uploadedImages[areaId]) return;
    
    e.preventDefault();
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
    const scaleDelta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.2, Math.min(3, currentPos.scale + scaleDelta));
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  // Zoom controls
  const zoomIn = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return;
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
    const newScale = Math.max(0.2, Math.min(3, currentPos.scale + 0.1));
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  const zoomOut = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return;
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
    const newScale = Math.max(0.2, Math.min(3, currentPos.scale - 0.1));
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  const handleZoomChange = useCallback((areaId, value) => {
    if (!uploadedImages[areaId]) return;
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
    const newScale = Math.max(0.2, Math.min(3, value));
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }));
  }, [uploadedImages, imagePositions]);

  // Rotate functionality
  const handleRotate = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return;
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
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

  // Draw design on canvas
  const drawDesignOnCanvas = async () => {
    if (!mugCanvasRef.current) return;
    
    const canvas = mugCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 800;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
      // Draw mug base image
      const mugImg = new Image();
      mugImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        mugImg.onload = resolve;
        mugImg.onerror = reject;
        mugImg.src = currentBaseImage;
      });
      
      ctx.drawImage(mugImg, 0, 0, canvas.width, canvas.height);
      
      // Draw uploaded images
      for (const area of currentViewAreas) {
        const previewUrl = imagePreviews[area.id];
        if (!previewUrl) continue;
        
        const position = imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
        
        // Get area position
        let areaX = 50, areaY = 50, areaWidth = 30, areaHeight = 30;
        
        if (area.position) {
          areaX = area.position.x;
          areaY = area.position.y;
          areaWidth = area.position.width;
          areaHeight = area.position.height;
        } else if (area.slot) {
          const slotPos = getSlotPosition(area.slot);
          areaX = slotPos.x;
          areaY = slotPos.y;
          areaWidth = slotPos.width;
          areaHeight = slotPos.height;
        }
        
        // Convert percentages to pixels
        const pixelX = (areaX / 100) * canvas.width;
        const pixelY = (areaY / 100) * canvas.height;
        const pixelWidth = (areaWidth / 100) * canvas.width;
        const pixelHeight = (areaHeight / 100) * canvas.height;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = previewUrl;
        });
        
        ctx.save();
        ctx.translate(pixelX + pixelWidth / 2, pixelY + pixelHeight / 2);
        ctx.rotate((position.rotate * Math.PI) / 180);
        
        const scale = position.scale || 0.5;
        
        ctx.drawImage(
          img,
          position.x - (pixelWidth * scale) / 2,
          position.y - (pixelHeight * scale) / 2,
          pixelWidth * scale,
          pixelHeight * scale
        );
        
        ctx.restore();
      }
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error drawing on canvas:", error);
      throw new Error("Failed to generate design preview");
    }
  };

  // Generate preview image
  const generatePreviewImage = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      throw new Error("Please add at least one design.");
    }

    try {
      const dataUrl = await drawDesignOnCanvas();
      return dataUrl;
    } catch (error) {
      console.error("Canvas generation failed:", error);
      
      if (!mugContainerRef.current) {
        throw new Error("Cannot capture preview. Please try again.");
      }

      try {
        const dataUrl = await toPng(mugContainerRef.current, {
          backgroundColor: null,
          pixelRatio: 1,
          cacheBust: true
        });
        return dataUrl;
      } catch (fallbackError) {
        console.error("html-to-image failed:", fallbackError);
        throw new Error("Failed to generate preview.");
      }
    }
  };

  // Upload images to Cloudinary
  const uploadAllImagesToCloudinary = async () => {
    const uploadedUrls = {};
    
    try {
      const imageFiles = Object.values(uploadedImages);
      
      if (imageFiles.length === 0) {
        return uploadedUrls;
      }

      const uploadResults = await uploadImagesAPI(imageFiles);
      
      if (!uploadResults || !Array.isArray(uploadResults)) {
        throw new Error('Invalid response from upload API');
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
      console.error('Cloudinary upload error:', error);
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
      alert("Please add at least one design.");
      return;
    }

    try {
      setIsUploading(true);
      
      const designPreviewUrl = await generatePreviewImage();
      setPreviewImageUrl(designPreviewUrl);
      
      const uploadedUrls = await uploadAllImagesToCloudinary();
      setCloudinaryUrls(uploadedUrls);
      
      setShowPreviewModal(true);
      
    } catch (error) {
      console.error("Failed to process images:", error);
      alert(error.message || "Failed to process images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Add to cart
  const addDesignToCart = async (cloudinaryUrlsData) => {
    if (!product || !cloudinaryUrlsData) {
      alert("Product data not loaded. Please try again.");
      return;
    }

    if (Object.keys(cloudinaryUrlsData).length === 0) {
      alert("Please upload designs first.");
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Prepare print areas data
      const printAreas = {};
      
      currentViewAreas.forEach(area => {
        if (uploadedImages[area.id] && cloudinaryUrlsData[area.id]) {
          const viewName = area.slot ? 'wrap' : view;
          
          printAreas[area.id] = {
            enabled: true,
            area: area.name.toLowerCase().replace(/\s+/g, '_'),
            slot: area.slot || null,
            image: {
              url: cloudinaryUrlsData[area.id],
              width: 1200,
              height: 1400,
              source: 'cloudinary',
              position: imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
            },
            view: viewName
          };
        }
      });
      
      // Create cart item
      const cartItem = {
        productId: product._id,
        productSlug: product.slug,
        productName: product.name,
        quantity: 1,
        variant: {
          view: view
        },
        designData: {
          cloudinary_urls: cloudinaryUrlsData,
          print_areas: printAreas,
          positions: imagePositions,
          preview_url: previewImageUrl
        },
        metadata: {
          view_configuration: {
            current_view: view
          },
          image_positions: imagePositions,
          uploaded_areas: Object.keys(uploadedImages).map(areaId => {
            const area = currentViewAreas.find(a => a.id === areaId);
            return {
              id: areaId,
              name: area?.name || 'Unknown Area',
              slot: area?.slot || null,
              position: imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
            };
          }),
          design_timestamp: new Date().toISOString()
        },
        product: {
          id: product._id,
          slug: product.slug,
          type: 'mug',
          name: product.name,
          print_config_id: printConfig?._id
        }
      };
      
      const cartResult = await cartManager.addItem(cartItem);
      
      if (cartResult.success) {
        const designs = JSON.parse(localStorage.getItem('mugDesigns') || '[]');
        setSavedDesignsCount(designs.length);
        
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItemCount(cartItems.reduce((total, item) => total + item.quantity, 0));
        
        alert(`Design added to cart successfully!`);
        setShowPreviewModal(false);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(`Failed to add to cart: ${error.message}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  // Global mouse listeners
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

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const totalUploadedAreas = Object.keys(uploadedImages).length;

  if (isStudioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-300 border-t-black animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">
              Design your custom Mug
            </h2>
            <p className="text-sm text-gray-500">
              Preparing design studio…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-x-hidden lg:px-32">
      {/* Cart Badge */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/cart"
          className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-colors"
        >
          <span>🛒</span>
          <span>Cart ({cartItemCount})</span>
        </Link>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Mug Design Preview</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-auto max-h-[60vh]">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Preview Image */}
                <div className="lg:w-1/2">
                  <div className="flex justify-center mb-4">
                    <img
                      src={previewImageUrl}
                      alt="Mug Design Preview"
                      className="max-w-full max-h-[300px] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <button
                      onClick={() => addDesignToCart(cloudinaryUrls)}
                      disabled={isAddingToCart}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm w-full ${
                        isAddingToCart
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {isAddingToCart ? 'Adding to Cart...' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
                
                {/* Uploaded Images */}
                <div className="lg:w-1/2">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Designs</h3>
                  <div className="space-y-3">
                    {Object.entries(cloudinaryUrls).map(([areaId, url]) => {
                      const area = currentViewAreas.find(a => a.id === areaId);
                      return (
                        <div key={areaId} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-sm">{area?.name || areaId}</span>
                              {area?.slot && (
                                <span className="text-xs text-gray-500 ml-2">({area.slot})</span>
                              )}
                            </div>
                            <button
                              onClick={() => copyToClipboard(url)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            >
                              Copy URL
                            </button>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded break-all">
                            {url.substring(0, 60)}...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="lg:grid lg:grid-cols-[1fr_420px] gap-8 p-4 lg:p-8">
        
        {/* Left: Mug Preview */}
        <div className="flex flex-col items-center">
          {/* Hidden canvas */}
          <canvas
            ref={mugCanvasRef}
            style={{ display: 'none' }}
            width={800}
            height={800}
          />

          <div className="w-full flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {product?.name || 'Custom Mug'}
            </h1>
            {savedDesignsCount > 0 && (
              <Link
                href="/my-designs"
                className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200"
              >
                📁 {savedDesignsCount} saved
              </Link>
            )}
          </div>

          {/* View Selector */}
          <div className="flex gap-3 mb-6 w-full">
            {["front", "back", "full_wrap"].map(v => (
              <button
                key={v}
                onClick={() => {
                  setView(v)
                  setSelectedArea(null)
                }}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  view === v
                    ? "bg-black text-white"
                    : "border hover:bg-gray-50"
                }`}
              >
                {v === "full_wrap" ? "360° Wrap" : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Mug Preview Container */}
          <div 
            ref={mugContainerRef}
            className="relative w-full max-w-lg aspect-square border rounded-xl overflow-hidden bg-gray-50"
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {currentBaseImage && (
              <img
                src={currentBaseImage}
                alt="Mug Preview"
                className="absolute inset-0 w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            )}

            {/* Uploaded Design Overlays */}
            {currentViewAreas.map(area => {
              const previewUrl = imagePreviews[area.id];
              if (!previewUrl) return null;

              const position = imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
              const isSelected = selectedArea?.id === area.id;

              // Get area position
              let areaStyle = {};
              
              if (area.position) {
                areaStyle = {
                  top: `${area.position.y}%`,
                  left: `${area.position.x}%`,
                  width: `${area.position.width}%`,
                  height: `${area.position.height}%`
                };
              } else if (area.slot) {
                const slotPos = getSlotPosition(area.slot);
                areaStyle = {
                  top: `${slotPos.y}%`,
                  left: `${slotPos.x}%`,
                  width: `${slotPos.width}%`,
                  height: `${slotPos.height}%`
                };
              }

              return (
                <div
                  key={area.id}
                  className="absolute"
                  style={{
                    ...areaStyle,
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
                    
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State Overlay */}
            {totalUploadedAreas === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">✨ No designs yet</p>
                  <p className="text-xs text-gray-400">Select an area below to upload</p>
                </div>
              </div>
            )}
          </div>

          {/* Position Controls */}
          {selectedArea && uploadedImages[selectedArea.id] && (
            <div className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border shadow-sm w-full">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => zoomOut(selectedArea.id)}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-50"
                    disabled={imagePositions[selectedArea.id]?.scale <= 0.2}
                  >
                    <span className="text-lg">−</span>
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Small</span>
                      <span>{(imagePositions[selectedArea.id]?.scale || 0.5).toFixed(1)}x</span>
                      <span>Large</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3"
                      step="0.1"
                      value={imagePositions[selectedArea.id]?.scale || 0.5}
                      onChange={(e) => handleZoomChange(selectedArea.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <button 
                    onClick={() => zoomIn(selectedArea.id)}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-50"
                    disabled={imagePositions[selectedArea.id]?.scale >= 3}
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
            </div>
          )}
        </div>

        {/* Right: Print Areas Panel */}
        <aside className="space-y-6 mt-6 lg:mt-0">
          <div className="bg-white border rounded-2xl shadow-lg p-6 space-y-6">
            
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Print Areas</h2>
              <span className="text-sm px-3 py-1 bg-gray-100 rounded-full">
                {view === "full_wrap"
                  ? "3 Panel Wrap"
                  : view.charAt(0).toUpperCase() + view.slice(1)}
              </span>
            </div>

            {/* Upload Rules */}
            {view === "full_wrap" && totalUploadedAreas > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm text-blue-800">
                ⚡ One design shared across all wrap panels
              </div>
            )}

            {/* Areas Grid */}
            <div className={`grid ${view === "full_wrap" ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
              {currentViewAreas.map(area => {
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
                    <p className="font-semibold text-sm">{area.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {area.max}
                    </p>
                    {hasImage && (
                      <span className="text-xs text-green-600 font-medium inline-block mt-2">
                        ✓ Design added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upload Panel */}
            {selectedArea && (
              <div className="border rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{selectedArea.name}</h3>
                    <p className="text-xs text-gray-500">
                      Max size: {selectedArea.max}
                    </p>
                  </div>
                  {uploadedImages[selectedArea.id] && (
                    <button
                      onClick={() => removeImage(selectedArea.id)}
                      className="text-red-600 text-sm hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors relative overflow-hidden bg-gray-50">
                  {uploadedImages[selectedArea.id] ? (
                    <img
                      src={imagePreviews[selectedArea.id]}
                      alt="Uploaded design"
                      className="object-contain p-2 w-full h-full"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-sm text-gray-500 block">Click to upload</span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        PNG, JPG up to 5MB
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, selectedArea.id)}
                  />
                </label>

                {uploadedImages[selectedArea.id] && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => resetPosition(selectedArea.id)}
                      className="py-2 border rounded-lg text-sm hover:bg-gray-50"
                    >
                      Reset Position
                    </button>
                    <button
                      onClick={() => handleRotate(selectedArea.id)}
                      className="py-2 border rounded-lg text-sm hover:bg-gray-50"
                    >
                      Rotate 45°
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t">
              <button
                onClick={handlePreviewAndAddToCart}
                disabled={isUploading || totalUploadedAreas === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isUploading || totalUploadedAreas === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : totalUploadedAreas === 0 ? (
                  'Add a design to preview'
                ) : (
                  '🖼️ Preview & Add to Cart'
                )}
              </button>
              
              {totalUploadedAreas > 0 && !showPreviewModal && (
                <p className="text-xs text-gray-500 text-center">
                  Drag to position • Scroll to zoom • Click rotate
                </p>
              )}
            </div>
          </div>

          {/* Product Info Card */}
          <div className="bg-white border rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold mb-3">Product Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Material:</span>
                <span className="font-medium">
                  {product?.material?.split(",").map(m => m.trim()).join(" • ") || 'Ceramic'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Capacity:</span>
                <span className="font-medium">11 oz / 325ml</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500">Price:</span>
                <span className="font-bold text-xl text-black">
                  {product?.pricing?.currency} {product?.pricing?.specialPrice}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}