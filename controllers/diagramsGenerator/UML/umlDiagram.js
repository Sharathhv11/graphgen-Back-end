import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "./../../../utils/asyncFunctionHandler.js";
import CustomError from "./../../../utils/customError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load both prompts — same two-stage pipeline as ER / Flowchart
const reasoningPromptPath = path.join(__dirname, "../../../prompts/uml/UML_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/uml/UML.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

const umlDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query, apiKey, model } = req.body;

  if (!query || !query.length) {
    return next(
      new CustomError(400, "Please provide a description for generating the UML diagram.")
    );
  }

  if (!apiKey) {
    return next(
      new CustomError(400, "Please provide a valid Gemini API key.")
    );
  }

  // Per-request Gemini client with the user's API key — same as ER
  const userClient = new GoogleGenAI({ apiKey });

  const targetModel = model || process.env.UML_MODEL_TYPE || "gemma-3-27b-it";

  // Stage 1: Reasoning — AI determines UML type and extracts entities/relationships
  const reasoningResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${reasoningPrompt}\n\nDesign a UML diagram for:\n${query}` }],
      },
    ],
  });

  const umlReasoning = reasoningResponse.text;

  // Stage 2: DOT code generation — convert reasoning into Viz.js renderable DOT code
  const vizResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}\n\n${umlReasoning}` }],
      },
    ],
  });

  // Strip any markdown fences the model might accidentally add — same as ER
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

export default umlDiagramGenerator;
