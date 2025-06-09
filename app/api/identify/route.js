import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('API route called');
  
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    console.log('API key exists:', !!apiKey);

    // Determine if this is an image upload or dropdown selection
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    const isFormData = contentType?.includes('multipart/form-data');
    console.log('Is FormData:', isFormData);
    
    if (isFormData) {
      console.log('Handling image upload');
      return await handleImageUpload(request, apiKey);
    } else {
      console.log('Handling dropdown selection');
      return await handleDropdownSelection(request, apiKey);
    }
  } catch (error) {
    console.error('Unhandled error in main POST:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

async function handleImageUpload(request, apiKey) {
  try {
    console.log('Processing image upload...');
    
    // For now, let's return mock data since image processing is complex
    // This will help us test if the basic flow works
    return NextResponse.json({
      make: "Toyota",
      model: "Camry",
      year: "2022",
      specifications: [
        { category: "Engine", value: "2.5L 4-cylinder", unit: "" },
        { category: "Horsepower", value: "203", unit: "hp" },
        { category: "Weight", value: "3,310", unit: "lbs" },
        { category: "Drivetrain", value: "FWD", unit: "" }
      ]
    });
  } catch (error) {
    console.error('Error in handleImageUpload:', error);
    return NextResponse.json(
      { error: 'Failed to process image: ' + error.message },
      { status: 500 }
    );
  }
}

async function handleDropdownSelection(request, apiKey) {
  try {
    console.log('Processing dropdown selection...');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { make, model, year } = body;
    
    if (!make || !model || !year) {
      console.log('Missing required fields:', { make, model, year });
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      );
    }

    console.log(`Getting specifications for: ${year} ${make} ${model}`);

    // For now, return mock data to test the basic functionality
    // We'll add real AI integration once the basic flow works
    const specs = generateMockSpecs(make, model, year);
    
    return NextResponse.json({
      make,
      model,
      year,
      specifications: specs
    });
    
  } catch (error) {
    console.error('Error in handleDropdownSelection:', error);
    return NextResponse.json(
      { error: 'Failed to get car specifications: ' + error.message },
      { status: 500 }
    );
  }
}

function generateMockSpecs(make, model, year) {
  console.log('Generating mock specs for:', { make, model, year });
  
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
    'BMW': {
      '3 Series': { hp: 255, weight: 3582, mpg: '26/36/30', engine: '2.0L Turbo' },
      '5 Series': { hp: 335, weight: 3871, mpg: '23/32/27', engine: '3.0L Turbo' },
      'X3': { hp: 248, weight: 4045, mpg: '25/29/26', engine: '2.0L Turbo' }
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

  console.log('Found car specs:', carSpecs);

  // Adjust for year (newer cars tend to be slightly more efficient and powerful)
  const yearFactor = (parseInt(year) - 2010) / 10;
  const adjustedHp = Math.round(carSpecs.hp * (1 + yearFactor * 0.1));
  const adjustedWeight = Math.round(carSpecs.weight * (1 + yearFactor * 0.05));

  const specifications = [
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

  console.log('Generated specifications:', specifications);
  return specifications;
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
}
