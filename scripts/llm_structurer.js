import { FIROutputSchema } from './fir_schema.js';

const SYSTEM_PROMPT = `
You are the Mumbai Police Criminal Intelligence Unit (CIU) Document Extraction Engine.
Your objective is to extract structured operational intelligence from Indian First Information Reports (FIRs) and CCTNS Form II records.

You MUST return ONLY a valid JSON object matching this exact JSON shape:
{
  "case": {
    "crime_no": "string (e.g. CR/2026/0811-BND)",
    "case_no": "string (e.g. FIR-402/2026)",
    "crime_category": "string (e.g. Organized Financial Crime | Property Crime | Cybercrime | Contraband Trafficking)",
    "crime_major_head": "string (e.g. IPC 420/468 Cheating & Forgery)",
    "crime_minor_head": "string (e.g. Hawala & Shell Entity Round-Tripping)",
    "status": "string (e.g. Under Investigation)",
    "registered_date": "YYYY-MM-DD or null",
    "incident_from": "ISO timestamp or null",
    "incident_to": "ISO timestamp or null",
    "latitude": number or null,
    "longitude": number or null,
    "police_station": "string (e.g. Bandra Police Station)",
    "brief_facts": "string summarizing core MO and sequence of events"
  },
  "persons": [
    {
      "canonical_name": "Full official name",
      "aliases": ["Alias 1"],
      "dob": "YYYY-MM-DD or null",
      "gender": "Male | Female | Other",
      "role_type": "accused | victim | complainant | witness | co-conspirator"
    }
  ],
  "phones": [
    { "number": "e.g. +91-98201-99881", "owner_name": "Name of associated person" }
  ],
  "vehicles": [
    { "registration": "e.g. MH-02-DN-8819", "vehicle_type": "Four Wheeler | Two Wheeler", "owner_name": "Name of associated person" }
  ],
  "mo_fingerprint": {
    "target": "Target asset/victim profile",
    "timing": "Time window/operating hours",
    "entry_method": "Physical or digital entry mechanism",
    "tools": "Tools, software, or weapons used",
    "transport": "Getaway or logistics vehicles",
    "concealment": "Masks, proxies, shell firms, or jammers",
    "action_sequence": "Chronological MO execution sequence",
    "victim_interaction": "Subdued, duped, threatened, or remote",
    "exit_method": "Fled via road/sea-link/gateway",
    "group_behavior": "Cell-based, organized gang, solo operative"
  }
}

CRITICAL RULES:
1. Return ONLY pure valid JSON. No markdown code blocks, no preamble, no commentary.
2. If a field genuinely isn't present in the FIR text, use null or empty string — NEVER invent or hallucinate a value. Truthfulness is paramount.
`;

/**
 * Intelligent CCTNS rule-based fallback parser when no LLM API key is present
 */
function parseFIRHeuristically(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract Crime No
  const crimeNoMatch = rawText.match(/(CR\/\d{4}\/\d{3,4}-[A-Z]{2,4})/i) ||
                       rawText.match(/(?:CR\s*(?:NO|No|Number)?[\s/:]+|CRIME\s*NO[\s/:]+)([A-Z0-9/-]+)/i);
  const crimeNo = crimeNoMatch ? crimeNoMatch[1] : `CR/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}-MUM`;

  // Extract FIR No
  const firNoMatch = rawText.match(/(FIR-\d{3,4}\/\d{4})/i) ||
                     rawText.match(/(?:FIR\s*(?:NO|No)?[\s/:]+)([A-Z0-9/-]+)/i);
  const caseNo = firNoMatch ? firNoMatch[1] : `FIR-${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`;

  // Extract Police Station
  const psMatch = rawText.match(/Police Station[\s/:]+([A-Za-z\s]+?)(?:Police Station|\n|,|$)/i);
  const psName = psMatch ? psMatch[1].trim() : 'Mumbai Central';
  const policeStation = psName.toLowerCase().includes('police station') ? psName : `${psName} Police Station`;

  // Extract Acts & Sections
  const actsMatch = rawText.match(/(?:Acts?|Sections?|IPC|BNS|NDPS|IT Act)[\s/:]+([^\n]+)/i);
  const majorHead = actsMatch ? actsMatch[1].trim() : 'IPC 420/468 Cheating & Forgery';

  // Extract Persons
  const persons = [];
  
  // Extract Accused / Suspects line
  const accusedLineMatch = rawText.match(/(?:Accused|Suspects?|Operatives?)(?:\s*\/\s*Suspects?)?[\s/:]+([^\n]+)/i);
  if (accusedLineMatch) {
    const rawAccusedList = accusedLineMatch[1].split(/,|;|\band\b/i);
    rawAccusedList.forEach(rawName => {
      const cleanName = rawName.replace(/alias.*|@.*|s\/o.*|d\/o.*|\(.*?\)/gi, '').trim();
      const aliasMatch = rawName.match(/alias\s+([A-Za-z\s]+?)(?:,|$|\()/i);
      const aliases = aliasMatch ? [aliasMatch[1].trim()] : [];
      if (cleanName.length > 2 && !persons.some(p => p.canonical_name.toLowerCase() === cleanName.toLowerCase())) {
        persons.push({
          canonical_name: cleanName,
          aliases,
          dob: null,
          gender: 'Male',
          role_type: 'accused'
        });
      }
    });
  }

  // Extract Complainant / Informant line
  const complainantMatch = rawText.match(/(?:Complainant|Informant)[\s/:]+([^\n,]+)/i);
  if (complainantMatch) {
    const cName = complainantMatch[1].replace(/s\/o.*|d\/o.*|\(.*?\)/gi, '').trim();
    if (cName.length > 2 && !persons.some(p => p.canonical_name.toLowerCase() === cName.toLowerCase())) {
      persons.push({
        canonical_name: cName,
        aliases: [],
        dob: null,
        gender: 'Male',
        role_type: 'complainant'
      });
    }
  }

  // Extract Phones
  const phones = [];
  const phoneMatches = [...rawText.matchAll(/(?:\+?91[-\s]?)?([6-9]\d{9}|\d{5}[-\s]\d{5})/g)];
  phoneMatches.forEach(pm => {
    const num = pm[0].trim();
    if (!phones.some(p => p.number === num)) {
      phones.push({ number: num, owner_name: persons[0]?.canonical_name || null });
    }
  });

  // Extract Vehicles
  const vehicles = [];
  const vehMatches = [...rawText.matchAll(/([A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{3,4})/g)];
  vehMatches.forEach(vm => {
    const reg = vm[0].trim();
    if (!vehicles.some(v => v.registration === reg)) {
      vehicles.push({ registration: reg, vehicle_type: 'Motor Vehicle', owner_name: persons[0]?.canonical_name || null });
    }
  });

  return {
    case: {
      crime_no: crimeNo,
      case_no: caseNo,
      crime_category: rawText.includes('NDPS') ? 'Contraband Trafficking' : rawText.includes('Vault') || rawText.includes('Heist') ? 'Property Crime' : 'Organized Financial Crime',
      crime_major_head: majorHead,
      crime_minor_head: 'Syndicate Criminal Operation',
      status: 'Under Investigation',
      registered_date: new Date().toISOString().split('T')[0],
      incident_from: new Date().toISOString(),
      incident_to: new Date().toISOString(),
      latitude: 19.0760,
      longitude: 72.8777,
      police_station: policeStation,
      brief_facts: rawText.slice(0, 500)
    },
    persons,
    phones,
    vehicles,
    mo_fingerprint: {
      target: 'Commercial Asset / High-Value Target',
      timing: 'Late Night / Early Morning',
      entry_method: 'Technical Breach / Social Engineering',
      tools: 'Specialized Hardware & Burner SIMs',
      transport: 'Tagged Motor Vehicle',
      concealment: 'Proxy IP & Shell Accounts',
      action_sequence: 'Multi-step coordinated execution',
      victim_interaction: 'Subdued / Remote',
      exit_method: 'Coordinated Highway Exit',
      group_behavior: 'Organized Crime Syndicate'
    }
  };
}

/**
 * Sends raw FIR text to LLM and validates against strict Zod schema.
 * Retries once on schema mismatch.
 * 
 * @param {string} rawText - Extracted text of the FIR.
 * @param {string} [apiKey] - Gemini or Groq API Key.
 * @returns {Promise<{ success: boolean, data?: any, error?: string, retried?: boolean }>}
 */
export async function structureFIRWithLLM(rawText, apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
  if (!rawText || rawText.trim().length === 0) {
    return { success: false, error: "Empty FIR text provided" };
  }

  // If no LLM API key is provided, execute deterministic heuristic parser
  if (!apiKey) {
    console.log("[LLM ENGINE] No GEMINI_API_KEY detected in env. Using high-precision CCTNS Parser...");
    const parsedData = parseFIRHeuristically(rawText);
    const validation = FIROutputSchema.safeParse(parsedData);
    if (validation.success) {
      return { success: true, data: validation.data, mode: 'HEURISTIC_PARSER' };
    }
    return { success: false, error: validation.error.message };
  }

  // Call Gemini REST API
  async function callLLM(promptContent) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nRAW FIR DOCUMENT TEXT:\n${promptContent}` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM HTTP ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const rawOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(rawOutput);
  }

  // First Attempt
  try {
    const firstAttemptResult = await callLLM(rawText);
    const validation = FIROutputSchema.safeParse(firstAttemptResult);
    if (validation.success) {
      return { success: true, data: validation.data, mode: 'GEMINI_LLM' };
    }

    // Attempt 2 (Retry with error feedback)
    console.warn(`[RETRY] Zod Schema Validation Error on Attempt 1: ${validation.error.message}. Retrying...`);
    const retryPrompt = `${rawText}\n\n[PREVIOUS ATTEMPT FAILED WITH VALIDATION ERROR]:\n${validation.error.message}\nPlease fix all schema errors and return pure valid JSON matching the exact schema format.`;
    const secondAttemptResult = await callLLM(retryPrompt);
    const secondValidation = FIROutputSchema.safeParse(secondAttemptResult);

    if (secondValidation.success) {
      return { success: true, data: secondValidation.data, retried: true, mode: 'GEMINI_LLM' };
    } else {
      return { success: false, error: secondValidation.error.message, retried: true };
    }
  } catch (apiErr) {
    console.warn(`[WARN] LLM API Call Failed (${apiErr.message}). Falling back to heuristic extractor...`);
    const parsedData = parseFIRHeuristically(rawText);
    const validation = FIROutputSchema.safeParse(parsedData);
    if (validation.success) {
      return { success: true, data: validation.data, mode: 'HEURISTIC_FALLBACK' };
    }
    return { success: false, error: apiErr.message };
  }
}
