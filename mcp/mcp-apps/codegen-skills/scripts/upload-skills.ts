/// <reference types="node" />
/**
 * One-time script: uploads each skills/ subfolder as a separate LLM skill.
 * Run once with: pnpm run upload-skills
 * Then paste the printed SKILL_ID_* lines into your .env file.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.join(__dirname, "..", "skills");

// Use OPENAI_URL if set (custom endpoint), otherwise default to api.openai.com
const baseUrl = process.env.OPENAI_URL
  ? process.env.OPENAI_URL.replace(/\/$/, "")
  : "https://api.openai.com/v1";

async function uploadSkill(
  name: string,
  skillMdContent: string,
): Promise<string> {
  const formData = new FormData();
  formData.append(
    "files[]",
    new Blob([skillMdContent], { type: "text/markdown" }),
    `${name}/SKILL.md`,
  );

  const response = await fetch(`${baseUrl}/skills`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to upload skill "${name}": HTTP ${response.status} — ${body}`,
    );
  }

  const result = (await response.json()) as { id: string };
  return result.id;
}

async function main() {
  if (!process.env.OPENAI_KEY) {
    console.error("Error: OPENAI_KEY is not set in your .env file.");
    process.exit(1);
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory());

  if (skillDirs.length === 0) {
    console.error("No skill directories found under skills/");
    process.exit(1);
  }

  console.error(`Uploading ${skillDirs.length} Cesium skill(s) to OpenAI...\n`);

  for (const dir of skillDirs) {
    const skillMdPath = path.join(skillsDir, dir.name, "SKILL.md");

    try {
      await fs.access(skillMdPath);
    } catch {
      console.error(`Skipping ${dir.name}: no SKILL.md found`);
      continue;
    }

    const content = await fs.readFile(skillMdPath, "utf8");
    const skillId = await uploadSkill(dir.name, content);

    // Convert e.g. "cesium-viewer" → "SKILL_ID_VIEWER"
    const envVar = `SKILL_ID_${dir.name.replace(/^cesium-/i, "").toUpperCase()}`;
    console.log(`${envVar}=${skillId}`);
  }

  console.error(
    "\nCopy the lines above into your .env file, then start the server.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
