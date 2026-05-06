import { useMemo, useRef, useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAddKeywordsBulk, useRemoveKeyword } from '../../hooks/useKeywords';
import { KEYWORD_LOCATIONS, DEFAULT_LOCATION_CODE, locationLabel } from './keywordLocations';

const MAX_LEN = 80;

// Parses raw textarea input into a list of trimmed, deduped keyword strings.
// Duplicate detection against existing rows happens server-side per (keyword,
// locationCode) pair — here we only dedupe within the batch and trim length.
function parseInput(text) {
  const valid = [];
  const tooLong = [];
  const seen = new Set();
  const chunks = (text || '').split(/[\n,;\t]+/).map((s) => s.trim()).filter(Boolean);
  for (const kw of chunks) {
    if (kw.length > MAX_LEN) {
      tooLong.push(kw);
      continue;
    }
    const lower = kw.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    valid.push(kw);
  }
  return { valid, tooLong };
}

function PillCount({ label, n, tone = 'gray' }) {
  if (!n) return null;
  const palette = {
    gray: 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums ${palette[tone]} font-label`}>
      {n} {label}
    </span>
  );
}

function LocationChip({ code, language, selected, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(code)}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-label border transition-colors ${
        selected
          ? 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary border-brand-primary/40'
          : 'bg-brand-surface-container-low dark:bg-brand-on-surface text-brand-on-surface-variant dark:text-brand-outline border-brand-outline-variant dark:border-brand-outline hover:border-brand-outline'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span>{locationLabel(code, language)}</span>
    </button>
  );
}

function TrackedRow({ item, onRemove, removing }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-brand-outline-variant dark:border-brand-outline hover:border-brand-outline-variant dark:hover:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-sm text-brand-on-surface dark:text-brand-outline-variant truncate">{item.keyword}</span>
        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-label bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline">
          {locationLabel(item.locationCode, item.languageCode)}
        </span>
      </div>
      {confirming ? (
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <button
            onClick={() => {
              onRemove(item);
              setConfirming(false);
            }}
            disabled={removing}
            className="text-[11px] font-medium px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 font-label"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-[11px] font-medium px-2 py-1 rounded text-brand-on-surface-variant hover:text-brand-on-surface dark:hover:text-brand-outline font-label"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          title="Remove keyword"
          className="flex-shrink-0 ml-3 text-brand-outline hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function ManageKeywordsModal({
  isOpen,
  onClose,
  siteId,
  items,
  maxKeywords,
}) {
  const [text, setText] = useState('');
  const [selectedCodes, setSelectedCodes] = useState([DEFAULT_LOCATION_CODE]);
  const [lastResult, setLastResult] = useState(null);
  const textareaRef = useRef(null);

  const addBulk = useAddKeywordsBulk(siteId);
  const removeKw = useRemoveKeyword(siteId);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setSelectedCodes([DEFAULT_LOCATION_CODE]);
      setLastResult(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const parsed = useMemo(() => parseInput(text), [text]);
  const slotsRemaining = Math.max(0, maxKeywords - (items?.length || 0));

  // Existing (keyword, locationCode) pairs — for live duplicate hinting.
  const existingPairs = useMemo(() => {
    const set = new Set();
    for (const it of items || []) {
      set.add(`${(it.keyword || '').toLowerCase()}|${it.locationCode ?? DEFAULT_LOCATION_CODE}`);
    }
    return set;
  }, [items]);

  const selectedLocations = useMemo(
    () => KEYWORD_LOCATIONS.filter((l) => selectedCodes.includes(l.code)),
    [selectedCodes],
  );

  // Project the input × locations cross-product through the duplicate set and slot
  // limit so the user sees an honest preview before submitting.
  const projection = useMemo(() => {
    let newCount = 0;
    let duplicateCount = 0;
    let overLimitCount = 0;
    let slotsLeft = slotsRemaining;
    for (const kw of parsed.valid) {
      for (const loc of selectedLocations) {
        const key = `${kw.toLowerCase()}|${loc.code}`;
        if (existingPairs.has(key)) {
          duplicateCount += 1;
          continue;
        }
        if (slotsLeft <= 0) {
          overLimitCount += 1;
          continue;
        }
        newCount += 1;
        slotsLeft -= 1;
      }
    }
    return { newCount, duplicateCount, overLimitCount };
  }, [parsed.valid, selectedLocations, existingPairs, slotsRemaining]);

  const toggleLocation = (code) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleAdd = () => {
    if (parsed.valid.length === 0 || selectedLocations.length === 0) return;
    addBulk.mutate(
      {
        keywords: parsed.valid,
        locations: selectedLocations.map((l) => ({
          locationCode: l.code,
          languageCode: l.language,
        })),
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setText('');
        },
      },
    );
  };

  const handleRemove = (item) => {
    removeKw.mutate({ keyword: item.keyword, locationCode: item.locationCode ?? DEFAULT_LOCATION_CODE });
  };

  const noLocations = selectedLocations.length === 0;
  const addDisabled = parsed.valid.length === 0 || noLocations || projection.newCount === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Keywords" size="lg">
      <div className="space-y-6">
        {/* Add section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="bulk-keywords" className="text-sm font-semibold font-label text-brand-on-surface dark:text-brand-outline-variant">
              Add keywords
            </label>
            <span className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline tabular-nums font-label">
              {(items?.length || 0)} / {maxKeywords} used · {slotsRemaining} slot{slotsRemaining === 1 ? '' : 's'} left
            </span>
          </div>
          <textarea
            ref={textareaRef}
            id="bulk-keywords"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={addBulk.isPending || slotsRemaining === 0}
            placeholder={
              slotsRemaining === 0
                ? `You've reached the ${maxKeywords}-keyword limit. Remove one below before adding more.`
                : 'hosting deutschland\nvps server germany\nwebhosting berlin, cloud provider berlin'
            }
            rows={6}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-brand-primary-container focus:border-brand-500 focus:outline-none  resize-y disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">
            <span>One per line, or separate with comma / tab / semicolon.</span>
          </div>

          {/* Country multi-select */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold font-label text-brand-on-surface dark:text-brand-outline-variant">
                Countries
              </label>
              <span className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline tabular-nums font-label">
                {selectedLocations.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {KEYWORD_LOCATIONS.map((l) => (
                <LocationChip
                  key={l.code}
                  code={l.code}
                  language={l.language}
                  selected={selectedCodes.includes(l.code)}
                  onToggle={toggleLocation}
                  disabled={addBulk.isPending}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">
              Each keyword is tracked per country. Default is Germany (DE) when nothing is changed here.
            </p>
          </div>

          {/* Projection summary */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">
            {parsed.valid.length > 0 && selectedLocations.length > 0 && (
              <span className="tabular-nums">
                {parsed.valid.length} keyword{parsed.valid.length === 1 ? '' : 's'} × {selectedLocations.length} countr{selectedLocations.length === 1 ? 'y' : 'ies'} ={' '}
                <strong className="text-brand-on-surface dark:text-brand-outline-variant">{projection.newCount}</strong> new
              </span>
            )}
            <PillCount label="duplicate" n={projection.duplicateCount} tone="gray" />
            <PillCount label="over limit" n={projection.overLimitCount} tone="red" />
            <PillCount label="too long" n={parsed.tooLong.length} tone="amber" />
            {noLocations && (
              <span className="text-red-600 dark:text-red-400">Pick at least one country.</span>
            )}
          </div>

          {/* Post-submit summary */}
          {lastResult?.summary && (
            <div className="mt-3 rounded-lg bg-brand-surface-container-low dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline p-3 text-xs font-label">
              <div className="font-medium text-brand-on-surface dark:text-brand-outline-variant mb-1">
                {lastResult.summary.addedCount > 0 ? `${lastResult.summary.addedCount} added` : 'Nothing added'}
                {lastResult.summary.skippedCount > 0 && ` · ${lastResult.summary.skippedCount} skipped`}
              </div>
              {lastResult.skipped?.length > 0 && (
                <ul className="space-y-0.5 text-brand-on-surface-variant dark:text-brand-outline">
                  {lastResult.skipped.slice(0, 8).map((s, i) => (
                    <li key={`${s.keyword}-${s.locationCode || ''}-${i}`} className="flex items-center gap-2">
                      <span className="truncate">{s.keyword || '(empty)'}</span>
                      {s.locationCode && (
                        <span className="text-[10px] text-brand-on-surface-variant dark:text-brand-outline">
                          {locationLabel(s.locationCode)}
                        </span>
                      )}
                      <span className="text-[10px] text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-wider font-label">{s.reason.replace('_', ' ')}</span>
                    </li>
                  ))}
                  {lastResult.skipped.length > 8 && (
                    <li className="text-brand-outline">…and {lastResult.skipped.length - 8} more</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={addBulk.isPending}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              isLoading={addBulk.isPending}
              disabled={addDisabled}
            >
              Add {projection.newCount > 0 ? `${projection.newCount} entr${projection.newCount === 1 ? 'y' : 'ies'}` : 'keywords'}
            </Button>
          </div>
        </section>

        {/* Tracked list */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant">
              Tracked keywords
            </h4>
            <span className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline tabular-nums font-label">
              {(items?.length || 0)}
            </span>
          </div>
          {(!items || items.length === 0) ? (
            <div className="text-xs text-brand-outline dark:text-brand-on-surface-variant text-center py-6 rounded-lg border border-dashed border-brand-outline-variant dark:border-brand-outline font-label">
              No keywords tracked yet. Add some above.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {items.map((it) => (
                <TrackedRow
                  key={`${it.keyword}-${it.locationCode ?? DEFAULT_LOCATION_CODE}`}
                  item={it}
                  onRemove={handleRemove}
                  removing={removeKw.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
