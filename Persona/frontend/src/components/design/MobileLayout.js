import { Menu, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react'
import MobileDrawers from './MobileDrawers'
import CanvasView from './CanvasView'

export default function MobileLayout({
  product,
  config,
  selectedView,
  selectedArea,
  selectedModel,
  designs,
  textValue,
  fontFamily,
  selectedAttributes,
  selectedVariant,
  quantity,
  mobileLeftDrawerOpen,
  mobileRightDrawerOpen,
  showMobilePreview,
  fileInputRef,
  FONTS,
  setDesignType,
  setTextValue,
  setFontFamily,
  setQuantity,
  setSelectedAttributes,
  setMobileLeftDrawerOpen,
  setMobileRightDrawerOpen,
  setShowMobilePreview,
  handleModelChange,
  handleViewChange,
  handleAreaChange,
  handleImageUpload,
  handleAddToCart,
  handleBuyNow,
  isOptionDisabled,
  getAvailableViews,
  getCurrentViewData,
  getAllViewOptions,
  getProductIcon,
  isMobileCaseConfig,
  hasVariants
}) {
  const viewData = getCurrentViewData()
  const currentDesign = designs[selectedView]?.[selectedArea?.id]

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={() => setMobileLeftDrawerOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold truncate max-w-[50vw]">{product.name}</h2>
        <button onClick={() => setMobileRightDrawerOpen(true)} className="p-2">
          <ShoppingCart size={24} />
        </button>
      </div>

      {/* Canvas */}
      <CanvasView
        viewData={viewData}
        isMobileCaseConfig={isMobileCaseConfig}
        selectedModel={selectedModel}
        product={product}
        selectedView={selectedView}
        currentDesign={currentDesign}
        selectedArea={selectedArea}
        isMobile={true}
      />

      {/* Floating preview */}
      {showMobilePreview && currentDesign && (
        <div
          className="absolute bottom-16 left-4 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 border border-gray-200 flex items-center gap-3 cursor-pointer"
          onClick={() => setMobileRightDrawerOpen(true)}
        >
          <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border">
            {currentDesign.type === 'image' && currentDesign.imageUrl ? (
              <img src={currentDesign.imageUrl} alt="preview" className="w-full h-full object-cover" />
            ) : currentDesign.type === 'text' && currentDesign.text ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs font-medium text-center p-1 overflow-hidden">
                {currentDesign.text.slice(0, 20)}{currentDesign.text.length > 20 ? '...' : ''}
              </div>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {currentDesign.type === 'image' ? (currentDesign.name || 'Uploaded image') : `Text: ${currentDesign.text || ''}`}
            </p>
            <p className="text-xs text-gray-500">Tap to edit / change</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowMobilePreview(false) }}
            className="p-1 text-gray-500 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Quick drawer buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        <button onClick={() => setMobileLeftDrawerOpen(true)} className="bg-white p-3 rounded-full shadow-lg border">
          <ChevronLeft size={24} />
        </button>
        <button onClick={() => setMobileRightDrawerOpen(true)} className="bg-white p-3 rounded-full shadow-lg border">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Drawers */}
      <MobileDrawers
        mobileLeftDrawerOpen={mobileLeftDrawerOpen}
        mobileRightDrawerOpen={mobileRightDrawerOpen}
        setMobileLeftDrawerOpen={setMobileLeftDrawerOpen}
        setMobileRightDrawerOpen={setMobileRightDrawerOpen}
        product={product}
        config={config}
        isMobileCaseConfig={isMobileCaseConfig}
        hasVariants={hasVariants}
        selectedModel={selectedModel}
        selectedAttributes={selectedAttributes}
        selectedView={selectedView}
        viewData={viewData}
        viewOptions={getAllViewOptions()}
        selectedArea={selectedArea}
        designType={designType}
        designs={designs}
        textValue={textValue}
        fontFamily={fontFamily}
        selectedVariant={selectedVariant}
        quantity={quantity}
        fileInputRef={fileInputRef}
        FONTS={FONTS}
        setDesignType={setDesignType}
        setTextValue={setTextValue}
        setFontFamily={setFontFamily}
        setQuantity={setQuantity}
        setSelectedAttributes={setSelectedAttributes}
        handleModelChange={handleModelChange}
        handleViewChange={handleViewChange}
        handleAreaChange={handleAreaChange}
        handleImageUpload={handleImageUpload}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
        isOptionDisabled={isOptionDisabled}
        currentDesign={currentDesign}
        getProductIcon={getProductIcon}
      />
    </div>
  )
}