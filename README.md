# PDF to Audiobook Converter

This project automates the process of converting PDF books into audiobooks. It extracts chapters from PDF files, generates text files for each chapter, and then converts those texts into MP3 audio files using a voice model.

## Features
- Extracts chapters from PDF files using the document outline.
- Saves each chapter as a separate `.txt` file.
- Converts each chapter to an `.mp3` audio file using a configurable voice model.
- Consistent logging with timestamps and log levels.
- Handles errors gracefully and skips problematic files.

## Requirements
- Node.js (v18 or higher recommended)
- npm or yarn
- Internet connection (for voice model API)

## Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/marcelosanchez/pdf-to-audiobook
   cd pdf-to-audiobook
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

## Usage
1. Place your PDF files in the `input/` directory.
2. Run the main processing script:
   ```sh
   node src/scripts/processAllBooks.js
   ```
   This will:
   - Extract chapters from each PDF in `input/`
   - Save chapter texts in `output/<book-name>/txt/`
   - Generate MP3 files in `output/<book-name>/mp3/`

3. (Optional) To convert text to audio for a specific book:
   ```sh
   node src/scripts/txtToSpeech.js "<book-name>"
   ```
   You can also specify a voice key (see `src/config/voices.js`):
   ```sh
   node src/scripts/txtToSpeech.js "<book-name>" "spanish_male"
   ```

## Configuration
- Voice profiles and model endpoint are configured in `src/config/voices.js`.
- Output paths are managed in `src/config/paths.js`.

## Logging
All scripts use a unified logger with timestamps and log levels for easy debugging and monitoring.

## Troubleshooting
- If you see errors about connecting to the voice model, check your internet connection and the endpoint URL in `voices.js`.
- If a PDF is not processed, check that it is not empty or corrupted.

## License
MIT
