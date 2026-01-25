import { Layers } from "lucide-react"

export default function PreviewCard({ title, baseImage, areas, subtitle }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      
      <div className="p-4">
        <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-4">
          {baseImage ? (
            <img src={baseImage} alt={title} className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center mb-2">
                <Layers className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Single Print Area</p>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {areas.map(area => (
            <div key={area.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-gray-900">{area.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Max: {area.max}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Print Area</span>
                <span>{area.references?.length || 0} reference images</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}