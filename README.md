# Egy Mac — Industrial B2B Platform

Full-stack monorepo for **Egy Mac (إيجي ماك)** — complete concrete block production lines, precision industrial molds, and mechanical engineering services.

**Tagline:** *German Technology, Egyptian Might*

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 6, Tailwind CSS, React Router |
| Backend | Node.js, Express 4 |
| PDF export | Puppeteer (headless Chromium) |
| Data | JSON files in `backend/data/` |

---

## Quick start

### 1. Install dependencies

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Run dev servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Website & admin | http://localhost:5173 |
| API | http://localhost:5001 |
| Health check | http://localhost:5001/api/health |

The frontend proxies `/api` to the backend during development (see `frontend/vite.config.js`).

### 3. Admin dashboard

Open **http://localhost:5173/admin**

Default admin key: `egymac-admin-dev`  
Send it on every admin request as header: `X-Admin-Key: egymac-admin-dev`

---

## Project structure

```
egymac/
├── frontend/
│   ├── public/logo.png          Brand logo
│   └── src/
│       ├── pages/               Home, Catalog, Admin
│       ├── components/admin/    Free-form quote generator, catalog CRUD, etc.
│       ├── styles/              freeFormQuote.print.css (preview + PDF styles)
│       └── api/client.js        API client
├── backend/
│   ├── server.js                Express entry
│   ├── routes/                  API routers
│   ├── utils/
│   │   ├── freeFormQuoteHtml.js Puppeteer HTML (mirrors live preview)
│   │   └── generateFreeFormQuotePdf.js
│   ├── assets/logo.png          Optimized logo for PDF embedding
│   └── data/                    JSON persistence
├── shared/brandColors.js        Shared brand tokens (#3b767c)
└── package.json                 Root scripts (concurrently)
```

---

## Features

### Public website

- Bilingual (EN / AR) homepage with Hero, About, catalog CTA
- **Digital catalog** — production lines & molds with filters
- **RFQ modal** — inquiry submissions stored in JSON

### Admin dashboard

| Tab | Description |
|-----|-------------|
| Text Manager | Edit bilingual homepage copy |
| Catalog CRUD | Production lines & molds |
| Inquiries Inbox | View RFQ submissions |
| **Price Offers** | Free-form B2B quotation generator |

### Free-form Price Offer Generator

The main quotation workflow:

1. **Edit** — client, greeting, technical specs, commercial terms, signatures, footer (fully dynamic)
2. **Live Official Preview** — WYSIWYG document with brand styling
3. **Smart Print Optimizer** — Compact (1 page) or Spanned (multi-page)
4. **Download PDF** — server-side Puppeteer render (native Arabic RTL + `#3b767c` brand color)

**PDF pipeline**

```
Admin UI → POST /api/quotations/generate-pdf → Puppeteer
         → same HTML/CSS as live preview → A4 PDF download
```

Key files:

- `frontend/src/components/admin/FreeFormQuotePreview.jsx` — live preview
- `frontend/src/styles/freeFormQuote.print.css` — shared document styles
- `backend/utils/freeFormQuoteHtml.js` — HTML builder for PDF
- `frontend/src/utils/generateOfferPdf.js` — download helper

---

## Brand & typography (documents)

| Token | Value |
|-------|-------|
| Primary | `#3b767c` |
| Primary dark | `#2e6569` |
| Primary light | `#e9f3f4` |
| Arabic font | **Cairo** |
| English font | **Poppins** |
| Phone | `+201228004646` |

---

## API reference

Base URL: `http://localhost:5001`

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/catalog` | Production lines + molds (`?facet=`, `?search=`) |
| GET | `/api/site-texts` | Homepage copy |
| POST | `/api/inquiries` | Submit RFQ |

### Admin (requires `X-Admin-Key`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/site-texts` | Manage homepage text |
| CRUD | `/api/catalog/production-lines` | Production lines |
| CRUD | `/api/catalog/molds` | Molds |
| GET | `/api/inquiries` | List inquiries |
| GET | `/api/quotations` | List saved free-form offers |
| GET | `/api/quotations/template` | Empty quote scaffold |
| GET | `/api/quotations/:id` | Load archived offer |
| POST | `/api/quotations/save` | Save / update offer |
| **POST** | **`/api/quotations/generate-pdf`** | **Generate PDF** `{ quote, printMode }` |
| DELETE | `/api/quotations/:id` | Delete archived offer |

### Legacy quotation tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quotation/parse` | Upload PDF → editable form |
| POST | `/api/quotation/generate` | Generate PDF via pdfkit |
| GET | `/api/quotation/template` | Legacy template |

---

## Scripts

```bash
npm run dev              # Frontend + backend (concurrently)
npm run dev:frontend     # Vite only
npm run dev:backend      # Express with --watch
npm run build            # Production frontend → frontend/dist
npm start                # Production backend
```

---

## Production

```bash
npm run build
npm start
```

Serve `frontend/dist` with any static host (nginx, Vercel, etc.) and point `/api` to the Express server on port `5001` (or set `PORT`).

---

## Troubleshooting

### `Failed running 'server.js'` / port in use

Another process is holding port **5001**:

```bash
lsof -i :5001
kill -9 <PID>
npm run dev
```

Or run the backend on another port:

```bash
PORT=5002 npm run dev --prefix backend
```

Update the Vite proxy target in `frontend/vite.config.js` if needed.

### PDF download fails or looks wrong

- Ensure the **backend is running** (PDF is generated server-side, not in the browser)
- Hard refresh the admin page (`Cmd+Shift+R`)
- Check `backend/assets/logo.png` exists (copied from `frontend/public/logo.png`)

### Arabic text broken in PDF

The free-form offer uses **Puppeteer + Chromium** with Cairo font and proper RTL — not client-side canvas capture. If Arabic looks wrong, confirm you are using **Price Offers → Download PDF**, not the legacy quotation generator.

---

## Data files

| File | Contents |
|------|----------|
| `productionLines.json` | Production line catalog |
| `molds.json` | Mold catalog |
| `texts.json` | Bilingual site copy |
| `inquiries.json` | RFQ submissions |
| `saved_quotes.json` | Archived free-form price offers |
| `quotations.json` | Legacy quotation history |

---

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Backend listen port |

Admin key is configured in backend middleware (`egymac-admin-dev` for local dev).

---

© **Egy Mac Machine** — Production Lines & Precision Molds · Egypt
# egymac
# egymac
