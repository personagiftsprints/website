// 🎯 Mug design preview component for checkout
function MugDesignPreview({ designData }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!designData) return null;
  
  const printAreas = designData.print_areas || {};
  const hasDesigns = Object.keys(printAreas).length > 0;
  
  // Check if it's a wrap design (multi-slot)
  const isWrapDesign = printAreas.full_wrap?.type === "multi";
  const wrapImages = isWrapDesign ? printAreas.full_wrap?.images : null;
  
  if (!hasDesigns) return null;
  
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
          ☕ Custom Mug
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-600 hover:text-purple-800"
        >
          {expanded ? "Hide details" : "View design details"}
        </button>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
          {isWrapDesign ? (
            // Wrap Design Display (3 slots)
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Full Wrap Design (Left to Right):</p>
              <div className="grid grid-cols-3 gap-2">
                {wrapImages && Object.entries(wrapImages)
                  .sort((a, b) => (a[1].slot_order || 0) - (b[1].slot_order || 0))
                  .map(([slot, data]) => (
                    <div key={slot} className="bg-white p-2 rounded border">
                      <div className="flex flex-col items-center">
                        {data.url && (
                          <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden mb-1">
                            <Image
                              src={data.url}
                              alt={slot}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <p className="text-xs font-medium capitalize">
                          {slot === "front" ? "Front (Left)" : 
                           slot === "center" ? "Center" : "Back (Right)"}
                        </p>
                        {data.position && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Size: {Math.round((data.position.scale || 0.5) * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            // Single View Design (front/back) - This matches your cart data
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Print Areas:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(printAreas).map(([view, area]) => (
                  <div key={view} className="bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {area.image?.url && (
                        <div className="relative w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={area.image.url}
                            alt={area.area}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium capitalize">
                          {view} View
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {area.area?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    {area.image?.position && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Size: {Math.round((area.image.position.scale || 0.5) * 100)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Show preview URLs if available */}
          {designData.preview_urls && (
            <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
              <p className="font-medium mb-1">Previews:</p>
              <div className="flex gap-2">
                {designData.preview_urls.front && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">
                    Front ✓
                  </span>
                )}
                {designData.preview_urls.back && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">
                    Back ✓
                  </span>
                )}
                {designData.preview_urls.full_wrap && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">
                    Wrap ✓
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}