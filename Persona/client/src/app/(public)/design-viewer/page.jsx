"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyDesignsPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = () => {
    const savedDesigns = JSON.parse(localStorage.getItem('tshirtDesigns') || '[]');
    setDesigns(savedDesigns);
    if (savedDesigns.length > 0) {
      setSelectedDesign(savedDesigns[0]);
    }
    setLoading(false);
  };

  const deleteDesign = (designId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this design?')) {
      const updatedDesigns = designs.filter(d => d.id !== designId);
      localStorage.setItem('tshirtDesigns', JSON.stringify(updatedDesigns));
      setDesigns(updatedDesigns);
      
      if (selectedDesign?.id === designId) {
        setSelectedDesign(updatedDesigns[0] || null);
      }
    }
  };

  const deleteAllDesigns = () => {
    if (confirm('Are you sure you want to delete ALL saved designs? This cannot be undone.')) {
      localStorage.removeItem('tshirtDesigns');
      setDesigns([]);
      setSelectedDesign(null);
    }
  };

  const downloadDesign = (design) => {
    const link = document.createElement('a');
    link.download = `tshirt-design-${design.id}.png`;
    link.href = design.previewImage;
    link.click();
  };

  const exportDesign = (design) => {
    const jsonData = JSON.stringify(design, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `design-${design.id}.json`;
    link.href = url;
    link.click();
  };

  const viewDesignDetails = (design) => {
    router.push(`/design-viewer?id=${design.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My T-Shirt Designs</h1>
            <p className="text-gray-600 mt-2">
              All designs are saved locally in your browser. They will persist until you clear browser data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Create New Design
            </Link>
            {designs.length > 0 && (
              <button
                onClick={deleteAllDesigns}
                className="px-5 py-2.5 border border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Delete All Designs
              </button>
            )}
          </div>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No designs yet</h3>
            <p className="text-gray-600 mb-8">Create your first custom t-shirt design to get started!</p>
            <Link
              href="/"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-lg"
            >
              Create Your First Design
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Designs List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Your Designs ({designs.length})</h2>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {Math.round(JSON.stringify(designs).length / 1024)} KB
                  </span>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedDesign?.id === design.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedDesign(design)}
                    >
                      <div className="flex gap-3">
                        <img
                          src={design.previewImage}
                          alt="Design preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {design.productName || 'Custom T-Shirt'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(design.savedAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded capitalize">
                              {design.color}
                            </span>
                            <span className="text-xs text-gray-500">
                              {design.totalUploadedAreas} area{design.totalUploadedAreas !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Design Details */}
            <div className="lg:col-span-2">
              {selectedDesign ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* Design Preview */}
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedDesign.productName}</h2>
                        <p className="text-gray-600">Created: {new Date(selectedDesign.savedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadDesign(selectedDesign)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Download PNG
                        </button>
                        <button
                          onClick={() => viewDesignDetails(selectedDesign)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={selectedDesign.previewImage}
                        alt="Design preview"
                        className="max-w-full h-auto rounded-lg border shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Design Information */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="font-semibold mb-3">Design Configuration</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Color:</span>
                            <span className="font-medium capitalize">{selectedDesign.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">View:</span>
                            <span className="font-medium capitalize">{selectedDesign.view}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Areas Used:</span>
                            <span className="font-medium">{selectedDesign.totalUploadedAreas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium">
                              {selectedDesign.currency} {selectedDesign.price}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Product Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product:</span>
                            <span className="font-medium text-right">{selectedDesign.productName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Material:</span>
                            <span className="font-medium text-right">{selectedDesign.productDetails?.material || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Design ID:</span>
                            <span className="font-medium text-sm text-right truncate max-w-[150px]">
                              {selectedDesign.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Area Positions */}
                    {selectedDesign.metadata?.selectedAreas && selectedDesign.metadata.selectedAreas.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-3">Area Positions & Coordinates</h3>
                        <div className="space-y-3">
                          {selectedDesign.metadata.selectedAreas.map((areaId) => {
                            const position = selectedDesign.metadata.imagePositions?.[areaId] || {};
                            const areaConfig = selectedDesign.areaConfigurations?.find(a => a.id === areaId);
                            
                            return (
                              <div key={areaId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{areaConfig?.name || areaId}</span>
                                  <span className="text-sm text-gray-500">Scale: {(position.scale || 0.5).toFixed(2)}x</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">X Position:</span>
                                    <p className="font-medium">{position.x || 0}px</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Y Position:</span>
                                    <p className="font-medium">{position.y || 0}px</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Rotation:</span>
                                    <p className="font-medium">{position.rotate || 0}°</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Area Size:</span>
                                    <p className="font-medium">{areaConfig?.width || 100}% × {areaConfig?.height || 100}%</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      <button
                        onClick={() => exportDesign(selectedDesign)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => deleteDesign(selectedDesign.id, { stopPropagation: () => {} })}
                        className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete Design
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedDesign.metadata, null, 2));
                          alert('Design metadata copied to clipboard!');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Copy Metadata
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500">Select a design to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Info */}
        {designs.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-800">Local Storage Information</h4>
                <p className="text-sm text-blue-600">
                  Designs are saved in your browser's localStorage. They will be available until you clear browser data.
                  Maximum 20 designs are saved (oldest designs are automatically deleted).
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-800">
                  {designs.length} / 20 designs saved
                </p>
                <p className="text-xs text-blue-600">
                  {Math.round(JSON.stringify(designs).length / 1024)} KB used
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}