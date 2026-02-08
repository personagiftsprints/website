import { DESIGN_TYPES, UPLOAD_CONFIG } from './shared/constants'

export default function CustomizationPanel({
  isMobileCaseConfig,
  config,
  selectedModel,
  selectedView,
  viewData,
  viewOptions,
  selectedArea,
  designType,
  designs,
  textValue,
  fontFamily,
  selectedVariant,
  quantity,
  fileInputRef,
  FONTS,
  setDesignType,
  setTextValue,
  setFontFamily,
  setQuantity,
  setSelectedArea,
  handleViewChange,
  handleAreaChange,
  handleImageUpload,
  handleAddToCart,
  handleBuyNow,
  currentDesign,
  hasVariants
}) {
  return (
    <div className="w-96 border-l p-6 space-y-6 overflow-y-auto">
      {/* View/Model selection */}
      {isMobileCaseConfig ? (
        <div>
          <h3 className="font-semibold mb-2">Selected Model</h3>
          {selectedModel && config.models && (
            <div className="p-3 bg-gray-50 rounded mb-4">
              <p className="font-medium">{config.models.find(m => m.modelCode === selectedModel)?.modelName}</p>
              <p className="text-sm text-gray-600">Current view</p>
            </div>
          )}
        </div>
      ) : viewOptions.length > 0 ? (
        <div>
          <h3 className="font-semibold mb-2">View</h3>
          <div className="flex gap-2 flex-wrap">
            {viewOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleViewChange(option.id)}
                className={`px-3 py-1 rounded transition-colors ${
                  selectedView === option.id ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Print Area */}
      {viewData?.areas && viewData.areas.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Print Area</h3>
          {viewData.areas.map(area => (
            <div
              key={area.id}
              onClick={() => {
                handleAreaChange(area)
                setSelectedArea(area)
              }}
              className={`p-3 border rounded mb-2 cursor-pointer transition-colors ${
                selectedArea?.id === area.id ? 'border-black bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{area.name}</span>
                {area.max && <span className="text-xs text-gray-500">{area.max}</span>}
              </div>
              {area.description && (
                <p className="text-xs text-gray-500 mt-1">{area.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Design Type */}
      <div>
        <h3 className="font-semibold mb-2">Design Type</h3>
        <div className="flex gap-2">
          {DESIGN_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setDesignType(type.id)}
              className={`px-3 py-1 rounded transition-colors ${
                designType === type.id ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Design Input */}
      {designType === 'text' && (
        <>
          <input
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            placeholder="Enter your text here"
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-2 flex-wrap">
            {FONTS.map(font => (
              <button
                key={font.value}
                onClick={() => setFontFamily(font.value)}
                className={`px-3 py-1 rounded transition-colors ${
                  fontFamily === font.value ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
                } ${font.value}`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Image Upload */}
      {designType === 'image' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-dashed border-2 border-gray-300 p-6 text-center cursor-pointer hover:border-gray-400 transition-colors rounded"
        >
          <p className="text-gray-600">Click to upload image</p>
          <p className="text-sm text-gray-500 mt-1">
            Max {UPLOAD_CONFIG.maxSize / (1024 * 1024)}MB • {UPLOAD_CONFIG.formats.join(', ')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleImageUpload}
            accept={UPLOAD_CONFIG.acceptedTypes}
          />
        </div>
      )}

      {/* Current Design Preview */}
      {currentDesign && (
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium">Current Design:</p>
          <p className="text-sm text-gray-600">
            {currentDesign.type === 'image'
              ? `Image: ${currentDesign.name || 'Uploaded image'}`
              : `Text: "${currentDesign.text}"`}
          </p>
        </div>
      )}

      {/* Quantity Controls */}
      <QuantityControls
        quantity={quantity}
        setQuantity={setQuantity}
        selectedVariant={selectedVariant}
        hasVariants={hasVariants}
      />

      {/* Stock Info for Variant Products */}
      {hasVariants && selectedVariant && (
        <StockInfo selectedVariant={selectedVariant} />
      )}

      {/* Action Buttons */}
      <ActionButtons
        isMobileCaseConfig={isMobileCaseConfig}
        selectedModel={selectedModel}
        hasVariants={hasVariants}
        selectedVariant={selectedVariant}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
      />
    </div>
  )
}

// Sub-components for better organization
function QuantityControls({ quantity, setQuantity, selectedVariant, hasVariants }) {
  return (
    <div className="flex gap-3 items-center justify-center">
      <button
        onClick={() => setQuantity(q => Math.max(1, q - 1))}
        className="w-10 h-10 border rounded flex items-center justify-center"
        disabled={quantity <= 1}
      >
        −
      </button>
      <input
        type="number"
        value={quantity}
        min={1}
        max={hasVariants && selectedVariant ? selectedVariant.stockQuantity : undefined}
        onChange={e => {
          const newVal = Number(e.target.value)
          if (hasVariants && selectedVariant) {
            setQuantity(Math.max(1, Math.min(selectedVariant.stockQuantity, newVal)))
          } else {
            setQuantity(Math.max(1, newVal))
          }
        }}
        className="w-20 text-center border rounded py-2"
      />
      <button
        onClick={() => {
          if (hasVariants && selectedVariant) {
            setQuantity(q => Math.min(selectedVariant.stockQuantity, q + 1))
          } else {
            setQuantity(q => q + 1)
          }
        }}
        className="w-10 h-10 border rounded flex items-center justify-center"
        disabled={hasVariants && selectedVariant && quantity >= selectedVariant.stockQuantity}
      >
        +
      </button>
    </div>
  )
}

function StockInfo({ selectedVariant }) {
  return (
    <p className={`text-center font-medium ${
      selectedVariant.stockQuantity > 10 ? 'text-green-600' :
      selectedVariant.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
    }`}>
      {selectedVariant.stockQuantity > 0
        ? `${selectedVariant.stockQuantity} in stock`
        : 'Out of stock'}
    </p>
  )
}

function ActionButtons({
  isMobileCaseConfig,
  selectedModel,
  hasVariants,
  selectedVariant,
  handleAddToCart,
  handleBuyNow
}) {
  const getAddToCartText = () => {
    if (isMobileCaseConfig && !selectedModel) return 'Select Model First'
    if (hasVariants) {
      if (!selectedVariant) return 'Select Variant'
      if (selectedVariant.stockQuantity === 0) return 'Out of Stock'
      return 'Add to Cart'
    }
    return 'Add to Cart'
  }

  const isDisabled = (hasVariants && (!selectedVariant || selectedVariant.stockQuantity === 0)) ||
                    (isMobileCaseConfig && !selectedModel)

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`w-full py-3 rounded transition-colors font-medium ${
          isDisabled
            ? 'bg-gray-300 cursor-not-allowed text-gray-700'
            : 'bg-gray-900 hover:bg-black text-white'
        }`}
      >
        {getAddToCartText()}
      </button>

      <button
        onClick={handleBuyNow}
        disabled={isDisabled}
        className={`w-full py-3 rounded transition-colors font-medium ${
          isDisabled
            ? 'bg-gray-300 cursor-not-allowed text-gray-700'
            : 'bg-black hover:bg-gray-800 text-white'
        }`}
      >
        Buy Now
      </button>
    </>
  )
}