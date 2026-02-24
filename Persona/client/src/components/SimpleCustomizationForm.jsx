// components/SimpleCustomizationForm.jsx
"use client";

import { useState } from 'react';

export default function SimpleCustomizationForm({ product, onAddToCart }) {
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState({});

  const fields = product.customFields || [];
  const requiredFields = fields.filter(f => f.required);
  const totalSteps = fields.length;

  const currentField = fields[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageUpload = async (field, file) => {
    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreviews({ ...previews, [field.name]: previewUrl });
    setFiles({ ...files, [field.name]: file });
    setFormData({ ...formData, [field.name]: 'uploading' });

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (data.url) {
        setUploadedUrls({ ...uploadedUrls, [field.name]: data.url });
        setFormData({ ...formData, [field.name]: data.url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleTextChange = (field, value) => {
    setFormData({ ...formData, [field.name]: value });
  };

  const handleSubmit = async () => {
    // Check if all required fields are filled
    const missingRequired = requiredFields.some(f => !formData[f.name]);
    
    if (missingRequired) {
      alert('Please fill all required fields');
      return;
    }

    // Prepare cart item
    const cartItem = {
      productId: product._id,
      productSlug: product.slug,
      name: product.name,
      productType: product.type,
      image: product.thumbnail,
      price: product.pricing?.specialPrice || product.pricing?.basePrice,
      currency: product.pricing?.currency || 'GBP',
      quantity: 1,
      designData: {
        type: 'custom_fields',
        fields: fields,
        data: formData,
        uploaded_images: uploadedUrls,
        field_count: {
          images: fields.filter(f => f.type === 'image').length,
          texts: fields.filter(f => f.type === 'text').length
        }
      }
    };

    onAddToCart(cartItem);
  };

  // Step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {fields.map((field, idx) => (
        <div key={idx} className="flex items-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            idx <= currentStep ? 'bg-black text-white' : 'bg-gray-200'
          }`}>
            {idx + 1}
          </div>
          {idx < fields.length - 1 && (
            <div className={`flex-1 h-1 mx-2 ${
              idx < currentStep ? 'bg-black' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // Render current field
  const renderField = () => {
    if (!currentField) return null;

    const isImage = currentField.type === 'image';
    const hasValue = formData[currentField.name];
    const hasPreview = previews[currentField.name];

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Step {currentStep + 1} of {totalSteps}
        </h3>
        
        <div className="p-6 border rounded-lg">
          <label className="block mb-4">
            <span className="text-lg font-medium">{currentField.label}</span>
            {currentField.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {isImage ? (
            <div>
              {!hasValue ? (
                <input
                  type="file"
                  accept={currentField.imageConstraints?.allowedFormats?.map(f => `.${f}`).join(',')}
                  onChange={(e) => handleImageUpload(currentField, e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="relative">
                  <img
                    src={hasPreview}
                    alt="Preview"
                    className="max-h-64 mx-auto object-contain border rounded"
                  />
                  <button
                    onClick={() => {
                      setFormData({ ...formData, [currentField.name]: '' });
                      setPreviews({ ...previews, [currentField.name]: '' });
                      setFiles({ ...files, [currentField.name]: '' });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              {currentField.imageConstraints && (
                <p className="text-sm text-gray-500 mt-2">
                  Max size: {currentField.imageConstraints.maxSize}MB • 
                  Formats: {currentField.imageConstraints.allowedFormats?.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={formData[currentField.name] || ''}
              onChange={(e) => handleTextChange(currentField, e.target.value)}
              placeholder={currentField.textConstraints?.placeholder || `Enter ${currentField.label}`}
              maxLength={currentField.textConstraints?.maxLength}
              className="w-full p-3 border rounded text-lg"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {renderStepIndicator()}
      {renderField()}

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-6 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
        >
          Previous
        </button>
        
        {currentStep < totalSteps - 1 ? (
          <button
            onClick={handleNext}
            disabled={currentField?.required && !formData[currentField.name]}
            className="px-6 py-2 bg-black text-white rounded disabled:opacity-50 hover:bg-gray-800"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}