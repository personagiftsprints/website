"use client"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { toPng } from 'html-to-image'
import Link from "next/link"
import cartManager from '@/lib/cart';
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

  // New state for controlling area visibility
  const [showCenterChest, setShowCenterChest] = useState(false)
  const [showLeftChest, setShowLeftChest] = useState(false)

  // Image position controls
  const [imagePositions, setImagePositions] = useState({})

  const data = tshirtData.tshirt

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

  // Function to generate preview (without downloading)
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

  // Function to download the preview
  const downloadPreview = (dataUrl) => {
    const link = document.createElement('a');
    link.download = `tshirt-design-${new Date().getTime()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Function to save design to localStorage
  const saveDesignToLocalStorage = async (dataUrl, cloudinaryUrls = {}) => {
    if (!dataUrl) return null;
    
    try {
      // Create design object with ALL coordinates and positions
      const designData = {
        id: `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        previewImage: dataUrl,
        productId: product?.id || '',
        productSlug: slug || '',
        productName: product?.name || '',
        color: selectedColor,
        view: view,
        imagePositions: JSON.parse(JSON.stringify(imagePositions)), // Deep clone
        uploadedImages: Object.keys(uploadedImages),
        totalUploadedAreas: Object.keys(uploadedImages).length,
        cloudinaryUrls: cloudinaryUrls, // Store Cloudinary URLs
        areaConfigurations: currentViewAreas.map(area => ({
          id: area.id,
          name: area.name,
          position: area.position,
          width: area.width,
          height: area.height,
          max: area.max,
          hasImage: !!uploadedImages[area.id],
          imagePosition: imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 },
          cloudinaryUrl: cloudinaryUrls[area.id] || null
        })),
        metadata: {
          selectedColor,
          view,
          imagePositions: JSON.parse(JSON.stringify(imagePositions)),
          selectedAreas: Object.keys(uploadedImages),
          totalUploadedAreas: Object.keys(uploadedImages).length,
          previewGenerated: true,
          timestamp: new Date().toISOString(),
          tshirtImageUrl: current[view],
          productSlug: slug,
          showCenterChest,
          showLeftChest,
          cloudinaryUrls: cloudinaryUrls
        },
        savedAt: new Date().toISOString(),
        price: product?.pricing?.specialPrice || '0',
        currency: product?.pricing?.currency || '$',
        productDetails: {
          name: product?.name,
          description: product?.description,
          material: product?.material,
          price: product?.pricing?.specialPrice,
          currency: product?.pricing?.currency
        }
      };

      // Get existing designs from localStorage
      const existingDesigns = JSON.parse(localStorage.getItem('tshirtDesigns') || '[]');
      
      // Add new design
      existingDesigns.unshift(designData);
      
      // Keep only last 20 designs to prevent localStorage overflow
      const limitedDesigns = existingDesigns.slice(0, 20);
      
      // Save to localStorage
      localStorage.setItem('tshirtDesigns', JSON.stringify(limitedDesigns));
      
      console.log('✅ Design saved to localStorage:', designData.id);
      return designData.id;
      
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return null;
    }
  };

  // Function to generate and save individual area previews
  const generateAreaPreviews = async () => {
    const areaPreviews = {};
    
    for (const [areaId, previewUrl] of Object.entries(imagePreviews)) {
      try {
        // Create a canvas for each area
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Create white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Load the image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = previewUrl;
        });
        
        const position = imagePositions[areaId] || { x: 0, y: 0, scale: 0.5, rotate: 0 };
        
        // Apply transformations
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((position.rotate * Math.PI) / 180);
        ctx.scale(position.scale, position.scale);
        
        // Draw image centered
        const scaledWidth = canvas.width * position.scale;
        const scaledHeight = canvas.height * position.scale;
        
        ctx.drawImage(
          img,
          -scaledWidth / 2 + (position.x * 2),
          -scaledHeight / 2 + (position.y * 2),
          scaledWidth,
          scaledHeight
        );
        
        ctx.restore();
        
        areaPreviews[areaId] = canvas.toDataURL('image/png');
      } catch (error) {
        console.error(`Error generating preview for area ${areaId}:`, error);
      }
    }
    
    return areaPreviews;
  };

  // Function to upload all images to Cloudinary using your existing API
// Function to upload all images to Cloudinary using your existing API
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
      fileCount: imageFiles.length,
      files: imageFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      }))
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
    
    console.log('🗺️ Mapping URLs to area IDs:', areaIds);
    
    uploadResults.forEach((imageData, index) => {
      const areaId = areaIds[index];
      if (areaId && imageData.url) {
        uploadedUrls[areaId] = imageData.url;
        console.log(`✅ Uploaded image for area ${areaId}:`, imageData.url);
      } else {
        console.warn(`⚠️ Could not map upload result ${index} to area ID`, imageData);
      }
    });

    console.log('🎉 Upload completed successfully:', uploadedUrls);
    return uploadedUrls;
    
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    
    // Show error to user
    alert(`Upload failed: ${error.message}. Using local previews instead.`);
    
    // Fallback: Use local preview URLs if upload fails
    console.log('🔄 Using local preview URLs as fallback');
    Object.entries(imagePreviews).forEach(([areaId, previewUrl]) => {
      uploadedUrls[areaId] = previewUrl;
    });
    
    return uploadedUrls;
  }
};

  // Show preview modal
  const handleShowPreview = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      alert("Please add at least one design to preview.");
      return;
    }

    try {
      setIsAddingToCart(true);
      const dataUrl = await generatePreviewImage();
      setPreviewImageUrl(dataUrl);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Failed to generate preview:", error);
      alert(error.message || "Failed to generate preview. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Download from preview modal
  const handleDownloadFromPreview = () => {
    if (previewImageUrl) {
      downloadPreview(previewImageUrl);
      setPreviewGenerated(true);
      setShowPreviewModal(false);
      alert("Design preview downloaded!");
    }
  };

  // Quick preview button (just download)
  const handleQuickPreview = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      alert("Please add at least one design to preview.");
      return;
    }

    try {
      setIsAddingToCart(true);
      const dataUrl = await generatePreviewImage();
      downloadPreview(dataUrl);
      
      // Save to localStorage
      const savedId = await saveDesignToLocalStorage(dataUrl);
      if (savedId) setSavedDesignId(savedId);
      
      setPreviewGenerated(true);
      alert("Design downloaded and saved to local storage!");
    } catch (error) {
      console.error("Failed to generate preview:", error);
      alert(error.message || "Failed to generate preview. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Combined handler that shows preview first, then adds to cart
  const handlePreviewAndAddToCart = async () => {
    if (Object.keys(uploadedImages).length === 0) {
      alert("Please add at least one design before adding to cart.");
      return;
    }

    try {
      setIsAddingToCart(true);
      
      // Step 1: Generate preview
      const dataUrl = await generatePreviewImage();
      
      // Show preview modal first
      setPreviewImageUrl(dataUrl);
      setShowPreviewModal(true);
      
    } catch (error) {
      console.error("Failed to generate preview:", error);
      alert(error.message || "Failed to generate preview. Please try again.");
      setIsAddingToCart(false);
    }
  };

  // Handler for when user confirms download and wants to add to cart
// Handler for when user confirms download and wants to add to cart
const handleConfirmAndAddToCart = async () => {
  if (!previewImageUrl) return;
  
  try {
    // 1. Download the preview
    downloadPreview(previewImageUrl);
    setPreviewGenerated(true);
    setShowPreviewModal(false);
    
    // 2. Upload images to Cloudinary with timeout
    let uploadedImageUrls = {};
    try {
      console.log('🔄 Starting image upload process...');
      uploadedImageUrls = await Promise.race([
        uploadAllImagesToCloudinary(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
        )
      ]);
      console.log('✅ Upload completed:', uploadedImageUrls);
    } catch (uploadError) {
      console.error('❌ Upload failed, using fallback:', uploadError);
      // Use local URLs as fallback
      Object.entries(imagePreviews).forEach(([areaId, previewUrl]) => {
        uploadedImageUrls[areaId] = previewUrl;
      });
    }
    
    // 3. Generate area previews
    const areaPreviews = await generateAreaPreviews();
    
    // 4. Save design to localStorage
    const savedId = await saveDesignToLocalStorage(previewImageUrl, uploadedImageUrls);
    if (savedId) setSavedDesignId(savedId);
    
    // ... rest of your code remains the same
    // 5. Prepare cart item data
    const cartItemData = {
      // ... your cart item data
    };
    
    // 6. Add to cart using cart manager
    const result = cartManager.addToCart(cartItemData);
    
    if (result.success) {
      let message = `✅ Design added to cart!\n\n`;
      message += `Item: ${cartItemData.productName}\n`;
      message += `Size: ${cartItemData.variant.size}\n`;
      message += `Color: ${cartItemData.variant.color}\n`;
      message += `Price: ${cartItemData.currency}${cartItemData.price}\n`;
      message += `\nCart now has ${cartManager.getItemCount()} items`;
      
      // Check if upload was successful
      const hasCloudinaryUrls = Object.values(uploadedImageUrls).some(url => 
        url && url.includes('cloudinary') || url.includes('res.cloudinary.com')
      );
      
      if (hasCloudinaryUrls) {
        message += '\n✅ Images uploaded to Cloudinary';
      } else {
        message += '\n⚠️ Using local image previews (upload failed)';
      }
      
      alert(message);
      
      // Update cart badge
      updateCartBadge();
      
    } else {
      alert('Failed to add to cart. Please try again.');
    }
    
  } catch (error) {
    console.error("❌ Failed to process design:", error);
    alert(`Failed to save your design: ${error.message}`);
  } finally {
    setIsAddingToCart(false);
  }
};

  // Helper function to update cart badge
  const updateCartBadge = () => {
    const itemCount = cartManager.getItemCount();
    const badgeElement = document.getElementById('cart-badge');
    if (badgeElement) {
      badgeElement.textContent = itemCount > 9 ? '9+' : itemCount;
      badgeElement.style.display = itemCount > 0 ? 'flex' : 'none';
    }
  };

  // Load cart badge on component mount
  useEffect(() => {
    updateCartBadge();
  }, []);

  // Load saved designs count
  const [savedDesignsCount, setSavedDesignsCount] = useState(0);
  
  useEffect(() => {
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
          width={800}
          height={800}
        />
        
        <div 
          ref={tshirtContainerRef}
          className="relative tshirt-container"
          style={{ width: '100%', maxWidth: '660px', height: '730px' }}
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
  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <div className="bg-white overflow-x-hidden lg:px-32">
      {/* Preview Modal */}
      {showPreviewModal && previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Design Preview</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-auto max-h-[60vh]">
              <div className="flex justify-center">
                <img
                  src={previewImageUrl}
                  alt="Design Preview"
                  className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
                />
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-4">
                  This is how your custom design will look. You can download it now and add to cart.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDownloadFromPreview}
                    className="px-6 py-3 border-2 border-black rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    ⬇️ Download Only
                  </button>
                  
                  <button
                    onClick={handleConfirmAndAddToCart}
                    disabled={isAddingToCart}
                    className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      '⬇️ Download & Add to Cart'
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                The design will be downloaded as a PNG file. You'll also get a copy saved to your cart.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Responsive Layout */}
      <div className="lg:grid lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,340px)] lg:gap-6 lg:p-8 p-4 space-y-6 lg:space-y-0 max-w-full">
        
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
                  {product?.pricing?.currency} {product?.pricing?.specialPrice}
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
                          ? "ring-4 ring-black ring-offset-2 shadow-lg scale-110"
                          : "border-gray-200 hover:border-gray-300 hover:scale-105"
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
        </aside>

        {/* Main T-shirt Preview */}
        <main className="bg-white p-4 lg:p-2 flex items-center justify-center relative w-full">
          <div className="w-full max-w-2xl mx-auto">
            {renderTshirtWithOverlay()}
            
            {/* Enhanced Controls overlay */}
            <div className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border shadow-sm">
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

        <aside className="space-y-6 w-full">
          {/* Saved Designs Banner */}
          {savedDesignsCount > 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">📁 Saved Designs</h3>
                  <p className="text-sm opacity-90">{savedDesignsCount} design{savedDesignsCount !== 1 ? 's' : ''} in local storage</p>
                </div>
                <Link
                  href="/my-designs"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
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
                <button 
                  onClick={() => setShowLeftChest(v => !v)} 
                  className={`border p-3 rounded-xl ${showLeftChest ? 'bg-black text-white' : ''}`}
                >
                  Left Chest
                </button>
              </div>
            )}

            {/* Rules */}
            {view === "front" && hasUploadInFrontView && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm">
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
                    className={`p-4 rounded-xl border-2 text-left transition ${
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

            {/* UPLOAD PANEL */}
            {selectedArea && canUploadToArea(selectedArea.id) && (
              <div className="border rounded-2xl p-5 space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">{selectedArea.name}</h3>
                    <p className="text-xs text-gray-500">Max size: {selectedArea.max}</p>
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

                <label className="h-36 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors relative overflow-hidden">
                  {uploadedImages[selectedArea.id] ? (
                    <img
                      src={imagePreviews[selectedArea.id]}
                      alt="Uploaded design"
                      className="object-contain p-3 w-full h-full"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">Upload design</span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, selectedArea.id)}
                  />
                </label>

                {uploadedImages[selectedArea.id] && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => resetPosition(selectedArea.id)}
                        className="py-2 border rounded-lg text-sm hover:bg-gray-50"
                      >
                        Reset All
                      </button>
                      <button
                        onClick={() => handleRotate(selectedArea.id)}
                        className="py-2 border rounded-lg text-sm hover:bg-gray-50"
                      >
                        Rotate 45°
                      </button>
                    </div>
                    
                    {/* Quick size buttons */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Quick Size:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[0.25, 0.5, 0.75, 1].map(size => (
                          <button
                            key={size}
                            onClick={() => handleZoomChange(selectedArea.id, size)}
                            className={`py-1 text-xs border rounded ${
                              Math.abs((imagePositions[selectedArea.id]?.scale || 0.5) - size) < 0.05
                                ? 'bg-black text-white border-black'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {size}x
                          </button>
                        ))}
                      </div>
                    </div>
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
            <div className="space-y-3">
              {totalUploadedAreas > 0 && (
                <>
                  <button
                    onClick={handleShowPreview}
                    disabled={isAddingToCart}
                    className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
                  >
                    {isAddingToCart ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Generating Preview...
                      </div>
                    ) : (
                      '👁️ Preview Design'
                    )}
                  </button>
                  
                  <button
                    onClick={handleQuickPreview}
                    disabled={isAddingToCart}
                    className="w-full py-3 border-2 border-black rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
                  >
                    {isAddingToCart ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      '⬇️ Quick Download'
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  handlePreviewAndAddToCart().catch(console.error);
                }}
                disabled={isAddingToCart || totalUploadedAreas === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isAddingToCart || totalUploadedAreas === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-900 active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {isAddingToCart ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : totalUploadedAreas === 0 ? (
                  'Add a design to continue'
                ) : previewGenerated ? (
                  `✅ Download & Add to Cart - ${product?.pricing?.currency} ${product?.pricing?.specialPrice}`
                ) : (
                  `⬇️ Download & Add to Cart - ${product?.pricing?.currency} ${product?.pricing?.specialPrice}`
                )}
              </button>
              
              {/* Success Message */}
              {previewGenerated && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-700 font-semibold">
                        ✅ Design saved successfully!
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Design ID: {savedDesignId?.slice(-8) || 'N/A'}
                      </p>
                      <p className="text-xs text-green-600">
                        Size: {selectedSize} • Color: {selectedColor}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/design-viewer?id=${savedDesignId}`}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        View Design
                      </Link>
                      <Link
                        href="/my-designs"
                        className="px-3 py-1 text-xs border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                      >
                        All Designs
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {totalUploadedAreas > 0 && !previewGenerated && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Click "Preview Design" to see your design before downloading
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}