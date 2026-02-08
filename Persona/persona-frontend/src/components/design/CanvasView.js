export default function CanvasView({
  viewData,
  isMobileCaseConfig,
  selectedModel,
  product,
  selectedView,
  currentDesign,
  selectedArea,
  isMobile = false
}) {
  if (!viewData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-400">No preview available</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 relative">
      {viewData.baseImage ? (
        <img
          src={viewData.baseImage}
          alt={isMobileCaseConfig ? `${selectedModel} view` : `${product.name} - ${selectedView}`}
          className={`${isMobile ? 'max-h-full max-w-full' : 'max-h-full'} object-contain`}
        />
      ) : (
        <div className="text-gray-400">No preview available</div>
      )}
      
      {currentDesign?.type === 'image' && currentDesign.imageUrl && (
        <img
          src={currentDesign.imageUrl}
          alt="Custom design"
          className="absolute max-h-[60%] max-w-[60%] object-contain"
          style={{ 
            left: selectedArea?.position?.x || '50%', 
            top: selectedArea?.position?.y || '50%', 
            transform: 'translate(-50%, -50%)' 
          }}
        />
      )}
      
      {currentDesign?.type === 'text' && currentDesign.text && (
        <div
          className={`absolute ${isMobile ? 'text-2xl' : 'text-3xl'} ${currentDesign.font}`}
          style={{ 
            left: selectedArea?.position?.x || '50%', 
            top: selectedArea?.position?.y || '50%', 
            transform: 'translate(-50%, -50%)', 
            whiteSpace: 'nowrap' 
          }}
        >
          {currentDesign.text}
        </div>
      )}
    </div>
  )
}