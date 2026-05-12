import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "../../../../utils/asyncFunctionHandler.js";
import CustomError from "../../../../utils/customError.js";
import { getUserApiKey } from "../../../../utils/getUserApiKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripMarkdownFences = (text = "") =>
  text
    .replace(/```(?:dot|graphviz|viz|plain|regex|cfg|text)?\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

const sanitizeRegexOutput = (text = "") => {
  const cleaned = stripMarkdownFences(text)
    .replace(/^regular\s*expression\s*:\s*/i, "")
    .replace(/^regex\s*:\s*/i, "")
    .trim();

  if (!cleaned) {
    throw new CustomError(502, "Failed to generate a valid NFA regular expression.");
  }

  return cleaned;
};

const sanitizeCfgOutput = (text = "") => {
  const lines = stripMarkdownFences(text)
    .split(/\r?\n|;/)
    .map((line) =>
      line
        .replace(/^\s*[-*]\s*/, "")
        .replace(/^\s*\d+[\).\s-]+/, "")
        .trim()
    )
    .filter(Boolean)
    .filter((line) => /→|->/.test(line));

  if (!lines.length) {
    throw new CustomError(502, "Failed to generate valid NFA CFG production rules.");
  }

  return lines;
};

// Load prompts
const reasoningPromptPath = path.join(__dirname, "./../../../../prompts/nfa/NFA_REASONING.txt");
const vizPromptPath = path.join(__dirname, "./../../../../prompts/nfa/NFA.txt");
const regexPromptPath = path.join(__dirname, "./../../../../prompts/nfa/NFA_REGEX.txt");
const cfgPromptPath = path.join(__dirname, "./../../../../prompts/nfa/NFA_CFG.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");
const regexPrompt = fs.readFileSync(regexPromptPath, "utf-8");
const cfgPrompt = fs.readFileSync(cfgPromptPath, "utf-8");

const nfaDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query: code, model } = req.body;
  const modelType = model || process.env.NFA_MODEL_TYPE || "gemini-2.5-flash-lite";

  if (!code || !code.length) { 
    return next(
      new CustomError(400, "Please provide the description for generating the NFA diagram.")
    );
  }

  // Get user's decrypted API key (falls back to env if not configured)
  const apiKey = await getUserApiKey(req.user._id, next);
  if (!apiKey) return;

  // Create a per-request Gemini client with the user's API key
  const userClient = new GoogleGenAI({ apiKey });

  // Stage 1: Reasoning — use gemini-2.5-flash to analyze the NFA step-by-step
  const reasoningResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\nDesign an NFA for:\n${code}` }],
      },
    ],
  });

  const nfaReasoning = reasoningResponse.text;

  // Stage 2: Viz.js DOT code generation
  const vizResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}\n\n${nfaReasoning}` }],
      },
    ],
  });

  const rawVizCode = stripMarkdownFences(vizResponse.text);

  // Stage 3: Regular expression generation
  const regexResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${regexPrompt}\n\n${nfaReasoning}` }],
      },
    ],
  });

  const regularExpression = sanitizeRegexOutput(regexResponse.text);

  // Stage 4: CFG generation
  const cfgResponse = await userClient.models.generateContent({
    model: modelType,
    contents: [
      {
        role: "user",
        parts: [{ text: `${cfgPrompt}\n\n${nfaReasoning}` }],
      },
    ],
  });

  const contextFreeGrammar = sanitizeCfgOutput(cfgResponse.text);

  res.status(200).json({
    status: "success",
    data: {
      vizCode: rawVizCode,
      regularExpression,
      contextFreeGrammar,
    },
  });
});

export default nfaDiagramGenerator;
