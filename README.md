# Residency Determination System – Proof of Concept (Angular + AI)

A **full-stack demo** showing how AI can assist with **tuition residency determination** by combining transparent **rules-based evaluation** with **AI-powered document understanding and explanations**.

---

## 🎯 Project Goal

To demonstrate an **AI-assisted residency determination workflow** that:
- Evaluates student eligibility for *in-state tuition* using California residency rules.  
- Uses OCR to extract key data from uploaded documents (lease, utility bill, driver’s license).  
- Generates a clear, human-readable explanation of the decision and supporting evidence.  
- Logs every action for transparency and auditability.

---

## 🧱 System Architecture

| Layer | Technology | Key Role |
|-------|-------------|----------|
| Frontend | **Angular 18** | Multi-page web app (Intake → Upload → Review → Decision). |
| Backend | **NestJS (Express)** | REST API endpoints for OCR, rule evaluation, and audit logging. |
| AI/OCR | **Tesseract.js** | In-browser OCR to extract text, addresses, and dates from images/PDFs. |
| Database | **SQLite + Prisma** | Stores students, extracted fields, rules fired, decisions, and audit logs. |

---

## 🧩 Frontend Overview

### Pages & Components
1. **`student-intake`** – Collects student info and intended start term.  
2. **`doc-upload`** – Drag-and-drop zone; runs client-side OCR and extraction.  
3. **`review-panel`** – Displays parsed evidence and rule-based evaluation.  
4. **`decision-explanation`** – Shows AI-generated summary and confidence score.  
5. *(Optional)* **Ask AI Side Panel** – Conversational summary of decision rationale.

---

## ⚖️ Rules + AI Hybrid Decisioning

### 1. Rule Layer (Transparent)
Implements California tuition-residency factors ([UC Office of the President](https://www.ucop.edu/residency/residency-requirements.html)):
- **Physical presence:** ≥ 366 days before the residence determination date.  
- **Intent:** CA address, voter registration, driver’s license, etc.  
- **Financial independence:** Applicable to under-24 students.  
- **Dependency & minor rules.**  
- **Special categories:** Military, dependent minors, refugees, etc.  

Each rule contributes to a **confidence score** and **reason list**.

### 2. AI Layer (Assistive)
- Extracts **dates** and **addresses** from OCR text.  
- Generates **plain-English explanations**, e.g.  
  > “Met 366-day presence; 2 proofs at CA address; no conflicting indicators.”  
- Flags **missing or conflicting evidence**, e.g.  
  > “No proof of physical presence before RDD.”

---

## 📂 API Endpoints (NestJS)

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/ocr` | `POST` | Runs Tesseract OCR and returns extracted text. |
| `/api/ingest` | `POST` | Saves student data and extracted fields. |
| `/api/decision` | `POST` | Applies rule logic + AI explanation; returns decision object. |
| `/api/audit` | `GET` | Retrieves audit logs for review. |

---

## 🗄️ Data Model (Prisma)

```prisma
model Student {
  id           Int      @id @default(autoincrement())
  name         String
  dob          DateTime
  startTerm    String
  evidences    Evidence[]
  decisions    Decision[]
  auditLogs    AuditLog[]
}

model Evidence {
  id              Int      @id @default(autoincrement())
  studentId       Int
  type            String
  fileUrl         String
  ocrText         String?
  extractedAddress String?
  extractedDates  String?
  Student         Student  @relation(fields: [studentId], references: [id])
}

model Decision {
  id          Int      @id @default(autoincrement())
  studentId   Int
  status      String   // resident | nonresident | needs-more-info
  ruleReasons Json
  aiSummary   String
  confidence  Float
  createdAt   DateTime @default(now())
  Student     Student  @relation(fields: [studentId], references: [id])
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  studentId   Int
  eventType   String
  payloadJSON Json
  timestamp   DateTime @default(now())
  Student     Student  @relation(fields: [studentId], references: [id])
}
```

---

## ⚙️ Setup Instructions

```bash
# 1. Clone
git clone https://github.com/<yourusername>/residency-determination-poc.git
cd residency-determination-poc

# 2. Install dependencies
npm install

# 3. Run backend (NestJS)
cd apps/api
npm run start:dev

# 4. Run frontend (Angular)
cd ../web
npm start
```

---

## 💡 Demo Workflow

1. Fill out student intake form.  
2. Upload residency proof documents (e.g., lease, utility bill).  
3. View OCR-extracted data and rule evaluation results.  
4. Click **Evaluate** to generate decision, reasons, and AI explanation.  
5. Inspect audit trail and downloadable JSON log.

---

## 🔐 Governance & Ethics

- **Transparency:** Display which rules fired and why.  
- **Traceability:** Maintain a full audit log of inputs and outcomes.  
- **Fairness:** Exclude sensitive or protected attributes from decision logic.  
- **Explainability:** Provide a clear English summary for every automated decision.

---

## 📚 Helpful References

- [UC Residency Requirements](https://www.ucop.edu/residency/residency-requirements.html)  
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)  
- [Angular AI Integration Guide](https://angular.dev/guide/ai)  
- [NestJS + Prisma Tutorial](https://docs.nestjs.com/recipes/prisma)

---

## 🧑‍💻 Author
**Chaoran Lu** – Software Engineer | Full-stack AI & MERN/MEAN Developer