"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { toPng } from 'html-to-image'
import { getProductBySlug, uploadImagesAPI } from "@/services/product.service"
import { getPrintConfigBySlug } from "@/services/printArea.service"

export default function MugDesigner() {
  const { slug } = useParams()
  const searchParams = useSearchParams()

  // State management
  const [selectedArea, setSelectedArea] = useState(null)
  const [uploadedImages, setUploadedImages] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})
  
  // ✅ NEW: Text layers state
  const [textLayers, setTextLayers] = useState({})
  const [textPositions, setTextPositions] = useState({})
  
  const [isStudioLoading, setIsStudioLoading] = useState(true)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [successPreviews, setSuccessPreviews] = useState({ front: null, back: null, full_wrap: null })
  const [confirmedPreviewUrls, setConfirmedPreviewUrls] = useState({
    front: null,
    back: null,
    full_wrap: null
  })
  const [confirmedSlots, setConfirmedSlots] = useState({
  front: false,
  center: false,
  back: false
});
  const [isConfirming, setIsConfirming] = useState(false)

  // Image position controls
  const [imagePositions, setImagePositions] = useState({})

  // Cloudinary state
  const [showCloudinaryUrls, setShowCloudinaryUrls] = useState(false)
  const [cloudinaryUrls, setCloudinaryUrls] = useState({})
  const [isUploading, setIsUploading] = useState(false)

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

  // View state
  const [view, setView] = useState("front")
  const [isLoading, setIsLoading] = useState(true)

  // For full_wrap view - track which slot is being uploaded to
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Cart manager
  const cartManager = {
    addItem: async (item) => {
      try {
        console.log('🛒 Adding to cart:', item)
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



  // ✅ UPDATED: getStructuredProductDataForCart with text support
  const getStructuredProductDataForCart = (cloudinaryUrlsData) => {
    if (!product) return null;

    const printAreas = {};

    Object.keys(printConfig?.views || {}).forEach(viewKey => {
      const areas = printConfig?.views?.[viewKey]?.areas || [];
      areas.forEach(area => {
        // For full_wrap view with multi type
        if (viewKey === "full_wrap" && area.type === "multi") {
          const wrapImages = {};
          const slotOrder = ["front", "center", "back"];
          
          slotOrder.forEach((slot, index) => {
            const slotId = `${area.id}_${slot}`;
            if (uploadedImages[slotId] && cloudinaryUrlsData[slotId]) {
              wrapImages[slot] = {
                url: cloudinaryUrlsData[slotId],
                position: imagePositions[slotId] || { x: 0, y: 0, scale: 0.5, rotate: 0 },
                slot_order: index
              };
            }
            
            // ✅ NEW: Add text layers for wrap slots
            if (textLayers[slotId]?.content) {
              if (!wrapImages[slot]) wrapImages[slot] = {};
              wrapImages[slot].text_layers = {
                content: textLayers[slotId].content,
                fontSize: textLayers[slotId].fontSize,
                color: textLayers[slotId].color,
                fontFamily: textLayers[slotId].fontFamily,
                fontWeight: textLayers[slotId].fontWeight,
                textShadow: textLayers[slotId].textShadow,
                position: textPositions[slotId] || { x: 0, y: 0, scale: 1, rotate: 0 }
              };
            }
          });
          
          if (Object.keys(wrapImages).length > 0) {
            printAreas.full_wrap = {
              enabled: true,
              area: "full_wrap",
              type: "multi",
              images: wrapImages,
              view: "full_wrap",
              metadata: {
                slot_count: Object.keys(wrapImages).length,
                slots_ordered: slotOrder.filter(slot => wrapImages[slot]),
                design_type: "full_wrap",
                has_text: Object.keys(textLayers).some(id => id.includes('full_wrap'))
              }
            };
          }
        } 
        // For single areas (front/back)
        else {
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
          
          // ✅ NEW: Handle text-only areas
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
      // ✅ NEW: Add text layers to cart data
      text_layers: textLayers,
      text_positions: textPositions,
      metadata: {
        product_type: "mug",
        view_configuration: { 
          current_view: view,
          available_views: Object.keys(printConfig?.views || {})
        },
        image_positions: imagePositions,
        text_positions: textPositions,
        uploaded_areas: Object.keys(uploadedImages).map(key => ({
          id: key,
          slot: key.includes('_') ? key.split('_').pop() : null,
          position: imagePositions[key] || { x: 0, y: 0, scale: 0.5, rotate: 0 }
        })),
        // ✅ NEW: Text areas summary
        text_areas: Object.keys(textLayers).map(id => {
          const slot = id.includes('_') ? id.split('_').pop() : null;
          const area = currentViewAreas.find(a => a.id === id);
          return {
            id: id,
            name: slot ? `Wrap - ${slot}` : area?.name || id,
            view: id.includes('full_wrap') ? 'full_wrap' : view,
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

  if (!confirmedPreviewUrls.front && !confirmedPreviewUrls.back && !confirmedPreviewUrls.full_wrap) {
    alert("Please confirm at least one view's design first.")
    return
  }

  try {
    setIsAddingToCart(true)

    // Log all the URLs we're about to use
    console.log("🛒 ADDING TO CART WITH URLS:", {
      confirmedPreviewUrls,
      slotImageUrls,
      cloudinaryUrls: cloudinaryUrlsData
    })

    const previewUrls = {
      front: confirmedPreviewUrls.front,
      back: confirmedPreviewUrls.back,
      full_wrap: confirmedPreviewUrls.full_wrap,
      // Include individual slot images for full wrap
      slots: slotImageUrls
    }

    const mainPreviewUrl = previewUrls.front || previewUrls.back || previewUrls.full_wrap || 
                          slotImageUrls.front || slotImageUrls.center || slotImageUrls.back || null
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
        // Include individual slot images
        slot_images: slotImageUrls,
        print_areas: cartData.print_areas,
        positions: cartData.metadata?.image_positions || {},
        // Include text data
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
      metadata: {
        ...cartData.metadata,
        slot_images: slotImageUrls,
        confirmed_urls: confirmedPreviewUrls
      },
      productSnapshot: cartData.productSnapshot
    }

    // console.log("📦 Final cart item with URLs:", {
    //   previewUrls: cartItem.designData.preview_urls,
    //   slotImages: cartItem.designData.slot_images,
    //   mainPreview: cartItem.designData.preview_url
    // })

    const result = await cartManager.addItem(cartItem)
    
    if (result.success) {
      // Update success previews with all available images
      setSuccessPreviews({ 
        front: confirmedPreviewUrls.front || slotImageUrls.front,
        back: confirmedPreviewUrls.back || slotImageUrls.back,
        full_wrap: confirmedPreviewUrls.full_wrap,
        center: slotImageUrls.center
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

  const full_wrapSlots = useMemo(() => {
    if (view !== "full_wrap") return []
    const full_wrapArea = printConfig?.views?.full_wrap?.areas?.[0]
    return full_wrapArea?.slots || []
  }, [view, printConfig])

  // ✅ UPDATED: Draw design on canvas with text support
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
      // Get mug image from print config
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
      
      // Sort areas by position.x to ensure left-to-right rendering
      const sortedAreas = [...areas].sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0))
      
      for (const area of sortedAreas) {
        // For full_wrap view with multi type, we need to handle each slot separately
        if (view === "full_wrap" && area.type === "multi") {
          // Sort slots in the order they should appear (front, center, back)
          const slotOrder = ["front", "center", "back"]
          
          for (let i = 0; i < slotOrder.length; i++) {
            const slot = slotOrder[i]
            const slotId = `${area.id}_${slot}`
            
            // Calculate position based on slot index - distribute evenly across the mug
            const slotWidth = 100 / 3 // Divide into thirds
            const areaX = (slotWidth * i) // Position each slot in its third
            const areaY = 20 // Center vertically
            const areaWidth = slotWidth * 0.8 // Leave some margin
            const areaHeight = 60 // Height of the full_wrap area

            // Draw image if exists
            const previewUrl = imagePreviews[slotId]
            if (previewUrl) {
              const position = imagePositions[slotId] || { x: 0, y: 0, scale: 0.5, rotate: 0 }

              const img = new Image()
              img.crossOrigin = 'anonymous'
              
              await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = previewUrl
              })

              ctx.save()
              ctx.translate(
                (areaX + areaWidth / 2) / 100 * canvas.width, 
                (areaY + areaHeight / 2) / 100 * canvas.height
              )
              ctx.rotate((position.rotate * Math.PI) / 180)
              
              const scale = position.scale || 0.5
              ctx.drawImage(
                img,
                position.x - (areaWidth * scale) / 2 * canvas.width / 100,
                position.y - (areaHeight * scale) / 2 * canvas.height / 100,
                (areaWidth * scale) / 100 * canvas.width,
                (areaHeight * scale) / 100 * canvas.height
              )
              
              ctx.restore()
            }

            // ✅ NEW: Draw text if exists
            const text = textLayers[slotId]
            if (text?.content) {
              const textPosition = textPositions[slotId] || { x: 0, y: 0, scale: 1, rotate: 0 }

              ctx.save()
              ctx.translate(
                (areaX + areaWidth / 2) / 100 * canvas.width,
                (areaY + areaHeight / 2) / 100 * canvas.height
              )
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
        } else {
          // Regular single area (front/back)
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

          // ✅ NEW: Draw text if exists
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


  const [slotImageUrls, setSlotImageUrls] = useState({
  front: null,
  center: null,
  back: null
});

  // Confirm design
// Confirm design
const handleConfirmDesign = async () => {
  if (!mugContainerRef.current) return
  
  // For full_wrap view, check if current slot has content
  if (view === "full_wrap") {
    if (!selectedSlot) {
      alert("Please select a slot first.")
      return
    }
    
    const slotId = `full_wrap_3panel_${selectedSlot}`
    const hasContent = uploadedImages[slotId] || textLayers[slotId]?.content
    
    if (!hasContent) {
      alert("Please upload an image or add text for this slot before confirming.")
      return
    }
    
    // Check if this slot is already confirmed
    if (confirmedSlots[selectedSlot]) {
      alert("This slot is already confirmed. Please move to the next slot.")
      return
    }
  } else if (!selectedArea || (!uploadedImages[selectedArea.id] && !textLayers[selectedArea.id]?.content)) {
    alert("Please select an area with an uploaded image or text.")
    return
  }

  setIsConfirming(true)
  try {
    await new Promise(r => setTimeout(r, 800))
    
    // Generate preview for this slot
    const dataUrl = await generatePreviewImage()
    const cloudUrl = await uploadPreviewImageToCloudinary(dataUrl)
    
    if (!cloudUrl) throw new Error("Preview upload failed")
    
    if (view === "full_wrap" && selectedSlot) {
      // Store the individual slot image URL
      setSlotImageUrls(prev => ({
        ...prev,
        [selectedSlot]: cloudUrl
      }))
      
      // Mark this slot as confirmed
      const newConfirmedSlots = { ...confirmedSlots, [selectedSlot]: true }
      setConfirmedSlots(newConfirmedSlots)
      
      // Check if all slots are confirmed
      const allConfirmed = Object.values(newConfirmedSlots).every(v => v)
      
      if (allConfirmed) {
        // All slots confirmed, generate final combined preview
        const finalDataUrl = await generatePreviewImage() // This will show all slots together
        const finalCloudUrl = await uploadPreviewImageToCloudinary(finalDataUrl)
        
        setConfirmedPreviewUrls(prev => ({
          ...prev,
          [view]: finalCloudUrl
        }))
        
        // Update successPreviews with all slot images
        setSuccessPreviews(prev => ({
          ...prev,
          full_wrap: finalCloudUrl,
          front: slotImageUrls.front || cloudUrl,
          center: slotImageUrls.center || (selectedSlot === 'center' ? cloudUrl : null),
          back: slotImageUrls.back || (selectedSlot === 'back' ? cloudUrl : null)
        }))
        
        alert(`✓ All slots confirmed! Full wrap design is ready.`)
      } else {
        // Find next unconfirmed slot
        const slotOrder = ["front", "center", "back"]
        const currentIndex = slotOrder.indexOf(selectedSlot)
        const nextSlot = slotOrder.slice(currentIndex + 1).find(slot => !newConfirmedSlots[slot])
        
        if (nextSlot) {
          // Auto-select next slot
          setSelectedSlot(nextSlot)
          setSelectedArea({
            id: `full_wrap_3panel_${nextSlot}`,
            name: `Wrap - ${nextSlot.charAt(0).toUpperCase() + nextSlot.slice(1)}`,
            max: "8 × 8 cm"
          })
          alert(`✓ Slot ${selectedSlot} confirmed! Now please design the ${nextSlot} slot.`)
        }
      }
    } else {
      // Regular view confirmation
      setConfirmedPreviewUrls(prev => ({
        ...prev,
        [view]: cloudUrl
      }))
    }
    
    console.log(`${view.toUpperCase()} preview confirmed:`, cloudUrl)
  } catch (err) {
    console.error("Confirm failed:", err)
    alert("Failed to confirm design: " + err.message)
  } finally {
    setIsConfirming(false)
  }
}


// Update the success modal to show all slot images
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
          Your custom mug design has been added to cart.<br/>
          Here are the previews:
        </p>
        
        {/* Show individual slot images for full wrap */}
        {successPreviews.full_wrap && (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="border rounded-xl overflow-hidden shadow-md">
                <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                  Front (Left)
                </div>
                {slotImageUrls.front ? (
                  <img
                    src={slotImageUrls.front}
                    alt="Front preview"
                    className="w-full h-48 object-contain p-4 bg-gray-50"
                    onError={(e) => e.target.src = "/placeholder-mug.png"}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-100">
                    No front design
                  </div>
                )}
              </div>
              <div className="border rounded-xl overflow-hidden shadow-md">
                <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                  Center
                </div>
                {slotImageUrls.center ? (
                  <img
                    src={slotImageUrls.center}
                    alt="Center preview"
                    className="w-full h-48 object-contain p-4 bg-gray-50"
                    onError={(e) => e.target.src = "/placeholder-mug.png"}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-100">
                    No center design
                  </div>
                )}
              </div>
              <div className="border rounded-xl overflow-hidden shadow-md">
                <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                  Back (Right)
                </div>
                {slotImageUrls.back ? (
                  <img
                    src={slotImageUrls.back}
                    alt="Back preview"
                    className="w-full h-48 object-contain p-4 bg-gray-50"
                    onError={(e) => e.target.src = "/placeholder-mug.png"}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-100">
                    No back design
                  </div>
                )}
              </div>
            </div>
            
            {/* Combined Preview */}
            <div className="border rounded-xl overflow-hidden shadow-md">
              <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                Full Wrap Combined Preview
              </div>
              <img
                src={successPreviews.full_wrap}
                alt="Full wrap preview"
                className="w-full h-64 object-contain p-4 bg-gray-50"
                onError={(e) => e.target.src = "/placeholder-mug.png"}
              />
            </div>
          </>
        )}

        {/* For regular front/back views (non-wrap) */}
        {!successPreviews.full_wrap && (
          <div className="grid md:grid-cols-2 gap-4">
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
        )}
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
      const imageFiles = Object.values(uploadedImages)
      
      if (imageFiles.length === 0) {
        return uploadedUrls
      }

      const uploadResults = await uploadImagesAPI(imageFiles)
      
      if (!uploadResults || !Array.isArray(uploadResults)) {
        throw new Error('Invalid response from upload API')
      }

      const areaIds = Object.keys(uploadedImages)
      
      uploadResults.forEach((imageData, index) => {
        const areaId = areaIds[index]
        if (areaId && imageData.url) {
          uploadedUrls[areaId] = imageData.url
        }
      })

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
// Handle preview and add to cart
const handlePreviewAndAddToCart = async () => {
  if (Object.keys(uploadedImages).length === 0 && Object.keys(textLayers).length === 0) {
    alert("Please add at least one design or text.")
    return
  }

  // Check if any view is confirmed
  if (!confirmedPreviewUrls.front && !confirmedPreviewUrls.back && !confirmedPreviewUrls.full_wrap) {
    alert("Please confirm your design first by clicking 'Confirm Design' on the selected area.")
    return
  }

  try {
    setIsUploading(true)
    
    // Log the existing URLs we already have
    console.log("✅ EXISTING CONFIRMED URLS:", {
      confirmedPreviewUrls,
      slotImageUrls,
      front: confirmedPreviewUrls.front,
      back: confirmedPreviewUrls.back,
      full_wrap: confirmedPreviewUrls.full_wrap,
      slots: slotImageUrls
    })
    
    // Upload user uploaded images to Cloudinary (if any)
    const userDesignUrls = await uploadAllImagesToCloudinary()
    setCloudinaryUrls(userDesignUrls)
    
    // For full_wrap view, we already have all the URLs from confirmations
    if (view === "full_wrap") {
      console.log("🎯 Using existing slot URLs for full wrap:", slotImageUrls)
      
      // Use the existing confirmed URLs
      const previewUrls = {
        front: confirmedPreviewUrls.front,
        back: confirmedPreviewUrls.back,
        full_wrap: confirmedPreviewUrls.full_wrap,
        slots: slotImageUrls
      }
      
      // Set preview image from existing URLs
      if (confirmedPreviewUrls.full_wrap) {
        setPreviewImageUrl(confirmedPreviewUrls.full_wrap)
      } else if (slotImageUrls.front) {
        setPreviewImageUrl(slotImageUrls.front)
      }
      
      // Skip preview generation, go straight to cart
      await addDesignToCart(userDesignUrls)
    } else {
      // For front/back views, generate preview (keep existing behavior)
      const localPreviewDataUrl = await generatePreviewImage()
      const previewCloudinaryUrl = await uploadPreviewImageToCloudinary(localPreviewDataUrl)
      const finalPreviewUrl = previewCloudinaryUrl || localPreviewDataUrl
      setPreviewImageUrl(finalPreviewUrl)
      setShowPreviewModal(true)
      // Don't add to cart yet - wait for modal confirmation
    }
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
    setSelectedSlot(null)
  }, [view])

  // Check if current view can be changed
  const canSwitchView = useCallback((targetView) => {
    // If trying to switch away from full_wrap and full_wrap has images
    if (view === "full_wrap" && targetView !== "full_wrap") {
      const hasFullWrapContent = full_wrapSlots.some(slot => {
        const slotId = `full_wrap_3panel_${slot}`
        return uploadedImages[slotId] || textLayers[slotId]?.content
      })
      
      if (hasFullWrapContent) {
        return {
          allowed: false,
          message: "Please clear all wrap designs and text before switching to front/back views, or confirm the wrap design first."
        }
      }
    }
    
    // If trying to switch to full_wrap and front/back have images
    if (targetView === "full_wrap" && view !== "full_wrap") {
      const hasFrontOrBackContent = Object.keys(uploadedImages).some(key => 
        !key.includes('full_wrap') && uploadedImages[key]
      ) || Object.keys(textLayers).some(key => 
        !key.includes('full_wrap') && textLayers[key]?.content
      )
      
      if (hasFrontOrBackContent) {
        return {
          allowed: false,
          message: "Please clear front/back designs and text before switching to wrap view."
        }
      }
    }
    
    return { allowed: true }
  }, [view, uploadedImages, textLayers, full_wrapSlots])

  // Handle view change with validation
  const handleViewChange = (newView) => {
    const check = canSwitchView(newView)
    if (!check.allowed) {
      alert(check.message)
      return
    }
    setView(newView)
  }

  // Filter current view areas
  const currentViewAreas = useMemo(() => {
    return printConfig?.views?.[view]?.areas || []
  }, [printConfig, view])

  // Check if user can upload more images (max 3 for full_wrap view)
  const canUploadMore = useCallback(() => {
    if (view !== "full_wrap") return true
    
    const uploadedfull_wrapImages = full_wrapSlots.filter(slot => {
      const slotId = `full_wrap_3panel_${slot}`
      return uploadedImages[slotId]
    })
    
    return uploadedfull_wrapImages.length < 3
  }, [view, full_wrapSlots, uploadedImages])

  // Get upload count message
  const getUploadStatus = useCallback(() => {
    if (view !== "full_wrap") return null
    
    const uploadedfull_wrapImages = full_wrapSlots.filter(slot => {
      const slotId = `full_wrap_3panel_${slot}`
      return uploadedImages[slotId]
    })
    
    const slotOrder = ["front", "center", "back"]
    const orderedUploads = slotOrder.filter(slot => {
      const slotId = `full_wrap_3panel_${slot}`
      return uploadedImages[slotId]
    })
    
    return {
      count: uploadedfull_wrapImages.length,
      max: 3,
      message: `${uploadedfull_wrapImages.length} of 3 images uploaded - will appear left to right (front, center, back)`,
      slots: orderedUploads
    }
  }, [view, full_wrapSlots, uploadedImages])

  // Check if current view is confirmed
  const isCurrentViewConfirmed = useCallback(() => {
    return confirmedPreviewUrls[view]
  }, [confirmedPreviewUrls, view])

  // ✅ NEW: Text drag handlers
  const handleTextDragStart = useCallback((e, areaId) => {
    if (!textLayers[areaId]?.content) return

    isDraggingTextRef.current = true
    currentTextAreaRef.current = areaId
    dragStartRef.current = {
      x: e.clientX - (textPositions[areaId]?.x || 0),
      y: e.clientY - (textPositions[areaId]?.y || 0)
    }

    e.preventDefault()
    
    if (view === "full_wrap") {
      const slot = areaId.split('_').pop()
      setSelectedSlot(slot)
    } else {
      setSelectedArea(currentViewAreas.find(a => a.id === areaId) || null)
    }
  }, [textLayers, textPositions, currentViewAreas, view])

  // ✅ UPDATED: Image drag handlers
  const handleDragStart = useCallback((e, areaId) => {
    if (!uploadedImages[areaId]) return
    
    isDraggingRef.current = true
    currentAreaRef.current = areaId
    dragStartRef.current = {
      x: e.clientX - (imagePositions[areaId]?.x || 0),
      y: e.clientY - (imagePositions[areaId]?.y || 0)
    }
    
    e.preventDefault()
    
    if (view === "full_wrap") {
      const slot = areaId.split('_').pop()
      setSelectedSlot(slot)
    } else {
      setSelectedArea(currentViewAreas.find(a => a.id === areaId) || null)
    }
  }, [uploadedImages, imagePositions, currentViewAreas, view])

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
    setSelectedSlot(null)
  }, [])

  // ✅ NEW: Text zoom/rotate controls
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

  // ✅ NEW: Text size slider
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

  // ✅ NEW: Text scale slider
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
  const handleImageUpload = (e, areaId, slot = null) => {
    const file = e.target.files[0]
    if (!file) return

    // For full_wrap view, we use slot-based IDs
    const uploadId = slot ? `${areaId}_${slot}` : areaId

    // Check if trying to upload more than 3 images in full_wrap view
    if (view === "full_wrap") {
      const uploadedfull_wrapImages = full_wrapSlots.filter(s => {
        const slotId = `full_wrap_3panel_${s}`
        return uploadedImages[slotId]
      })
      
      if (uploadedfull_wrapImages.length >= 3 && !uploadedImages[uploadId]) {
        alert("Maximum 3 images allowed for full wrap design. Please remove an existing image first.")
        return
      }
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    if (!file.type.match('image/(jpeg|png|jpg|webp)')) {
      alert("Only JPG, PNG, and WebP images are allowed")
      return
    }

    if (imagePreviews[uploadId]) {
      URL.revokeObjectURL(imagePreviews[uploadId])
    }

    const previewUrl = URL.createObjectURL(file)
    
    setImagePreviews(prev => ({ ...prev, [uploadId]: previewUrl }))
    setUploadedImages(prev => ({ ...prev, [uploadId]: file }))
    setImagePositions(prev => ({
      ...prev,
      [uploadId]: { x: 0, y: 0, scale: 0.5, rotate: 0 }
    }))

    if (slot) {
      setSelectedSlot(slot)
    } else {
      const area = currentViewAreas.find(a => a.id === areaId)
      setSelectedArea(area || null)
    }
  }

  // Remove image
  const removeImage = (uploadId) => {
    const previewUrl = imagePreviews[uploadId]
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setUploadedImages(prev => {
      const newState = { ...prev }
      delete newState[uploadId]
      return newState
    })
    
    setImagePreviews(prev => {
      const newState = { ...prev }
      delete newState[uploadId]
      return newState
    })
    
    setImagePositions(prev => {
      const newState = { ...prev }
      delete newState[uploadId]
      return newState
    })
    
    if (view === "full_wrap") {
      setSelectedSlot(null)
    } else if (selectedArea?.id === uploadId) {
      setSelectedArea(null)
    }
  }

  // ✅ NEW: Remove text
  const removeText = (areaId) => {
    setTextLayers(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
    setTextPositions(prev => {
      const newState = { ...prev }
      delete newState[areaId]
      return newState
    })
  }

  // Clear all wrap images
  const clearWrapImages = () => {
    if (view === "full_wrap") {
      full_wrapSlots.forEach(slot => {
        const slotId = `full_wrap_3panel_${slot}`
        if (uploadedImages[slotId]) {
          removeImage(slotId)
        }
        if (textLayers[slotId]?.content) {
          removeText(slotId)
        }
      })
    }
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

          {/* For full_wrap view, we don't show overlays - just the base image */}
          {view !== "full_wrap" && currentViewAreas.map(area => {
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
  const uploadStatus = getUploadStatus()

  // Check if Add to Cart should be enabled
  const isAddToCartEnabled = useMemo(() => {
    return (
      (totalUploadedAreas > 0 || totalTextAreas > 0) && 
      (confirmedPreviewUrls.front || confirmedPreviewUrls.back || confirmedPreviewUrls.full_wrap)
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
    <div className="bg-white overflow-x-hidden lg:px-32">
      {/* Success Modal */}
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
                <div className="border rounded-xl overflow-hidden shadow-md">
                  <div className="bg-indigo-600 text-white px-5 py-3 font-medium text-center">
                    Full Wrap
                  </div>
                  {successPreviews.full_wrap ? (
                    <img
                      src={successPreviews.full_wrap}
                      alt="full_wrap preview"
                      className="w-full h-64 object-contain p-4 bg-gray-50"
                      onError={(e) => e.target.src = "/placeholder-mug.png"}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-100">
                      No wrap design
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

      {/* Preview Modal - Only shown for non-wrap views */}
      {showPreviewModal && previewImageUrl && view !== "full_wrap" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
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
                      let displayName = uploadId
                      if (uploadId.includes('_')) {
                        const slot = uploadId.split('_').pop()
                        displayName = `Wrap - ${slot.charAt(0).toUpperCase() + slot.slice(1)}`
                      } else {
                        const area = currentViewAreas.find(a => a.id === uploadId)
                        displayName = area?.name || uploadId
                      }
                      
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
                      if (cloudinaryUrls[areaId]) return null // Already shown with image
                      const text = textLayers[areaId]
                      let displayName = areaId
                      if (areaId.includes('_')) {
                        const slot = areaId.split('_').pop()
                        displayName = `Text - ${slot.charAt(0).toUpperCase() + slot.slice(1)}`
                      } else {
                        const area = currentViewAreas.find(a => a.id === areaId)
                        displayName = `Text - ${area?.name || areaId}`
                      }
                      
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
      <div className="lg:grid lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,380px)] lg:gap-6 lg:p-6 p-4 space-y-6 lg:space-y-0 max-w-full">
        
        {/* Left Sidebar - Product Info */}
        <aside className="hidden lg:block space-y-6 w-full border-r border-r-gray-200 p-4 mr-2">
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
              {["front", "back", "full_wrap"].map(v => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    view === v 
                      ? "bg-black text-white" 
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {v === "full_wrap" ? "Full Wrap" : v.charAt(0).toUpperCase() + v.slice(1)} View
                </button>
              ))}
            </div>
            
            {/* Image Controls */}
            {view !== "full_wrap" && selectedArea && uploadedImages[selectedArea.id] && (
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

            {/* ✅ NEW: Text Controls */}
            {view !== "full_wrap" && selectedArea && textLayers[selectedArea.id]?.content && (
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
              {view !== "full_wrap" && selectedArea && (uploadedImages[selectedArea.id] || textLayers[selectedArea.id]?.content)
                ? "Drag to move • Scroll or use slider to zoom"
                : view === "full_wrap" 
                  ? "Upload up to 3 images for full wrap (appear left to right)"
                  : "Click on an area with design to adjust size and position"}
            </p>

            {/* Clear wrap button if needed */}
            {view === "full_wrap" && (
              <button
                onClick={clearWrapImages}
                className="mt-3 w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear All Wrap Images & Text
              </button>
            )}
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
            
            {showCloudinaryUrls && previewImageUrl && view !== "full_wrap" && (
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
        <main className="bg-white p-4 lg:p-2 flex items-center justify-center relative w-full">
          <div className="w-full max-w-2xl mx-auto">
            {renderMugWithOverlay()}
            
            {/* Mobile Controls */}
            <div className="mt-4 p-4 lg:hidden bg-white/90 backdrop-blur-sm rounded-xl border shadow-sm">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {["front", "back", "full_wrap"].map(v => (
                  <button
                    key={v}
                    onClick={() => handleViewChange(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      view === v 
                        ? "bg-black text-white" 
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {v === "full_wrap" ? "Full Wrap" : v.charAt(0).toUpperCase() + v.slice(1)} View
                  </button>
                ))}
              </div>
              
              {view !== "full_wrap" && selectedArea && uploadedImages[selectedArea.id] && (
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

              {/* ✅ NEW: Mobile Text Controls */}
              {view !== "full_wrap" && selectedArea && textLayers[selectedArea.id]?.content && (
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
                {view !== "full_wrap" && selectedArea && (uploadedImages[selectedArea.id] || textLayers[selectedArea.id]?.content)
                  ? "Drag to move • Scroll or use slider to zoom"
                  : view === "full_wrap"
                    ? "Upload up to 3 images for full wrap"
                    : "Click on an area with design to adjust size and position"}
              </p>

              {/* Clear wrap button for mobile */}
              {view === "full_wrap" && (
                <button
                  onClick={clearWrapImages}
                  className="mt-3 w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear All Wrap Images & Text
                </button>
              )}
            </div>

{view === "full_wrap" && (
  <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
    <h3 className="text-lg font-semibold mb-4">Full Wrap Design - Confirm Each Slot</h3>
    
    {/* Slot Grid */}
    <div className="grid grid-cols-3 gap-4">
      {full_wrapSlots.map((slot, index) => {
        const slotId = `full_wrap_3panel_${slot}`
        const previewUrl = imagePreviews[slotId]
        const text = textLayers[slotId]
        const isSelected = selectedSlot === slot
        const isConfirmed = confirmedSlots[slot]
        const isDisabled = isConfirmed || (index > 0 && !confirmedSlots[full_wrapSlots[index - 1]])
        
        let slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1)
        if (slot === "front") slotLabel = "Front (Left)"
        else if (slot === "center") slotLabel = "Center"
        else if (slot === "back") slotLabel = "Back (Right)"
        
        return (
          <div 
            key={slot}
            className={`border rounded-lg p-3 transition-all cursor-pointer ${
              isSelected && !isDisabled ? 'border-blue-500 ring-2 ring-blue-200' : 
              isConfirmed ? 'border-green-500 bg-green-50' : 
              isDisabled ? 'border-gray-200 bg-gray-100 opacity-60' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => {
              if (!isDisabled && !isConfirmed) {
                setSelectedSlot(slot)
                setSelectedArea({
                  id: slotId,
                  name: `Wrap - ${slotLabel}`,
                  max: "8 × 8 cm"
                })
              }
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500">{slotLabel}</div>
              {isConfirmed && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  ✓ Confirmed
                </span>
              )}
              {isDisabled && !isConfirmed && (
                <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </div>
            
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt={`${slot} design`}
                  className="w-full h-32 object-contain rounded border border-gray-200"
                />
                {text?.content && (
                  <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-br">
                    📝
                  </div>
                )}
                {!isConfirmed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(slotId)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
                <div className="mt-2 text-xs text-gray-600">
                  Size: {Math.round((imagePositions[slotId]?.scale || 0.5) * 100)}%
                </div>
              </div>
            ) : text?.content ? (
              <div className="relative">
                <div className="h-32 border-2 border-blue-200 rounded-lg flex flex-col items-center justify-center bg-blue-50">
                  <div className="text-2xl mb-1">✏️</div>
                  <div className="text-xs text-center px-2 break-words max-w-full">
                    "{text.content.substring(0, 20)}{text.content.length > 20 ? '...' : ''}"
                  </div>
                </div>
                {!isConfirmed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeText(slotId)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className={`h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center ${
                isDisabled ? 'border-gray-200 bg-gray-200' : 'border-gray-300 hover:border-blue-400 bg-white'
              }`}>
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-500 mt-1">
                  {isDisabled ? 'Complete previous slot' : 'Click to upload'}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
    
    {/* Progress Bar */}
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {full_wrapSlots.map((slot) => (
            <div 
              key={slot}
              className={`flex-1 h-2 rounded-full transition-all ${
                confirmedSlots[slot] ? 'bg-green-500' : 
                slot === 'front' || confirmedSlots['front'] ? 'bg-blue-300' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-600">
          {Object.values(confirmedSlots).filter(Boolean).length}/3 slots confirmed
        </span>
      </div>
      
      {/* Current Slot Instruction */}
      {selectedSlot && !confirmedSlots[selectedSlot] && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Current slot: </span>
            {selectedSlot === "front" ? "Front (Left)" : 
             selectedSlot === "center" ? "Center" : "Back (Right)"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            1. Upload an image or add text for this slot<br/>
            2. Click "Confirm Wrap Design" below to lock this slot<br/>
            3. Move to the next slot
          </p>
        </div>
      )}
      
      {/* Completion Message */}
      {Object.values(confirmedSlots).every(Boolean) && !confirmedPreviewUrls.full_wrap && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium text-center">
            ✓ All slots completed! Click "Confirm Wrap Design" to finish.
          </p>
        </div>
      )}
      
      {/* Confirmed Message */}
      {confirmedPreviewUrls.full_wrap && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-sm text-green-800 font-medium text-center">
            ✓ Full wrap design confirmed and ready for cart!
          </p>
        </div>
      )}
    </div>
  </div>
)}

{/* Update the slot selector in right sidebar to show confirmation status */}
{view === "full_wrap" && (
  <div className="space-y-3">
    <h3 className="font-medium text-gray-700">Design Slots (Complete in order):</h3>
    <div className="grid grid-cols-3 gap-2">
      {full_wrapSlots.map((slot, index) => {
        const slotId = `full_wrap_3panel_${slot}`
        const hasImage = !!uploadedImages[slotId]
        const hasText = !!(textLayers[slotId]?.content)
        const isConfirmed = confirmedSlots[slot]
        const isDisabled = isConfirmed || (index > 0 && !confirmedSlots[full_wrapSlots[index - 1]])
        
        let slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1)
        if (slot === "front") slotLabel = "Front (Left)"
        else if (slot === "back") slotLabel = "Back (Right)"
        
        return (
          <button
            key={slot}
            onClick={() => {
              if (!isDisabled && !isConfirmed) {
                setSelectedSlot(slot)
                setSelectedArea({
                  id: slotId,
                  name: `Wrap - ${slotLabel}`,
                  max: "8 × 8 cm"
                })
              }
            }}
            disabled={isDisabled}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              selectedSlot === slot && !isDisabled && !isConfirmed
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
                : isConfirmed
                  ? "border-green-500 bg-green-50 cursor-not-allowed"
                  : isDisabled
                    ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                    : hasImage || hasText
                      ? "border-yellow-500 bg-yellow-50 hover:border-yellow-600"
                      : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-semibold text-sm">{slotLabel}</p>
            {isConfirmed && (
              <span className="text-xs text-green-600 font-medium block mt-1">✓ Confirmed</span>
            )}
            {!isConfirmed && (hasImage || hasText) && (
              <span className="text-xs text-yellow-600 font-medium block mt-1">Ready to confirm</span>
            )}
            {!isConfirmed && !hasImage && !hasText && !isDisabled && (
              <span className="text-xs text-gray-500 block mt-1">Not started</span>
            )}
            {isDisabled && !isConfirmed && (
              <span className="text-xs text-gray-500 block mt-1">Locked</span>
            )}
          </button>
        )
      })}
    </div>
  </div>
)}
           


          </div>
        </main>

        {/* Right Sidebar - Print Areas */}
        <aside className="space-y-6 w-full">
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
              {["front", "back", "full_wrap"].map(v => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    view === v ? "bg-black text-white" : "border"
                  }`}
                >
                  {v === "full_wrap" ? "Full Wrap" : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Upload status for full_wrap view */}
            {view === "full_wrap" && uploadStatus && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm font-medium text-blue-800">
                    Full Wrap Design
                  </p>
                </div>
                <p className="text-xs text-blue-700">
                  {uploadStatus.message}
                </p>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3].map((num) => (
                    <div 
                      key={num}
                      className={`flex-1 h-1.5 rounded-full ${
                        num <= uploadStatus.count ? 'bg-blue-500' : 'bg-blue-200'
                      }`}
                    />
                  ))}
                </div>
                {uploadStatus.slots && (
                  <div className="mt-3 flex gap-2 text-xs">
                    {uploadStatus.slots.map((slot, i) => (
                      <span key={slot} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {i+1}. {slot}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Area Selector - For front/back views only */}
            {view !== "full_wrap" && (
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
            )}

            {/* For full_wrap view, show slot selector */}
            {view === "full_wrap" && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Upload to slots:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {full_wrapSlots.map((slot) => {
                    const slotId = `full_wrap_3panel_${slot}`
                    const hasImage = !!uploadedImages[slotId]
                    const hasText = !!(textLayers[slotId]?.content)
                    let slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1)
                    if (slot === "front") slotLabel = "Front (Left)"
                    else if (slot === "back") slotLabel = "Back (Right)"
                    
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelectedSlot(slot)
                          setSelectedArea({
                            id: slotId,
                            name: `Wrap - ${slotLabel}`,
                            max: "8 × 8 cm"
                          })
                        }}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          selectedSlot === slot
                            ? "border-black bg-gray-100" 
                            : hasImage || hasText
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-semibold text-sm">{slotLabel}</p>
                        {(hasImage || hasText) && (
                          <div className="mt-1">
                            {hasImage && <span className="text-xs text-green-600 block">✓ Image</span>}
                            {hasText && <span className="text-xs text-blue-600 block">✓ Text</span>}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upload Area */}
            {view !== "full_wrap" && selectedArea && (
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

                {/* ✅ NEW: Text Input Area */}
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
                      // Initialize text position if not exists
                      if (!textPositions[selectedArea.id]) {
                        setTextPositions(prev => ({
                          ...prev,
                          [selectedArea.id]: { x: 0, y: 0, scale: 1, rotate: 0 }
                        }))
                      }
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

            {/* For full_wrap view, show slot upload area */}
            {view === "full_wrap" && selectedSlot && (
              <div className="border rounded-2xl border-gray-200 p-4 space-y-6 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">
                      {selectedSlot === "front" ? "Front (Left)" : 
                       selectedSlot === "center" ? "Center" : "Back (Right)"}
                    </h3>
                    <p className="text-sm text-gray-600">8 × 8 cm</p>
                  </div>
                  <div className="flex gap-2">
                    {uploadedImages[`full_wrap_3panel_${selectedSlot}`] && (
                      <button
                        onClick={() => removeImage(`full_wrap_3panel_${selectedSlot}`)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <label className="h-40 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors relative overflow-hidden bg-white">
                  {uploadedImages[`full_wrap_3panel_${selectedSlot}`] ? (
                    <img
                      src={imagePreviews[`full_wrap_3panel_${selectedSlot}`]}
                      alt="Design preview"
                      className="object-contain p-4 max-h-full"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-gray-500 block mb-2">
                        {!canUploadMore() && !uploadedImages[`full_wrap_3panel_${selectedSlot}`]
                          ? "Maximum 3 images reached" 
                          : "Click to upload design"}
                      </span>
                      <span className="text-xs text-gray-400">PNG, JPG, WebP • Max 5MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "full_wrap_3panel", selectedSlot)}
                    disabled={!canUploadMore() && !uploadedImages[`full_wrap_3panel_${selectedSlot}`]}
                  />
                </label>

                {/* ✅ NEW: Text Input for wrap slot */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Add Text</h4>
                  
                  <input
                    type="text"
                    placeholder="Enter text for this slot"
                    value={textLayers[`full_wrap_3panel_${selectedSlot}`]?.content || ""}
                    onChange={(e) => {
                      const slotId = `full_wrap_3panel_${selectedSlot}`
                      setTextLayers(prev => ({
                        ...prev,
                        [slotId]: {
                          ...prev[slotId],
                          content: e.target.value,
                          fontSize: prev[slotId]?.fontSize || 40,
                          color: prev[slotId]?.color || "#000000",
                          fontFamily: prev[slotId]?.fontFamily || "Arial",
                          fontWeight: prev[slotId]?.fontWeight || "normal",
                          textShadow: prev[slotId]?.textShadow || "none"
                        }
                      }))
                      if (!textPositions[slotId]) {
                        setTextPositions(prev => ({
                          ...prev,
                          [slotId]: { x: 0, y: 0, scale: 1, rotate: 0 }
                        }))
                      }
                    }}
                    className="w-full border rounded-lg p-2"
                  />

                  {textLayers[`full_wrap_3panel_${selectedSlot}`]?.content && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Color:</label>
                        <input
                          type="color"
                          value={textLayers[`full_wrap_3panel_${selectedSlot}`]?.color || "#000000"}
                          onChange={(e) =>
                            setTextLayers(prev => ({
                              ...prev,
                              [`full_wrap_3panel_${selectedSlot}`]: {
                                ...prev[`full_wrap_3panel_${selectedSlot}`],
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
                          value={textLayers[`full_wrap_3panel_${selectedSlot}`]?.fontFamily || "Arial"}
                          onChange={(e) => setTextLayers(prev => ({
                            ...prev,
                            [`full_wrap_3panel_${selectedSlot}`]: {
                              ...prev[`full_wrap_3panel_${selectedSlot}`],
                              fontFamily: e.target.value
                            }
                          }))}
                          className="w-full border rounded-lg p-2"
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

                      <div>
                        <label className="text-sm text-gray-600 block mb-1">
                          Font Size: {textLayers[`full_wrap_3panel_${selectedSlot}`]?.fontSize || 40}px
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="120"
                          value={textLayers[`full_wrap_3panel_${selectedSlot}`]?.fontSize || 40}
                          onChange={(e) => handleTextSizeChange(`full_wrap_3panel_${selectedSlot}`, Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <button
                        onClick={() => removeText(`full_wrap_3panel_${selectedSlot}`)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove Text
                      </button>
                    </div>
                  )}
                </div>

                {/* Confirm button for full_wrap view */}
                {(uploadedImages[`full_wrap_3panel_${selectedSlot}`] || textLayers[`full_wrap_3panel_${selectedSlot}`]?.content) && (
                  <button
                    onClick={handleConfirmDesign}
                    disabled={isConfirming || confirmedPreviewUrls.full_wrap}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all shadow-md ${
                      confirmedPreviewUrls.full_wrap
                        ? 'bg-green-600 cursor-not-allowed ring-2 ring-green-300'
                        : isConfirming
                          ? 'bg-gray-400 cursor-wait'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                    }`}
                  >
                    {confirmedPreviewUrls.full_wrap
                      ? '✓ Wrap Design Confirmed'
                      : isConfirming
                        ? 'Confirming...'
                        : 'Confirm Wrap Design'}
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
              
              {showCloudinaryUrls && previewImageUrl && view !== "full_wrap" && (
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
    </div>
  )
}