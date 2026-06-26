#!/usr/bin/env node
/**
 * Step 2 of the historical-import pipeline.
 *
 * Reads the JSON produced by parseFormExcel.js and POSTs each record to the
 * form-submission webhook. Does NO mapping — sends exactly what's in the JSON.
 * Uses Node's built-in global fetch (Node 18+).
 *
 * Usage:
 *   node scripts/sendFormSubmissions.js --in=form-submissions.json \
 *        --secret=<FORM_WEBHOOK_SECRET> [--url=<webhook>] [--delay=2200] \
 *        [--dry-run] [--start=0] [--limit=N]
 *
 * Notes:
 *   - The webhook does NOT dedupe, so re-sending double-imports. Send once.
 *   - If it dies mid-run, resume from the failure log with --start=<index>.
 *   - Prod rate limit is 30/min; default --delay=2200ms stays under it. Raise
 *     FORM_WEBHOOK_RATE_MAX on the server to go faster.
 */
const fs = require('fs');

function arg(name, def) {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  if (hit) return hit.slice(pref.length);
  return process.argv.includes(`--${name}`) ? true : def;
}

const IN = arg('in', 'form-submissions.json');
const SECRET = arg('secret', process.env.FORM_WEBHOOK_SECRET);
const URL = arg('url', 'https://app.sitelyze.io/api/form-submissions/webhook');
const HEADER = String(arg('header', 'x-form-secret')).toLowerCase();
const DELAY = parseInt(arg('delay', '2200'), 10);
const START = parseInt(arg('start', '0'), 10);
const LIMIT = arg('limit') ? parseInt(arg('limit'), 10) : Infinity;
const DRY = !!arg('dry-run', false);

if (!SECRET) {
  console.error('Missing --secret (or set FORM_WEBHOOK_SECRET in the environment).');
  process.exit(1);
}
if (!fs.existsSync(IN)) {
  console.error(`Input not found: ${IN}. Run parseFormExcel.js first.`);
  process.exit(1);
}
if (typeof fetch !== 'function') {
  console.error('Global fetch unavailable — use Node 18+ to run this script.');
  process.exit(1);
}

const all = JSON.parse(fs.readFileSync(IN, 'utf8'));
const end = Number.isFinite(LIMIT) ? START + LIMIT : undefined;
const items = all.slice(START, end);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
let sent = 0;
let ok = 0;
let fail = 0;

(async () => {
  console.log(`Sending ${items.length} of ${all.length} records (start=${START}) → ${URL}${DRY ? '  [DRY-RUN]' : ''}`);

  for (let i = 0; i < items.length; i += 1) {
    const idx = START + i;
    const body = items[i];

    if (DRY) {
      console.log(`[dry] #${idx}  ${body.email || `${body.first_name} ${body.last_name}`.trim() || '(no name)'}  ${body.date || '(no date)'}  type="${body.website_type || ''}"`);
      continue;
    }

    let attempt = 0;
    let done = false;
    while (!done && attempt < 3) {
      attempt += 1;
      try {
        const res = await fetch(URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', [HEADER]: SECRET },
          body: JSON.stringify(body),
        });
        sent += 1;
        if (res.status === 201) {
          ok += 1;
          done = true;
        } else if (res.status === 429) {
          const wait = DELAY * attempt * 2;
          console.warn(`#${idx} 429 rate-limited — backing off ${wait}ms (attempt ${attempt})`);
          await sleep(wait);
        } else {
          const text = await res.text().catch(() => '');
          console.error(`#${idx} HTTP ${res.status}: ${text.slice(0, 200)}`);
          failures.push({ index: idx, status: res.status, body: text.slice(0, 500) });
          fail += 1;
          done = true;
        }
      } catch (e) {
        if (attempt >= 3) {
          console.error(`#${idx} network error (giving up): ${e.message}`);
          failures.push({ index: idx, error: e.message });
          fail += 1;
          done = true;
        } else {
          console.warn(`#${idx} network error: ${e.message} — retrying`);
          await sleep(DELAY * attempt);
        }
      }
    }

    if (i < items.length - 1) await sleep(DELAY);
    if ((i + 1) % 25 === 0) console.log(`… ${i + 1}/${items.length}  (ok=${ok} fail=${fail})`);
  }

  if (failures.length) {
    fs.writeFileSync('send-failures.json', JSON.stringify(failures, null, 2));
    console.log(`\nWrote ${failures.length} failures → send-failures.json (resume with --start=<index>)`);
  }
  console.log(`\nDone. total=${items.length} sent=${sent} ok=${ok} fail=${fail}`);
})();
