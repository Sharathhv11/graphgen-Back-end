import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "../../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../../utils/customError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both prompts
const reasoningPromptPath = path.join(__dirname, "./../../../../prompts/FINATE-AUTOMATA/dfa/DFA_REASONING.txt");
const vizPromptPath = path.join(__dirname, "./../../../../prompts/FINATE-AUTOMATA/dfa/DFA.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

const dfaDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query: code, model } = req.body;
  const modelType = model || process.env.DFA_MODEL_TYPE || "gemini-2.5-flash-lite";

  if (!code || !code.length) {
    return next(
      new CustomError(400, "Please provide the description for generating the DFA diagram.")
    );
  }

  const apiKey = process.env.GEMINI_API;

  if (!apiKey) {
    return next(
      new CustomError(500, "Server configuration error: Gemini API key is missing.")
    );
  }

  // Create a per-request Gemini client with the server's API key
  const userClient = new GoogleGenAI({ apiKey });

  // Stage 1: Reasoning — use gemini-2.5-flash to analyze the DFA step-by-step
  const reasoningResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\nDesign a DFA for:\n${code}` }],
      },
    ],
  });

  const dfaReasoning = reasoningResponse.text;

  // Stage 2: Viz.js DOT code generation
  const vizResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}\n\n${dfaReasoning}` }],
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

export default dfaDiagramGenerator;
