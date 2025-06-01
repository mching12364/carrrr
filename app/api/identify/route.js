import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI("AIzaSyBYIjZEa1Ub21NjPFWVnA8JA_NRTWvnISQ");

export async function POST(request) {
  try {
    console.log("API route called");

    // Get form data from the request
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      console.error("No image provided in request");
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log("Image received: ", {
      type: image.type,
      size: Math.round(image.size / 1024) + "KB"
    });

    try {
      // Convert the file to base64
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');

      console.log("Image converted to base64, length:", base64Image.length);

      // Get the Gemini 1.5 Flash model (replacement for deprecated gemini-pro-vision)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Prepare the image part for the API
      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: image.type || "image/jpeg"
          }
        }
      ];

      // Prepare the prompt
      const prompt = `
        Analyze this car image and provide the following details:
        1. Car make (manufacturer)
        2. Car model
        3. Year (if identifiable)
        4. Key specifications (if identifiable), including:
           - Engine type and displacement
           - Horsepower
           - Torque
           - Powertrain (FWD, RWD, AWD)
           - Transmission type
           - Weight
           - Fuel efficiency

        Return the result in a structured JSON format like this:
        {
          "make": "manufacturer name",
          "model": "model name",
          "year": "year (or range if not specific)",
          "specifications": [
            {"name": "Engine", "value": "engine details"},
            {"name": "Horsepower", "value": "hp value"},
            {"name": "Torque", "value": "torque value"},
            // and so on with other specifications
          ]
        }

        If you cannot identify certain details, provide the most likely information based on the visible features but mark those with "(estimated)" at the end.
      `;

      console.log("Calling Gemini API...");

      // Generate content with the model
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini API response received, length:", text.length);

      // Extract JSON from the response
      let parsedData;

      try {
        // Try to extract JSON from markdown code block first
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);

        if (jsonMatch && jsonMatch[1]) {
          console.log("Found JSON in code block");
          parsedData = JSON.parse(jsonMatch[1].trim());
        } else {
          // Try to find JSON pattern directly
          const jsonRegex = /(\{[\s\S]*\})/;
          const directMatch = text.match(jsonRegex);

          if (directMatch && directMatch[1]) {
            console.log("Found JSON directly in text");
            parsedData = JSON.parse(directMatch[1].trim());
          } else {
            // Last resort: try parsing the whole response as JSON
            console.log("Attempting to parse entire response as JSON");
            parsedData = JSON.parse(text.trim());
          }
        }

        console.log("Successfully parsed JSON data");

        // Return the processed data
        return NextResponse.json(parsedData);
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        console.log("First 100 chars of response:", text.substring(0, 100));

        // If parsing fails, return a fallback response
        return NextResponse.json({
          make: "Unknown",
          model: "Parsing Error",
          year: "",
          specifications: [
            { name: "Error", value: "Could not parse AI response. Please try again with a clearer image." }
          ]
        });
      }
    } catch (processingError) {
      console.error("Error processing image:", processingError);
      return NextResponse.json(
        { error: 'Error processing the image: ' + processingError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('General error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to identify car: ' + error.message },
      { status: 500 }
    );
  }
}

// Increase the body size limit for image uploads
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Remove the old 'export const config = ...' entirely
