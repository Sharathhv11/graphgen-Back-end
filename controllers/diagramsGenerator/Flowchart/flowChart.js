import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "./../../../utils/asyncFunctionHandler.js";
import CustomError from "./../../../utils/customError.js";
import { getUserApiKey } from "./../../../utils/getUserApiKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both prompts
const reasoningPromptPath = path.join(__dirname, "../../../prompts/flowchart/FLOWCHART_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/flowchart/FLOWCHART.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

const flowChartGenerator = handleAsync(async (req, res, next) => {
  const { query, model, language } = req.body;

  if (!query || !query.length) {
    return next(
      new CustomError(400, "Please provide the code or description for generating the flowchart.")
    );
  }

  if (query.length > 3000) {
    return next(
      new CustomError(400, "Input is too big to generate the flowchart")
    );
  }

  // Get user's decrypted API key (falls back to env if not configured)
  const apiKey = await getUserApiKey(req.user._id, next);
  if (!apiKey) return;

  const userClient = new GoogleGenAI({ apiKey });
  const targetModel = model || process.env.FLOWCHART_MODEL_TYPE || "gemini-2.5-flash-lite";

  // Build the input context — prefix with language hint when code mode is used
  const langHint = language
    ? `The following is ${language.toUpperCase()} code. Analyze it as source code, NOT a description.\n\n`
    : "";

  // Stage 1: Reasoning
  const reasoningResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\n${langHint}Here is the input:\n${query}` }],
      },
    ],
  });

  const reasoningText = reasoningResponse.text;

  // Stage 2: DOT code generation
  const vizResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}\n\n${reasoningText}` }],
      },
    ],
  });

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

export default flowChartGenerator;
