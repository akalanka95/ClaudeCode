import express from "express";
import { query } from "@anthropic-ai/claude-agent-sdk";

const PORT = process.env.SYNC_AGENT_PORT || 4100;

const app = express();
app.use(express.json({ limit: "15mb" }));

app.post("/search", async (req, res) => {
  const { topicLabel, previousUrls } = req.body ?? {};
  if (!topicLabel) {
    return res.status(400).json({ error: "topicLabel is required" });
  }

  const priorUrlsNote =
    Array.isArray(previousUrls) && previousUrls.length > 0
      ? `Sources already surfaced in a previous sync (prefer new ones over repeating these): ${previousUrls.join(", ")}\n`
      : "";

  const prompt = `Search the web for recent, notable developments, articles, or discussions related to
the interview-prep topic "${topicLabel}" that would be useful for someone studying this topic for
technical interviews (news, official docs/release updates, notable write-ups or discussions).
${priorUrlsNote}
Respond with ONLY a JSON object (no markdown fences, no other text) matching exactly this shape:
{"summary": "2-4 sentence summary of what's new", "links": [{"title": "...", "url": "...", "note": "one-line note on why it's relevant"}]}
Include 3-6 links.`;

  try {
    const result = await runQuery(prompt, ["WebSearch"]);
    res.json(parseJsonResult(result));
  } catch (err) {
    console.error("Sync agent search failed:", err);
    res.status(502).json({ error: String(err?.message ?? err) });
  }
});

app.post("/summarize-upload", async (req, res) => {
  const { fileBase64, mimeType } = req.body ?? {};
  if (!fileBase64 || !mimeType) {
    return res.status(400).json({ error: "fileBase64 and mimeType are required" });
  }

  const instruction = `The attached file contains handwritten interview-prep notes. Transcribe the
handwritten content as best you can, then organize it into clear, well-structured study notes:
a short title, broken into a few labeled sections, each with concise bullet points (not flowing
paragraphs — short, scannable points a student could skim before an interview).
Respond with ONLY a JSON object (no markdown fences, no other text) matching exactly this shape:
{"title": "short overall title", "sections": [{"heading": "section heading", "bullets": ["point one", "point two"]}]}
Include 2-5 sections, each with 2-6 bullets. Every string is plain text — no markdown or HTML.`;

  const fileBlock =
    mimeType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: mimeType, data: fileBase64 } }
      : { type: "image", source: { type: "base64", media_type: mimeType, data: fileBase64 } };

  try {
    const result = await runQuery(fileMessages(fileBlock, instruction), []);
    res.json(parseJsonResult(result));
  } catch (err) {
    console.error("Sync agent summarize-upload failed:", err);
    res.status(502).json({ error: String(err?.message ?? err) });
  }
});

async function* fileMessages(fileBlock, instructionText) {
  yield {
    type: "user",
    message: {
      role: "user",
      content: [fileBlock, { type: "text", text: instructionText }],
    },
    parent_tool_use_id: null,
  };
}

async function runQuery(prompt, allowedTools) {
  let resultText = null;
  let failure = null;

  for await (const message of query({
    prompt,
    options: {
      allowedTools,
      maxTurns: 6,
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        resultText = message.result;
      } else {
        failure = `${message.subtype}: ${(message.errors || []).join("; ")}`;
      }
    }
  }

  if (failure) {
    throw new Error(failure);
  }
  if (!resultText) {
    throw new Error("Agent produced no result");
  }
  return resultText;
}

function parseJsonResult(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Agent response was not valid JSON");
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`sync-agent listening on http://127.0.0.1:${PORT}`);
});
