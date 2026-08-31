# 🛠️ NETRA / VAJRA-X21 — Tech Stack Documentation

This document provides a comprehensive breakdown of the technologies, frameworks, libraries, and tools utilized across the **NETRA (VAJRA-X21)** platform.

---

## 📑 Summary Matrix

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React.js (v19)** | Component-based, responsive Single Page Application (SPA) architecture |
| **Build & Tooling** | **Vite (v8)** | Lightning-fast development server with Hot Module Replacement (HMR) and optimized production bundler |
| **Styling & Design** | **Tailwind CSS (v4)** | Modern utility-first CSS framework with dark mode support |
| **Graph Visualization** | **React Flow (v11)** / **Reagraph** | Dynamic, interactive node-link diagrams for entity and cross-case network exploration |
| **Geospatial Mapping** | **Leaflet** & **React-Leaflet** | Interactive map layers, crime hotspot plotting, and location tracking |
| **Analytics & Charts** | **Recharts** | Visual data analytics, crime trend charts, and distribution metrics |
| **Backend Framework** | **FastAPI (v0.110+)** | High-performance asynchronous REST API microservice |
| **Server Engine** | **Uvicorn (v0.28+)** | High-throughput ASGI server implementation |
| **Database & Auth** | **Supabase (PostgreSQL)** | Relational database, vector embeddings, JWT authentication, and row-level security |
| **Priority Scoring (ML)** | **XGBoost (v2.0+)** & **scikit-learn** | Crime priority classification and case urgency scoring model |
| **Explainable AI (XAI)** | **SHAP** | Feature importance attribution to explain model reasoning to investigators |
| **NLP & Entity Extraction** | **spaCy** / **Google Gemini AI** | Named Entity Recognition (NER), suspect/vehicle extraction, and Modus Operandi (MO) extraction |
| **OCR & Document Ingestion** | **Tesseract.js** / **pytesseract** & **pdfplumber** | Ingestion and text parsing of scanned FIR PDFs and evidence documents |
| **DevOps & Hosting** | **Vercel** (Frontend) & **Render** (Backend) | Continuous Deployment (CD) and cloud container hosting |
| **Version Control** | **Git & GitHub** | Source code management and CI/CD automation |

---

## 🌐 1. Frontend Architecture

### Core Technologies
- **[React.js](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json) (v19)**: Powers the single-page application dashboard, reactive state management, and real-time investigative views.
- **[Vite](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: High-speed frontend build tool providing immediate feedback during development.
- **[Tailwind CSS](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Responsive, dark-themed police analytics dashboard UI.
- **[React Router DOM](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json) (v7)**: Client-side routing across Search, Graph Explorer, Geospatial Map, Case Details, and Alerts views.

### Visualization & Mapping Libraries
- **[React Flow](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json) / [Reagraph](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Canvas-based entity graph rendering to trace connections between suspects, phone numbers, vehicles, and crime scenes.
- **[Leaflet](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json) & [React-Leaflet](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Geospatial mapping of FIR incident locations, crime clusters, and jurisdiction boundaries.
- **[Recharts](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Visualizing temporal crime distributions, risk score distributions, and case closure analytics.
- **[Lucide React](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Vector icon system for tactical dashboard styling.

---

## ⚙️ 2. Backend & Microservices

### Core API Engine
- **[FastAPI](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Provides fast RESTful endpoints with automatic OpenAPI documentation for ML model inference and data pipelines.
- **[Python 3.10+](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Core runtime for machine learning models, text extraction pipelines, and background processing.
- **[Node.js](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Execution runtime for batch ETL scripts, CSV imports, and mock FIR generation pipelines.
- **[Pydantic](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Strict schema validation and data integrity enforcement.

### Document Parsing & Ingestion Pipeline
- **[pdfplumber](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt) & [pdf-parse](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: PDF text extraction for native electronic FIRs.
- **[pytesseract](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt) / [Tesseract.js](file:///c:/Users/ASUS/Desktop/Netra%20ai/package.json)**: Optical Character Recognition (OCR) to convert scanned physical FIR copies and handwritten evidence into structured text.

---

## 🧠 3. Artificial Intelligence & Machine Learning

### Predictive Modeling & Explainability
- **[XGBoost](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Gradient-boosted decision tree algorithm trained to calculate case urgency scores based on parameters like IPC sections, crime severity, repeat offenders, and violence indicators.
- **[scikit-learn](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Feature preprocessing, standard scaling, and baseline evaluation.
- **[SHAP](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt) (SHapley Additive exPlanations)**: Calculates individual feature contributions to ensure AI transparency and trust for law enforcement officers.

### Natural Language Processing & Knowledge Extraction
- **[spaCy](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Rule-based and statistical Named Entity Recognition (NER) to automatically extract suspect names, mobile numbers, Aadhaar/ID numbers, vehicle registration numbers, and addresses.
- **[google-genai](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/requirements.txt)**: Advanced LLM capabilities for Modus Operandi (MO) semantic analysis, complex case summarization, and investigative lead generation.
- **Vector Embeddings**: Generates semantic embeddings for unstructured FIR narratives to identify similar MO patterns across cases.

---

## 🗄️ 4. Data Layer & Storage

- **[Supabase](file:///c:/Users/ASUS/Desktop/Netra%20ai/src/services/db.js) (PostgreSQL)**: Primary relational database hosting relational tables:
  - `cases` (FIR metadata, priority score, status)
  - `entities` (Extracted suspects, victims, phone numbers, vehicles)
  - `links` / `case_entities` (Graph edges connecting entities across multiple FIRs)
  - `alerts` & `audit_logs` (Security and event tracking)
- **Supabase Storage**: Secure object storage for FIR documents, scanned PDFs, and forensic media.
- **Supabase Auth**: Role-Based Access Control (RBAC) supporting Investigating Officers (IO), Station House Officers (SHO), and System Administrators.

---

## ☁️ 5. DevOps & Deployment

- **Frontend Hosting**: **Vercel** (Global CDN, automated edge builds).
- **Backend Hosting**: **Render** (Containerized Docker deployment via `Dockerfile` and `render.yaml`).
- **Containerization**: **Docker** for uniform environment packaging of the Python ML microservices.
- **Repository Management**: **GitHub** for version control, issue tracking, and automated CI pipelines.
