import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "@gradio/client";
import { MODEL_ENDPOINT, VOICE_PROFILES } from "../config/voices.js";
import { getBookOutputPaths } from "../config/paths.js";
import { logInfo, logError } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts a text file to audio using a given voice profile.
 */
export async function convertTextToAudio(inputPath, outputPath, client, voiceProfile) {
  const text = await fs.readFile(inputPath, "utf8");

  const result = await client.predict("/predict", {
    text,
    voice: voiceProfile.name,
    rate: voiceProfile.rate,
    pitch: voiceProfile.pitch,
  });

  const audioUrl = result?.data?.[0]?.url;

  if (!audioUrl || typeof audioUrl !== "string" || !audioUrl.startsWith("http")) {
    throw new Error("Received an invalid or missing audio URL.");
  }

  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Audio download failed: ${response.statusText}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, audioBuffer);
}

export async function generateAllAudio({ bookName, voiceKey = "spanish_male" } = {}) {
  if (!bookName) {
    throw new Error("Missing required parameter: bookName");
  }

  // informative banner before audio generation starts
  logInfo(`------------------------------------------------------------`);
  logInfo(`Starting audio generation for: "${bookName}"`);
  logInfo(`------------------------------------------------------------`);

  const voiceProfile = VOICE_PROFILES[voiceKey];
  if (!voiceProfile) {
    throw new Error(`Voice profile "${voiceKey}" not found.`);
  }

  const { txtDir, mp3Dir } = getBookOutputPaths(bookName);

  let client;
  try {
    client = await Client.connect(MODEL_ENDPOINT);
  } catch (err) {
    logError(`Could not connect to voice model endpoint: ${err.message}`);
    throw err;
  }

  await fs.ensureDir(mp3Dir);

  const allFiles = await fs.readdir(txtDir);
  const txtFiles = allFiles.filter(f => f.toLowerCase().endsWith(".txt"));

  if (txtFiles.length === 0) {
    logError(`No .txt files found in ${txtDir}`);
    return;
  }

  for (const [index, fileName] of txtFiles.entries()) {
    const inputPath = path.join(txtDir, fileName);
    const outputFileName = fileName.replace(/\.txt$/i, ".mp3");
    const outputPath = path.join(mp3Dir, outputFileName);

    logInfo(`Processing (${index + 1}/${txtFiles.length}): ${fileName}`);

    try {
      await convertTextToAudio(inputPath, outputPath, client, voiceProfile);
      logInfo(`Saved: ${outputPath}`);
    } catch (error) {
      logError(`Failed to process "${fileName}": ${error.message}`);
    }
  }

  logInfo(`Audio generation completed for ${bookName}`);
}

// CLI entrypoint
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bookArg = process.argv[2];
  const voiceArg = process.argv[3];

  if (!bookArg) {
    console.error("Usage: node generateAudio.js \"<book-name>\" [voice-key]");
    process.exit(1);
  }

  generateAllAudio({ bookName: bookArg, voiceKey: voiceArg || "spanish_male" })
    .catch(err => {
      logError(`Fatal error: ${err.message}`);
      process.exit(1);
    });
}
