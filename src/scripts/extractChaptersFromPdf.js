import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getBookOutputPaths } from '../config/paths.js';
import { logInfo, logWarn, logError, logFatal } from './logger.js';

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.resolve('input');

// flatten PDF outline recursively
function flattenOutline(outline, level = 0) {
  const result = [];
  for (const item of outline) {
    if (!item.title || !item.dest) continue;
    result.push({ title: item.title.trim(), dest: item.dest, level });
    if (Array.isArray(item.items)) {
      result.push(...flattenOutline(item.items, level + 1));
    }
  }
  return result;
}

function prepareText(text) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[•·●]/g, '*')
    .replace(/[ ]/g, ' ')
    .replace(/\r?\n/g, '\r\n');
}

function sanitizeTitle(title) {
  return title.replace(/[^\w\s]/g, '')
              .replace(/\s+/g, '_')
              .toLowerCase();
}

async function loadPdfDocument(filePath) {
  const rawData = new Uint8Array(await fs.readFile(filePath));
  const loadingTask = pdfjsLib.getDocument({ data: rawData });
  return loadingTask.promise;
}

async function getChaptersFromOutline(pdfDoc, outline) {
  const flat = flattenOutline(outline).filter(ch => Array.isArray(ch.dest));
  const chapters = [];

  for (const item of flat) {
    try {
      const pageIndex = await pdfDoc.getPageIndex(item.dest[0]);
      chapters.push({ title: item.title, pageNum: pageIndex + 1 });
    } catch {
      logWarn(`skipping unresolved outline entry: "${item.title}"`);
    }
  }

  return chapters;
}

async function extractChapterText(pdfDoc, startPage, endPage) {
  let text = '';
  for (let p = startPage; p < endPage; p++) {
    const page = await pdfDoc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n\n';
  }
  return prepareText(text);
}

async function writeChapterToFile(txtDir, index, title, content) {
  const safeTitle = sanitizeTitle(title);
  const fileName = `${String(index + 1).padStart(2, '0')}_${safeTitle}.txt`;
  const outFile = path.join(txtDir, fileName);
  await fs.writeFile(outFile, content, { encoding: 'utf8' });
  logInfo(`Saved: ${outFile}`);
}

async function extractChaptersByOutline(pdfPath, pdfFileName) {
  const pdfDoc = await loadPdfDocument(pdfPath);
  const outline = await pdfDoc.getOutline();
  if (!outline) {
    logError(`No outline found in "${pdfFileName}"`);
    return;
  }

  const chapters = await getChaptersFromOutline(pdfDoc, outline);
  if (!chapters.length) {
    logWarn(`No valid chapters found in "${pdfFileName}"`);
    return;
  }

  chapters.push({ title: '__END__', pageNum: pdfDoc.numPages + 1 });

  const { txtDir } = getBookOutputPaths(pdfFileName);
  await fs.ensureDir(txtDir);

  for (let i = 0; i < chapters.length - 1; i++) {
    try {
      const startPage = chapters[i].pageNum;
      const endPage = chapters[i + 1].pageNum;
      const chapterText = await extractChapterText(pdfDoc, startPage, endPage);
      await writeChapterToFile(txtDir, i, chapters[i].title, chapterText);
    } catch (err) {
      logError(`Failed to extract chapter "${chapters[i].title}": ${err.message}`);
    }
  }
}

async function main() {
  const files = await fs.readdir(inputDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  if (!pdfFiles.length) {
    logError('No PDF files found in input directory');
    return;
  }

  for (const file of pdfFiles) {
    logInfo(`Processing: ${file}`);
    const filePath = path.join(inputDir, file);
    await extractChaptersByOutline(filePath, file);
  }
}

main().catch(err => {
  logFatal(`${err.message}`);
});

export { extractChaptersByOutline };
