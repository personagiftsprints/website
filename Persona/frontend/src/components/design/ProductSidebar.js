import { SmartphoneIcon, ShirtIcon, MugIcon, InfoIcon } from './shared/icons'

export default function ProductSidebar({
  product,
  config,
  isMobileCaseConfig,
  hasVariants,
  selectedModel,
  selectedAttributes,
  setSelectedAttributes,
  handleModelChange,
  isOptionDisabled,
  getProductIcon
}) {
  const getIconComponent = () => {
    const iconType = getProductIcon()
    switch (iconType) {
      case 'smartphone': return <SmartphoneIcon />
      case 'shirt': return <ShirtIcon />
      case 'mug': return <MugIcon />
      default: return <InfoIcon />
    }
  }

  return (
    <div className="w-80 border-r p-5 space-y-6 overflow-y-auto">
      <img src={product.thumbnail} alt={product.name} className="w-full rounded" />
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{product.name}</h2>
        {getIconComponent()}
      </div>

      {/* Variant selection */}
      {hasVariants && product.productConfig?.attributes?.map(attr => (
        <div key={attr.code}>
          <p className="text-sm mb-2">{attr.name}</p>
          <div className="flex gap-2 flex-wrap">
            {attr.values?.map(value => (
              <button
                key={value}
                disabled={isOptionDisabled(attr.code, value)}
                onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.code]: value }))}
                className={`px-3 py-2 border rounded transition-colors ${
                  selectedAttributes[attr.code] === value ? 'bg-black text-white' : 'hover:bg-gray-100'
                } ${isOptionDisabled(attr.code, value) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Model selection for mobile case */}
      {isMobileCaseConfig && config.models && (
        <div>
          <p className="text-sm mb-2 font-medium">Select Phone Model</p>
          <div className="space-y-2">
            {config.models.map(model => (
              <button
                key={model.modelCode}
                onClick={() => handleModelChange(model.modelCode)}
                className={`w-full p-3 border rounded text-left transition-colors ${
                  selectedModel === model.modelCode ? 'bg-black text-white border-black' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{model.modelName}</span>
                  <span className="text-xs text-gray-500">{model.year}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {model.displaySize} • {model.dimensions.height} × {model.dimensions.width}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}