import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../utils/customError.js";
import { getUserApiKey } from "../../../utils/getUserApiKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both prompts
const reasoningPromptPath = path.join(__dirname, "../../../prompts/data-structure/DS_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/data-structure/DS.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

const dsDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query: code, model } = req.body;
  const modelType = model || process.env.DS_MODEL_TYPE || "gemini-2.5-flash-lite";

  if (!code || !code.length) {
    return next(
      new CustomError(400, "Please provide a description for generating the data structure diagram.")
    );
  }

  // Get user's decrypted API key (falls back to env if not configured)
  const apiKey = await getUserApiKey(req.user._id, next);
  if (!apiKey) return;

  // Create a per-request Gemini client with the user's API key
  const userClient = new GoogleGenAI({ apiKey });

  // Stage 1: Reasoning — analyze the data structure step-by-step
  const reasoningResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\nVisualize the following data structure:\n${code}` }],
      },
    ],
  });

  const dsReasoning = reasoningResponse.text;

  // Stage 2: Viz.js DOT code generation
  const vizResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}\n\n${dsReasoning}` }],
      },
    ],
  });

  // Clean the response — strip any markdown code fences if present
  const rawVizCode = vizResponse.text
    .replace(/```(?:dot|graphviz|viz|plain)?\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  res.status(200).json({
    status: "success",
    data: {
      vizCode: rawVizCode,
    },
  });
});

export default dsDiagramGenerator;
