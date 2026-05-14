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

/**
 * Parses the combined JSON output from the merged ER prompt.
 * Expected format: { "dotCode": "digraph ...", "sqlQueries": ["CREATE TABLE ...;", ...] }
 * Falls back to extracting DOT code and SQL separately if JSON parsing fails.
 */
const parseCombinedOutput = (text = "") => {
  const cleaned = stripMarkdownFences(text);

  // Try parsing as JSON first (expected path)
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.dotCode === "string" && Array.isArray(parsed.sqlQueries)) {
      return {
        dotCode: parsed.dotCode.trim(),
        sqlQueries: parsed.sqlQueries
          .filter((q) => typeof q === "string" && q.trim())
          .map((q) => (q.trim().endsWith(";") ? q.trim() : `${q.trim()};`)),
      };
    }
  } catch {
    // JSON parsing failed — try fallback extraction
  }

  // Fallback: try to find JSON object in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*"dotCode"[\s\S]*"sqlQueries"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.dotCode === "string" && Array.isArray(parsed.sqlQueries)) {
        return {
          dotCode: parsed.dotCode.trim(),
          sqlQueries: parsed.sqlQueries
            .filter((q) => typeof q === "string" && q.trim())
            .map((q) => (q.trim().endsWith(";") ? q.trim() : `${q.trim()};`)),
        };
      }
    } catch {
      // Continue to next fallback
    }
  }

  // Last resort: extract DOT code and SQL array separately
  const dotMatch = cleaned.match(/(?:strict\s+)?digraph\s+[\s\S]*?\{[\s\S]*\}/i);
  const sqlArrayMatch = cleaned.match(/\[[\s\S]*?("CREATE\s+TABLE[\s\S]*?)?\]/i);

  const dotCode = dotMatch ? dotMatch[0].trim() : "";
  let sqlQueries = [];

  if (sqlArrayMatch) {
    try {
      const parsedArr = JSON.parse(sqlArrayMatch[0]);
      if (Array.isArray(parsedArr)) {
        sqlQueries = parsedArr
          .filter((q) => typeof q === "string" && q.trim())
          .map((q) => (q.trim().endsWith(";") ? q.trim() : `${q.trim()};`));
      }
    } catch {
      // Could not extract SQL array
    }
  }

  if (!dotCode) {
    throw new CustomError(502, "Failed to generate ER diagram. The AI did not return valid DOT code.");
  }

  return { dotCode, sqlQueries };
};

// Load prompts — only 2 prompts needed now (reasoning + combined DOT/SQL)
const reasoningPromptPath = path.join(__dirname, "../../../prompts/er/ER_REASONING.txt");
const vizPromptPath = path.join(__dirname, "../../../prompts/er/ER.txt");
const reasoningPrompt = fs.readFileSync(reasoningPromptPath, "utf-8");
const vizPrompt = fs.readFileSync(vizPromptPath, "utf-8");

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

  // Stage 2: Combined DOT + SQL generation — single call produces both outputs
  const targetDialect = normalizeSqlDialect(sqlDialect);
  const dialectInstruction = targetDialect !== "MySQL"
    ? `\n\nIMPORTANT: Use ${targetDialect} SQL dialect for all CREATE TABLE statements.\n\n`
    : "\n\n";

  const vizResponse = await userClient.models.generateContent({
    model: targetModel,
    contents: [
      {
        role: "user",
        parts: [{ text: `${vizPrompt}${dialectInstruction}${erReasoning}` }],
      },
    ],
  });

  const { dotCode, sqlQueries } = parseCombinedOutput(vizResponse.text);

  res.status(200).json({
    status: "success",
    data: {
      vizCode: dotCode,
      sqlQueries,
    },
  });
});

export default erDiagramGenerator;
