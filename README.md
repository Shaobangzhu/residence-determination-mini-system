# Residency Determination System – Proof of Concept (React + AI)

A **full-stack demo** using **React** and **AI-enhanced decision logic** to simulate a tuition **Residency Determination System (RDS)**.  
The app combines transparent **rules-based evaluation** with **AI-assisted OCR** and natural-language explanations.

---

## 🎯 Project Goal

To demonstrate how **AI and automation** can help assign student residency (in-state vs out-of-state tuition) by:
- Collecting student data and document proofs (lease, utility bill, driver’s license).
- Using **OCR (Tesseract.js)** to extract key text such as addresses and dates.  
- Running transparent rules for **physical presence**, **intent**, and **special categories**.  
- Generating a human-readable **explanation and confidence score**.  
- Storing everything in an auditable, traceable backend.

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | **React 18 + TypeScript (Vite)** | Modern, fast, type-safe UI |
| Backend | **Node.js + Express** | REST API for evaluation and audit |
| Database | **SQLite (via Prisma)** | Lightweight, easy to deploy |
| OCR | **Tesseract.js** | Client-side document text extraction |
| Validation | **Zod + React Hook Form** | Type-safe schema validation |
| API Data | **TanStack Query** | Query caching and mutation |
| UI Library | **Material UI** (MUI) | Consistent, accessible design |

---

## ⚙️ Core Workflow

1. **Student Intake Form**  
   Collect name, DOB, and intended start term.

2. **Document Upload**  
   Drag and drop documents (images/PDF). OCR extracts text, then the app detects addresses and dates.

3. **Residency Evaluation**  
   Backend runs CA-style rules (presence ≥ 366 days, intent, CA DL).  
   Each rule contributes to a **confidence score**.

4. **AI Explanation**  
   The backend or a local template generates a readable summary (“Met presence; two proofs; likely resident”).

5. **Audit Trail**  
   Logs every input, rule fired, and final decision for traceability.

---

## 🗂️ Folder Structure

```
rds-poc/
  frontend/
    src/
      app.tsx
      routes/
        IntakePage.tsx
        UploadPage.tsx
        ReviewPage.tsx
      components/
        IntakeForm.tsx
        DocUploader.tsx
        OcrPreview.tsx
        RuleResults.tsx
        DecisionCard.tsx
        ExplainPanel.tsx
      lib/
        api.ts
        ocr.ts
        parsing.ts
        types.ts

  backend/
    src/
      index.ts
      routes/
        students.ts
        evidence.ts
        decision.ts
        audit.ts
      services/
        rules.ts
        explanation.ts
        db.ts
    prisma/
      schema.prisma
```

---

## ⚖️ Decision Logic (Rule Engine)

### Implemented Rules
| Rule | Description | Weight |
|------|--------------|--------|
| Physical Presence | ≥ 366 days before Residence Determination Date | 0.5 |
| Intent | ≥ 2 independent proofs (lease, utility bill, bank) | 0.35 |
| CA Driver License | Holds a valid CA DL | 0.15 |
| Special Category | Military, refugee, etc. | overrides |

Each rule contributes to a **weighted confidence score**.  
A simple classification applies:
- ≥ 0.7 → **Resident**
- 0.5–0.69 → **Needs More Info**
- < 0.5 → **Nonresident**

---

## 🧠 AI Layer (Optional)

- **LLM integration (OpenAI or Gemini)** for enhanced natural-language explanations.  
- Fallback: a deterministic template-based generator.  

Example output:
> "Result: RESIDENT (confidence 0.82). Positive signals: presence, address, CA DL. Missing: none."

---

## 🗄️ Database Schema (Prisma)

```prisma
model Student {
  id        Int      @id @default(autoincrement())
  name      String
  dob       DateTime
  startTerm String
  evidences Evidence[]
  decisions Decision[]
  audits    AuditLog[]
}

model Evidence {
  id               Int      @id @default(autoincrement())
  studentId        Int
  type             String
  fileUrl          String
  ocrText          String?
  extractedAddress String?
  extractedDates   String?
  Student          Student  @relation(fields: [studentId], references: [id])
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

## 🧩 Key React Components

| Component | Function |
|------------|-----------|
| `IntakeForm` | Collects student info |
| `DocUploader` | Drag & drop file input + OCR trigger |
| `OcrPreview` | Shows raw OCR text and extracted fields |
| `RuleResults` | Table of rule outcomes |
| `DecisionCard` | Displays status, confidence, and AI summary |
| `ExplainPanel` | Textual explanation + audit log link |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/<yourusername>/residency-determination-react.git
cd residency-determination-react

# 2. Frontend setup
cd frontend
npm install
npm run dev

# 3. Backend setup
cd ../backend
npm install
npx prisma migrate dev --name init
npm run dev
```

Visit **http://localhost:5173** for the frontend and **http://localhost:3000** for the API.

---

## 🔐 Governance & Ethics

- **Transparency** – show all rules fired and why.  
- **Traceability** – maintain audit logs of decisions.  
- **Fairness** – exclude sensitive demographic attributes.  
- **Explainability** – every automated decision has a human-readable reason.

---

## 📚 Helpful References

- [Tesseract.js Docs](https://tesseract.projectnaptha.com/)  
- [Prisma ORM](https://www.prisma.io/docs)  
- [React Hook Form + Zod](https://react-hook-form.com/get-started)  
- [Material UI Components](https://mui.com/)  
- [California Residency Requirements](https://www.ucop.edu/residency/residency-requirements.html)

---

## 👨‍💻 Author
**Chaoran Lu**  
Software Engineer | Full-stack React + Express Developer