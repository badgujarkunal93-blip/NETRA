import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const SAMPLE_FIRS = [
  {
    fileName: 'FIR_2026_0811_BND_Hawala_Shell.pdf',
    crimeNo: 'CR/2026/0811-BND',
    caseNo: 'FIR-402/2026',
    ps: 'Bandra Police Station',
    acts: 'IPC 420, 468, 471, 120B (Cheating, Forgery & Criminal Conspiracy)',
    complainant: 'Suresh Narvekar, Assistant Commissioner of Sales Tax',
    accused: 'Farhan Merchant alias Babloo, Tariq Al-Mansoor, Zeeshan Qureshi',
    phones: '+91-98201-99881, +91-98205-44321',
    vehicles: 'MH-02-DN-8819 (Skoda Octavia White)',
    facts: `Investigation into a syndicate operating 14 fake import-export billing firms in Bandra Kurla Complex (BKC). Funds routed via overseas mule accounts in UAE before remitting to real estate holdings in suburban Mumbai. Primary operator Farhan Merchant identified using multiple burner SIMs (+91-98201-99881) and coordinating through shell firm Apex Global Advisory Pvt Ltd.`
  },
  {
    fileName: 'FIR_2026_0924_CLB_Diamond_Vault_Heist.pdf',
    crimeNo: 'CR/2026/0924-CLB',
    caseNo: 'FIR-118/2026',
    ps: 'Colaba Police Station',
    acts: 'IPC 395, 397, 457 (Armed Dacoity & Vault Housebreaking by Night)',
    complainant: 'Dhanraj Mehta, Chief Security Officer, Royal Gems Vaults',
    accused: 'Rajesh Sawant alias Raju Cutter, Imtiaz Shaikh, Vicky Sharma',
    phones: '+91-98202-33441, +91-98207-66552',
    vehicles: 'MH-01-BK-4091 (Pulsar 220 Black), MH-01-EF-1102 (Yamaha FZ)',
    facts: `Four masked operatives breached private vault facility in Colaba after subduing night guard with stun devices. Vault door opened via specialized pneumatic cutting tools. Suspects fled on two black motorcycles (MH-01-BK-4091) toward South Bombay sea-link exit. Striation marks match pneumatic hydraulic shears used by Rajesh Sawant gang.`
  },
  {
    fileName: 'FIR_2026_0740_DHR_NDPS_Mephedrone.pdf',
    crimeNo: 'CR/2026/0740-DHR',
    caseNo: 'FIR-305/2026',
    ps: 'Dharavi Police Station',
    acts: 'NDPS Act Sec 8(c), 21(c), 29 (Commercial Quantity Synthetic Drugs)',
    complainant: 'Inspector Vikram Patil, Anti-Narcotics Cell Mumbai',
    accused: 'Bilal Khan alias Chhota Bilal, Altaf Memon',
    phones: '+91-98203-77889',
    vehicles: 'MH-04-AZ-9901 (Eicher Commercial Tempo)',
    facts: `Interception of 12.5 kg suspected commercial-grade Mephedrone concealed within hollowed industrial textile rolls in transit from Palghar border to transit godown near 90 Feet Road, Dharavi. Carrier vehicle intercepted with burner phone linked to interstate logistics cell.`
  },
  {
    fileName: 'FIR_2026_0615_AND_Cyber_SIM_Swap.pdf',
    crimeNo: 'CR/2026/0615-AND',
    caseNo: 'FIR-512/2026',
    ps: 'Andheri East Cyber Cell',
    acts: 'IT Act 66C, 66D and IPC 419, 420 (Identity Theft & Corporate Wire Fraud)',
    complainant: 'Arunav Sengupta, CFO, InfraTech Logistics Ltd',
    accused: 'Dinesh Rathod, Sameer Qazi alias Sam Cyber',
    phones: '+91-98209-11223, +91-98204-55667',
    vehicles: 'MH-02-CP-7712 (Hyundai i20 Grey)',
    facts: `Unlawful SIM porting targeting Chief Financial Officer of an infrastructure enterprise in MIDC Andheri. OTP intercepted to drain INR 4.8 Crore into 38 distinct micro-accounts within 12 minutes through proxy VPN tunnels and shell beneficiary mandates.`
  },
  {
    fileName: 'FIR_2026_0491_KRL_SUV_Auto_Theft.pdf',
    crimeNo: 'CR/2026/0491-KRL',
    caseNo: 'FIR-178/2026',
    ps: 'Kurla Police Station',
    acts: 'IPC 379, 467, 471 (Organized Vehicle Theft & Chassis Forgery)',
    complainant: 'Mahesh Kulkarni, Resident of CST Road Kurla',
    accused: 'Salim Garage alias Salim Mechanic, Vicky Sharma',
    phones: '+91-98206-88771',
    vehicles: 'MH-03-BW-5521 (Toyota Fortuner Pearl White)',
    facts: `Organized gang using electronic signal amplifier and OBD key cloner targeting high-end SUVs in Kurla-CST Road belt. Chassis numbers re-stamped at Kurla scrap workshop and exported via Gujarat container depot.`
  },
  {
    fileName: 'FIR_2026_0582_WRL_Extortion_VoIP.pdf',
    crimeNo: 'CR/2026/0582-WRL',
    caseNo: 'FIR-209/2026',
    ps: 'Worli Police Station',
    acts: 'IPC 384, 387, 506(II) (Extortion & Threat to Life)',
    complainant: 'Harshvardhan Singhania, Managing Director, Skyline Developers',
    accused: 'Farhan Merchant alias Babloo, Imran Kazi',
    phones: '+91-98208-33221',
    vehicles: 'MH-01-EE-3344 (Honda City Black)',
    facts: `Threat calls received by prominent high-rise builder demanding INR 2 Crore protection money. VoIP tracing linked proxy IP gateways to a logistics syndicate registered in Navi Mumbai with financial conduits linked to Farhan Merchant.`
  }
];

export async function generateSampleFIRPDFs() {
  const outputDir = path.join(process.cwd(), 'data', 'firs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[GENERATOR] Creating 6 authentic test FIR PDFs in: ${outputDir}`);

  for (const item of SAMPLE_FIRS) {
    const pdfDoc = await PDFDocument.create();
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    // Header CCTNS Form II
    page.drawText('FIRST INFORMATION REPORT', {
      x: 180,
      y: height - 50,
      size: 16,
      font: timesBold,
      color: rgb(0, 0.1, 0.3)
    });
    page.drawText('(Under Section 154 Cr.P.C. / Section 173 B.N.S.S.)', {
      x: 175,
      y: height - 68,
      size: 10,
      font: timesFont,
      color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText('GOVERNMENT OF MAHARASHTRA // MUMBAI POLICE COMMISSIONERATE', {
      x: 100,
      y: height - 85,
      size: 10,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1)
    });

    // Divider
    page.drawLine({
      start: { x: 50, y: height - 95 },
      end: { x: width - 50, y: height - 95 },
      thickness: 1.5,
      color: rgb(0, 0, 0)
    });

    let y = height - 120;
    const drawField = (label, val, isMono = false) => {
      page.drawText(label, { x: 50, y, size: 10, font: timesBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(val, { x: 190, y, size: 10, font: isMono ? courierFont : timesFont, color: rgb(0, 0, 0) });
      y -= 22;
    };

    drawField('1. District / Unit:', 'MUMBAI CITY POLICE');
    drawField('2. Police Station:', item.ps);
    drawField('3. Crime No / FIR No:', `${item.crimeNo} / ${item.caseNo}`, true);
    drawField('4. Date of Registration:', '2026-07-14 (11:30 hrs)');
    drawField('5. Acts & Sections:', item.acts);
    drawField('6. Complainant / Informant:', item.complainant);
    drawField('7. Accused / Suspects:', item.accused);
    drawField('8. Linked Phone Numbers:', item.phones, true);
    drawField('9. Tagged Vehicles:', item.vehicles, true);

    y -= 10;
    page.drawText('10. Brief Facts of the Case & Modus Operandi (MO):', {
      x: 50,
      y,
      size: 11,
      font: timesBold,
      color: rgb(0, 0.1, 0.3)
    });

    y -= 20;
    // Word wrap facts
    const words = item.facts.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + w).length > 70) {
        page.drawText(line, { x: 50, y, size: 9.5, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
        y -= 15;
        line = '';
      }
      line += `${w} `;
    }
    if (line) {
      page.drawText(line, { x: 50, y, size: 9.5, font: timesFont, color: rgb(0.1, 0.1, 0.1) });
      y -= 25;
    }

    // Seal & Signature Footer
    page.drawLine({
      start: { x: 50, y: 90 },
      end: { x: width - 50, y: 90 },
      thickness: 0.75,
      color: rgb(0.5, 0.5, 0.5)
    });
    page.drawText('Station House Officer / Investigating Officer Signature & Seal', {
      x: 280,
      y: 70,
      size: 9,
      font: timesBold,
      color: rgb(0.2, 0.2, 0.2)
    });
    page.drawText('CCTNS Electronic Digitized Record • Mumbai Police CIU Portal', {
      x: 50,
      y: 50,
      size: 8,
      font: courierFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(outputDir, item.fileName);
    fs.writeFileSync(filePath, pdfBytes);
    console.log(`  -> Generated PDF: ${item.fileName}`);
  }

  console.log(`[GENERATOR] Successfully created all 6 FIR PDF test files.\n`);
}

// Self-run if called directly
if (process.argv[1]?.endsWith('generate_sample_pdfs.js')) {
  generateSampleFIRPDFs().catch(console.error);
}
