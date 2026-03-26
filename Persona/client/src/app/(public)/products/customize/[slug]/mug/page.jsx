"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { toPng } from 'html-to-image'
import { getProductBySlug, uploadImagesAPI } from "@/services/product.service"
import { getPrintConfigBySlug } from "@/services/printArea.service"
import DesignLibraryModal from "@/components/design/DesignLibraryModal"

export default function MugDesigner() {
  const { slug } = useParams()
  const searchParams = useSearchParams()

  // State management
  const [selectedArea, setSelectedArea] = useState(null)
  const [uploadedImages, setUploadedImages] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})
  
  // Text layers state
  const [textLayers, setTextLayers] = useState({})
  const [textPositions, setTextPositions] = useState({})
  
  const [isStudioLoading, setIsStudioLoading] = useState(true)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [successPreviews, setSuccessPreviews] = useState({ front: null, center: null, back: null })
  const [confirmedPreviewUrls, setConfirmedPreviewUrls] = useState({
    front: null,
    center: null,
    back: null
  })
  const [isConfirming, setIsConfirming] = useState(false)
  const [proposedView, setProposedView] = useState(null)
  const [showConfirmSwitchModal, setShowConfirmSwitchModal] = useState(false)

  // Image position controls
  const [imagePositions, setImagePositions] = useState({})

  // Cloudinary state
  const [showCloudinaryUrls, setShowCloudinaryUrls] = useState(false)
  const [cloudinaryUrls, setCloudinaryUrls] = useState({})
  const [isUploading, setIsUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [libraryDesigns, setLibraryDesigns] = useState({}) 

  // Product data
  const [product, setProduct] = useState(null)
  const [printConfig, setPrintConfig] = useState(null)

  // Refs
  const mugContainerRef = useRef(null)
  const mugCanvasRef = useRef(null)
  const isDraggingRef = useRef(false)
  const isDraggingTextRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const currentAreaRef = useRef(null)
  const currentTextAreaRef = useRef(null)

  // Cart state
  const [cartItemCount, setCartItemCount] = useState(0)
  const [savedDesignsCount, setSavedDesignsCount] = useState(0)

  // View state - only front and back
  const [view, setView] = useState("front")
  const [isLoading, setIsLoading] = useState(true)

  // Cart manager
  const cartManager = {
    addItem: async (item) => {
      try {
        // console.log('🛒 Adding to cart:', item)
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]')
        
        const uniqueId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${item.productId}`
        
        const existingIndex = cartItems.findIndex(cartItem => 
          cartItem.productId === item.productId &&
          JSON.stringify(cartItem.designData?.cloudinary_urls) === JSON.stringify(item.designData?.cloudinary_urls)
        )
        
        if (existingIndex > -1) {
          cartItems[existingIndex].quantity += item.quantity
        } else {
          cartItems.push({
            ...item,
            id: uniqueId,
            addedAt: new Date().toISOString()
          })
        }
        
        localStorage.setItem('cart', JSON.stringify(cartItems))
        window.dispatchEvent(new Event("cart-updated"))
        
        const designs = JSON.parse(localStorage.getItem('mugDesigns') || '[]')
        designs.push({
          ...item,
          id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          saved_at: new Date().toISOString()
        })
        localStorage.setItem('mugDesigns', JSON.stringify(designs))
        
        return {
          success: true,
          message: 'Added to cart successfully',
          cartCount: cartItems.length
        }
      } catch (error) {
        console.error('❌ Error adding to cart:', error)
        return { success: false, error: error.message }
      }
    },
    getItems: () => JSON.parse(localStorage.getItem('cart') || '[]'),
    getItemCount: () => {
      const items = JSON.parse(localStorage.getItem('cart') || '[]')
      return items.reduce((total, item) => total + item.quantity, 0)
    }
  }

  // getStructuredProductDataForCart - only front/back
  const getStructuredProductDataForCart = (cloudinaryUrlsData) => {
    if (!product) return null;

    const printAreas = {};

    Object.keys(printConfig?.views || {}).forEach(viewKey => {
      // Skip full_wrap view
      if (viewKey === "full_wrap") return;
      
      const areas = printConfig?.views?.[viewKey]?.areas || [];
      areas.forEach(area => {
        // Handle image uploads
        if (uploadedImages[area.id] && cloudinaryUrlsData[area.id]) {
          printAreas[viewKey] = {
            enabled: true,
            area: area.name.toLowerCase().replace(/\s+/g, '_'),
            orientation_id: `ori_${area.name.toLowerCase().replace(/\s+/g, '_')}`,
            image: {
              url: cloudinaryUrlsData[area.id],
              width: 800,
              height: 800,
              source: 'cloudinary',
              position: imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
            },
            view: viewKey,
            metadata: {
              design_type: "single",
              placement: area.name
            }
          };
        }
        
        // Handle text-only areas
        if (textLayers[area.id]?.content) {
          if (!printAreas[viewKey]) {
            printAreas[viewKey] = {
              enabled: true,
              area: area.name.toLowerCase().replace(/\s+/g, '_'),
              orientation_id: `ori_${area.name.toLowerCase().replace(/\s+/g, '_')}`,
              view: viewKey,
              metadata: {
                design_type: "text_only",
                placement: area.name
              }
            };
          }
          
          printAreas[viewKey].text_layers = {
            content: textLayers[area.id].content,
            fontSize: textLayers[area.id].fontSize,
            color: textLayers[area.id].color,
            fontFamily: textLayers[area.id].fontFamily,
            fontWeight: textLayers[area.id].fontWeight,
            textShadow: textLayers[area.id].textShadow,
            position: textPositions[area.id] || { x: 0, y: 0, scale: 1, rotate: 0 }
          };
        }
      });
    });

    return {
      productSnapshot: {
        id: product._id,
        slug: product.slug || slug,
        name: product.name || "Custom Mug",
        type: "mug",
        description: product.description || "",
        basePrice: product.pricing?.price || 0,
        specialPrice: product.pricing?.specialPrice || 0,
        currency: product.pricing?.currency || "INR",
        image: product.images?.[0]?.url || product.image || null,
        material: product.material || "Ceramic"
      },
      variant: {
        color: 'white',
        color_label: 'White'
      },
      quantity: 1,
      print_areas: printAreas,
      cloudinary_urls: cloudinaryUrlsData,
      text_layers: textLayers,
      text_positions: textPositions,
      metadata: {
        product_type: "mug",
        view_configuration: { 
          current_view: view,
          available_views: ["front", "center", "back"]
        },
        image_positions: imagePositions,
        text_positions: textPositions,
        uploaded_areas: Object.keys(uploadedImages).map(key => ({
          id: key,
          position: imagePositions[key] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
        })),
        text_areas: Object.keys(textLayers).map(id => {
          const area = currentViewAreas.find(a => a.id === id);
          return {
            id: id,
            name: area?.name || id,
            view: view,
            content: textLayers[id]?.content,
            position: textPositions[id] || { x: 0, y: 0, scale: 1, rotate: 0 }
          };
        }),
        text_summary: Object.keys(textLayers).map(id => ({
          area_id: id,
          text: textLayers[id]?.content,
          enabled: !!textLayers[id]?.content
        })),
        design_timestamp: new Date().toISOString()
      },
      currency: product.pricing?.currency || 'INR'
    };
  };

  // Add to cart function
  const addDesignToCart = async (cloudinaryUrlsData) => {
    if (!product || !cloudinaryUrlsData) {
      alert("Product data not loaded.")
      return
    }

    if (Object.keys(cloudinaryUrlsData).length === 0 && Object.keys(textLayers).length === 0) {
      alert("Please upload designs or add text first.")
      return
    }

    if (!confirmedPreviewUrls.front && !confirmedPreviewUrls.center && !confirmedPreviewUrls.back) {
      alert("Please confirm at least one view's design first.")
      return
    }

    try {
      setIsAddingToCart(true)

      const previewUrls = {
        front: confirmedPreviewUrls.front,
        center: confirmedPreviewUrls.center,
        back: confirmedPreviewUrls.back
      }

      const mainPreviewUrl = previewUrls.front || previewUrls.center || previewUrls.back || null
      if (mainPreviewUrl) setPreviewImageUrl(mainPreviewUrl)

      const cartData = getStructuredProductDataForCart(cloudinaryUrlsData)
      if (!cartData) throw new Error("No cart data")

      const cartItem = {
        productId: cartData.productSnapshot.id,
        productSlug: cartData.productSnapshot.slug,
        name: cartData.productSnapshot.name,
        productType: "mug",  
        image: cartData.productSnapshot.image,
        price: cartData.productSnapshot.specialPrice || cartData.productSnapshot.basePrice,
        currency: cartData.currency,
        variant: cartData.variant,
        quantity: cartData.quantity,
        designData: {
          cloudinary_urls: cartData.cloudinary_urls,
          type: "mug",
          preview_url: mainPreviewUrl,
          preview_urls: previewUrls,
          print_areas: cartData.print_areas,
          positions: cartData.metadata?.image_positions || {},
          text_layers: cartData.text_layers,
          text_positions: cartData.text_positions,
          text_content: Object.keys(textLayers).reduce((acc, areaId) => {
            acc[areaId] = {
              content: textLayers[areaId]?.content || null,
              enabled: !!textLayers[areaId]?.content,
              style: {
                fontSize: textLayers[areaId]?.fontSize,
                color: textLayers[areaId]?.color,
                fontFamily: textLayers[areaId]?.fontFamily,
                fontWeight: textLayers[areaId]?.fontWeight
              }
            };
            return acc;
          }, {})
        },
        metadata: cartData.metadata,
        productSnapshot: cartData.productSnapshot
      }

      const result = await cartManager.addItem(cartItem)
      
      if (result.success) {
        setSuccessPreviews({ 
          front: previewUrls.front, 
          center: previewUrls.center,
          back: previewUrls.back
        })
        setShowSuccessModal(true)
        
        const designs = JSON.parse(localStorage.getItem('mugDesigns') || '[]')
        setSavedDesignsCount(designs.length)
        setCartItemCount(cartManager.getItemCount())
        setShowPreviewModal(false)
        setShowCloudinaryUrls(false)
      }
    } catch (err) {
      console.error("Add to cart failed:", err)
      alert("Failed to add: " + (err.message || "Unknown error"))
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Draw design on canvas
  const drawDesignOnCanvas = async () => {
    if (!mugCanvasRef.current) return

    const canvas = mugCanvasRef.current
    const ctx = canvas.getContext('2d')
    
    canvas.width = 800
    canvas.height = 800
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    try {
      const mugImageUrl = printConfig?.views?.[view]?.baseImage
      if (!mugImageUrl) throw new Error("Mug image not found")

      const mugImg = new Image()
      mugImg.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        mugImg.onload = resolve
        mugImg.onerror = reject
        mugImg.src = mugImageUrl
      })
      
      ctx.drawImage(mugImg, 0, 0, canvas.width, canvas.height)

      const areas = printConfig?.views?.[view]?.areas || []
      
      for (const area of areas) {
        const areaX = (area.position?.x || 0) / 100 * canvas.width
        const areaY = (area.position?.y || 0) / 100 * canvas.height
        const areaWidth = (area.width || 100) / 100 * canvas.width
        const areaHeight = (area.height || 100) / 100 * canvas.height

        // Draw image if exists
        const previewUrl = imagePreviews[area.id]
        if (previewUrl) {
          const position = imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 }

          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = previewUrl
          })

          ctx.save()
          ctx.translate(areaX + areaWidth / 2, areaY + areaHeight / 2)
          ctx.rotate((position.rotate * Math.PI) / 180)
          
          const scale = position.scale || 0.5
          ctx.drawImage(
            img,
            position.x - (areaWidth * scale) / 2,
            position.y - (areaHeight * scale) / 2,
            areaWidth * scale,
            areaHeight * scale
          )
          
          ctx.restore()
        }

        // Draw text if exists
        const text = textLayers[area.id]
        if (text?.content) {
          const textPosition = textPositions[area.id] || { x: 0, y: 0, scale: 1, rotate: 0 }

          ctx.save()
          ctx.translate(areaX + areaWidth / 2, areaY + areaHeight / 2)
          ctx.translate(textPosition.x || 0, textPosition.y || 0)
          ctx.rotate((textPosition.rotate || 0) * Math.PI / 180)
          ctx.scale(textPosition.scale || 1, textPosition.scale || 1)

          ctx.fillStyle = text.color || "#000000"
          ctx.font = `${text.fontWeight || 'normal'} ${text.fontSize || 40}px ${text.fontFamily || 'Arial'}`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          
          if (text.textShadow) {
            ctx.shadowColor = text.textShadow
            ctx.shadowBlur = 5
          }

          ctx.fillText(text.content, 0, 0)
          ctx.restore()
        }
      }
      
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error("Error drawing on canvas:", error)
      throw new Error("Failed to generate design preview")
    }
  }

  // Generate preview image
  const generatePreviewImage = async () => {
    if (Object.keys(uploadedImages).length === 0 && Object.keys(textLayers).length === 0) {
      throw new Error("Please add at least one design or text.")
    }

    try {
      return await drawDesignOnCanvas()
    } catch (error) {
      console.error("Canvas generation failed, trying html-to-image...", error)
      
      if (!mugContainerRef.current) {
        throw new Error("Cannot capture preview. Please try again.")
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        const dataUrl = await toPng(mugContainerRef.current, {
          backgroundColor: null,
          pixelRatio: 1,
          cacheBust: true,
          skipFonts: true,
          style: { transform: 'translateZ(0)', willChange: 'transform' }
        })
        return dataUrl
      } catch (fallbackError) {
        console.error("html-to-image also failed:", fallbackError)
        throw new Error("Failed to generate preview. Please try with different images.")
      }
    }
  }

  // Confirm design
  const handleConfirmDesign = async () => {
    if (!mugContainerRef.current) return
    
    if (!selectedArea || (!uploadedImages[selectedArea.id] && !textLayers[selectedArea.id]?.content)) {
      alert("Please select an area with an uploaded image or text.")
      return
    }

    setIsConfirming(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      const dataUrl = await generatePreviewImage()
      const cloudUrl = await uploadPreviewImageToCloudinary(dataUrl)
      
      if (!cloudUrl) throw new Error("Preview upload failed")
      
      setConfirmedPreviewUrls(prev => ({
        ...prev,
        [view]: cloudUrl
      }))
      
      // console.log(`${view.toUpperCase()} preview confirmed:`, cloudUrl)
      return cloudUrl
    } catch (err) {
      console.error("Confirm failed:", err)
      alert("Failed to confirm design: " + err.message)
      return null
    } finally {
      setIsConfirming(false)
    }
  }

  const handleViewChange = (newView) => {
    if (newView === view) return;

    // Check if current view has unconfirmed changes
    const hasDesignInCurrentView = currentViewAreas.some(area => 
      uploadedImages[area.id] || textLayers[area.id]?.content
    );

    if (hasDesignInCurrentView && !confirmedPreviewUrls[view]) {
      setProposedView(newView);
      setShowConfirmSwitchModal(true);
      return;
    }

    setView(newView);
    setIsLoading(true);
  };

  // Upload to Cloudinary
  const uploadPreviewImageToCloudinary = async (dataUrl) => {
    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `preview-${Date.now()}.png`, { type: 'image/png' })

      const uploadResults = await uploadImagesAPI([file])
      
      if (!uploadResults || !Array.isArray(uploadResults) || uploadResults.length === 0) {
        throw new Error("Invalid upload response")
      }

      const url = uploadResults[0].url
      if (!url) throw new Error("No URL returned")
      
      return url
    } catch (error) {
      console.error("Preview Cloudinary upload failed:", error)
      return null
    }
  }

  // Upload all images
  const uploadAllImagesToCloudinary = async () => {
    const uploadedUrls = {}
    
    try {
      const entries = Object.entries(uploadedImages)
      const filesToUpload = []
      const uploadAreaIds = []

      entries.forEach(([areaId, value]) => {
        if (value === "LIBRARY_DESIGN") {
          // Use the existing library design URL
          uploadedUrls[areaId] = libraryDesigns[areaId]?.imageUrl || imagePreviews[areaId]
        } else if (value && typeof value !== 'string') {
          // It's a file
          filesToUpload.push(value)
          uploadAreaIds.push(areaId)
        }
      })
      
      if (filesToUpload.length > 0) {
        const uploadResults = await uploadImagesAPI(filesToUpload)
        
        if (!uploadResults || !Array.isArray(uploadResults)) {
          throw new Error('Invalid response from upload API')
        }

        uploadResults.forEach((imageData, index) => {
          const areaId = uploadAreaIds[index]
          if (areaId && imageData.url) {
            uploadedUrls[areaId] = imageData.url
          }
        })
      }

      return uploadedUrls
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error)
      alert(`Upload failed: ${error.message}. Using local previews instead.`)
      
      Object.entries(imagePreviews).forEach(([areaId, previewUrl]) => {
        uploadedUrls[areaId] = previewUrl
      })
      
      return uploadedUrls
    }
  }

  // Handle preview and add to cart
  const handlePreviewAndAddToCart = async () => {
    if (Object.keys(uploadedImages).length === 0 && Object.keys(textLayers).length === 0) {
      alert("Please add at least one design or text.")
      return
    }

    if (!confirmedPreviewUrls.front && !confirmedPreviewUrls.center && !confirmedPreviewUrls.back) {
      alert("Please confirm your design first by clicking 'Confirm Design' on the selected area.")
      return
    }

    try {
      setIsUploading(true)
      
      const userDesignUrls = await uploadAllImagesToCloudinary()
      setCloudinaryUrls(userDesignUrls)
      
      const localPreviewDataUrl = await generatePreviewImage()
      const previewCloudinaryUrl = await uploadPreviewImageToCloudinary(localPreviewDataUrl)
      const finalPreviewUrl = previewCloudinaryUrl || localPreviewDataUrl
      setPreviewImageUrl(finalPreviewUrl)
      setShowPreviewModal(true)
    } catch (err) {
      console.error("Preview/cart preparation failed:", err)
      alert("Failed to prepare design: " + (err.message || "Unknown error"))
    } finally {
      setIsUploading(false)
    }
  }

  // Load product data
  useEffect(() => {
    if (!slug) return

    const load = async () => {
      try {
        setIsStudioLoading(true)
        const [productRes, configRes] = await Promise.all([
          getProductBySlug(slug),
          getPrintConfigBySlug("mug")
        ])
        
        setProduct(productRes?.data || null)
        setPrintConfig(configRes || null)
        console.log("Print Config:", configRes)
      } finally {
        setIsStudioLoading(false)
      }
    }

    load()
  }, [slug])

  // Load cart counts
  useEffect(() => {
    setCartItemCount(cartManager.getItemCount())
    const designs = JSON.parse(localStorage.getItem('mugDesigns') || '[]')
    setSavedDesignsCount(designs.length)
  }, [])

  useEffect(() => {
    setIsLoading(true)
  }, [view])

  useEffect(() => {
    setSelectedArea(null)
  }, [view])

  // Filter current view areas
  const currentViewAreas = useMemo(() => {
    // Skip full_wrap view
    if (view === "full_wrap") return [];
    return printConfig?.views?.[view]?.areas || []
  }, [printConfig, view])

  // Text drag handlers
  const handleTextDragStart = useCallback((e, areaId) => {
    if (!textLayers[areaId]?.content) return

    isDraggingTextRef.current = true
    currentTextAreaRef.current = areaId
    dragStartRef.current = {
      x: e.clientX - (textPositions[areaId]?.x || 0),
      y: e.clientY - (textPositions[areaId]?.y || 0)
    }

    e.preventDefault()
    setSelectedArea(currentViewAreas.find(a => a.id === areaId) || null)
  }, [textLayers, textPositions, currentViewAreas])

  // Image drag handlers
  const handleDragStart = useCallback((e, areaId) => {
    if (!uploadedImages[areaId]) return
    
    isDraggingRef.current = true
    currentAreaRef.current = areaId
    dragStartRef.current = {
      x: e.clientX - (imagePositions[areaId]?.x || 0),
      y: e.clientY - (imagePositions[areaId]?.y || 0)
    }
    
    e.preventDefault()
    setSelectedArea(currentViewAreas.find(a => a.id === areaId) || null)
  }, [uploadedImages, imagePositions, currentViewAreas])

  const handleDrag = useCallback((e) => {
    if (isDraggingRef.current && currentAreaRef.current) {
      const areaId = currentAreaRef.current
      const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
      
      const newX = e.clientX - dragStartRef.current.x
      const newY = e.clientY - dragStartRef.current.y
      
      const constrainedX = Math.max(-100, Math.min(100, newX))
      const constrainedY = Math.max(-100, Math.min(100, newY))
      
      setImagePositions(prev => ({
        ...prev,
        [areaId]: { ...currentPos, x: constrainedX, y: constrainedY }
      }))
    } else if (isDraggingTextRef.current && currentTextAreaRef.current) {
      const areaId = currentTextAreaRef.current
      const currentPos = textPositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
      
      const newX = e.clientX - dragStartRef.current.x
      const newY = e.clientY - dragStartRef.current.y
      
      const constrainedX = Math.max(-100, Math.min(100, newX))
      const constrainedY = Math.max(-100, Math.min(100, newY))
      
      setTextPositions(prev => ({
        ...prev,
        [areaId]: { ...currentPos, x: constrainedX, y: constrainedY }
      }))
    }
  }, [imagePositions, textPositions])

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false
    isDraggingTextRef.current = false
    currentAreaRef.current = null
    currentTextAreaRef.current = null
  }, [])

  // Text zoom/rotate controls
  const handleTextZoomIn = useCallback((areaId) => {
    if (!textLayers[areaId]) return
    const currentPos = textPositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    setTextPositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: Math.min(3, currentPos.scale + 0.1) }
    }))
  }, [textLayers, textPositions])

  const handleTextZoomOut = useCallback((areaId) => {
    if (!textLayers[areaId]) return
    const currentPos = textPositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    setTextPositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: Math.max(0.5, currentPos.scale - 0.1) }
    }))
  }, [textLayers, textPositions])

  const handleTextRotate = useCallback((areaId) => {
    if (!textLayers[areaId]) return
    const currentPos = textPositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    setTextPositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, rotate: (currentPos.rotate + 45) % 360 }
    }))
  }, [textLayers, textPositions])

  const resetTextPosition = (areaId) => {
    setTextPositions(prev => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 1, rotate: 0 }
    }))
  }

  // Text size slider
  const handleTextSizeChange = useCallback((areaId, value) => {
    if (!textLayers[areaId]) return
    setTextLayers(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        fontSize: value
      }
    }))
  }, [textLayers])

  // Text scale slider
  const handleTextScaleChange = useCallback((areaId, value) => {
    if (!textLayers[areaId]) return
    setTextPositions(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        scale: value
      }
    }))
  }, [textLayers])

  // Wheel for zoom
  const handleWheel = useCallback((e, areaId) => {
    if (!uploadedImages[areaId]) return
    
    e.preventDefault()
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    const scaleDelta = e.deltaY > 0 ? -0.05 : 0.05
    const newScale = Math.max(0.1, Math.min(5, currentPos.scale + scaleDelta))
    
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: newScale }
    }))
  }, [uploadedImages, imagePositions])

  // Zoom controls
  const zoomIn = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: Math.min(5, currentPos.scale + 0.1) }
    }))
  }, [uploadedImages, imagePositions])

  const zoomOut = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, scale: Math.max(0.1, currentPos.scale - 0.1) }
    }))
  }, [uploadedImages, imagePositions])

  const handleRotate = useCallback((areaId) => {
    if (!uploadedImages[areaId]) return
    const currentPos = imagePositions[areaId] || { x: 0, y: 0, scale: 1, rotate: 0 }
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { ...currentPos, rotate: (currentPos.rotate + 45) % 360 }
    }))
  }, [uploadedImages, imagePositions])

  const resetPosition = (areaId) => {
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }))
  }

  // Global mouse listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleDrag(e)
    const handleGlobalMouseUp = () => handleDragEnd()
    
    if (isDraggingRef.current || isDraggingTextRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [handleDrag, handleDragEnd])

  // Handle image upload
  const handleImageUpload = (e, areaId) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    if (!file.type.match('image/(jpeg|png|jpg|webp)')) {
      alert("Only JPG, PNG, and WebP images are allowed")
      return
    }

    if (imagePreviews[areaId]) {
      URL.revokeObjectURL(imagePreviews[areaId])
    }

    const previewUrl = URL.createObjectURL(file)
    
    setImagePreviews(prev => ({ ...prev, [areaId]: previewUrl }))
    setUploadedImages(prev => ({ ...prev, [areaId]: file }))
    setConfirmedPreviewUrls(prev => ({ ...prev, [view]: null }))
    setImagePositions(prev => ({
      ...prev,
      [areaId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }))

    const area = currentViewAreas.find(a => a.id === areaId)
    setSelectedArea(area || null)
  }

  // Remove image
  const removeImage = (areaId) => {
    const previewUrl = imagePreviews[areaId]
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setConfirmedPreviewUrls(prev => ({ ...prev, [view]: null }))
    setUploadedImages(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
    
    setImagePreviews(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
    
    setImagePositions(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })

    setLibraryDesigns(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
    
    if (selectedArea?.id === areaId) {
      setSelectedArea(null)
    }
  }

  const handleLibrarySelect = (design) => {
    try {
      let areaId = selectedArea?.id

      if (!areaId) {
        if (currentViewAreas.length > 0) {
          areaId = currentViewAreas[0].id
          setSelectedArea(currentViewAreas[0])
        } else {
          alert("Please select a print area first.")
          return
        }
      }

      setImagePreviews(prev => ({
        ...prev,
        [areaId]: design.imageUrl
      }))

      setLibraryDesigns(prev => ({
        ...prev,
        [areaId]: design
      }))

      setUploadedImages(prev => ({
        ...prev,
        [areaId]: "LIBRARY_DESIGN" 
      }))

      setConfirmedPreviewUrls(prev => ({ ...prev, [view]: null }))

      setImagePositions(prev => ({
        ...prev,
        [areaId]: { x: 0, y: 0, scale: design.metadata?.defaultScale || 0.5, rotate: 0 }
      }))

      setShowLibrary(false)
    } catch (err) {
      console.error("Error applying library design:", err)
      alert("Failed to apply design")
    }
  }

  // Remove text
  const removeText = (areaId) => {
    setTextLayers(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
    setConfirmedPreviewUrls(prev => ({ ...prev, [view]: null }))
    setTextPositions(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
  }

  // Render mug with overlay
  const renderMugWithOverlay = () => {
    const mugImageUrl = printConfig?.views?.[view]?.baseImage

    return (
      <>
        <canvas
          ref={mugCanvasRef}
          style={{ display: 'none' }}
          width={800}
          height={800}
        />
        
        <div 
          ref={mugContainerRef}
          className="relative w-full max-w-md mx-auto aspect-square mug-container"
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 rounded-lg">
              <div className="h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {mugImageUrl && (
            <img
              key={`${view}`}
              src={mugImageUrl}
              alt="Mug preview"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              crossOrigin="anonymous"
            />
          )}

          {currentViewAreas.map(area => {
            const previewUrl = imagePreviews[area.id]
            const text = textLayers[area.id]
            const hasImage = !!previewUrl
            const hasText = !!(text?.content)
            
            if (!hasImage && !hasText) return null

            const imagePosition = imagePositions[area.id] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
            const textPosition = textPositions[area.id] || { x: 0, y: 0, scale: 1, rotate: 0 }
            const isSelected = selectedArea?.id === area.id

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
                {/* Image Layer */}
                {hasImage && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imagePosition.scale}) rotate(${imagePosition.rotate}deg)`,
                      transformOrigin: 'center center',
                      cursor: 'move',
                      zIndex: 1
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
                  </div>
                )}

                {/* Text Layer */}
                {hasText && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                    style={{
                      transform: `translate(${textPosition.x}px, ${textPosition.y}px) scale(${textPosition.scale}) rotate(${textPosition.rotate}deg)`,
                      transformOrigin: 'center center',
                      cursor: 'move',
                      zIndex: 2
                    }}
                    onMouseDown={(e) => handleTextDragStart(e, area.id)}
                  >
                    <div
                      style={{
                        fontSize: `${text.fontSize || 40}px`,
                        color: text.color || "#000000",
                        fontFamily: text.fontFamily || "Arial",
                        fontWeight: text.fontWeight || "normal",
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                        userSelect: "none",
                        textShadow: text.textShadow || "none"
                      }}
                      className="pointer-events-none"
                    >
                      {text.content}
                    </div>
                  </div>
                )}

                {/* Selection outline */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none z-10" />
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  const totalUploadedAreas = Object.keys(uploadedImages).length
  const totalTextAreas = Object.keys(textLayers).length

  // Check if Add to Cart should be enabled
  const isAddToCartEnabled = useMemo(() => {
    return (
      (totalUploadedAreas > 0 || totalTextAreas > 0) && 
      (confirmedPreviewUrls.front || confirmedPreviewUrls.center || confirmedPreviewUrls.back)
    )
  }, [totalUploadedAreas, totalTextAreas, confirmedPreviewUrls])

  if (isStudioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-300 border-t-black animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Design your custom Mug</h2>
            <p className="text-sm text-gray-500">Preparing design studio…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white lg:h-[calc(100vh-148px)] overflow-hidden">
      {/* Confirm View Switch Modal */}
      {showConfirmSwitchModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                ⚠️
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Unconfirmed Design</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                You have an unconfirmed design on the <strong className="text-black">{view.toUpperCase()}</strong> view. 
                Would you like to confirm it before switching to <strong className="text-black">{proposedView.toUpperCase()}</strong>?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    const result = await handleConfirmDesign();
                    if (result) {
                      setView(proposedView);
                      setShowConfirmSwitchModal(false);
                      setIsLoading(true);
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100"
                >
                  {isConfirming ? (
                    <div className="flex items-center justify-center gap-2">
                       <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       Confirming...
                    </div>
                  ) : "Confirm & Switch View"}
                </button>
                <button
                  onClick={() => {
                    setView(proposedView);
                    setShowConfirmSwitchModal(false);
                    setIsLoading(true);
                  }}
                  className="w-full py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Switch Without Confirming
                </button>
                <button
                  onClick={() => setShowConfirmSwitchModal(false)}
                  className="w-full py-2 text-gray-500 font-medium hover:text-gray-900 transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
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
                Your custom mug design has been added to cart.<br/>
                Here are the previews:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-xl overflow-hidden shadow-md">
                  <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                    Front View
                  </div>
                  {successPreviews.front ? (
                    <img
                      src={successPreviews.front}
                      alt="Front preview"
                      className="w-full h-64 object-contain p-4 bg-gray-50"
                      onError={(e) => e.target.src = "/placeholder-mug.png"}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-100">
                      No front design
                    </div>
                  )}
                </div>
                <div className="border rounded-xl overflow-hidden shadow-md">
                  <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                    Center View
                  </div>
                  {successPreviews.center ? (
                    <img
                      src={successPreviews.center}
                      alt="Center preview"
                      className="w-full h-64 object-contain p-4 bg-gray-50"
                      onError={(e) => e.target.src = "/placeholder-mug.png"}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-100">
                      No center design
                    </div>
                  )}
                </div>
                <div className="border rounded-xl overflow-hidden shadow-md">
                  <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                    Back View
                  </div>
                  {successPreviews.back ? (
                    <img
                      src={successPreviews.back}
                      alt="Back preview"
                      className="w-full h-64 object-contain p-4 bg-gray-50"
                      onError={(e) => e.target.src = "/placeholder-mug.png"}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-100">
                      No back design
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
                  setShowSuccessModal(false)
                  window.location.href = '/cart'
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
                  setShowPreviewModal(false)
                  setShowCloudinaryUrls(false)
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
                  <h3 className="text-xs font-medium text-gray-700 mb-2">Uploaded Images & Text</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {Object.entries(cloudinaryUrls).map(([uploadId, url]) => {
                      const area = currentViewAreas.find(a => a.id === uploadId)
                      const displayName = area?.name || uploadId
                      
                      return (
                        <div key={uploadId} className="flex gap-2 border rounded-lg p-1.5 bg-gray-50">
                          <div className="w-12 h-12 bg-white rounded border flex-shrink-0 overflow-hidden">
                            <img 
                              src={url} 
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{displayName}</p>
                            <p className="text-[10px] text-gray-500">
                              {imagePositions[uploadId] ? `${Math.round(imagePositions[uploadId].scale * 100)}%` : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    {/* Show text-only areas */}
                    {Object.keys(textLayers).map(areaId => {
                      if (cloudinaryUrls[areaId]) return null
                      const text = textLayers[areaId]
                      const area = currentViewAreas.find(a => a.id === areaId)
                      const displayName = `Text - ${area?.name || areaId}`
                      
                      return (
                        <div key={areaId} className="flex gap-2 border rounded-lg p-1.5 bg-blue-50">
                          <div className="w-12 h-12 bg-white rounded border flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
                            ✏️
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{displayName}</p>
                            <p className="text-[10px] text-gray-600 truncate">"{text.content}"</p>
                            <p className="text-[10px] text-gray-500">
                              {text.fontFamily}, {text.fontSize}px
                            </p>
                          </div>
                        </div>
                      )
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
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : !isAddToCartEnabled ? (
                  'Confirm designs first'
                ) : (
                  'Add to Cart'
                )}
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setShowCloudinaryUrls(false)
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
      <div className="lg:h-full lg:grid lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,380px)] lg:gap-6 lg:p-6 p-4 space-y-6 lg:space-y-0 max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Left Sidebar - Product Info */}
        <aside className="hidden lg:block h-full overflow-y-auto no-scrollbar space-y-6 w-full border-r border-r-gray-200 p-4 mr-2">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{product?.name || "Custom Mug"}</h1>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product?.description || "Design your own ceramic mug"}</p>
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

          {/* Controls Panel */}
          <div className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200">
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {["front", "center", "back"].map(v => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
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
            
            {/* Image Controls */}
            {selectedArea && uploadedImages[selectedArea.id] && (
              <div className="space-y-3 mb-4 pb-4 border-b">
                <h4 className="font-semibold text-sm">Image Controls</h4>
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
                      onChange={(e) => {
                        const newScale = parseFloat(e.target.value)
                        setImagePositions(prev => ({
                          ...prev,
                          [selectedArea.id]: { ...prev[selectedArea.id], scale: newScale }
                        }))
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

            {/* Text Controls */}
            {selectedArea && textLayers[selectedArea.id]?.content && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Text Controls</h4>
                
                {/* Font Family */}
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Font Family:</label>
                  <select
                    value={textLayers[selectedArea.id]?.fontFamily || "Arial"}
                    onChange={(e) => setTextLayers(prev => ({
                      ...prev,
                      [selectedArea.id]: {
                        ...prev[selectedArea.id],
                        fontFamily: e.target.value
                      }
                    }))}
                    className="w-full border rounded-lg p-2 text-sm"
                  >
                    <option value="Arial">Arial (Classic)</option>
                    <option value="Helvetica">Helvetica (Clean)</option>
                    <option value="Times New Roman">Times New Roman (Elegant)</option>
                    <option value="Georgia">Georgia (Formal)</option>
                    <option value="Courier New">Courier New (Typewriter)</option>
                    <option value="Verdana">Verdana (Readable)</option>
                    <option value="Impact">Impact (Bold)</option>
                    <option value="Comic Sans MS">Comic Sans MS (Casual)</option>
                  </select>
                </div>

                {/* Font Weight */}
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Font Weight:</label>
                  <select
                    value={textLayers[selectedArea.id]?.fontWeight || "normal"}
                    onChange={(e) => setTextLayers(prev => ({
                      ...prev,
                      [selectedArea.id]: {
                        ...prev[selectedArea.id],
                        fontWeight: e.target.value
                      }
                    }))}
                    className="w-full border rounded-lg p-2 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                  </select>
                </div>

                {/* Text Color */}
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Text Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textLayers[selectedArea.id]?.color || "#000000"}
                      onChange={(e) => setTextLayers(prev => ({
                        ...prev,
                        [selectedArea.id]: {
                          ...prev[selectedArea.id],
                          color: e.target.value
                        }
                      }))}
                      className="w-10 h-10 border rounded"
                    />
                    <span className="text-xs text-gray-500">
                      {textLayers[selectedArea.id]?.color || "#000000"}
                    </span>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Font Size: {textLayers[selectedArea.id]?.fontSize || 40}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={textLayers[selectedArea.id]?.fontSize || 40}
                    onChange={(e) => handleTextSizeChange(selectedArea.id, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Text Scale */}
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Text Scale: {(textPositions[selectedArea.id]?.scale || 1).toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={textPositions[selectedArea.id]?.scale || 1}
                    onChange={(e) => handleTextScaleChange(selectedArea.id, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Text Position Controls */}
                <div className="flex gap-2 justify-center mt-2">
                  <button
                    onClick={() => handleTextRotate(selectedArea.id)}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  >
                    ↻ Rotate 45°
                  </button>
                  <button
                    onClick={() => resetTextPosition(selectedArea.id)}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  >
                    ↺ Reset Position
                  </button>
                </div>

                {/* Remove Text Button */}
                <button
                  onClick={() => removeText(selectedArea.id)}
                  className="w-full mt-2 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Remove Text
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-2">
              {selectedArea && (uploadedImages[selectedArea.id] || textLayers[selectedArea.id]?.content)
                ? "Drag to move • Scroll or use slider to zoom"
                : "Click on an area with design to adjust size and position"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePreviewAndAddToCart}
              disabled={!isAddToCartEnabled || isUploading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !isAddToCartEnabled || isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading Images...
                </div>
              ) : !isAddToCartEnabled ? (
                'Confirm designs first'
              ) : (
                'Add to Cart'
              )}
            </button>
            
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
            
            {showCloudinaryUrls && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-semibold text-blue-700">
                    Images uploaded successfully!
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Preview */}
        <main className="bg-white p-4 lg:p-2 flex items-center justify-center relative w-full h-full overflow-hidden">
          <div className="w-full max-w-2xl mx-auto">
            {renderMugWithOverlay()}
            
            {/* Mobile Controls */}
            <div className="mt-4 p-4 lg:hidden bg-white/90 backdrop-blur-sm rounded-xl border shadow-sm">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {["front", "center", "back"].map(v => (
                  <button
                    key={v}
                    onClick={() => handleViewChange(v)}
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
                <div className="space-y-3 mb-4 pb-4 border-b">
                  <h4 className="font-semibold text-sm">Image Controls</h4>
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
                        onChange={(e) => {
                          const newScale = parseFloat(e.target.value)
                          setImagePositions(prev => ({
                            ...prev,
                            [selectedArea.id]: { ...prev[selectedArea.id], scale: newScale }
                          }))
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

              {/* Mobile Text Controls */}
              {selectedArea && textLayers[selectedArea.id]?.content && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Text Controls</h4>
                  
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Font Family:</label>
                    <select
                      value={textLayers[selectedArea.id]?.fontFamily || "Arial"}
                      onChange={(e) => setTextLayers(prev => ({
                        ...prev,
                        [selectedArea.id]: {
                          ...prev[selectedArea.id],
                          fontFamily: e.target.value
                        }
                      }))}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textLayers[selectedArea.id]?.color || "#000000"}
                      onChange={(e) => setTextLayers(prev => ({
                        ...prev,
                        [selectedArea.id]: {
                          ...prev[selectedArea.id],
                          color: e.target.value
                        }
                      }))}
                      className="w-10 h-10 border rounded"
                    />
                    <span className="text-xs text-gray-500">Text Color</span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-1">
                      Size: {textLayers[selectedArea.id]?.fontSize || 40}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={textLayers[selectedArea.id]?.fontSize || 40}
                      onChange={(e) => handleTextSizeChange(selectedArea.id, Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 text-center mt-2">
                {selectedArea && (uploadedImages[selectedArea.id] || textLayers[selectedArea.id]?.content)
                  ? "Drag to move • Scroll or use slider to zoom"
                  : "Click on an area with design to adjust size and position"}
              </p>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Print Areas */}
        <aside className="h-full overflow-y-auto no-scrollbar space-y-6 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Print Areas</h2>
              {(totalUploadedAreas > 0 || totalTextAreas > 0) && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {totalUploadedAreas + totalTextAreas} design{totalUploadedAreas + totalTextAreas > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
              {["front", "center", "back"].map(v => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    view === v ? "bg-black text-white" : "border"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Area Selector */}
            <div className="grid grid-cols-2 gap-3">
              {currentViewAreas.map(area => {
                const active = selectedArea?.id === area.id
                const hasImage = !!uploadedImages[area.id]
                const hasText = !!(textLayers[area.id]?.content)
                
                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      active 
                        ? "border-black bg-gray-100" 
                        : hasImage || hasText
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">{area.name}</p>
                    <p className="text-xs text-gray-500">{area.max}</p>
                    {(hasImage || hasText) && (
                      <div className="mt-1">
                        {hasImage && (
                          <span className="text-xs text-green-600 font-medium inline-block mr-2">
                            ✓ Image
                          </span>
                        )}
                        {hasText && (
                          <span className="text-xs text-blue-600 font-medium inline-block">
                            ✓ Text
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
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
                  <div className="flex gap-2">
                    {uploadedImages[selectedArea.id] && (
                      <button
                        onClick={() => removeImage(selectedArea.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
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
                  />
                </label>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[1px] bg-gray-200"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-[1px] bg-gray-200"></div>
                </div>

                <button
                  onClick={() => setShowLibrary(true)}
                  className="w-full py-3 border-2 border-[#F9A51B] text-[#F9A51B] rounded-xl font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                >
                  <span>🖼️</span> Choose from Gallery
                </button>

                {/* Text Input Area */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Add Text</h4>
                  
                  <input
                    type="text"
                    placeholder="Enter text for this area"
                    value={textLayers[selectedArea.id]?.content || ""}
                    onChange={(e) => {
                      setTextLayers(prev => ({
                        ...prev,
                        [selectedArea.id]: {
                          ...prev[selectedArea.id],
                          content: e.target.value,
                          fontSize: prev[selectedArea.id]?.fontSize || 40,
                          color: prev[selectedArea.id]?.color || "#000000",
                          fontFamily: prev[selectedArea.id]?.fontFamily || "Arial",
                          fontWeight: prev[selectedArea.id]?.fontWeight || "normal",
                          textShadow: prev[selectedArea.id]?.textShadow || "none"
                        }
                      }))
                      if (!textPositions[selectedArea.id]) {
                        setTextPositions(prev => ({
                          ...prev,
                          [selectedArea.id]: { x: 0, y: 0, scale: 1, rotate: 0 }
                        }))
                      }
                      setConfirmedPreviewUrls(prev => ({ ...prev, [view]: null }))
                    }}
                    className="w-full border rounded-lg p-2"
                  />

                  {textLayers[selectedArea.id]?.content && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Color:</label>
                        <input
                          type="color"
                          value={textLayers[selectedArea.id]?.color || "#000000"}
                          onChange={(e) =>
                            setTextLayers(prev => ({
                              ...prev,
                              [selectedArea.id]: {
                                ...prev[selectedArea.id],
                                color: e.target.value
                              }
                            }))
                          }
                          className="w-10 h-10 border rounded"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">
                          Font Family:
                        </label>
                        <select
                          value={textLayers[selectedArea.id]?.fontFamily || "Arial"}
                          onChange={(e) => setTextLayers(prev => ({
                            ...prev,
                            [selectedArea.id]: {
                              ...prev[selectedArea.id],
                              fontFamily: e.target.value
                            }
                          }))}
                          className="w-full border rounded-lg p-2"
                        >
                          <option value="Arial">Arial (Classic)</option>
                          <option value="Helvetica">Helvetica (Clean)</option>
                          <option value="Times New Roman">Times New Roman (Elegant)</option>
                          <option value="Georgia">Georgia (Formal)</option>
                          <option value="Courier New">Courier New (Typewriter)</option>
                          <option value="Verdana">Verdana (Readable)</option>
                          <option value="Impact">Impact (Bold)</option>
                          <option value="Comic Sans MS">Comic Sans MS (Casual)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">
                          Font Weight:
                        </label>
                        <select
                          value={textLayers[selectedArea.id]?.fontWeight || "normal"}
                          onChange={(e) => setTextLayers(prev => ({
                            ...prev,
                            [selectedArea.id]: {
                              ...prev[selectedArea.id],
                              fontWeight: e.target.value
                            }
                          }))}
                          className="w-full border rounded-lg p-2"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="lighter">Light</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">
                          Font Size: {textLayers[selectedArea.id]?.fontSize || 40}px
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="120"
                          value={textLayers[selectedArea.id]?.fontSize || 40}
                          onChange={(e) => handleTextSizeChange(selectedArea.id, Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">
                          Text Scale: {(textPositions[selectedArea.id]?.scale || 1).toFixed(1)}x
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={textPositions[selectedArea.id]?.scale || 1}
                          onChange={(e) => handleTextScaleChange(selectedArea.id, Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-2 justify-center mt-2">
                        <button
                          onClick={() => handleTextRotate(selectedArea.id)}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                        >
                          ↻ Rotate Text 45°
                        </button>
                        <button
                          onClick={() => resetTextPosition(selectedArea.id)}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                        >
                          ↺ Reset Text
                        </button>
                      </div>

                      <button
                        onClick={() => removeText(selectedArea.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove Text
                      </button>
                    </div>
                  )}
                </div>

                {/* Confirm button */}
                {(uploadedImages[selectedArea.id] || textLayers[selectedArea.id]?.content) && (
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
                      ? '✓ Design Confirmed'
                      : isConfirming
                        ? 'Confirming...'
                        : 'Confirm Design & Save Preview'}
                  </button>
                )}
              </div>
            )}

            {/* Mobile action buttons */}
            <div className="space-y-3 lg:hidden">
              <button
                onClick={handlePreviewAndAddToCart}
                disabled={!isAddToCartEnabled || isUploading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  !isAddToCartEnabled || isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : !isAddToCartEnabled ? (
                  'Confirm designs first'
                ) : (
                  'Add to Cart'
                )}
              </button>
              
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
              
              {showCloudinaryUrls && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-blue-700">
                      Images uploaded successfully!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {showLibrary && (
        <DesignLibraryModal 
          productType="mug"
          onSelect={handleLibrarySelect}
          onClose={() => setShowLibrary(false)}
          currentDesignUrl={imagePreviews[selectedArea?.id]}
        />
      )}
    </div>
  )
}