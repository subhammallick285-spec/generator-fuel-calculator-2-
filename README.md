# Generator Fuel Calculator

A serverless web application for recording generator fuel consumption from field screenshots, with AI-powered OCR extraction and an admin approval workflow.

**🔗 Live demo:** https://generator-fuel-calculator-2.balancecalc.workers.dev  
**📱 Admin panel:** `/admin.html` (requires admin key)  
**✉️ Contact:** subhammallick285@gmail.com

---

## The problem

Field engineers record generator meter readings manually — kWh, hour-meter (HMR), diesel filled, and remaining balance. Transcribing these into spreadsheets causes delays and transcription errors.

## The solution

A single web app where a technician photographs the meter, the system extracts the values with AI, and the admin approves before the record is written to the database.

## Features

- 📸 **Screenshot OCR** via Llama 3.2 11B Vision
- ✂️ **Automatic image cropping** — tall phone screenshots are cropped to the relevant band before OCR
- ✅ **Admin approval flow** — every field reading goes through a pending → approve/reject workflow
- 🔐 **Session-based admin gate** — key validated server-side, no credentials in the client
- 📊 **Site management** — search, load, edit, and update site records
- 💾 **Persistent storage** on Cloudflare D1 with foreign-key integrity between `sites` and `readings`

## Architecture

```
┌────────────────┐         ┌─────────────────┐       ┌──────────────┐
│  Browser       │────────▶│ Cloudflare      │──────▶│  D1 Database │
│  (admin.html)  │         │ Worker (edge)   │       │  (SQLite)    │
│  (Admin.js)    │         │                 │       └──────────────┘
└────────────────┘         │  + Workers AI   │
                           │  (Llama Vision) │
                           └─────────────────┘
```

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | HTML5, CSS3, Vanilla JavaScript (ES2020) |
| Backend | Cloudflare Workers (serverless edge) |
| Database | Cloudflare D1 (SQLite at the edge) |
| AI / OCR | Cloudflare Workers AI — Llama 3.2 11B Vision |
| Auth | Header-based admin key + session storage |
| Deploy | GitHub → Cloudflare CI |

## Database schema

```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL UNIQUE,
  date_of_filling TEXT,
  model TEXT NOT NULL,
  current_hmr REAL,
  current_kwh REAL,
  current_balance REAL,
  last_updated TEXT,
  screenshot_url TEXT,
  data_source TEXT
);

CREATE TABLE readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  hmr REAL,
  kwh REAL,
  balance REAL,
  reading_date TEXT NOT NULL,
  screenshot_url TEXT,
  source TEXT DEFAULT 'ocr',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id)
);
```

## Chart rule (calculation logic)

The lookup table treats each printed range as inclusive of both endpoints. At an exact shared boundary (e.g. X = 1.6), JavaScript matches the earlier row first. If you want exact boundaries to belong to the next row, adjust the lookup rule in `functions/api/calculate.js` before publishing.

## Models supported

- Eicher 10 KVA
- Eicher 20 KVA
- KOEL 20 KVA
- Mahindra 10 KVA
- Mahindra 20 KVA

## Running locally

```bash
git clone https://github.com/subhammallick285-spec/generator-fuel-calculator-2-.git
cd generator-fuel-calculator-2-
npm install -g wrangler
wrangler login
wrangler dev
```

Then open `http://localhost:8787/admin.html`.

## Environment / secrets

Configure in Cloudflare dashboard → Workers → Settings → Variables:

- `ADMIN_KEY` — admin passphrase (secret)
- `CLOUDFLARE_API_TOKEN` — for the Llama agreement endpoint (secret)
- `DB` — D1 binding (in `wrangler.toml`)
- `AI` — Workers AI binding (in `wrangler.toml`)

## Roadmap

- [ ] Multi-user roles (admin / technician)
- [ ] CSV export of site history
- [ ] Email notifications on new pending approvals
- [ ] Historical charts per site

## Author

**Subham Mallick** — Full-Stack Developer  
📍 Kendujhar, Odisha, India  
📧 subhammallick285@gmail.com  
🔗 [github.com/subhammallick285-spec](https://github.com/subhammallick285-spec)

## License

MIT — free to use, modify, and learn from.
