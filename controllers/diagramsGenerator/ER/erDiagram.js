import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "./../../../utils/asyncFunctionHandler.js";
import CustomError from "./../../../utils/customError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both prompts — same two-stage pipeline as DFA
// Trigger nodemon restart
const reasoningPromptPath = path.join(__dirname, "../../../prompts/er/ER_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/er/ER.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

const erDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query, model } = req.body;

  if (!query || !query.length) {
    return next(
      new CustomError(400, "Please provide a description for generating the ER diagram.")
    );
  }

  const apiKey = process.env.GEMINI_API;

  if (!apiKey) {
    return next(
      new CustomError(500, "Server configuration error: Gemini API key is missing.")
    );
  }

  // Per-request Gemini client with the server's API key — same as DFA
  const userClient = new GoogleGenAI({ apiKey });

  const targetModel = model || process.env.ER_MODEL_TYPE || "gemini-2.5-flash-lite";

  // Stage 1: Reasoning — AI identifies entities, attributes, relationships step-by-step
  const reasoningResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\nDesign an ER diagram for:\n${query}` }],
      },
    ],
  });

  const erReasoning = reasoningResponse.text;

  // Stage 2: DOT code generation — convert reasoning into Viz.js renderable DOT code
  const vizResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}\n\n${erReasoning}` }],
      },
    ],
  });

  // Strip any markdown fences the model might accidentally add — same as DFA
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

export default erDiagramGenerator;
