import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

/**
 * Extracts raw text from an FIR PDF.
 * Uses direct text parsing as primary method; falls back to Tesseract OCR for scanned images.
 * 
 * @param {string} filePath - Absolute or relative path to the FIR PDF.
 * @returns {Promise<{ text: string, method: 'DIRECT_PARSE' | 'OCR_TESSERACT', charCount: number, pages: number, error?: string }>}
 */
export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // STEP 1: Direct digital text extraction
    let directText = '';
    let pageCount = 1;
    let parser = null;

    try {
      parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      directText = textResult?.text?.trim() || '';
      pageCount = textResult?.pages?.length || 1;
    } catch (parseErr) {
      console.warn(`[WARN] Digital text parse exception on ${filePath}: ${parseErr.message}`);
    }

    // If extracted text is substantial (e.g. >= 60 chars), return direct extraction result
    if (directText.length >= 60) {
      if (parser) await parser.destroy().catch(() => {});
      return {
        text: directText,
        method: 'DIRECT_PARSE',
        charCount: directText.length,
        pages: pageCount
      };
    }

    // STEP 2: Fallback to OCR (Tesseract) for scanned/image-based FIRs
    console.log(`[OCR FALLBACK] PDF ${filePath} has negligible digital text (${directText.length} chars). Initializing Tesseract OCR on rendered page...`);
    
    let ocrText = '';
    try {
      if (parser) {
        const screenshot = await parser.getScreenshot({ first: 1, last: 1 });
        if (screenshot?.pages?.[0]?.data) {
          const worker = await createWorker('eng');
          const { data } = await worker.recognize(screenshot.pages[0].data);
          await worker.terminate();
          ocrText = data?.text?.trim() || '';
        }
      }
    } catch (ocrErr) {
      console.warn(`[WARN] Tesseract OCR render error: ${ocrErr.message}`);
    }

    if (parser) await parser.destroy().catch(() => {});

    const finalText = ocrText.length > 0 ? ocrText : directText;

    return {
      text: finalText,
      method: ocrText.length > 0 ? 'OCR_TESSERACT' : 'DIRECT_PARSE',
      charCount: finalText.length,
      pages: pageCount
    };
  } catch (err) {
    return {
      text: '',
      method: 'FAILED',
      charCount: 0,
      pages: 1,
      error: err.message
    };
  }
}
