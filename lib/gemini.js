import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyBYIjZEa1Ub21NjPFWVnA8JA_NRTWvnISQ");

export async function identifyCar(imageBase64) {
  try {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64WithoutPrefix = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Create a model instance
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare the image part
    const imageParts = [
      {
        inlineData: {
          data: base64WithoutPrefix,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Prompt for the model
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
         - Approximate weight
         - Fuel efficiency
         - Top speed
         - 0-60 mph time

      Return the result in a structured JSON format like this:
      {
        "make": "manufacturer name",
        "model": "model name",
        "year": "year (or range if not specific)",
        "specifications": [
          {"name": "Engine", "value": "engine details"},
          {"name": "Horsepower", "value": "hp value"},
          {"name": "Torque", "value": "torque value"},
          ...and so on with other specifications
        ]
      }

      If you cannot identify certain details, provide the most likely information based on the visible features but mark those with "(estimated)" at the end.
    `;

    // Generate content
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Extract the JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);
    let parsedData;

    if (jsonMatch && jsonMatch[1]) {
      parsedData = JSON.parse(jsonMatch[1].trim());
    } else {
      try {
        // Try to parse the whole text as JSON
        parsedData = JSON.parse(text.trim());
      } catch (e) {
        throw new Error("Failed to parse AI response into structured data");
      }
    }

    return parsedData;
  } catch (error) {
    console.error("Error identifying car:", error);
    throw error;
  }
}