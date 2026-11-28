// Configure PDF.js worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export class CVUploader {
  // Main handler for uploaded files
  static async processFile(file, onProgress) {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // 1. Plain Text
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text();
    }

    // 2. PDF Document
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      if (onProgress) onProgress("Parsing PDF pages...");
      return await this.extractFromPDF(file);
    }

    // 3. Word Document (.docx)
    if (fileName.endsWith('.docx')) {
      if (onProgress) onProgress("Reading Word document...");
      return await this.extractFromDocx(file);
    }

    // 4. Images (PNG, JPG, JPEG via Tesseract OCR)
    if (fileType.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg)$/)) {
      if (onProgress) onProgress("Scanning picture via OCR (this takes 5-10s)...");
      return await this.extractFromImage(file, onProgress);
    }

    throw new Error("Unsupported file format. Please upload PDF, Word (.docx), TXT, or Image.");
  }

  // PDF.js Text Extractor
  static async extractFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + "\n\n";
    }

    return fullText;
  }

  // Mammoth.js Word Extractor
  static async extractFromDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }

  // Tesseract.js Image OCR Extractor
  static async extractFromImage(file, onProgress) {
    const worker = await window.Tesseract.createWorker('eng');
    
    const ret = await worker.recognize(file);
    await worker.terminate();
    return ret.data.text;
  }
}