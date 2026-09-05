# 🎯 NETRA (VAJRA-X21) — Pitch & Presentation Deck
> **Smart India Hackathon (SIH) | Problem Statement: SIH 26189**  
> **Team Pitch Deck & Presenter Script**  
> **Total Time Target:** 6–8 Minutes (+ Q&A)

---

## 📊 Presentation Structure & Timing Overview

| Slide # | Slide Title | Recommended Time | Focus Area |
| :--- | :--- | :--- | :--- |
| **Slide 1** | Title & Hook | 30 sec | Introduction & Problem Scope |
| **Slide 2** | The Problem: Data Silos in Law Enforcement | 45 sec | Real-world pain points & bottlenecks |
| **Slide 3** | The Solution: NETRA Command Center | 45 sec | Value proposition & key pillars |
| **Slide 4** | End-to-End System Architecture | 60 sec | Tech stack, data flow & security |
| **Slide 5** | Live Demo Flow 1: Ingestion & Knowledge Graph | 90 sec | Multi-case entity linking & hub discovery |
| **Slide 6** | Live Demo Flow 2: Modus Operandi Matching | 60 sec | Vector embeddings & cold-case links |
| **Slide 7** | Live Demo Flow 3: Explainable AI & Priority Scoring | 60 sec | XGBoost + TreeSHAP transparent attribution |
| **Slide 8** | Digital Murder Board (Investigation Canvas) | 45 sec | Tactical detective workspace |
| **Slide 9** | Business Impact, Security & Feasibility | 45 sec | RLS, chain of custody & deployment |
| **Slide 10** | Conclusion & The Future Roadmap | 30 sec | Vision, scale & wrap-up |

---

---

## 🖥️ Slide 1: Title & Hook
**Title:** NETRA (VAJRA-X21)  
**Subtitle:** Next-Generation Criminal Intelligence & Multi-Case Relational Analytics  
**Tagline:** *Empowering Law Enforcement with Explainable AI and Graph Intelligence*  

### 📌 On-Slide Content:
- **Project:** NETRA (National Evidence Tracking & Relational Analytics)
- **Domain:** Criminal Intelligence Unit (CIU) & Police Command Automation
- **SIH Problem Code:** SIH 26189
- **Core Pillars:** Multi-Modal FIR Ingestion • Cross-Case Knowledge Graph • Explainable AI Priority Scoring • MO Pattern Recognition

### 🎙️ Presenter Script (Spoken):
> "Respected judges, every single day, law enforcement officers register thousands of First Information Reports. But behind these thousands of documents lies a hidden reality: crimes do not occur in isolation. Repeat offenders use the same getaway vehicles, burner phones, and modus operandi across multiple police jurisdictions.
>
> Today, we are proud to introduce **NETRA (VAJRA-X21)** — an AI-powered Criminal Intelligence Command Center designed to break data silos, automatically link multi-case criminal syndicates, and deliver 100% explainable, courtroom-ready investigative intelligence."

---

## 🖥️ Slide 2: The Problem: The 4 Bottlenecks of Modern Policing
**Title:** The Investigation Crisis: Data Silos & Blind Spots  

### 📌 On-Slide Content:
```
┌─────────────────────────┐   ┌─────────────────────────┐
│   1. Data Silos         │   │  2. Blind MO Patterns   │
│ 80% data trapped in raw │   │ Similar crimes across   │
│ narrative text & PDFs.  │   │ districts go unnoticed. │
└─────────────────────────┘   └─────────────────────────┘
┌─────────────────────────┐   ┌─────────────────────────┐
│   3. Triage Overload    │   │  4. Black-Box AI Trust  │
│ IOs lack objective,     │   │ Courts & police reject  │
│ data-backed priority.   │   │ unexplainable AI scores.│
└─────────────────────────┘   └─────────────────────────┘
```

### 🎙️ Presenter Script (Spoken):
> "Let us look at why modern policing faces immense friction:
> 1. **Data Silos**: Critical clues—like an alias or a mule bank account—are buried in unstructured text across separate police stations.
> 2. **Blind Modus Operandi**: When a specialized burglary gang operates across three different districts, officers have no automated system to detect that identical tools and time windows were used.
> 3. **Triage Overload**: Investigating officers are overwhelmed and must manually guess which suspect poses the highest flight risk.
> 4. **The Black-Box Dilemma**: Standard AI models give a score without explaining *why*. In a court of law, unexplainable AI is inadmissible and dangerous."

---

## 🖥️ Slide 3: The Solution: NETRA Command Center
**Title:** NETRA — From Fragmented FIRs to Connected Intelligence  

### 📌 On-Slide Content:
- 📑 **Automated Multi-Modal Ingestion**: OCR + GenAI structuring of scanned & physical FIRs.
- 🕸️ **7-Dimensional Knowledge Graph**: Maps Persons, Phones, Vehicles, Bank Accounts, Locations, Organizations & Cases.
- 🧠 **Vector-Based MO Pattern Engine**: 384-dimensional dense semantic matching across unsolved cold cases.
- ⚖️ **Explainable Priority Scoring (XAI)**: XGBoost + TreeSHAP provides exact mathematical feature attributions for every score.
- 📌 **Digital Murder Board**: Tactile investigation canvas for timeline and hypothesis building.

### 🎙️ Presenter Script (Spoken):
> "NETRA solves this through a unified intelligence pipeline. We ingest raw FIRs, extract 7 distinct classes of entities, and construct a living, dynamic Knowledge Graph. 
>
> Instead of black-box predictions, we combine **XGBoost machine learning with TreeSHAP mathematical explainability**, giving every officer not just an urgency score, but a plain-English, evidence-backed justification for every lead."

---

## 🖥️ Slide 4: System Architecture & Data Pipeline
**Title:** Robust, Modular & Scalable Architecture  

### 📌 On-Slide Content:
```
[ User / Detective ]
        │ (HTTPS)
        ▼
[ React 19 Frontend (Vite + Tailwind + Recharts + Leaflet) ]
        │ (REST API / JWT Auth)
        ▼
[ FastAPI Backend Microservice (Python 3.10+ / Uvicorn) ]
        ├── OCR & NER Engine (pytesseract + pdfplumber + Gemini LLM)
        ├── Risk & Priority Classifier (XGBoost + TreeSHAP XAI)
        └── Semantic MO Vector Engine (SentenceTransformers / 384-dim)
        │
        ▼
[ Supabase PostgreSQL + pgvector + Row-Level Security (RLS) ]
        └── Immutable Audit Trail (Chain of Custody)
```

### 🎙️ Presenter Script (Spoken):
> "Our architecture is built for enterprise scale and security:
> - **Frontend**: React 19 and Vite deliver sub-millisecond UI interactions and fluid graph visualization.
> - **Microservices**: A dedicated Python FastAPI engine handles high-throughput ML inference and OCR document processing.
> - **Persistence**: Supabase PostgreSQL with `pgvector` allows millisecond similarity queries across thousands of crime vectors.
> - **Security**: Strict Row-Level Security (RLS) and an immutable `audit_logs` table maintain a legally compliant chain of custody."

---

## 🖥️ Slide 5: Feature Demo 1 — Knowledge Graph & Multi-Case Hubs
**Title:** Multi-Case Relational Graph: Exposing Hidden Syndicates  
**Demo Page Cue:** *Navigate to Knowledge Graph (`/graph`)*  

### 📌 On-Slide / Demo Highlights:
- **7 Entity Types Connected**: Accused, Phones, Vehicles, Accounts, Locations, Organizations, FIRs.
- **Hub & Bridge Discovery**: Instantly pinpoints entities linking 3+ distinct FIRs.
- **Graph Centrality**: Sizes nodes by degree and network betweenness.
- **Shortest Path Analysis**: Traces the criminal hierarchy between any two suspects.

### 🎙️ Presenter Script (Spoken):
> *(Screen shows Knowledge Graph)*  
> "Here on the Knowledge Graph, you are looking at live multi-case data. Notice this vehicle node: **MH-04-AB-1234**. In a traditional setup, three different police stations had no idea they were searching for the exact same motorcycle.
>
> NETRA automatically flags it as a **Network Hub**. By clicking on it, the system traces every linked suspect, burner phone, and registered FIR across city borders. We can calculate the shortest path between a street-level operative and a kingpin with a single click."

---

## 🖥️ Slide 6: Feature Demo 2 — Modus Operandi (MO) Pattern Matching
**Title:** Semantic Vector Matching: Uncovering Serial Crimes & Cold Cases  
**Demo Page Cue:** *Navigate to MO Similarity (`/mo-similarity`)*  

### 📌 On-Slide / Demo Highlights:
- **Dense Text Embeddings**: 384-dimensional semantic representation of crime narratives.
- **Composite Scoring Formula**:
  $$\text{Score}_{\text{MO}} = 0.45 \cdot \text{CosineSim} + 0.20 \cdot \text{Tool} + 0.20 \cdot \text{Target} + 0.15 \cdot \text{GeoDist}$$
- **Automated Cold Case Linkage**: Matches new FIRs against 5-year unsolved archives.

### 🎙️ Presenter Script (Spoken):
> *(Screen shows MO Similarity page)*  
> "Criminals are creatures of habit. They reuse specific tools, strike at identical hours, and target similar profiles.
>
> Our Modus Operandi engine converts raw narrative descriptions into 384-dimensional vector embeddings stored in `pgvector`. When an officer inputs a new night-time break-in involving a gas cutter, NETRA instantly ranks historical cases by composite similarity, linking open FIRs with 92% semantic confidence."

---

## 🖥️ Slide 7: Feature Demo 3 — Explainable AI Priority Scoring (XAI)
**Title:** Courtroom-Ready AI: Suspect Priority & TreeSHAP Attribution  
**Demo Page Cue:** *Navigate to Case Search or Entity Profile (`/entity-profile` or `/cases`)*  

### 📌 On-Slide / Demo Highlights:
- **XGBoost Classifier**: Predicts Priority Score ($0.0 - 100.0$) using 10 standardized graph & crime features.
- **TreeSHAP Exact Attribution**: Shows positive and negative feature contributions in real points.
- **LLM Legal Reasoning**: Generates plain-English, objective explanations with zero hallucinations.

```
┌──────────────────────────────────────────────────────────────┐
│ Priority Score: 88.4 / 100 [CRITICAL URGENCY]                │
├──────────────────────────────────────────────────────────────┤
│ • Network Bridge Centrality:      +24.2 pts (High graph hub) │
│ • Prior Registered FIRs:          +14.8 pts (Repeat offender)│
│ • MO Serial Pattern Match:        +9.5 pts  (Active cluster) │
│ • Verified Evidence Ratio:        +6.2 pts  (Hard evidence)  │
├──────────────────────────────────────────────────────────────┤
│ Judicial Explanation: "Subject warrants prioritized review   │
│ due to high network bridge centrality across 4 FIRs and      │
│ strong modus operandi alignment with active robbery ring."   │
└──────────────────────────────────────────────────────────────┘
```

### 🎙️ Presenter Script (Spoken):
> *(Screen shows Priority Score & SHAP Breakdown)*  
> "This is NETRA's most critical breakthrough: **Explainability**. 
>
> When an officer views Key Suspect Farhan, the system assigns an **88.4 Priority Score**. But more importantly, our **TreeSHAP engine** explains the exact mathematics: `+24.2 points` for being a network bridge node, `+14.8 points` for prior offenses, and `+9.5 points` for matching active MO patterns.
>
> This eliminates AI bias and provides an objective, transparent basis that stands scrutiny in judicial trials."

---

## 🖥️ Slide 8: Feature Demo 4 — Digital Murder Board (Investigation Canvas)
**Title:** Interactive Investigation Canvas: From Clues to Conviction  
**Demo Page Cue:** *Navigate to Case Canvas (`/canvas`)*  

### 📌 On-Slide / Demo Highlights:
- **Tactile Workspace**: Drag-and-drop evidence, suspects, and witness statements.
- **Timeline Sequencing**: Reconstructs incident chronologies to test alibis against CDR timestamps.
- **Collaborative Hypotheses**: Multi-officer notes, evidence linking, and visual case summaries.

### 🎙️ Presenter Script (Spoken):
> *(Screen shows Case Canvas)*  
> "Detectives have historically relied on physical whiteboards and sticky notes—what we call the 'Murder Board'.
>
> NETRA modernizes this into an **Interactive Digital Investigation Canvas**. Officers can pin evidence cards, draw hypotheses, sequence crime timelines against Call Detail Records, and export comprehensive briefing dossiers for senior leadership."

---

## 🖥️ Slide 9: Security, Governance & Implementation Feasibility
**Title:** Institutional Governance, Security & Deployment  

### 📌 On-Slide Content:
- 🔒 **Role-Based Access Control (RBAC)**: Strict permission tiers (Investigator, Analyst, Supervisor, Administrator).
- 📜 **Immutable Chain of Custody**: Every database read, edit, or export is cryptographically logged in `audit_logs`.
- ⚡ **Offline & Low-Bandwidth Resilience**: Client-side heuristic fallbacks ensure uninterrupted field operation.
- 🚀 **Cloud & On-Premise Ready**: Packaged via Docker for deployment on state police secure intranets or cloud platforms.

### 🎙️ Presenter Script (Spoken):
> "In law enforcement, data governance is paramount. NETRA enforces strict role-based access control. No user can view or edit data outside their clearance. Every single interaction is logged in an immutable audit ledger, preserving legal chain of custody.
>
> Furthermore, NETRA is built with fail-safe heuristic algorithms—if internet connectivity drops during field raids, the system seamlessly runs offline without crashing."

---

## 🖥️ Slide 10: Conclusion & Future Roadmap
**Title:** The Future of Intelligent Policing  

### 📌 On-Slide Content:
- 🚀 **Current State**: Fully functional end-to-end prototype with live AI scoring, vector search, and knowledge graph.
- 🔮 **Phase 2 Expansion**:
  - Integration with CCTNS (Crime and Criminal Tracking Network & Systems).
  - Automated CCTV Facial Recognition & ANPR (Automatic Number Plate Recognition) streaming feeds.
  - Multi-state interstate criminal intelligence exchange.

### 🎙️ Presenter Script (Spoken):
> "NETRA transforms policing from reactive documentation into **proactive, connected, and explainable intelligence**. By turning isolated FIRs into an actionable knowledge graph, we save hundreds of investigative hours and help law enforcement solve complex crimes faster.
>
> Thank you, and we are now open to your questions."

---

---

## 🎯 High-Stakes Judge Q&A Cheatsheet (Anticipated Questions & Winning Answers)

### ❓ Question 1: "How is NETRA different from existing police software like CCTNS?"
> **Winning Response:**  
> *"CCTNS is primarily a transactional record-keeping and FIR registration database. It was not built for real-time relational analytics. NETRA sits on top of existing databases as an **intelligence layer**. We perform automated multi-modal entity extraction, multi-case knowledge graph link prediction, and semantic Modus Operandi matching across jurisdictional silos that CCTNS cannot natively correlate."*

---

### ❓ Question 2: "Why use XGBoost and TreeSHAP instead of an end-to-end Deep Learning model?"
> **Winning Response:**  
> *"For structured tabular data (graph centrality, prior FIR counts, evidence counts), gradient-boosted trees consistently outperform deep neural networks in accuracy and efficiency. More importantly, law enforcement requires **explainability**. Deep neural networks are black boxes. XGBoost combined with TreeSHAP provides exact, polynomial-time Shapley values, mathematically proving which factors drove the score for legal accountability in court."*

---

### ❓ Question 3: "How do you handle spelling errors or aliases across different FIRs?"
> **Winning Response:**  
> *"We use a two-tiered entity resolution strategy: First, deterministic hard-matching on unique identifiers (Phone Numbers, Vehicle Registrations, Bank Account Hashes). Second, for suspect names, we employ phonetic algorithms (Soundex/Double Metaphone) and Levenshtein distance matching against known alias arrays. If the match confidence exceeds 85%, the system suggests an entity merge with an explicit confidence tag."*

---

### ❓ Question 4: "What if the police station has no internet or the AI server goes down?"
> **Winning Response:**  
> *"NETRA has a built-in **dual-mode fail-safe architecture**. If the FastAPI AI microservice is unreachable, the system automatically falls back to an internal mathematical heuristic scoring algorithm and serves cached local data, ensuring field officers are never locked out during critical operations."*

---

### ❓ Question 5: "How does NETRA protect suspect privacy and prevent wrongful targeting?"
> **Winning Response:**  
> *"NETRA explicitly avoids assigning guilt or making legal characterizations. All AI outputs are labeled as 'Investigative Priority Indicators' rather than culpability scores. Features are strictly derived from verified factual evidence, graph connectivity, and registered FIRs—not demographic or protected attributes. Furthermore, every query is tracked in an immutable audit log to prevent unauthorized profiling."*
