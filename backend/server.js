import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "AI Image Generator API is running",
  });
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const {
      prompt,
      style = "cinematic",
      size = "1024x1024",
      quality = "medium",
    } = req.body;

    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({
        error: "Please enter a more detailed prompt.",
      });
    }

    const enhancedPrompt = `
Create a high-quality ${style} AI artwork.

Main idea:
${prompt}

Style direction:
- professional composition
- cinematic lighting
- high detail
- beautiful color grading
- sharp focus
- premium digital art quality
- modern visual style
- no blurry details
`;

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt: enhancedPrompt,
      size,
      quality,
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return res.status(500).json({
        error: "No image was returned from the AI model.",
      });
    }

    res.json({
      image: `data:image/png;base64,${imageBase64}`,
      prompt: enhancedPrompt,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while generating the image.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});