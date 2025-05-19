import path from "path";

export function getBookOutputPaths(pdfFileName) {
  const baseName = path.basename(pdfFileName, path.extname(pdfFileName));
  return {
    bookSlug: baseName,
    txtDir: path.resolve("output", baseName, "txt"),
    mp3Dir: path.resolve("output", baseName, "mp3"),
  };
}