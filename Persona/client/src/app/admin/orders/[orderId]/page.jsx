"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Eye, FileText, Smartphone, Mail, Loader2 } from "lucide-react";
import GrayLogo from "@/assets/icons/gray.png"

import { getOrderAdminById, updateOrderStatus, sendInvoiceEmail } from "@/services/admin.service";
import Image from "next/image";

const STATUS_FLOW = {
  paid: ["processing"],
  processing: ["printing", "cancelled", "collected"],
  printing: ["out_for_delivery", "collected"],
  cancelled: [],
  out_for_delivery: ["delivered"],
  delivered: [],
  collected: [],
};

const HAMPER_NAMES = {
  basic: "Silver Level",
  premium: "Gold Level",
  luxury: "Platinum Level",
};

// Reusable Download Button Component
const DownloadButton = ({ url, filename = "image.png" }) => {
  const handleDownload = async () => {
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all opacity-80 hover:opacity-100"
      title="Download image"
    >
      <Download size={18} />
    </button>
  );
};

// Reusable View Button Component
const ViewButton = ({ url }) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all opacity-80 hover:opacity-100"
      title="View image in new tab"
    >
      <Eye size={18} />
    </a>
  );
};

// Mobile Case Design Display Component
const MobileCaseDesignDisplay = ({ item, orderNumber }) => {
  const designData = item.designData || {};
  const modelInfo = designData.model || {};
  const printAreas = designData.print_areas || {};
  const previewUrl = designData.preview_url;
  const cloudinaryUrls = designData.cloudinary_urls || {};
  const positions = designData.positions || {};

  if (!previewUrl && Object.keys(cloudinaryUrls).length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Model Information */}
      {modelInfo.name && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={20} className="text-amber-600" />
            <h4 className="text-lg font-semibold text-amber-800">
              {modelInfo.name}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {modelInfo.year && (
              <div>
                <span className="text-gray-500">Year:</span>
                <span className="ml-2 font-medium">{modelInfo.year}</span>
              </div>
            )}
            {modelInfo.displaySize && (
              <div>
                <span className="text-gray-500">Display:</span>
                <span className="ml-2 font-medium">{modelInfo.displaySize}</span>
              </div>
            )}
            {modelInfo.code && (
              <div className="col-span-2">
                <span className="text-gray-500">Model Code:</span>
                <span className="ml-2 font-medium">{modelInfo.code}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Preview Image */}
      {previewUrl && (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-amber-600 text-white px-5 py-3 font-medium text-center">
            Design Preview
          </div>
          <div className="p-4 bg-gray-50 relative group">
            <img
              src={previewUrl}
              alt="Case preview"
              className="w-full h-80 object-contain mx-auto"
            />
            <div className="absolute bottom-3 right-3 flex gap-2 z-10">
              <ViewButton url={previewUrl} />
              <DownloadButton
                url={previewUrl}
                filename={`order-${orderNumber}-case-preview.png`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Design Images */}
      {Object.keys(cloudinaryUrls).length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-amber-700 mb-4">Uploaded Design</h4>
          <div className="grid md:grid-cols-1 gap-4">
            {Object.entries(cloudinaryUrls).map(([areaId, url]) => {
              const area = printAreas.back;
              const position = positions[areaId] || area?.image?.position || {};

              return (
                <div key={areaId} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-amber-500 text-white px-4 py-2 font-medium text-sm">
                    Back Design
                  </div>
                  <div className="p-4 bg-gray-50 relative group">
                    <img
                      src={url}
                      alt="Uploaded design"
                      className="w-full h-48 object-contain mx-auto"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                      <ViewButton url={url} />
                      <DownloadButton
                        url={url}
                        filename={`order-${orderNumber}-case-design.png`}
                      />
                    </div>
                  </div>
                  {position.scale && (
                    <div className="px-4 py-2 text-sm text-gray-600 border-t bg-gray-50">
                      <div className="grid grid-cols-3 gap-2">
                        <div>Size: {Math.round((position.scale || 0.5) * 100)}%</div>
                        <div>X: {position.x || 0}px</div>
                        <div>Y: {position.y || 0}px</div>
                        {position.rotate !== 0 && (
                          <div>Rotate: {position.rotate}°</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Print Area Details */}
      {Object.keys(printAreas).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h5 className="font-semibold text-gray-800 mb-3">Print Area Details</h5>
          {Object.entries(printAreas).map(([view, area]) => (
            <div key={view} className="text-sm space-y-1">
              <p><span className="text-gray-500">View:</span> <span className="capitalize font-medium">{view}</span></p>
              <p><span className="text-gray-500">Area:</span> <span className="font-medium">{area.area?.replace(/_/g, ' ')}</span></p>
              {area.library_design && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                  <span className="font-bold text-amber-800">Library Design:</span> {area.library_design.name}
                  <span className="text-[10px] text-gray-500 ml-2">({area.library_design.id})</span>
                </div>
              )}
              {area.model && (
                <p><span className="text-gray-500">Model:</span> <span className="font-medium">{area.model}</span></p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add this new component after MobileCaseDesignDisplay and before MugDesignDisplay

// ✅ NEW: Custom Fields Design Display Component
const CustomFieldsDesignDisplay = ({ item, orderNumber }) => {
  const [expanded, setExpanded] = useState(true);
  
  // Get custom fields data from multiple possible locations
  const customFieldsData = item.customization?.data?.custom_fields || 
                          item.designData || 
                          {};
  
  const fields = customFieldsData.fields || [];
  const uploadedImages = customFieldsData.uploaded_images || {};
  const formData = customFieldsData.data || {};
  const fieldCount = customFieldsData.field_count || { images: 0, texts: 0 };

  // If no custom fields data, don't render
  if (fields.length === 0 && Object.keys(uploadedImages).length === 0) {
    return null;
  }

  // Separate image and text fields
  const imageFields = fields.filter(f => f.type === 'image');
  const textFields = fields.filter(f => f.type === 'text');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-medium">
          📦 Custom Product Details
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-teal-600 hover:text-teal-800 underline"
        >
          {expanded ? 'Hide details' : 'View details'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Uploaded Images Section */}
          {Object.keys(uploadedImages).length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-teal-700 mb-3 flex items-center gap-2">
                <span>🖼️</span> Uploaded Images ({Object.keys(uploadedImages).length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(uploadedImages).map(([fieldName, url]) => {
                  // Find the field label
                  const field = imageFields.find(f => f.name === fieldName);
                  const label = field?.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  
                  return (
                    <div key={fieldName} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="bg-teal-500 text-white px-3 py-1.5 text-xs font-medium">
                        {label}
                      </div>
                      <div className="p-3 bg-gray-50 relative group">
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-32 object-contain mx-auto"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2 z-10">
                          <ViewButton url={url} />
                          <DownloadButton
                            url={url}
                            filename={`order-${orderNumber}-${fieldName}.${url.split('.').pop()}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text Fields Section */}
          {textFields.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-teal-700 mb-3 flex items-center gap-2">
                <FileText size={20} /> Text Inputs ({textFields.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textFields.map((field) => {
                  const value = formData[field.name] || '';
                  
                  return (
                    <div key={field.name} className="bg-white rounded-lg p-4 shadow-sm border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border text-gray-700">
                        {value || <span className="text-gray-400 italic">No input provided</span>}
                      </div>
                      {field.textConstraints?.maxLength && (
                        <p className="text-xs text-gray-500 mt-1">
                          Max length: {field.textConstraints.maxLength} characters
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Field Summary */}
          {(fieldCount.images > 0 || fieldCount.texts > 0) && (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <h5 className="font-semibold text-teal-800 mb-2">Customization Summary</h5>
              <div className="flex flex-wrap gap-3">
                {fieldCount.images > 0 && (
                  <span className="bg-white text-teal-700 px-3 py-1 rounded-full text-sm border border-teal-200">
                    🖼️ {fieldCount.images} Image{fieldCount.images > 1 ? 's' : ''}
                  </span>
                )}
                {fieldCount.texts > 0 && (
                  <span className="bg-white text-teal-700 px-3 py-1 rounded-full text-sm border border-teal-200">
                    📝 {fieldCount.texts} Text Input{fieldCount.texts > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Mug Design Display Component - UPDATED with text design support
const MugDesignDisplay = ({ item, orderNumber }) => {
  const mugData = item.customization?.data?.mug || {};
  const printAreas = mugData.print_areas || {};
  const previewUrls = mugData.preview_urls || {};
  const cloudinaryUrls = mugData.cloudinary_urls || {};
  const positions = mugData.positions || {};
  
  // Get text data from multiple possible locations
  const textLayers = mugData.text_layers || item.designData?.text_layers || {};
  const textPositions = mugData.text_positions || item.designData?.text_positions || {};
  const textContent = mugData.text_content || item.designData?.text_content || {};
  const textSummary = mugData.metadata?.text_summary || item.designData?.metadata?.text_summary || [];

  // ============================================
  // COMPREHENSIVE IMAGE EXTRACTION FUNCTION
  // ============================================
  const extractAllImages = () => {
    const images = [];
    
    // 1. Extract from cloudinaryUrls (primary source for uploaded images)
    if (cloudinaryUrls && typeof cloudinaryUrls === 'object') {
      Object.entries(cloudinaryUrls).forEach(([key, url]) => {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          images.push({
            url: url,
            type: 'uploaded',
            area: key,
            source: 'cloudinary_urls',
            filename: url.split('/').pop() || 'image',
            format: url.split('.').pop() || 'unknown'
          });
        }
      });
    }
    
    // 2. Extract from print_areas images
    if (printAreas && typeof printAreas === 'object') {
      Object.entries(printAreas).forEach(([view, areaData]) => {
        // Check for image in the area
        if (areaData?.image?.url) {
          // Avoid duplicates with cloudinaryUrls
          const exists = images.some(img => img.url === areaData.image.url);
          if (!exists) {
            images.push({
              url: areaData.image.url,
              type: 'print_area_image',
              view: view,
              area: areaData.area || view,
              source: 'print_areas.image',
              filename: areaData.image.url.split('/').pop() || 'image',
              format: areaData.image.url.split('.').pop() || 'unknown',
              position: areaData.image.position || {}
            });
          }
        }
        
        // Check for images in wrap/multi-type areas
        if (areaData?.images && typeof areaData.images === 'object') {
          Object.entries(areaData.images).forEach(([slot, slotData]) => {
            if (slotData?.url) {
              const exists = images.some(img => img.url === slotData.url);
              if (!exists) {
                images.push({
                  url: slotData.url,
                  type: 'wrap_image',
                  view: view,
                  slot: slot,
                  source: 'print_areas.images',
                  filename: slotData.url.split('/').pop() || 'image',
                  format: slotData.url.split('.').pop() || 'unknown',
                  position: slotData.position || {}
                });
              }
            }
          });
        }
      });
    }
    
    // 3. Extract preview images (marked as preview type)
    if (previewUrls && typeof previewUrls === 'object') {
      Object.entries(previewUrls).forEach(([view, url]) => {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          // Check if this preview URL is different from uploaded images
          const isDuplicate = images.some(img => img.url === url);
          if (!isDuplicate) {
            images.push({
              url: url,
              type: 'preview',
              view: view,
              source: 'preview_urls',
              filename: url.split('/').pop() || 'preview',
              format: url.split('.').pop() || 'png'
            });
          }
        }
      });
    }
    
    // 4. Extract from positions object (might contain image references)
    if (positions && typeof positions === 'object') {
      // positions usually reference cloudinaryUrls, so we don't add duplicates
      // but we can add position info to existing images
      Object.entries(positions).forEach(([areaId, posData]) => {
        const matchingImage = images.find(img => img.area === areaId || img.url.includes(areaId));
        if (matchingImage && !matchingImage.position) {
          matchingImage.position = posData;
        }
      });
    }
    
    // 5. Extract from item.designData if available (backup)
    if (item.designData?.cloudinary_urls && typeof item.designData.cloudinary_urls === 'object') {
      Object.entries(item.designData.cloudinary_urls).forEach(([key, url]) => {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          const exists = images.some(img => img.url === url);
          if (!exists) {
            images.push({
              url: url,
              type: 'design_data_upload',
              area: key,
              source: 'designData.cloudinary_urls',
              filename: url.split('/').pop() || 'image',
              format: url.split('.').pop() || 'unknown'
            });
          }
        }
      });
    }
    
    return images;
  };

  // Get all images
  const allImages = extractAllImages();
  
  // Separate by type for better organization
  const uploadedImages = allImages.filter(img => img.type === 'uploaded' || img.type === 'print_area_image' || img.type === 'design_data_upload');
  const previewImages = allImages.filter(img => img.type === 'preview');
  const wrapImages = allImages.filter(img => img.type === 'wrap_image');

  // Check if it's a wrap design
  const isWrapDesign = previewUrls.full_wrap || wrapImages.length > 0 || Object.keys(cloudinaryUrls).some(key => key.includes('full_wrap'));

  if (isWrapDesign) {
    // Full Wrap Design - Show 3-panel grid
    const slotOrder = ["front", "center", "back"];
    const slotLabels = {
      front: "Front (Left)",
      center: "Center",
      back: "Back (Right)"
    };

    return (
      <div className="space-y-8">

        
           
        {/* Full Wrap Preview Image */}
        {previewUrls.full_wrap && (
          <div className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
            <div className="bg-purple-600 text-white px-5 py-3 font-medium text-center">
              Full Wrap Preview
            </div>
            <div className="p-4 bg-gray-50 relative group">
              <img
                src={previewUrls.full_wrap}
                alt="Full wrap preview"
                className="w-full h-80 object-contain mx-auto"
              />
              <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                <ViewButton url={previewUrls.full_wrap} />
                <DownloadButton
                  url={previewUrls.full_wrap}
                  filename={`order-${orderNumber}-full-wrap-preview.png`}
                />
              </div>
            </div>
          </div>
        )}

        



        {/* 3-Panel Individual Images - Using extracted images */}
        <div>
          <h4 className="text-lg font-semibold text-purple-700 mb-4">3-Panel Wrap Design</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {slotOrder.map((slot) => {
              // Find image for this slot
              const slotImage = wrapImages.find(img => img.slot === slot) || 
                               uploadedImages.find(img => img.area === slot || img.area?.startsWith(`${slot}_`));
              const imageUrl = slotImage?.url;
              const position = slotImage?.position || positions[`full_wrap_3panel_${slot}`] || {};
              
              // Get text for this slot
              const slotText = Object.entries(textLayers).find(([key]) => key === slot || key.startsWith(`${slot}_`))?.[1];

              if (!imageUrl && !slotText) return null;

              return (
                <div key={slot} className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
                  <div className="bg-purple-500 text-white px-3 py-2 font-medium text-center text-sm">
                    {slotLabels[slot]}
                  </div>
                  <div className="p-3 bg-gray-50 relative group">
                    {imageUrl ? (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt={`${slot} panel`}
                          className="w-full h-40 object-contain mx-auto"
                        />
                        {/* Format badge */}
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {slotImage?.format?.toUpperCase() || 'IMG'}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-center">
                          <div className="text-2xl mb-1">✏️</div>
                          <div className="text-xs text-gray-600 max-w-[120px] mx-auto break-words">
                            "{slotText?.content}"
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Text badge if both image and text exist */}
                    {imageUrl && slotText && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        📝
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 right-2 flex gap-2 z-10">
                      {imageUrl && <ViewButton url={imageUrl} />}
                      {imageUrl && (
                        <DownloadButton
                          url={imageUrl}
                          filename={`order-${orderNumber}-wrap-${slot}.${slotImage?.format || 'png'}`}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Image details */}
                  {imageUrl && (
                    <div className="px-3 py-2 text-xs bg-gray-100 border-t">
                      <div className="truncate text-gray-600">{slotImage?.filename || imageUrl.split('/').pop()}</div>
                    </div>
                  )}
                  
                  {/* Text details if text exists */}
                  {slotText && (
                    <div className="px-3 py-2 text-xs border-t bg-blue-50">
                      <div className="font-medium mb-1">Text: "{slotText.content}"</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* All Images Gallery */}
        {uploadedImages.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden mt-6">
            <div className="bg-purple-50 px-6 py-4 border-b flex items-center gap-2">
              <span className="text-2xl">🖼️</span>
              <h5 className="text-lg font-semibold text-purple-800">All Uploaded Images</h5>
              <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="relative h-32 bg-gray-50">
                      <img
                        src={img.url}
                        alt={`Upload ${idx}`}
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <ViewButton url={img.url} />
                      </div>
                    </div>
                    <div className="p-2 text-xs border-t">
                      <div className="font-medium truncate">{img.filename}</div>
                      <div className="text-gray-500 mt-1">Format: {img.format?.toUpperCase()}</div>
                      {img.area && <div className="text-gray-500">Area: {img.area}</div>}
                      {img.view && <div className="text-gray-500">View: {img.view}</div>}
                      {img.slot && <div className="text-gray-500">Slot: {img.slot}</div>}
                      <DownloadButton
                        url={img.url}
                        filename={`order-${orderNumber}-img-${idx}.${img.format || 'png'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Text Designs Section */}
        {Object.keys(textLayers).length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden mt-6">
            <div className="bg-purple-50 px-6 py-4 border-b flex items-center gap-2">
              <FileText size={20} className="text-purple-600" />
              <h5 className="text-lg font-semibold text-purple-800">Text Designs</h5>
              <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                {Object.keys(textLayers).length} text layer{Object.keys(textLayers).length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              {Object.entries(textLayers).map(([areaId, textData]) => {
                const slot = areaId.includes('_') ? areaId.split('_').pop() : 'unknown';
                const slotLabel = slot === 'front' ? 'Front (Left)' : 
                                 slot === 'center' ? 'Center' : 
                                 slot === 'back' ? 'Back (Right)' : slot;
                
                return (
                  <div key={areaId} className="border rounded-lg p-5 bg-gray-50">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h6 className="font-bold text-gray-900 text-lg capitalize">
                          Wrap - {slotLabel}
                        </h6>
                      </div>
                      
                      {/* Quick Preview of Text */}
                      <div className="bg-purple-100 p-4 rounded-lg border shadow-sm max-w-xs">
                        <p 
                          className="break-words text-center"
                          style={{
                            fontFamily: textData.fontFamily || 'Arial',
                            fontSize: `${textData.fontSize || 40}px`,
                            color: textData.color || '#000000',
                            fontWeight: textData.fontWeight || 'normal',
                          }}
                        >
                          {textData.content || 'No text'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="text-xs text-gray-500 block mb-1">Font Family</span>
                        <span className="font-medium text-gray-900">{textData.fontFamily || 'Arial'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="text-xs text-gray-500 block mb-1">Font Size</span>
                        <span className="font-medium text-gray-900">{textData.fontSize || 40}px</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="text-xs text-gray-500 block mb-1">Font Weight</span>
                        <span className="font-medium text-gray-900 capitalize">{textData.fontWeight || 'normal'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="text-xs text-gray-500 block mb-1">Color</span>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: textData.color || '#000000' }} />
                          <span className="font-medium text-gray-900 font-mono text-sm">{textData.color || '#000000'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single View Design (front/back)
  return (
    <div className="space-y-8">
      <h4 className="text-lg font-semibold text-purple-700 mb-4">Mug Design</h4>
        

        
      <div className="flex flex-row overflow-x-auto gap-4">
        {["front", "center", "back"].map((viewKey) => {
          if (!previewUrls[viewKey]) return null;
          return (
            <div key={viewKey} className="p-4 bg-gray-50 relative group min-w-[300px] flex-1">
              <div className="bg-purple-600 text-white px-3 py-1 font-medium capitalize text-center text-sm mb-2 rounded">
                {viewKey} View
              </div>
              <img
                src={previewUrls[viewKey]}
                alt={`${viewKey} preview`}
                className="w-full h-80 object-contain mx-auto"
              />
              <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                <ViewButton url={previewUrls[viewKey]} />
                <DownloadButton
                  url={previewUrls[viewKey]}
                  filename={`order-${orderNumber}-${viewKey}-preview.png`}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Front/Center/Back Views Details */}
      <div className="grid md:grid-cols-3 gap-8">
        {["front", "center", "back"].map((side) => {
          // Find all images for this side
          const sideUploadedImages = uploadedImages.filter(img => 
            img.view === side || img.area === side || img.area?.startsWith(`${side}_`)
          );
          
          const previewUrl = previewUrls[side];
          const areaData = printAreas[side];
          const mainImageUrl = areaData?.image?.url;
          const position = areaData?.image?.position;
          
          // Get text for this side
          const sideText = Object.entries(textLayers).find(([key]) => 
            !key.includes('full_wrap') && (key === side || key.startsWith(`${side}_`))
          )?.[1];

          if (sideUploadedImages.length === 0 && !previewUrl && !mainImageUrl && !sideText) return null;

          return (
            <div key={side} className="border rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="bg-purple-600 text-white px-5 py-3 font-medium capitalize text-center">
                {side.charAt(0).toUpperCase() + side.slice(1)} View
              
              
              </div>


              <div className="p-4 bg-gray-50 text-indigo-900 border-b">
                {areaData?.library_design && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎨</span>
                      <span className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">Library Design</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{areaData.library_design.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono italic">ID: {areaData.library_design.id}</p>
                    </div>
                  </div>
                )}

                {/* Show images if available */}
                {sideUploadedImages.length > 0 ? (
                  <div className="space-y-4">
                    {sideUploadedImages.map((img, idx) => (
                      <div key={idx} className="relative border rounded-lg overflow-hidden bg-white">
                        <img
                          src={img.url}
                          alt={`${side} upload ${idx}`}
                          className="w-full h-48 object-contain p-2"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <ViewButton url={img.url} />
                          <DownloadButton
                            url={img.url}
                            filename={`order-${orderNumber}-${side}-${idx}.${img.format || 'png'}`}
                          />
                        </div>
                        <div className="p-2 text-xs bg-gray-50 border-t">
                          <span className="font-medium">{img.format?.toUpperCase()}</span>
                          <span className="ml-2 text-gray-600 truncate block">{img.filename}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : previewUrl || mainImageUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl || mainImageUrl}
                      alt={`${side} preview`}
                      className="w-full h-64 object-contain mx-auto"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <ViewButton url={previewUrl || mainImageUrl} />
                      <DownloadButton
                        url={previewUrl || mainImageUrl}
                        filename={`order-${orderNumber}-${side}.png`}
                      />
                    </div>
                  </div>
                ) : sideText ? (
                  <div className="w-full h-64 flex items-center justify-center bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">✏️</div>
                      <p 
                        className="text-lg break-words"
                        style={{
                          fontFamily: sideText.fontFamily || 'Arial',
                          color: sideText.color || '#000',
                          fontWeight: sideText.fontWeight || 'normal'
                        }}
                      >
                        {sideText.content}
                      </p>
                    </div>
                  </div>
                ) : null}
                
                {/* Text details if text exists */}
                {sideText && (
                  <div className="mt-4 px-4 py-3 text-sm bg-blue-50 rounded-lg">
                    <div className="font-medium mb-2">Text: "{sideText.content}"</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>Font: {sideText.fontFamily || 'Arial'}</div>
                      <div>Size: {sideText.fontSize || 40}px</div>
                      <div className="flex items-center gap-1">
                        Color: 
                        <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: sideText.color || '#000' }} />
                      </div>
                      <div>Weight: {sideText.fontWeight || 'normal'}</div>
                    </div>
                  </div>
                )}
                
                {position && position.scale && (
                  <div className="mt-2 px-4 py-2 text-xs text-gray-600 border-t">
                    Image Scale: {Math.round((position.scale || 0.5) * 100)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>


      {/* All Images Gallery */}
      {uploadedImages.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden mt-6">
          <div className="bg-purple-50 px-6 py-4 border-b flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <h5 className="text-lg font-semibold text-purple-800">All Uploaded Images</h5>
            <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
              {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="relative h-32 bg-gray-50">
                    <img
                      src={img.url}
                      alt={`Upload ${idx}`}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <ViewButton url={img.url} />
                    </div>
                  </div>
                  <div className="p-2 text-xs border-t">
                    <div className="font-medium truncate">{img.filename}</div>
                    <div className="text-gray-500 mt-1">Format: {img.format?.toUpperCase()}</div>
                    {img.area && <div className="text-gray-500">Area: {img.area}</div>}
                    {img.view && <div className="text-gray-500">View: {img.view}</div>}
                    <DownloadButton
                      url={img.url}
                      filename={`order-${orderNumber}-img-${idx}.${img.format || 'png'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Text Designs Section */}
      {Object.keys(textLayers).length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden mt-6">
          <div className="bg-purple-50 px-6 py-4 border-b flex items-center gap-2">
            <FileText size={20} className="text-purple-600" />
            <h5 className="text-lg font-semibold text-purple-800">Text Designs</h5>
            <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
              {Object.keys(textLayers).length} text layer{Object.keys(textLayers).length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="p-6 space-y-6">
            {Object.entries(textLayers).map(([areaId, textData]) => {
              const side = areaId.includes('front') ? 'front' : 
                          areaId.includes('back') ? 'back' : 'front';
              const areaName = side.charAt(0).toUpperCase() + side.slice(1);
              
              return (
                <div key={areaId} className="border rounded-lg p-5 bg-gray-50">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h6 className="font-bold text-gray-900 text-lg capitalize">
                        {areaName} View Text
                      </h6>
                    </div>
                    
                    <div className="bg-purple-100 p-4 rounded-lg border shadow-sm max-w-xs">
                      <p 
                        className="break-words text-center"
                        style={{
                          fontFamily: textData.fontFamily || 'Arial',
                          fontSize: `${textData.fontSize || 40}px`,
                          color: textData.color || '#000000',
                          fontWeight: textData.fontWeight || 'normal',
                        }}
                      >
                        {textData.content || 'No text'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Font Family</span>
                      <span className="font-medium text-gray-900">{textData.fontFamily || 'Arial'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Font Size</span>
                      <span className="font-medium text-gray-900">{textData.fontSize || 40}px</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Font Weight</span>
                      <span className="font-medium text-gray-900 capitalize">{textData.fontWeight || 'normal'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Color</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: textData.color || '#000000' }} />
                        <span className="font-medium text-gray-900 font-mono text-sm">{textData.color || '#000000'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Text Summary */}
      {textSummary.length > 0 && !Object.keys(textLayers).length && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h6 className="font-semibold text-blue-800 mb-2">Text Designs Summary</h6>
          <div className="space-y-2">
            {textSummary.map((item, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-blue-100">
                <div className="flex items-start justify-between">
                  <span className="font-medium capitalize">{item.area_id?.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-gray-600">"{item.text}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
// T-Shirt Design Display Component
// T-Shirt Design Display Component - UPDATED with text design support
const TshirtDesignDisplay = ({ item, orderNumber }) => {
  const tshirtData = item.customization?.data?.tshirt || {};
  const printAreas = tshirtData.print_areas || {};
  const previewUrls = tshirtData.preview_urls || item.designData?.preview_urls || {};
  const mainPreview = tshirtData.preview_image_url || item.designData?.preview_url;
  
  // ✅ NEW: Get text data from multiple possible locations
  const textLayers = tshirtData.text_layers || item.designData?.text_layers || {};
  const textPositions = tshirtData.text_positions || item.designData?.text_positions || {};
  const textContent = tshirtData.text_content || item.designData?.text_content || {};
  const textSummary = tshirtData.metadata?.text_summary || item.designData?.metadata?.text_summary || [];

  return (
    <div className="space-y-8">
      {/* Both Side Previews */}
      <div className="grid md:grid-cols-2 gap-8">
        {["front", "back"].map((side) => {
          const previewUrl = previewUrls[side] || (side === "front" ? mainPreview : null);
          const fileName = `order-${orderNumber}-${side}-tshirt.png`;

          return (
            <div key={side} className="border rounded-xl overflow-hidden bg-white shadow-sm relative">
              <div className="bg-indigo-600 text-white px-5 py-3 font-medium capitalize text-center">
                {side.charAt(0).toUpperCase() + side.slice(1)} View
              </div>
              {previewUrl ? (
                <div className="p-4 bg-gray-50 relative group">
                  <img
                    src={previewUrl}
                    alt={`${side} preview`}
                    className="w-full h-80 object-contain mx-auto"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                    <ViewButton url={previewUrl} />
                    <DownloadButton url={previewUrl} filename={fileName} />
                  </div>
                </div>
              ) : (
                <div className="h-80 items-center justify-center flex flex-col text-gray-400 bg-gray-100">
                  <Image src={GrayLogo} alt="no preview" className="w-32"/>
                  <p>No {side} preview available</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ NEW: Text Designs Section */}
      {Object.keys(textLayers).length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" />
            <h5 className="text-lg font-semibold text-indigo-800">Text Designs</h5>
            <span className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
              {Object.keys(textLayers).length} text layer{Object.keys(textLayers).length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="p-6 space-y-6">
            {Object.entries(textLayers).map(([areaId, textData]) => {
              // Find which view this area belongs to
              const areaView = Object.entries(printAreas).find(([_, area]) => 
                area?.area === areaId || areaId.includes(area?.area)
              )?.[0] || 'front';
              
              const position = textPositions[areaId] || textData.position || {};
              const areaName = areaId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={areaId} className="border rounded-lg p-5 bg-gray-50">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h6 className="font-bold text-gray-900 text-lg capitalize">
                        {areaName}
                      </h6>
                      <span className="text-sm text-gray-500 capitalize bg-white px-3 py-1 rounded-full inline-block mt-1">
                        {areaView} view
                      </span>
                    </div>
                    
                    {/* Quick Preview of Text */}
                    <div className="bg-slate-200 p-4 rounded-lg border shadow-sm max-w-xs">
                      <p 
                        className="break-words text-center"
                        style={{
                          fontFamily: textData.fontFamily || 'Arial',
                          fontSize: `${textData.fontSize || 40}px`,
                          color: textData.color || '#000000',
                          fontWeight: textData.fontWeight || 'normal',
                          textShadow: textData.textShadow || 'none'
                        }}
                      >
                        {textData.content || 'No text'}
                      </p>
                    </div>
                  </div>

                  {/* Text Properties Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {/* Font Family */}
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Font Family</span>
                      <span className="font-medium text-gray-900 block truncate" 
                            style={{ fontFamily: textData.fontFamily || 'Arial' }}>
                        {textData.fontFamily || 'Arial'}
                      </span>
                    </div>

                    {/* Font Size */}
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Font Size</span>
                      <span className="font-medium text-gray-900">
                        {textData.fontSize || 40}px
                      </span>
                    </div>

                    {/* Font Weight */}
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Font Weight</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {textData.fontWeight || 'normal'}
                      </span>
                    </div>

                    {/* Text Color */}
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-xs text-gray-500 block mb-1">Color</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: textData.color || '#000000' }}
                        />
                        <span className="font-medium text-gray-900 font-mono text-sm">
                          {textData.color || '#000000'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Position Information */}
                  {position && (position.x !== 0 || position.y !== 0 || position.scale !== 1 || position.rotate !== 0) && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {position.x !== 0 && (
                        <div className="bg-gray-100 p-2 rounded text-sm">
                          <span className="text-gray-600">X Position:</span>
                          <span className="ml-2 font-medium">{position.x}px</span>
                        </div>
                      )}
                      {position.y !== 0 && (
                        <div className="bg-gray-100 p-2 rounded text-sm">
                          <span className="text-gray-600">Y Position:</span>
                          <span className="ml-2 font-medium">{position.y}px</span>
                        </div>
                      )}
                      {position.scale !== 1 && (
                        <div className="bg-gray-100 p-2 rounded text-sm">
                          <span className="text-gray-600">Scale:</span>
                          <span className="ml-2 font-medium">{Math.round(position.scale * 100)}%</span>
                        </div>
                      )}
                      {position.rotate !== 0 && (
                        <div className="bg-gray-100 p-2 rounded text-sm">
                          <span className="text-gray-600">Rotation:</span>
                          <span className="ml-2 font-medium">{position.rotate}°</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Print Areas Details (Images Only) - Keep existing but separate */}
      {Object.keys(printAreas).length > 0 && (
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-4">Print Areas & Images</h5>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(printAreas).map(([viewKey, area]) => (
              <div key={viewKey} className="bg-white rounded-lg p-4 shadow-sm border">
                <h6 className="font-semibold capitalize mb-2 text-indigo-600">
                  {viewKey} – {area.area?.replace(/_/g, " ") || "Custom Area"}
                </h6>

                {area.library_design && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎨</span>
                      <span className="font-bold text-amber-800 text-xs uppercase tracking-wider">Library Design</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{area.library_design.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {area.library_design.id}</p>
                    </div>
                  </div>
                )}

                {area.image?.url && (
                  <div className="mb-3 relative group">
                    <div className="relative overflow-hidden rounded">
                      <img
                        src={area.image.url}
                        alt="Placed design"
                        className="h-48 w-full object-contain"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2 z-10">
                        <ViewButton url={area.image.url} />
                        <DownloadButton
                          url={area.image.url}
                          filename={`design-${viewKey}-${area.area || "custom"}.png`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {area.image?.position && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Scale: {Math.round((area.image.position.scale || 0.5) * 100)}%</p>
                    <p>Position: X {area.image.position.x || 0}px, Y {area.image.position.y || 0}px</p>
                    {area.image.position.rotate !== 0 && (
                      <p>Rotation: {area.image.position.rotate}°</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Summary (Simplified View) */}
      {textSummary.length > 0 && !Object.keys(textLayers).length && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h6 className="font-semibold text-blue-800 mb-2">Text Designs Summary</h6>
          <div className="space-y-2">
            {textSummary.map((item, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-blue-100">
                <div className="flex items-start justify-between">
                  <span className="font-medium capitalize">{item.area_id?.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-gray-600">"{item.text}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderAdminById(orderId);
        console.log(res)
        setOrder(res.order);
        setStatus(res.order.orderStatus);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const updateStatusHandler = async () => {
    try {
      const res = await updateOrderStatus(orderId, status);
      setOrder(res.order);
      alert("Order status updated");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendInvoice = async () => {
    try {
      setSendingInvoice(true);
      await sendInvoiceEmail(orderId);
      alert("Invoice sent successfully to the customer!");
    } catch (err) {
      console.error("Failed to send invoice:", err);
      alert(err.response?.data?.message || "Failed to send invoice");
    } finally {
      setSendingInvoice(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading order details...</div>;
  if (!order) return <div className="p-10 text-center text-red-600">Order not found</div>;

  const allowedStatuses = [
    order.orderStatus,
    ...(STATUS_FLOW[order.orderStatus] || []),
  ];

  return (
    <div className="max-w-8xl mx-auto px-6 py-2 space-y-10 bg-gray-white h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-6 border-b pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              order.orderType === "collect" 
                ? "bg-teal-100 text-teal-700 border border-teal-200" 
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}>
              {order.orderType === "collect" ? "🏪 Shop Collection" : "🚚 Delivery"}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border px-4 py-2 rounded"
          >
            {allowedStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>

          <button
            onClick={updateStatusHandler}
            disabled={status === order.orderStatus}
            className="bg-indigo-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            Update Status
          </button>

          <button
            onClick={handleSendInvoice}
            disabled={sendingInvoice}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
          >
            {sendingInvoice ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {sendingInvoice ? "Sending..." : "Email Invoice"}
          </button>
        </div>
        <div>
          <p className="text-sm text-gray-600">
            Current Status: <strong className="capitalize">{order.orderStatus.replace(/_/g, ' ')}</strong>
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Items with product-specific displays */}
        <div className="lg:col-span-2 space-y-8">
          {order.items.map((item, index) => {
            const productType = item.productSnapshot?.productType || 
                               item.customization?.type || 
                               "other";

            return (
              <div key={index} className="bg-white overflow-hidden border rounded-xl">
                {/* Product Header */}
                <div className="p-6 flex gap-6 border-b bg-gray-50">
                  <div className="w-32 h-32 shrink-0 overflow-hidden rounded-lg border">
                    <img
                      src={item.productSnapshot?.image || "/placeholder.png"}
                      alt={item.productSnapshot?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
  <span className="bg-gray-900 text-white text-sm w-8 h-8 flex items-center justify-center rounded-full">
    {index + 1}
  </span>
  {item.productSnapshot?.name || "Custom Product"}
</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <span>Qty: {item.quantity}</span>
                      <span className="capitalize">
                        Type: {productType}
                      </span>
                      <span>
                        £{item.productSnapshot?.finalPrice?.toFixed(2) || "—"}
                      </span>
                    </div>

                    {/* Product Type Badge */}
                    <div className="flex gap-2">
                      {productType === "tshirt" && (
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs">
                          👕 Custom T-Shirt
                        </span>
                      )}
                      {productType === "mug" && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">
                          ☕ Custom Mug
                        </span>
                      )}
                      {productType === "mobileCase" && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs">
                          📱 Custom Phone Case
                        </span>
                      )}
                    </div>

                    {/* Model Info for Mobile Case */}
                    {productType === "mobileCase" && item.designData?.model && (
                      <div className="flex items-center gap-2 text-sm text-amber-700">
                        <Smartphone size={16} />
                        <span className="font-medium">{item.designData.model.name}</span>
                        <span className="text-xs text-gray-500">({item.designData.model.year})</span>
                      </div>
                    )}

                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <div className="flex gap-4 text-sm">
                        {item.variant.size && (
                          <span className="bg-gray-100 px-3 py-1 rounded">
                            Size: {item.variant.size}
                          </span>
                        )}
                        {item.variant.color && (
                          <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                            Color:
                            <span
                              className="w-5 h-5 rounded-full border"
                              style={{ backgroundColor: item.variant.color }}
                            ></span>
                            {item.variant.color_label || item.variant.color}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product-Specific Customization Section */}
               {/* Product-Specific Customization Section */}
<div className="p-6 bg-gray-50 border-t">
  {productType === "tshirt" && (
    <TshirtDesignDisplay item={item} orderNumber={order.orderNumber} />
  )}

  {productType === "mug" && (
    <MugDesignDisplay item={item} orderNumber={order.orderNumber} />
  )}

  {productType === "mobileCase" && (
    <MobileCaseDesignDisplay item={item} orderNumber={order.orderNumber} />
  )}

  {/* ✅ NEW: Check for custom fields products */}
  {!["tshirt", "mug", "mobileCase"].includes(productType) && (
    <>
      {/* First try to show custom fields if they exist */}
      {(item.customization?.data?.custom_fields || item.designData?.type === 'custom_fields') ? (
        <CustomFieldsDesignDisplay item={item} orderNumber={order.orderNumber} />
      ) : (
        // If no custom fields, show the default message
        <div className="text-center text-gray-500 py-8">
          No customization details for this product
        </div>
      )}
    </>
  )}
</div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Summary + Address */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
           

           <div className="space-y-3 text-sm">
  <div className="flex justify-between">
    <span className="text-gray-600">Subtotal</span>
    <span>£{order.subtotal.toFixed(2)}</span>
  </div>

  {order.discount?.amount > 0 && (
    <div className="flex justify-between text-green-600">
      <span>Discount ({order.discount.percent}%)</span>
      <span>-£{order.discount.amount.toFixed(2)}</span>
    </div>
  )}

  <div className="flex justify-between">
    <span className="text-gray-600">Delivery</span>
    <span>£{order.deliveryCharge.toFixed(2)}</span>
  </div>

  {/* 🔹 PACKAGING SECTION */}
  {order.packaging?.giftWrapCharge > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">Gift Wrap</span>
      <span>£{order.packaging.giftWrapCharge.toFixed(2)}</span>
    </div>
  )}

  {order.packaging?.hamperCharge > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">
        {HAMPER_NAMES[order.packaging.hamper] || order.packaging.hamper} Hamper
      </span>
      <span>£{order.packaging.hamperCharge.toFixed(2)}</span>
    </div>
  )}

  <div className="flex justify-between font-semibold text-lg border-t pt-3">
    <span>Total</span>
    <span className="text-green-700">
      £{order.totalAmount.toFixed(2)}
    </span>
  </div>
</div>
          </div>

          {/* Delivery Address */}
         <div className="bg-white border border-gray-300 rounded-lg p-4">
  <h2 className="text-base font-semibold text-gray-900 mb-4">
    {order.orderType === "collect" ? "🏪 Collection Information" : "🚚 Delivery Address"}
  </h2>

  <div className="text-sm text-gray-700 space-y-1 leading-relaxed">

    <div className="font-semibold text-gray-900">
      {order.deliveryAddress.fullName || "—"}
    </div>

    <div>{order.deliveryAddress.addressLine1 || "—"}</div>

    {order.deliveryAddress.addressLine2 && (
      <div>{order.deliveryAddress.addressLine2}</div>
    )}

    <div className="uppercase">
      {order.deliveryAddress.town || "—"}
    </div>

    {order.deliveryAddress.county && (
      <div>{order.deliveryAddress.county}</div>
    )}

    <div className="font-semibold uppercase tracking-wide">
      {order.deliveryAddress.postcode || "—"}
    </div>

    <div>United Kingdom</div>

    <div className="pt-2 text-xs text-gray-600">
      Phone: {order.deliveryAddress.phone || "—"}
    </div>

    {order.deliveryAddress.email && (
      <div className="text-xs text-gray-600">
        Email: {order.deliveryAddress.email}
      </div>
    )}

  </div>
</div>

        </div>
      </div>
    </div>
  );
}