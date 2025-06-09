'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, XCircle } from 'lucide-react';

export default function FileUpload({ onImageUpload, disabled }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    console.log('File input changed');
    const file = e.target.files[0];
    console.log('Selected file:', file);
    
    if (file && file.type.startsWith('image/')) {
      console.log('Valid image file, processing...');
      handleImageSelection(file);
    } else {
      console.log('Invalid file type or no file selected');
    }
  };

  const handleImageSelection = (file) => {
    console.log('Processing image selection:', file.name, file.size, file.type);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      console.log('File read successfully, setting preview');
      setPreviewImage(reader.result);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsDataURL(file);
    
    // Call the upload handler
    console.log('Calling onImageUpload with file');
    onImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    console.log('File dropped:', file);
    
    if (file && file.type.startsWith('image/')) {
      handleImageSelection(file);
    } else {
      console.log('Invalid dropped file');
    }
  };

  const handleClearImage = (e) => {
    e.stopPropagation();
    console.log('Clearing image');
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    console.log('Triggering file input');
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Camera className="w-6 h-6 mr-3 text-blue-400" />
        Upload Car Image
      </h2>
      
      <div 
        className={`relative w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-500 hover:border-blue-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={!disabled ? handleDrop : undefined}
        onClick={!disabled && !previewImage ? triggerFileInput : undefined}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {previewImage ? (
          <div className="relative">
            <div className="relative h-64 w-full mb-4">
              <img 
                src={previewImage} 
                alt="Car preview"
                className="h-full w-full object-contain rounded-md"
              />
            </div>
            {!disabled && (
              <button 
                onClick={handleClearImage}
                className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-500/80 transition-colors"
                aria-label="Clear image"
              >
                <XCircle size={20} />
              </button>
            )}
            <div className="mt-4">
              <button
                onClick={triggerFileInput}
                disabled={disabled}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choose Different Image
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="mb-4 flex justify-center">
              {disabled ? (
                <Camera size={48} className="text-gray-400" />
              ) : (
                <Upload size={48} className="text-blue-400" />
              )}
            </div>
            <p className="text-xl mb-2 font-medium">
              {disabled ? 'Processing image...' : 'Upload a car image'}
            </p>
            <p className="text-gray-400 mb-4">
              {disabled 
                ? 'Please wait while we analyze your image' 
                : 'Drag and drop or click to browse'}
            </p>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, WEBP (Max 10MB)
            </p>
            {!disabled && (
              <button
                onClick={triggerFileInput}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
              >
                Choose File
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
