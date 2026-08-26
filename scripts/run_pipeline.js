import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { extractTextFromPDF } from './pdf_extractor.js';
import { structureFIRWithLLM } from './llm_structurer.js';
import { writeFIRToDatabase } from './supabase_writer.js';
import { generateSampleFIRPDFs } from './generate_sample_pdfs.js';

async function runFIRPipeline() {
  const startTime = Date.now();
  console.log('================================================================================');
  console.log('  MUMBAI POLICE CIU — FIR PDF EXTRACTION & INGESTION PIPELINE (SIH 26189)');
  console.log('================================================================================\n');

  const firsDir = path.join(process.cwd(), 'data', 'firs');
  if (!fs.existsSync(firsDir) || fs.readdirSync(firsDir).filter(f => f.endsWith('.pdf')).length === 0) {
    console.log(`[INIT] No PDF files detected in ${firsDir}. Generating authentic CCTNS FIR test PDFs...`);
    await generateSampleFIRPDFs();
  }

  const pdfFiles = fs.readdirSync(firsDir).filter(f => f.endsWith('.pdf'));
  console.log(`[DISCOVERY] Located ${pdfFiles.length} FIR PDF documents to process in ${firsDir}\n`);

  // Pipeline Metrics Counters
  let totalProcessed = 0;
  let directExtractionCount = 0;
  let ocrExtractionCount = 0;
  let validationPassedCount = 0;
  let validationFailedCount = 0;
  let newPersonsTotal = 0;
  let resolvedPersonsTotal = 0;
  let phonesTotal = 0;
  let vehiclesTotal = 0;

  const perFileLogs = [];

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    const filePath = path.join(firsDir, file);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${pdfFiles.length}] Processing: ${file}`);

    // STEP 1: Text Extraction (Direct / OCR Fallback)
    const extraction = await extractTextFromPDF(filePath);
    if (extraction.method === 'DIRECT_PARSE') directExtractionCount++;
    else if (extraction.method === 'OCR_TESSERACT') ocrExtractionCount++;

    console.log(`  -> Step 1 (Extraction): [${extraction.method}] ${extraction.charCount} characters extracted from ${extraction.pages} page(s)`);

    if (extraction.charCount === 0) {
      console.error(`  -> [FAILED] Extraction yielded 0 characters. Skipping.`);
      validationFailedCount++;
      perFileLogs.push({ file, status: 'FAILED_EXTRACTION', error: extraction.error });
      continue;
    }

    // STEP 2: LLM Structuring & Zod Validation
    const structuring = await structureFIRWithLLM(extraction.text);
    if (!structuring.success) {
      console.error(`  -> [FAILED] Schema validation rejected LLM output: ${structuring.error}`);
      validationFailedCount++;
      perFileLogs.push({ file, status: 'FAILED_VALIDATION', error: structuring.error });
      continue;
    }

    validationPassedCount++;
    const firData = structuring.data;
    console.log(`  -> Step 2 (LLM & Validation): [SUCCESS] Mode: ${structuring.mode} ${structuring.retried ? '(Retried Once)' : ''}`);
    console.log(`     Crime No: ${firData.case.crime_no} | Station: ${firData.case.police_station}`);
    console.log(`     Extracted: ${firData.persons.length} Person(s), ${firData.phones.length} Phone(s), ${firData.vehicles.length} Vehicle(s)`);

    // STEP 3: Database Ingestion & Entity Resolution
    const dbResult = await writeFIRToDatabase(firData);
    newPersonsTotal += dbResult.newPersons;
    resolvedPersonsTotal += dbResult.personsResolved;
    phonesTotal += dbResult.phonesAdded;
    vehiclesTotal += dbResult.vehiclesAdded;
    totalProcessed++;

    console.log(`  -> Step 3 (Ingestion): [SUCCESS] Case ID: ${dbResult.caseId}`);
    console.log(`     Entity Resolution: ${dbResult.newPersons} New Persons Created, ${dbResult.personsResolved} Linked to Existing Entities`);
    console.log(`     Assets Linked: ${dbResult.phonesAdded} Phones, ${dbResult.vehiclesAdded} Vehicles`);

    perFileLogs.push({
      file,
      crimeNo: firData.case.crime_no,
      caseId: dbResult.caseId,
      extractionMethod: extraction.method,
      structuringMode: structuring.mode,
      newPersons: dbResult.newPersons,
      resolvedPersons: dbResult.personsResolved,
      phones: dbResult.phonesAdded,
      vehicles: dbResult.vehiclesAdded,
      status: 'SUCCESS'
    });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // STEP 4: Run Summary & Quality Audit Log
  const runSummary = {
    timestamp: new Date().toISOString(),
    executionTimeSeconds: Number(durationSec),
    totalFilesScanned: pdfFiles.length,
    successfulIngestions: totalProcessed,
    extractionMethods: {
      directDigitalText: directExtractionCount,
      ocrTesseractFallback: ocrExtractionCount
    },
    validationMetrics: {
      passed: validationPassedCount,
      failed: validationFailedCount,
      passRate: `${((validationPassedCount / (pdfFiles.length || 1)) * 100).toFixed(1)}%`
    },
    entityResolution: {
      newPersonsCreated: newPersonsTotal,
      matchedExistingPersons: resolvedPersonsTotal,
      totalEntityIdentitiesResolved: newPersonsTotal + resolvedPersonsTotal
    },
    assetsIngested: {
      phones: phonesTotal,
      vehicles: vehiclesTotal
    },
    perFileLogs
  };

  // Save audit run log
  const logFilePath = path.join(process.cwd(), 'data', 'pipeline_run_log.json');
  fs.writeFileSync(logFilePath, JSON.stringify(runSummary, null, 2), 'utf8');

  console.log('\n================================================================================');
  console.log('  PIPELINE EXECUTION AUDIT SUMMARY (CIU DATA PIPELINE)');
  console.log('================================================================================');
  console.log(`  Total FIR PDFs Scanned     : ${runSummary.totalFilesScanned}`);
  console.log(`  Successfully Ingested      : ${runSummary.successfulIngestions}`);
  console.log(`  Direct Text Extraction     : ${runSummary.extractionMethods.directDigitalText}`);
  console.log(`  Tesseract OCR Fallback     : ${runSummary.extractionMethods.ocrTesseractFallback}`);
  console.log(`  Zod Schema Validation Rate : ${runSummary.validationMetrics.passRate}`);
  console.log(`  New Persons Created        : ${runSummary.entityResolution.newPersonsCreated}`);
  console.log(`  Matched Existing Persons   : ${runSummary.entityResolution.matchedExistingPersons}`);
  console.log(`  Phones & Vehicles Linked   : ${phonesTotal} Phones, ${vehiclesTotal} Vehicles`);
  console.log(`  Execution Time             : ${durationSec} seconds`);
  console.log(`  Audit Run Log Saved To     : ${logFilePath}`);
  console.log('================================================================================\n');

  return runSummary;
}

runFIRPipeline().catch(console.error);
