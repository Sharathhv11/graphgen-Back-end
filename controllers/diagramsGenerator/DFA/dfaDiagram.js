import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "./../../../utils/asyncFunctionHandler.js";
import CustomError from "./../../../utils/customError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both prompts
const reasoningPromptPath = path.join(__dirname, "../../../prompts/dfa/DFA_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/dfa/DFA.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

const dfaDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query:code, apiKey, model } = req.body;

  if (!code || !code.length) {
    return next(
      new CustomError(400, "Please provide the description for generating the DFA diagram.")
    );
  }

  if (!apiKey) {
    return next(
      new CustomError(400, "Please provide a valid Gemini API key.")
    );
  } 

  // Create a per-request Gemini client with the user's API key
  const userClient = new GoogleGenAI({ apiKey });

  // Stage 1: Reasoning — use gemma-3-27b-it to analyze the DFA step-by-step
  const reasoningResponse = await userClient.models.generateContent({
    model: "gemma-3-27b-it",
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\nDesign a DFA for:\n${code}` }],
      },
    ],
  });

  const dfaReasoning = reasoningResponse.text;

  // Stage 2: Viz.js DOT code generation — use user-specified model (default: gemini-2.5-flash)
  const targetModel = model || "gemini-2.5-flash";
  const vizResponse = await userClient.models.generateContent({
    model: targetModel,
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
