import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import handleAsync from "./../../../utils/asyncFunctionHandler.js";
import CustomError from "./../../../utils/customError.js";
import { getUserApiKey } from "./../../../utils/getUserApiKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripMarkdownFences = (text = "") =>
  text
    .replace(/```(?:dot|graphviz|viz|plain|json|sql|text)?\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

const normalizeSqlDialect = (dialect = "") => {
  const normalized = String(dialect).trim().toLowerCase();

  if (normalized === "postgres" || normalized === "postgresql") return "PostgreSQL";
  if (normalized === "sqlserver" || normalized === "sql server" || normalized === "mssql") {
    return "SQL Server";
  }

  return "MySQL";
};

const sanitizeSqlQueriesOutput = (text = "") => {
  const cleaned = stripMarkdownFences(text);
  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      throw new CustomError(502, "Failed to generate SQL queries as a JSON array.");
    }
    parsed = JSON.parse(arrayMatch[0]);
  }

  if (!Array.isArray(parsed) || !parsed.length) {
    throw new CustomError(502, "Failed to generate SQL CREATE TABLE statements.");
  }

  const sqlQueries = parsed
    .map((query) => (typeof query === "string" ? query.trim() : ""))
    .filter(Boolean)
    .map((query) => (query.endsWith(";") ? query : `${query};`));

  if (
    !sqlQueries.length ||
    sqlQueries.some((query) => !/^CREATE\s+TABLE\b/i.test(query))
  ) {
    throw new CustomError(502, "Generated SQL output is invalid. Please try again.");
  }

  return sqlQueries;
};

// Load prompts
const reasoningPromptPath = path.join(__dirname, "../../../prompts/er/ER_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/er/ER.txt");
const sqlPromptPath = path.join(__dirname, "../../../prompts/er/ER_SQL.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");
const sqlPrompt = fs.readFileSync(sqlPromptPath, "utf-8");

const erDiagramGenerator = handleAsync(async (req, res, next) => {
  const { query, model, sqlDialect } = req.body;

  if (!query || !query.length) {
    return next(
      new CustomError(400, "Please provide a description for generating the ER diagram.")
    );
  }

  // Get user's decrypted API key (falls back to env if not configured)
  const apiKey = await getUserApiKey(req.user._id, next);
  if (!apiKey) return;

  // Per-request Gemini client with the user's API key
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

  const rawVizCode = stripMarkdownFences(vizResponse.text);

  // Stage 3: SQL generation — convert ER reasoning into executable CREATE TABLE statements
  const targetDialect = normalizeSqlDialect(sqlDialect);
  const sqlResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${sqlPrompt}\n\nSQL Dialect: ${targetDialect}\n\n${erReasoning}`,
          },
        ],
      },
    ],
  });

  const sqlQueries = sanitizeSqlQueriesOutput(sqlResponse.text);

  res.status(200).json({
    status: "success",
    data: {
      vizCode: rawVizCode,
      sqlQueries,
    },
  });
});

export default erDiagramGenerator;
