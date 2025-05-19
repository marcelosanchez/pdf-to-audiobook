import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAllAudio } from './txtToSpeech.js';
import { extractChaptersByOutline } from './extractChaptersFromPdf.js';
import { logInfo, logError } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.resolve('input');

async function orchestrateAll() {
  const files = await fs.readdir(inputDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  if (!pdfFiles.length) {
    logError('No PDF files found in path: input/');
    return;
  }

  for (const file of pdfFiles) {
    const filePath = path.join(inputDir, file);
    const bookName = path.basename(file, path.extname(file));

    let stats;
    try {
      stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        logError(`"${file}" is not a regular file. Skipping.`);
        continue;
      }
      if (stats.size === 0) {
        logError(`"${file}" is empty. Skipping.`);
        continue;
      }
    } catch (statErr) {
      logError(`Could not access "${file}": ${statErr.message}`);
      continue;
    }

    logInfo(`------------------------------------------------------------`);
    logInfo(`Starting processing: "${bookName}"`);
    logInfo(`------------------------------------------------------------`);

    try {
      // extract chapters as txt
      await extractChaptersByOutline(filePath, file);

      // generate audio for those chapters
      await generateAllAudio({ bookName });
    } catch (err) {
      logError(`Failed to process "${file}": ${err.message}`);
    }
  }

  logInfo('All books processed');
}

orchestrateAll().catch(err => {
  logFatal(`${err.message}`);
  process.exit(1);
});
