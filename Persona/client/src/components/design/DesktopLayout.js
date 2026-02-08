import ProductSidebar from './ProductSidebar'
import CanvasView from './CanvasView'
import CustomizationPanel from './CustomizationPanel'

export default function DesktopLayout({
  product,
  config,
  isMobileCaseConfig,
  hasVariants,
  selectedView,
  selectedArea,
  selectedModel,
  designType,
  designs,
  textValue,
  fontFamily,
  selectedAttributes,
  selectedVariant,
  quantity,
  fileInputRef,
  FONTS,
  viewData,
  currentDesign,
  viewOptions,
  setDesignType,
  setTextValue,
  setFontFamily,
  setQuantity,
  setSelectedAttributes,
  setSelectedArea,
  handleModelChange,
  handleViewChange,
  handleAreaChange,
  handleImageUpload,
  handleAddToCart,
  handleBuyNow,
  isOptionDisabled,
  getProductIcon
}) {
  return (
    <div className="flex h-screen bg-white">
   
      <ProductSidebar
        product={product}
        config={config}
        isMobileCaseConfig={isMobileCaseConfig}
        hasVariants={hasVariants}
        selectedModel={selectedModel}
        selectedAttributes={selectedAttributes}
        setSelectedAttributes={setSelectedAttributes}
        handleModelChange={handleModelChange}
        isOptionDisabled={isOptionDisabled}
        getProductIcon={getProductIcon}
      />

      
      <CanvasView
        viewData={viewData}
        isMobileCaseConfig={isMobileCaseConfig}
        selectedModel={selectedModel}
        product={product}
        selectedView={selectedView}
        currentDesign={currentDesign}
        selectedArea={selectedArea}
      />

    
      <CustomizationPanel
        isMobileCaseConfig={isMobileCaseConfig}
        config={config}
        selectedModel={selectedModel}
        selectedView={selectedView}
        viewData={viewData}
        viewOptions={viewOptions}
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
        setSelectedArea={setSelectedArea}
        handleViewChange={handleViewChange}
        handleAreaChange={handleAreaChange}
        handleImageUpload={handleImageUpload}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
        currentDesign={currentDesign}
        hasVariants={hasVariants}
      />
      
    </div>
  )
}