'use client';

import { useState } from 'react';
import ImageUploader from './components/FileUpload';
import CarDetails from './components/CarDetails';
import LoadingState from './components/LoadingState';

export default function Home() {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [carData, setCarData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMethod, setActiveMethod] = useState('dropdown'); // 'dropdown' or 'photo'

  // Car makes data
  const carMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 
    'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda',
    'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln',
    'Jeep', 'Ram', 'Dodge', 'Chrysler', 'Buick', 'GMC', 'Volvo',
    'Jaguar', 'Land Rover', 'Porsche', 'Tesla', 'Genesis'
  ].sort();

  // Sample models for different makes
  const carModels = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Tundra', 'Sienna', 'Avalon', 'C-HR'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Passport', 'Ridgeline', 'Insight', 'Fit'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Edge', 'Expedition', 'Ranger', 'Bronco', 'Transit', 'Maverick'],
    'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Suburban', 'Traverse', 'Camaro', 'Corvette', 'Blazer', 'Colorado'],
    'BMW': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i4', 'iX'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'G-Class', 'EQS'],
    'Audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Titan', 'Frontier', 'Leaf', 'Ariya', '370Z'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Genesis', 'Ioniq', 'Veloster']
  };

  // Generate years from 2010 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => currentYear - i);

  const handleMakeChange = (e) => {
    const make = e.target.value;
    setSelectedMake(make);
    setSelectedModel(''); // Reset model when make changes
    setCarData(null);
    setError(null);
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setCarData(null);
    setError(null);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setCarData(null);
    setError(null);
  };

  const handleImageUpload = async (imageFile) => {
    console.log('handleImageUpload called with:', imageFile);
    
    setIsLoading(true);
    setError(null);
    setCarData(null);
    
    try {
      console.log('Creating FormData...');
      const formData = new FormData();
      formData.append('image', imageFile);
      
      console.log('Sending request to API...');
      const response = await fetch('/api/identify-car', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to identify car');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('Setting car data:', data);
      setCarData(data);
    } catch (err) {
      console.error('Error identifying car:', err);
      setError('Failed to identify the car from the image. Please try the dropdown method or another image.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCarSpecifications = async () => {
    console.log('getCarSpecifications called');
    console.log('Selected values:', { selectedMake, selectedModel, selectedYear });
    
    if (!selectedMake || !selectedModel || !selectedYear) {
      setError('Please select make, model, and year');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCarData(null);

    try {
      console.log('Sending dropdown request to API...');
      const response = await fetch('/api/identify-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          make: selectedMake,
          model: selectedModel,
          year: selectedYear
        }),
      });
      
      console.log('Dropdown response status:', response.status);
      
      const data = await response.json();
      console.log('Dropdown response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get car specifications');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('Setting car data from dropdown:', data);
      setCarData(data);
    } catch (err) {
      console.error('Error getting car specs:', err);
      setError('Failed to get car specifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setCarData(null);
    setError(null);
  };

  const switchMethod = (method) => {
    setActiveMethod(method);
    setCarData(null);
    setError(null);
    resetForm();
  };

  const availableModels = carModels[selectedMake] || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">Car Identifier</h1>
        <p className="text-xl text-center text-gray-300 mb-10">
          Identify cars by uploading a photo or selecting from dropdown menus
        </p>
        
        <div className="max-w-3xl mx-auto">
          {/* Method Selection Tabs */}
          <div className="flex mb-8 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
            <button
              onClick={() => switchMethod('dropdown')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                activeMethod === 'dropdown'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Select Car Details
            </button>
            <button
              onClick={() => switchMethod('photo')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                activeMethod === 'photo'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Upload Photo
            </button>
          </div>

          {/* Dropdown Method */}
          {activeMethod === 'dropdown' && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl mb-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Select Your Vehicle
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Make Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Car Make
                  </label>
                  <select
                    value={selectedMake}
                    onChange={handleMakeChange}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  >
                    <option value="">Select Make</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make} className="bg-gray-800">
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Car Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={!selectedMake || isLoading}
                  >
                    <option value="">Select Model</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model} className="bg-gray-800">
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={!selectedModel || isLoading}
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year} className="bg-gray-800">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons for Dropdown */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={getCarSpecifications}
                  disabled={!selectedMake || !selectedModel || !selectedYear || isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Getting Specifications...' : 'Get Car Specifications'}
                </button>

                <button
                  onClick={resetForm}
                  disabled={isLoading}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Photo Upload Method */}
          {activeMethod === 'photo' && (
            <div className="mb-8">
              <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
            </div>
          )}
          
          {isLoading && <LoadingState />}
          
          {error && (
            <div className="mt-8 p-4 bg-red-900/30 border border-red-500 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300">{error}</span>
              </div>
              {activeMethod === 'photo' && (
                <p className="text-red-200 text-sm mt-2">
                  Try the dropdown method for more reliable results.
                </p>
              )}
            </div>
          )}
          
          {carData && !isLoading && <CarDetails carData={carData} />}
        </div>
      </div>
    </main>
  );
}
