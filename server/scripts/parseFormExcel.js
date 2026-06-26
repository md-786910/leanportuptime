#!/usr/bin/env node
/**
 * Step 1 of the historical-import pipeline (no network).
 *
 * Reads one or many CSV / XLSX files, maps each row to the form-submission
 * webhook payload shape, and writes a single JSON array of ready-to-POST
 * records. Review that JSON, then send it with scripts/sendFormSubmissions.js.
 *
 * Usage (single file):
 *   node scripts/parseFormExcel.js --file=./excel/Support.csv --project=<siteId>
 *
 * Usage (whole directory of .csv/.xlsx files, combined into one JSON):
 *   node scripts/parseFormExcel.js --dir=./excel --project=<siteId> \
 *        [--submit-from=live] [--out=form-submissions.json] [--sheet="Sheet1"]
 *
 * website_type:
 *   - taken from the "Auswahlfelder"/type column when that column has a value,
 *   - otherwise derived from the FILE NAME (the category-named exports carry the
 *     category in the filename, not a column). FILENAME_TYPE normalizes the known
 *     German category filenames to the same {token} the live forms send, so the
 *     UI shows the same readable label.
 *
 * Column mapping is auto-detected from the header row (German + English
 * variants). Override in COLUMN_MAP if a column is detected wrong/missing.
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// --- editable overrides: payload field => exact header (blank = auto-detect) ---
const COLUMN_MAP = {
  // firstName:   'Vorname',
  // lastName:    'Nachname',
  // email:       'Emails',
  // telephone:   'Phone Number',
  // description: 'Messages',
  // websiteType: 'Auswahlfelder',
  // date:        'Date',
};

// Auto-detect candidates (compared case-insensitively, trimmed, BOM-stripped).
const AUTODETECT = {
  firstName:   ['first_name', 'firstname', 'first name', 'vorname'],
  lastName:    ['last_name', 'lastname', 'last name', 'nachname', 'surname'],
  email:       ['email', 'e-mail', 'e mail', 'mail', 'emails', 'e_mail'],
  telephone:   ['telephone', 'phone', 'phone number', 'phone-number', 'tel', 'telefon', 'mobile'],
  description: ['description', 'message', 'messages', 'nachricht', 'comment', 'comments', 'enquiry', 'anfrage'],
  websiteType: ['website_type', 'type', 'category', 'auswahlfelder', 'auswahl', 'betreff', 'subject', 'department', 'kategorie'],
  date:        ['date', 'submitted', 'submitted_at', 'created', 'created_at', 'datum', 'timestamp', 'time'],
};

// Normalize category-named files to the {token} the live CF7 forms submit, so
// imported rows show the same label as webhook rows. Keyed by lower-cased file
// base name. Unlisted files fall back to the raw file name.
const FILENAME_TYPE = {
  'antriebssysteme':       '{Antriebssysteme}',
  'fahrzeugvernetzung':    '{Fahrzeugvernetzung}',
  'fertigung und montage': '{Fertigung und Montage}',
  'messtechnik':           '{Messtechnik}',
  'pruftechnik':           '{Prüftechnik}',
  'systemelektronik':      '{Systemelektronik}',
  'wasserstofftechnologie': '{Wasserstofftechnologie}',
};

const FIELDS = Object.keys(AUTODETECT);

function arg(name, def) {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  if (hit) return hit.slice(pref.length);
  return process.argv.includes(`--${name}`) ? true : def;
}

const FILE = arg('file');
const DIR = arg('dir');
const PROJECT_ID = arg('project');
const SUBMIT_FROM = arg('submit-from', 'live');
const OUT = arg('out', 'form-submissions.json');
const SHEET = arg('sheet');

if ((!FILE && !DIR) || !PROJECT_ID) {
  console.error('Usage: node scripts/parseFormExcel.js (--file=<path> | --dir=<folder>) --project=<siteId> [--submit-from=live] [--out=form-submissions.json] [--sheet=Name]');
  process.exit(1);
}

const normalize = (h) => String(h).replace(/^﻿/, '').trim().toLowerCase();

function resolveMapping(headers) {
  const norm = headers.map((h) => ({ raw: h, n: normalize(h) }));
  const map = {};
  for (const field of FIELDS) {
    if (COLUMN_MAP[field]) { map[field] = COLUMN_MAP[field]; continue; }
    const found = norm.find((h) => AUTODETECT[field].includes(h.n));
    if (found) map[field] = found.raw;
  }
  return map;
}

function toTimestamp(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val.toISOString();
  const s = String(val).trim();
  // "YYYY-MM-DD HH:mm[:ss]" → keep the wall-clock exactly (no TZ conversion),
  // just ISO-ify the separator. Avoids the script machine's timezone shifting
  // the historical timestamps.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
  if (m) return `${m[1]}T${m[2]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Read a CSV (utf8, raw strings — no date/number coercion, preserves umlauts,
// full timestamps and leading-zero phone numbers) or XLSX into row objects.
function readRows(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.csv') {
    const wb = XLSX.read(fs.readFileSync(file, 'utf8'), { type: 'string', raw: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return ws ? XLSX.utils.sheet_to_json(ws, { raw: true, defval: '' }) : [];
  }
  const wb = XLSX.readFile(file, { cellDates: true });
  const sheetName = SHEET && wb.Sheets[SHEET] ? SHEET : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
}

function fileType(file) {
  const base = path.basename(file, path.extname(file));
  return FILENAME_TYPE[base.trim().toLowerCase()] || base.trim();
}

function listFiles() {
  if (FILE) return [FILE];
  return fs.readdirSync(DIR)
    .filter((f) => /\.(csv|xlsx|xls)$/i.test(f) && !f.startsWith('~$'))
    .map((f) => path.join(DIR, f))
    .sort();
}

const files = listFiles();
if (!files.length) {
  console.error(DIR ? `No .csv/.xlsx files found in ${DIR}` : `File not found: ${FILE}`);
  process.exit(1);
}

const out = [];
let totalRows = 0;
let totalSkipped = 0;

for (const file of files) {
  if (!fs.existsSync(file)) { console.warn(`Skipping missing file: ${file}`); continue; }
  const rows = readRows(file);
  if (!rows.length) { console.warn(`No rows in ${path.basename(file)} — skipped`); continue; }

  const headers = Object.keys(rows[0]);
  const mapping = resolveMapping(headers);
  const fileTypeLabel = fileType(file);
  let mapped = 0;
  let skipped = 0;

  rows.forEach((row, i) => {
    const get = (field) => (mapping[field] ? String(row[mapping[field]] ?? '').trim() : '');
    const first = get('firstName');
    const last = get('lastName');
    const email = get('email');
    if (!email && !first && !last) { skipped += 1; return; }

    // website_type: column value if present, else the (normalized) filename.
    const colType = get('websiteType');
    const websiteType = colType || fileTypeLabel;

    const dateIso = mapping.date ? toTimestamp(row[mapping.date]) : null;

    const payload = {
      project_id: PROJECT_ID,
      submit_from: SUBMIT_FROM,
      first_name: first,
      last_name: last,
      email,
      telephone: get('telephone'),
      description: get('description'),
      website_type: websiteType,
      imported: true,
      _source_file: path.basename(file),
      _source_row: i + 2, // 1-based + header row
      _source: row,       // every original column (webhook stores full body)
    };
    if (dateIso) payload.date = dateIso;

    out.push(payload);
    mapped += 1;
  });

  totalRows += rows.length;
  totalSkipped += skipped;
  console.log(`${path.basename(file).padEnd(28)} rows=${String(rows.length).padStart(4)}  mapped=${String(mapped).padStart(4)}  skipped=${skipped}  type→"${fileTypeLabel}"  map=${JSON.stringify(mapping)}`);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log(`\nSummary: files=${files.length}  totalRows=${totalRows}  mapped=${out.length}  skipped=${totalSkipped}`);
console.log('Preview (first 2):');
console.log(JSON.stringify(out.slice(0, 2), null, 2));
console.log(`\n✔ Wrote ${out.length} records → ${path.resolve(OUT)}`);
console.log(`Next: node scripts/sendFormSubmissions.js --in=${OUT} --secret=<FORM_WEBHOOK_SECRET> --dry-run`);
