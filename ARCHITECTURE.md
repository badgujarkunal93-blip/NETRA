# 🏛️ NETRA / VAJRA-X21 System Architecture

This document provides a comprehensive technical overview and visual architecture diagram of the **NETRA (VAJRA-X21)** intelligence and investigative platform.

---

## 📊 End-to-End Architecture Diagram

```mermaid
flowchart TD
    %% Styling Definitions
    classDef userLayer fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef frontendLayer fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef gatewayLayer fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef aimlLayer fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef dataLayer fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#7c2d12;

    %% 1. User Layer
    subgraph USER_LAYER["👤 1. USER & INVESTIGATOR LAYER"]
        User["Law Enforcement / Investigator<br/>• Search Cases & FIR Records<br/>• Cross-Case Network & MO Exploration<br/>• Review Risk Alerts & Evidence Reports"]
    end
    class USER_LAYER,User userLayer;

    %% 2. Application Frontend Layer
    subgraph APP_LAYER["💻 2. APPLICATION LAYER (React + Vite)"]
        UI_Dash["Dashboard & Case Search<br/>(Tailwind CSS, Lucide Icons, Recharts)"]
        UI_Graph["Knowledge Graph Visualization<br/>(React Flow / Reagraph)"]
        UI_Map["Geospatial GIS Mapping<br/>(Leaflet & React-Leaflet)"]
        UI_OCR["Document / FIR Ingestion UI<br/>(Tesseract OCR / PDF Parser)"]
    end
    class APP_LAYER,UI_Dash,UI_Graph,UI_Map,UI_OCR frontendLayer;

    %% 3. API Gateway & Backend
    subgraph GATEWAY_LAYER["⚡ 3. API GATEWAY & BACKEND (FastAPI / Node.js)"]
        FastAPI["FastAPI REST Server<br/>(Uvicorn, REST Endpoints, Routing)"]
        AuthService["Auth & Security Manager<br/>(Supabase Auth, JWT Verification)"]
        IngestionService["FIR Pipeline & Extraction Handler<br/>(pdfplumber, pytesseract, regex)"]
    end
    class GATEWAY_LAYER,FastAPI,AuthService,IngestionService gatewayLayer;

    %% 4. AI / ML & Graph Processing Engine
    subgraph AI_GRAPH_LAYER["🧠 4. AI / ML & GRAPH ENGINE"]
        XGBoost["XGBoost Classifier<br/>(Priority Scoring & Urgency Ranking)"]
        SHAP["SHAP Explainability Engine<br/>(Feature Attribution & Factor Analysis)"]
        NLP["spaCy / GenAI Engine<br/>(NER, Suspect/Entity Extraction, MO Analysis)"]
        KG["Graph Engine<br/>(Entity Disambiguation, Link Prediction & Relationship Matching)"]
    end
    class AI_GRAPH_LAYER,XGBoost,SHAP,NLP,KG aimlLayer;

    %% 5. Persistence & Data Layer
    subgraph DATA_LAYER["🗄️ 5. DATA & STORAGE LAYER (Supabase / PostgreSQL)"]
        PostgresDB[("Supabase PostgreSQL DB<br/>• FIRs, Cases, Entities & Links<br/>• System Logs & Audit Trails")]
        VectorStore[("Vector Embeddings & Semantic Index<br/>• Modus Operandi (MO) Similarity")]
        Storage[("Evidence & File Storage<br/>• Scanned Documents, PDFs, Images")]
    end
    class DATA_LAYER,PostgresDB,VectorStore,Storage dataLayer;

    %% Data Flow Connections
    User <-->|HTTPS / Interactive UI| APP_LAYER
    
    APP_LAYER <-->|REST API Calls| FastAPI
    APP_LAYER <-->|Direct Client SDK Queries| PostgresDB

    FastAPI <--> AuthService
    FastAPI --> IngestionService
    
    IngestionService --> NLP
    FastAPI <--> XGBoost
    FastAPI <--> SHAP
    FastAPI <--> KG

    NLP --> PostgresDB
    XGBoost --> PostgresDB
    KG <--> PostgresDB
    KG <--> VectorStore
    IngestionService --> Storage
```

---

## 🛠️ Layer Breakdown & Tech Stack

### 1. Frontend Layer
* **Framework**: React 19, Vite
* **Styling**: Tailwind CSS, PostCSS
* **Visualizations**: React Flow, Reagraph (Graph visualization), Leaflet / React-Leaflet (GIS Mapping), Recharts (Analytics & Charts)
* **Icons & Assets**: Lucide React

### 2. Backend & Gateway Layer
* **API Framework**: FastAPI (Python 3.10+) with Uvicorn ASGI server
* **Data Ingestion**: Node.js pipeline scripts (`run_pipeline.js`, `compute_ai_outputs.js`), `pdfplumber`, `pytesseract`
* **Authentication**: Supabase Auth (JWT-based role access)

### 3. AI / ML & Graph Intelligence Engine
* **Risk & Urgency Scoring**: XGBoost classifier + scikit-learn
* **Model Explainability**: SHAP (SHapley Additive exPlanations)
* **Natural Language Processing (NLP)**: spaCy, Google Gemini AI (GenAI), regex tokenizers for NER (names, phones, vehicles, addresses)
* **Link Prediction & Knowledge Graph**: Relational entity linking across multi-case FIRs

### 4. Database & Storage Layer
* **Primary Database**: Supabase PostgreSQL with relational schemas (`cases`, `entities`, `links`, `alerts`, `audit_logs`)
* **Vector & Text Search**: Semantic similarity embeddings for MO pattern matching
* **Storage**: Supabase Storage Buckets for FIR PDFs, scanned evidence, and media

---

## 🎯 Key Use Cases Supported

1. **Cross-Case Network Analysis**: Identifying recurring suspects, phone numbers, bank accounts, and vehicles across multiple FIRs.
2. **Modus Operandi (MO) Pattern Discovery**: Detecting patterns in criminal behavior, tools used, and target locations to link seemingly independent crimes.
3. **Anomaly & Risk Detection**: Highlighting unusual activity, severe offenses, and prioritizing cases requiring immediate investigative action.
4. **Investigator Intelligence**: Generating actionable leads, timeline reconstructions, and explainable AI insights for accelerated decision-making.
5. **Evidence Management**: Centralized, secure storage of digital evidence with traceability and audit logs.
