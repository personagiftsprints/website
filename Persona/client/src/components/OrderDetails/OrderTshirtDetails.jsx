// components/OrderTshirtDetails.jsx
export default function OrderTshirtDetails({ customization }) {
  if (!customization?.data?.tshirt) return null;
  
  const tshirt = customization.data.tshirt;
  
  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="font-semibold text-sm mb-3">🎨 Custom T‑Shirt Design</h4>
      
      {/* Preview Image */}
      {tshirt.preview_image_url && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Final Design Preview:</p>
          <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
            <img 
              src={tshirt.preview_image_url} 
              alt="Custom t-shirt preview"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      )}
      
      {/* Print Areas */}
      <div className="space-y-3">
        <p className="text-xs font-medium">Print Areas:</p>
        <div className="grid grid-cols-2 gap-3">
          {tshirt.uploaded_images?.map((area, idx) => (
            <div key={idx} className="border rounded p-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 bg-gray-200 rounded overflow-hidden">
                  <img 
                    src={area.cloudinary_url || area.local_url} 
                    alt={area.area_name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium">{area.area_name}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{area.view} view</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Specifications */}
      <div className="mt-4 text-xs space-y-1 bg-gray-50 p-3 rounded">
        <p><span className="font-medium">Size:</span> {tshirt.size}</p>
        <p><span className="font-medium">Color:</span> {tshirt.color}</p>
        {tshirt.view_configuration?.show_center_chest && (
          <p><span className="font-medium">Features:</span> Center Chest Print</p>
        )}
      </div>
    </div>
  );
}