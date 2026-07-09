import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config({ override: true });

// Initialize Gemini Client
// We use the recommended 'aistudio-build' User-Agent for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set higher limit for base64 camera frames
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes first
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Visual companion API
  app.post("/api/analyze", async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { image, mode, prompt, assistanceStyle = "hybrid" } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Check API Key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "Gemini API Key is not configured on the server. Please add it via the Secrets panel." 
        });
      }

      // Extract raw base64 and mimeType from data URL
      let base64Data = image;
      let mimeType = "image/jpeg";

      if (image.includes(";base64,")) {
        const parts = image.split(";base64,");
        mimeType = parts[0].split(":")[1] || "image/jpeg";
        base64Data = parts[1];
      }

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      };

      // Set up tailored system instruction and prompt based on scanning mode
      let systemInstruction = "";
      let userPrompt = "";

      if (mode === "object_recognition") {
        systemInstruction = `You are the core vision module for SenseVision, an assistant for blind and low-vision users.
Your task is to identify key objects in the scene, estimate their position (left, right, center), and calculate their approximate distance in feet or meters from the user's camera viewpoint.
Be accurate, realistic, and highly practical. Focus on items the user might want to interact with or need to be aware of (like mugs, water bottles, keys, chairs, doors, trash cans).
You must output a structured JSON response matching the provided schema.`;
        
        userPrompt = prompt || "Identify the objects in front of me and estimate their location and approximate distance.";
      } else if (mode === "scene_description") {
        systemInstruction = `You are the spatial intelligence module for SenseVision, an assistive system.
Analyze the scene in front of the user and provide a rich, narrative-style spatial map.
Explain where they are (e.g., 'You are in a living room', 'You are outdoors on a sidewalk') and describe the general layout, major structures, and general accessibility.
Keep the description natural, clear, and focused on spatial awareness. Use clear indicators of relative directions (straight ahead, left side, right side).
You must output a structured JSON response matching the provided schema.`;

        userPrompt = prompt || "Describe my surroundings and explain the spatial layout.";
      } else if (mode === "text_reader") {
        systemInstruction = `You are the high-accuracy OCR text-reader module for SenseVision.
Detect and transcribe any visible text in the image (such as signboards, medicine labels, book pages, menu cards, computer screens, or food packaging).
Provide a complete transcription line-by-line under the extraData.textLines field.
In the main details, summarize the text content clearly, making sure to highlight important safety info, dosage guidelines, expiration dates, or price totals.
You must output a structured JSON response matching the provided schema.`;

        userPrompt = prompt || "Read any visible text in this image and transcribe it clearly.";
      } else if (mode === "navigation") {
        systemInstruction = `You are the navigation companion and obstacle detection system for SenseVision.
Scan the environment for prospective hazards, obstacles, or walking path changes (e.g., steps, power cables on the floor, open cabinet doors, trash cans, construction signs, wet spots, parked vehicles, or pedestrians).
Identify these hazards clearly under 'obstacles' and formulate a specific, safe step-by-step route suggestion under 'safeRoute' (e.g. 'Step slightly to the left', 'Maintain current course', 'Stop, there is an obstacle directly ahead').
You must output a structured JSON response matching the provided schema.`;

        userPrompt = prompt || "Analyze this path for obstacles and advise me on how to navigate safely.";
      } else if (mode === "assistant") {
        systemInstruction = `You are SenseVision, a highly compassionate and intelligent voice assistant companion for a visually impaired or physically challenged user.
The user is asking a specific question about their surroundings shown in the image.
Formulate a helpful, friendly, and precise answer. Use the current image as your visual context.
Speak directly to the user (e.g. 'Yes, I see your keys on the kitchen counter next to the sink'). Keep it audio-friendly and conversational.
You must output a structured JSON response matching the provided schema.`;

        userPrompt = prompt || "What is in front of me?";
      } else {
        systemInstruction = "You are SenseVision, an AI companion for independent living. Analyze the visual scene and help the user.";
        userPrompt = prompt || "Describe what you see.";
      }

      // Append style-specific guidelines dynamically to systemInstruction
      let styleInstruction = "";
      if (assistanceStyle === "ask") {
        styleInstruction = "\n\n[USER PREFERENCE: ASK MODE (On-demand)] Be highly direct, concise, and target ONLY the user's specific query. Do not provide unsolicited general tours or details. Speak briefly and precisely.";
      } else if (assistanceStyle === "smart_auto") {
        styleInstruction = "\n\n[USER PREFERENCE: SMART AUTO MODE (Continuous Guidance)] Act as a proactive narrator. Assume the user just stepped into this environment. Provide a complete, highly immersive description of the spatial layout, major items in view, paths, and general environment features right away. Narrate extensively.";
      } else { // hybrid (default)
        styleInstruction = "\n\n[USER PREFERENCE: HYBRID MODE (Safety-First + On-demand)] Prioritize safety above all. Begin by highlighting any obstacles, hazards, stairs, or pathway warnings first in your summary and details. If the path is clear, state it briefly. Provide a fast, clear environmental summary, and invite the user to ask for further details on-demand.";
      }

      const completeSystemInstruction = systemInstruction + styleInstruction;

      // Execute Gemini vision query
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: userPrompt }] },
        config: {
          systemInstruction: completeSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { 
                type: Type.STRING, 
                description: "A short, audio-friendly summary of the scan. Max 1-2 sentences. E.g. 'A clean living room with a sofa in front of you and a bottle on the table.'" 
              },
              details: { 
                type: Type.STRING, 
                description: "A detailed, descriptive report explaining layout, objects, relative locations and estimated distances." 
              },
              extraData: {
                type: Type.OBJECT,
                properties: {
                  objects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Name of the detected object" },
                        confidence: { type: Type.NUMBER, description: "Confidence value between 0.0 and 1.0" },
                        location: { type: Type.STRING, description: "E.g., 'center', 'slightly left', 'bottom right'" },
                        distance: { type: Type.STRING, description: "E.g. '2 feet', '1.5 meters', 'close range'" }
                      },
                      required: ["name", "confidence", "location", "distance"]
                    }
                  },
                  textLines: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Line-by-line transcription of read text"
                  },
                  obstacles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of hazards, obstacles, or safety warnings detected"
                  },
                  safeRoute: {
                    type: Type.STRING,
                    description: "Recommended clear path or visual direction suggestion"
                  }
                }
              }
            },
            required: ["summary", "details"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text received from Gemini.");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);

    } catch (error: any) {
      console.error("Gemini Vision Error:", error);
      res.status(500).json({ 
        error: "Failed to analyze image with Gemini", 
        message: error.message || String(error)
      });
    }
  });

  // Text-To-Speech API route (using Gemini TTS)
  app.post("/api/tts", async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { text, voice } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Missing text for voice generation" });
      }

      // Check API Key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "Gemini API Key is not configured on the server. Please add it via Secrets." 
        });
      }

      // Request Gemini TTS
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' }, // Kore, Fenrir, Zephyr, Puck, Charon
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio payload returned from Gemini TTS");
      }

      res.json({ audio: base64Audio });

    } catch (error: any) {
      console.warn("Gemini TTS Error, but we'll allow standard fallback:", error);
      res.status(500).json({ 
        error: "Failed to generate TTS audio", 
        message: error.message || String(error)
      });
    }
  });

  // Integrate Vite as middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SenseVision Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
