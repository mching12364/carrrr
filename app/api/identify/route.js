import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.log('No Gemini API key found, using mock data');
    }

    // Determine if this is an image upload or dropdown selection
    const contentType = request.headers.get('content-type');
    const isFormData = contentType?.includes('multipart/form-data');
    
    if (isFormData) {
      // Handle image upload
      return await handleImageUpload(request, apiKey);
    } else {
      // Handle dropdown selection
      return await handleDropdownSelection(request, apiKey);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleImageUpload(request, apiKey) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image identification requires API key configuration' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log(`Processing image: ${imageFile.name}, type: ${imageFile.type}, size: ${imageFile.size} bytes`);

    // Convert file to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = imageFile.type;

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `
      Analyze this car image and identify the following details:
      1. Car make (brand)
      2. Car model
      3. Year (estimated if discernible)
      4. Key specifications:
         - Horsepower
         - Weight  
         - Powertrain type (combustion, hybrid, electric)
         - Engine details
         - Fuel economy
         - Other notable specifications
      
      FORMAT YOUR RESPONSE AS A VALID JSON OBJECT WITH EXACTLY THIS STRUCTURE:
      {
        "make": "String - brand name",
        "model": "String - model name",
        "year": "String or null if unknown",
        "specifications": [
          {
            "category": "Engine",
            "value": "engine details",
            "unit": ""
          },
          {
            "category": "Horsepower",
            "value": "numeric value",
            "unit": "hp"
          },
          {
            "category": "Weight",
            "value": "numeric value",
            "unit": "lbs"
          },
          {
            "category": "Powertrain",
            "value": "descriptive string",
            "unit": ""
          }
        ]
      }
      
      IMPORTANT: Return ONLY the JSON object with no additional text, markdown formatting, or explanation.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ]);

    const response = result.response;
    const textResponse = response.text();
    
    // Try to extract JSON from the response
    let jsonContent = textResponse;
    
    // If response is wrapped in markdown code blocks, extract it
    const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, textResponse];
    if (jsonMatch && jsonMatch[1]) {
      jsonContent = jsonMatch[1].trim();
    }
    
    try {
      const parsedData = JSON.parse(jsonContent);
      
      // Validate the parsed data has required fields
      if (!parsedData.make || !parsedData.model || !Array.isArray(parsedData.specifications)) {
        console.error('Invalid response format from Gemini API');
        throw new Error('Could not parse car details from image');
      }
      
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return NextResponse.json(
        { error: 'Could not identify car from image. Please try the dropdown method.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image. Please try the dropdown method.' },
      { status: 500 }
    );
  }
}

async function handleDropdownSelection(request, apiKey) {
  try {
    const { make, model, year } = await request.json();
    
    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      );
    }

    console.log(`Getting specifications for: ${year} ${make} ${model}`);

    if (!apiKey) {
      return getMockCarSpecs(make, model, year);
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model_ai = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Provide detailed specifications for the ${year} ${make} ${model}.
      
      Include comprehensive information about:
      - Engine specifications (displacement, type, configuration)
      - Horsepower and torque
      - Fuel economy (city/highway/combined MPG)
      - Transmission type
      - Drivetrain (FWD, RWD, AWD)
      - Weight (curb weight)
      - Dimensions (length, width, height)
      - Seating capacity
      - Cargo space
      - Top speed (if available)
      - 0-60 mph acceleration time (if available)
      
      FORMAT YOUR RESPONSE AS A VALID JSON OBJECT WITH EXACTLY THIS STRUCTURE:
      {
        "make": "Brand name",
        "model": "Model name", 
        "year": "Year",
        "specifications": [
          {
            "category": "Engine",
            "value": "specific engine details",
            "unit": ""
          },
          {
            "category": "Horsepower", 
            "value": "numerical value",
            "unit": "hp"
          },
          {
            "category": "Torque",
            "value": "numerical value", 
            "unit": "lb-ft"
          },
          {
            "category": "Fuel Economy",
            "value": "city/highway/combined",
            "unit": "mpg"
          },
          {
            "category": "Transmission",
            "value": "transmission details",
            "unit": ""
          },
          {
            "category": "Drivetrain", 
            "value": "FWD/RWD/AWD",
            "unit": ""
          },
          {
            "category": "Weight",
            "value": "numerical value",
            "unit": "lbs"
          },
          {
            "category": "Length",
            "value": "numerical value",
            "unit": "inches"
          },
          {
            "category": "Acceleration",
            "value": "0-60 time",
            "unit": "seconds"
          }
        ]
      }
      
      If exact specifications are not available, provide reasonable estimates based on similar vehicles from that manufacturer and year.
      IMPORTANT: Return ONLY the JSON object with no additional text, markdown formatting, or explanation.
    `;

    try {
      const result = await model_ai.generateContent(prompt);
      const response = result.response;
      const textResponse = response.text();
      
      // Try to extract JSON from the response
      let jsonContent = textResponse;
      
      // If response is wrapped in markdown code blocks, extract it
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, textResponse];
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
      }
      
      try {
        const parsedData = JSON.parse(jsonContent);
        
        // Validate the parsed data has required fields
        if (!parsedData.make || !parsedData.model || !Array.isArray(parsedData.specifications)) {
          console.error('Invalid response format from Gemini API - using fallback');
          return getMockCarSpecs(make, model, year);
        }
        
        return NextResponse.json(parsedData);
      } catch (parseError) {
        console.error('Error parsing Gemini response - using fallback:', parseError);
        return getMockCarSpecs(make, model, year);
      }
    } catch (geminiError) {
      console.error('Error calling Gemini API - using fallback:', geminiError);
      return getMockCarSpecs(make, model, year);
    }
  } catch (error) {
    console.error('Error in dropdown selection:', error);
    return NextResponse.json(
      { error: 'Failed to get car specifications' },
      { status: 500 }
    );
  }
}

// Fallback function to provide mock data when API is not available
function getMockCarSpecs(make, model, year) {
  // Generate realistic mock specifications based on the car selection
  const specs = generateMockSpecs(make, model, year);
  
  return NextResponse.json({
    make,
    model,
    year,
    specifications: specs
  });
}

function generateMockSpecs(make, model, year) {
  // Base specifications that vary by manufacturer and model type
  const baseSpecs = {
    'Toyota': {
      'Camry': { hp: 203, weight: 3310, mpg: '28/39/32', engine: '2.5L 4-cylinder' },
      'Corolla': { hp: 139, weight: 2910, mpg: '32/41/35', engine: '2.0L 4-cylinder' },
      'RAV4': { hp: 203, weight: 3370, mpg: '27/35/30', engine: '2.5L 4-cylinder' },
      'Prius': { hp: 121, weight: 3010, mpg: '58/53/56', engine: '1.8L Hybrid' }
    },
    'Honda': {
      'Civic': { hp: 158, weight: 2906, mpg: '32/42/36', engine: '2.0L 4-cylinder' },
      'Accord': { hp: 192, weight: 3131, mpg: '30/38/33', engine: '1.5L Turbo' },
      'CR-V': { hp: 190, weight: 3337, mpg: '28/34/30', engine: '1.5L Turbo' }
    },
    'Ford': {
      'F-150': { hp: 290, weight: 4069, mpg: '20/26/22', engine: '3.3L V6' },
      'Mustang': { hp: 310, weight: 3532, mpg: '21/32/25', engine: '2.3L Turbo' },
      'Escape': { hp: 181, weight: 3267, mpg: '28/34/30', engine: '1.5L Turbo' }
    },
    'Tesla': {
      'Model 3': { hp: 283, weight: 3552, mpg: '142/132/136', engine: 'Electric Motor' },
      'Model S': { hp: 670, weight: 4561, mpg: '120/115/118', engine: 'Dual Motor Electric' },
      'Model Y': { hp: 384, weight: 4416, mpg: '131/117/124', engine: 'Dual Motor Electric' }
    }
  };

  // Get specific specs or use defaults
  const carSpecs = baseSpecs[make]?.[model] || {
    hp: 200,
    weight: 3200,
    mpg: '25/35/29',
    engine: '2.0L 4-cylinder'
  };

  // Adjust for year (newer cars tend to be slightly more efficient and powerful)
  const yearFactor = (parseInt(year) - 2010) / 10;
  const adjustedHp = Math.round(carSpecs.hp * (1 + yearFactor * 0.1));
  const adjustedWeight = Math.round(carSpecs.weight * (1 + yearFactor * 0.05));

  return [
    {
      category: "Engine",
      value: carSpecs.engine,
      unit: ""
    },
    {
      category: "Horsepower",
      value: adjustedHp.toString(),
      unit: "hp"
    },
    {
      category: "Torque",
      value: Math.round(adjustedHp * 1.2).toString(),
      unit: "lb-ft"
    },
    {
      category: "Fuel Economy",
      value: carSpecs.mpg,
      unit: "mpg"
    },
    {
      category: "Transmission",
      value: make === 'Tesla' ? 'Single-speed automatic' : 'CVT / 8-speed automatic',
      unit: ""
    },
    {
      category: "Drivetrain",
      value: getTypicalDrivetrain(make, model),
      unit: ""
    },
    {
      category: "Weight",
      value: adjustedWeight.toLocaleString(),
      unit: "lbs"
    },
    {
      category: "Length",
      value: getTypicalLength(model).toString(),
      unit: "inches"
    },
    {
      category: "Acceleration",
      value: getAcceleration(make, model, adjustedHp).toString(),
      unit: "seconds (0-60)"
    }
  ];
}

function getTypicalDrivetrain(make, model) {
  const awd = ['RAV4', 'CR-V', 'Outback', 'X3', 'Q5', 'GLC', 'Model Y', 'Model X'];
  const rwd = ['Mustang', 'Camaro', 'Corvette', '370Z', 'Model S', '3 Series', 'C-Class'];
  
  if (awd.includes(model)) return 'AWD';
  if (rwd.includes(model)) return 'RWD';
  return 'FWD';
}

function getTypicalLength(model) {
  const compact = ['Corolla', 'Civic', 'Sentra', 'Elantra'];
  const midsize = ['Camry', 'Accord', 'Altima', 'Sonata'];
  const suv = ['RAV4', 'CR-V', 'Escape', 'Equinox'];
  const truck = ['F-150', 'Silverado', 'Tacoma', 'Tundra'];
  
  if (compact.includes(model)) return Math.round(182 + Math.random() * 8);
  if (midsize.includes(model)) return Math.round(192 + Math.random() * 8);
  if (suv.includes(model)) return Math.round(180 + Math.random() * 15);
  if (truck.includes(model)) return Math.round(210 + Math.random() * 20);
  return Math.round(185 + Math.random() * 10);
}

function getAcceleration(make, model, hp) {
  // Base acceleration calculation based on horsepower and vehicle type
  let baseTime = 8.5;
  
  if (hp > 400) baseTime = 4.5;
  else if (hp > 300) baseTime = 5.5;
  else if (hp > 250) baseTime = 6.5;
  else if (hp > 200) baseTime = 7.5;
  
  // Adjust for specific makes/models
  if (make === 'Tesla') baseTime *= 0.7; // Electric cars are faster
  if (model.includes('Corvette')) baseTime = 3.5;
  if (model.includes('Prius')) baseTime = 9.8;
  
  return Math.round(baseTime * 10) / 10;
}import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.log('No Gemini API key found, using mock data');
      const { make, model, year } = await request.json();
      return getMockCarSpecs(make, model, year);
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the car details from the request
    const { make, model, year } = await request.json();
    
    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      );
    }

    console.log(`Getting specifications for: ${year} ${make} ${model}`);

    // Generate content with Gemini
    const model_ai = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Provide detailed specifications for the ${year} ${make} ${model}.
      
      Include comprehensive information about:
      - Engine specifications (displacement, type, configuration)
      - Horsepower and torque
      - Fuel economy (city/highway/combined MPG)
      - Transmission type
      - Drivetrain (FWD, RWD, AWD)
      - Weight (curb weight)
      - Dimensions (length, width, height)
      - Seating capacity
      - Cargo space
      - Top speed (if available)
      - 0-60 mph acceleration time (if available)
      
      FORMAT YOUR RESPONSE AS A VALID JSON OBJECT WITH EXACTLY THIS STRUCTURE:
      {
        "make": "Brand name",
        "model": "Model name", 
        "year": "Year",
        "specifications": [
          {
            "category": "Engine",
            "value": "specific engine details",
            "unit": ""
          },
          {
            "category": "Horsepower", 
            "value": "numerical value",
            "unit": "hp"
          },
          {
            "category": "Torque",
            "value": "numerical value", 
            "unit": "lb-ft"
          },
          {
            "category": "Fuel Economy",
            "value": "city/highway/combined",
            "unit": "mpg"
          },
          {
            "category": "Transmission",
            "value": "transmission details",
            "unit": ""
          },
          {
            "category": "Drivetrain", 
            "value": "FWD/RWD/AWD",
            "unit": ""
          },
          {
            "category": "Weight",
            "value": "numerical value",
            "unit": "lbs"
          },
          {
            "category": "Length",
            "value": "numerical value",
            "unit": "inches"
          },
          {
            "category": "Acceleration",
            "value": "0-60 time",
            "unit": "seconds"
          }
        ]
      }
      
      If exact specifications are not available, provide reasonable estimates based on similar vehicles from that manufacturer and year.
      IMPORTANT: Return ONLY the JSON object with no additional text, markdown formatting, or explanation.
    `;

    try {
      const result = await model_ai.generateContent(prompt);
      const response = result.response;
      const textResponse = response.text();
      
      console.log('Received response from Gemini');
      
      // Try to extract JSON from the response
      let jsonContent = textResponse;
      
      // If response is wrapped in markdown code blocks, extract it
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, textResponse];
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
      }
      
      try {
        const parsedData = JSON.parse(jsonContent);
        
        // Validate the parsed data has required fields
        if (!parsedData.make || !parsedData.model || !Array.isArray(parsedData.specifications)) {
          console.error('Invalid response format from Gemini API - missing required fields');
          console.log('Received:', jsonContent);
          
          // Return fallback with the requested car details
          return getMockCarSpecs(make, model, year);
        }
        
        return NextResponse.json(parsedData);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw response:', textResponse);
        
        // Return fallback with the requested car details
        return getMockCarSpecs(make, model, year);
      }
    } catch (geminiError) {
      console.error('Error calling Gemini API:', geminiError);
      
      // Return fallback with the requested car details
      return getMockCarSpecs(make, model, year);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback function to provide mock data when API is not available
function getMockCarSpecs(make, model, year) {
  // Generate realistic mock specifications based on the car selection
  const specs = generateMockSpecs(make, model, year);
  
  return NextResponse.json({
    make,
    model,
    year,
    specifications: specs
  });
}

function generateMockSpecs(make, model, year) {
  // Base specifications that vary by manufacturer and model type
  const baseSpecs = {
    'Toyota': {
      'Camry': { hp: 203, weight: 3310, mpg: '28/39/32', engine: '2.5L 4-cylinder' },
      'Corolla': { hp: 139, weight: 2910, mpg: '32/41/35', engine: '2.0L 4-cylinder' },
      'RAV4': { hp: 203, weight: 3370, mpg: '27/35/30', engine: '2.5L 4-cylinder' },
      'Prius': { hp: 121, weight: 3010, mpg: '58/53/56', engine: '1.8L Hybrid' }
    },
    'Honda': {
      'Civic': { hp: 158, weight: 2906, mpg: '32/42/36', engine: '2.0L 4-cylinder' },
      'Accord': { hp: 192, weight: 3131, mpg: '30/38/33', engine: '1.5L Turbo' },
      'CR-V': { hp: 190, weight: 3337, mpg: '28/34/30', engine: '1.5L Turbo' }
    },
    'Ford': {
      'F-150': { hp: 290, weight: 4069, mpg: '20/26/22', engine: '3.3L V6' },
      'Mustang': { hp: 310, weight: 3532, mpg: '21/32/25', engine: '2.3L Turbo' },
      'Escape': { hp: 181, weight: 3267, mpg: '28/34/30', engine: '1.5L Turbo' }
    },
    'Tesla': {
      'Model 3': { hp: 283, weight: 3552, mpg: '142/132/136', engine: 'Electric Motor' },
      'Model S': { hp: 670, weight: 4561, mpg: '120/115/118', engine: 'Dual Motor Electric' },
      'Model Y': { hp: 384, weight: 4416, mpg: '131/117/124', engine: 'Dual Motor Electric' }
    }
  };

  // Get specific specs or use defaults
  const carSpecs = baseSpecs[make]?.[model] || {
    hp: 200,
    weight: 3200,
    mpg: '25/35/29',
    engine: '2.0L 4-cylinder'
  };

  // Adjust for year (newer cars tend to be slightly more efficient and powerful)
  const yearFactor = (parseInt(year) - 2010) / 10;
  const adjustedHp = Math.round(carSpecs.hp * (1 + yearFactor * 0.1));
  const adjustedWeight = Math.round(carSpecs.weight * (1 + yearFactor * 0.05));

  return [
    {
      category: "Engine",
      value: carSpecs.engine,
      unit: ""
    },
    {
      category: "Horsepower",
      value: adjustedHp.toString(),
      unit: "hp"
    },
    {
      category: "Torque",
      value: Math.round(adjustedHp * 1.2).toString(),
      unit: "lb-ft"
    },
    {
      category: "Fuel Economy",
      value: carSpecs.mpg,
      unit: "mpg"
    },
    {
      category: "Transmission",
      value: make === 'Tesla' ? 'Single-speed automatic' : 'CVT / 8-speed automatic',
      unit: ""
    },
    {
      category: "Drivetrain",
      value: getTypicalDrivetrain(make, model),
      unit: ""
    },
    {
      category: "Weight",
      value: adjustedWeight.toLocaleString(),
      unit: "lbs"
    },
    {
      category: "Length",
      value: getTypicalLength(model).toString(),
      unit: "inches"
    },
    {
      category: "Acceleration",
      value: getAcceleration(make, model, adjustedHp).toString(),
      unit: "seconds (0-60)"
    }
  ];
}

function getTypicalDrivetrain(make, model) {
  const awd = ['RAV4', 'CR-V', 'Outback', 'X3', 'Q5', 'GLC', 'Model Y', 'Model X'];
  const rwd = ['Mustang', 'Camaro', 'Corvette', '370Z', 'Model S', '3 Series', 'C-Class'];
  
  if (awd.includes(model)) return 'AWD';
  if (rwd.includes(model)) return 'RWD';
  return 'FWD';
}

function getTypicalLength(model) {
  const compact = ['Corolla', 'Civic', 'Sentra', 'Elantra'];
  const midsize = ['Camry', 'Accord', 'Altima', 'Sonata'];
  const suv = ['RAV4', 'CR-V', 'Escape', 'Equinox'];
  const truck = ['F-150', 'Silverado', 'Tacoma', 'Tundra'];
  
  if (compact.includes(model)) return Math.round(182 + Math.random() * 8);
  if (midsize.includes(model)) return Math.round(192 + Math.random() * 8);
  if (suv.includes(model)) return Math.round(180 + Math.random() * 15);
  if (truck.includes(model)) return Math.round(210 + Math.random() * 20);
  return Math.round(185 + Math.random() * 10);
}

function getAcceleration(make, model, hp) {
  // Base acceleration calculation based on horsepower and vehicle type
  let baseTime = 8.5;
  
  if (hp > 400) baseTime = 4.5;
  else if (hp > 300) baseTime = 5.5;
  else if (hp > 250) baseTime = 6.5;
  else if (hp > 200) baseTime = 7.5;
  
  // Adjust for specific makes/models
  if (make === 'Tesla') baseTime *= 0.7; // Electric cars are faster
  if (model.includes('Corvette')) baseTime = 3.5;
  if (model.includes('Prius')) baseTime = 9.8;
  
  return Math.round(baseTime * 10) / 10;
        const modelMatch = textResponse.match(/model["']?\s*:\s*["']([^"']+)["']/i);
        
        if (makeMatch || modelMatch) {
          return NextResponse.json({
            make: makeMatch ? makeMatch[1] : "Unknown",
            model: modelMatch ? modelMatch[1] : "Unknown",
            year: null,
            specifications: fallbackResponse.specifications
          });
        }
        
        // If all else fails, return the fallback
        return NextResponse.json(fallbackResponse);
      }
    } catch (geminiError) {
      console.error('Error calling Gemini API:', geminiError);
      
      // Return a more helpful error message based on the specific error
      if (geminiError.message?.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key or authorization issue' },
          { status: 401 }
        );
      } else if (geminiError.message?.includes('capacity')) {
        return NextResponse.json(
          { error: 'Gemini API capacity exceeded, please try again later' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: 'Gemini API error: ' + geminiError.message },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
