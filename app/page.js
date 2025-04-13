'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [carData, setCarData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: () => {
      setUploadFailed(true);
      setError("Please upload a valid image file (JPG, PNG) under 10MB.");
    }
  });

  const handleImageUpload = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      setCarData(null);
      setUploadFailed(false);

      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Create form data to send the image to the API
      const formData = new FormData();
      formData.append('image', file);

      console.log("Sending image to API...");

      // Call our API route
      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `Failed to identify the car (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("Car data received:", data);
      setCarData(data);
    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.message || 'An error occurred while identifying the car');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-blue-600">Car Identifier</h1>
          <p className="mt-2 text-gray-600">Upload a car image and get detailed specifications instantly</p>
        </header>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            {!imagePreview && !uploadFailed && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Identify Any Car in Seconds
                </h2>
                <p className="text-gray-600 mb-8">
                  Upload an image of a car and our AI will identify its make, model, and specifications.
                </p>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium">
                      {isDragActive ? "Drop your image here" : "Drag & drop a car image, or click to browse"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports JPG, PNG (max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(imagePreview || uploadFailed) && (
              <div className="grid md:grid-cols-2 gap-8">
                {imagePreview && (
                  <div className="order-1 md:order-1">
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded car" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className={`order-2 md:order-2 ${!imagePreview ? 'md:col-span-2' : ''}`}>
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <h3 className="text-xl font-medium text-gray-800">Identifying your car...</h3>
                      <p className="text-gray-600 mt-2">
                        Our AI is analyzing the image to identify the make, model and specifications.
                      </p>
                    </div>
                  ) : error ? (
                    <div className="p-6 bg-red-50 text-red-700 rounded-lg">
                      <h3 className="text-xl font-medium">Error Occurred</h3>
                      <p className="mt-2">{error}</p>
                      <div className="mt-6 flex flex-wrap gap-4">
                        <button 
                          onClick={() => {
                            setImagePreview(null);
                            setError(null);
                            setUploadFailed(false);
                          }}
                          className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    carData && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl font-bold text-blue-600">
                            {carData.make} {carData.model}
                          </h2>
                          {carData.year && <p className="text-xl text-gray-600">{carData.year}</p>}
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Specifications</h3>
                          <div className="grid grid-cols-1 gap-3">
                            {carData.specifications.map((spec, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">{spec.name}</p>
                                <p className="font-medium">{spec.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {!isLoading && !error && imagePreview && (
                    <div className="mt-6">
                      <button 
                        onClick={() => {
                          setImagePreview(null);
                          setCarData(null);
                          setError(null);
                          setUploadFailed(false);
                        }}
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Upload New Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Car Identifier &copy; {new Date().getFullYear()} • Powered by Google Gemini AI</p>
        </footer>
      </div>
    </main>
  );
}