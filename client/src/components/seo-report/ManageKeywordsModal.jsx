import { useMemo, useRef, useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAddKeywordsBulk, useRemoveKeyword } from '../../hooks/useKeywords';

const MAX_LEN = 80;

function parseBulk(text, existing, maxKeywords) {
  const existingSet = new Set((existing || []).map((k) => k.toLowerCase()));
  const valid = [];
  const duplicates = [];
  const tooLong = [];
  const overLimit = [];
  const seen = new Set();
  let slotsLeft = maxKeywords - existing.length;

  const chunks = (text || '').split(/[\n,;\t]+/).map((s) => s.trim()).filter(Boolean);
  for (const kw of chunks) {
    if (kw.length > MAX_LEN) {
      tooLong.push(kw);
      continue;
    }
    const lower = kw.toLowerCase();
    if (existingSet.has(lower) || seen.has(lower)) {
      duplicates.push(kw);
      continue;
    }
    if (slotsLeft <= 0) {
      overLimit.push(kw);
      continue;
    }
    seen.add(lower);
    valid.push(kw);
    slotsLeft -= 1;
  }
  return { valid, duplicates, tooLong, overLimit };
}

function PillCount({ label, n, tone = 'gray' }) {
  if (!n) return null;
  const palette = {
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums ${palette[tone]}`}>
      {n} {label}
    </span>
  );
}

function TrackedRow({ keyword, onRemove, removing }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
      <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{keyword}</span>
      {confirming ? (
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <button
            onClick={() => {
              onRemove(keyword);
              setConfirming(false);
            }}
            disabled={removing}
            className="text-[11px] font-medium px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-[11px] font-medium px-2 py-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          title="Remove keyword"
          className="flex-shrink-0 ml-3 text-gray-400 hover:text-red-500 transition-colors"
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
  const [lastResult, setLastResult] = useState(null);
  const textareaRef = useRef(null);

  const addBulk = useAddKeywordsBulk(siteId);
  const removeKw = useRemoveKeyword(siteId);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setLastResult(null);
      // focus textarea on open
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const existingKeywords = useMemo(() => (items || []).map((it) => it.keyword), [items]);
  const parsed = useMemo(() => parseBulk(text, existingKeywords, maxKeywords), [text, existingKeywords, maxKeywords]);

  const slotsRemaining = Math.max(0, maxKeywords - existingKeywords.length);

  const handleAdd = () => {
    if (parsed.valid.length === 0) return;
    addBulk.mutate(parsed.valid, {
      onSuccess: (data) => {
        setLastResult(data);
        setText('');
      },
    });
  };

  const handleRemove = (keyword) => {
    removeKw.mutate(keyword);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Keywords" size="lg">
      <div className="space-y-6">
        {/* Add section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="bulk-keywords" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Add keywords
            </label>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
              {existingKeywords.length} / {maxKeywords} used · {slotsRemaining} slot{slotsRemaining === 1 ? '' : 's'} left
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
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none font-mono resize-y disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span>One per line, or separate with comma / tab / semicolon.</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <PillCount label="valid" n={parsed.valid.length} tone="emerald" />
            <PillCount label="duplicate" n={parsed.duplicates.length} tone="gray" />
            <PillCount label="too long" n={parsed.tooLong.length} tone="amber" />
            <PillCount label="over limit" n={parsed.overLimit.length} tone="red" />
          </div>

          {/* Post-submit summary */}
          {lastResult?.summary && (
            <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3 text-xs">
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                {lastResult.summary.addedCount > 0 ? `${lastResult.summary.addedCount} added` : 'Nothing added'}
                {lastResult.summary.skippedCount > 0 && ` · ${lastResult.summary.skippedCount} skipped`}
              </div>
              {lastResult.skipped?.length > 0 && (
                <ul className="space-y-0.5 text-gray-500 dark:text-gray-400">
                  {lastResult.skipped.slice(0, 8).map((s, i) => (
                    <li key={`${s.keyword}-${i}`} className="flex items-center gap-2">
                      <span className="truncate">{s.keyword || '(empty)'}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{s.reason.replace('_', ' ')}</span>
                    </li>
                  ))}
                  {lastResult.skipped.length > 8 && (
                    <li className="text-gray-400">…and {lastResult.skipped.length - 8} more</li>
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
              disabled={parsed.valid.length === 0}
            >
              Add {parsed.valid.length > 0 ? `${parsed.valid.length} keyword${parsed.valid.length === 1 ? '' : 's'}` : 'keywords'}
            </Button>
          </div>
        </section>

        {/* Tracked list */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Tracked keywords
            </h4>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
              {existingKeywords.length}
            </span>
          </div>
          {existingKeywords.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-6 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              No keywords tracked yet. Add some above.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {existingKeywords.map((kw) => (
                <TrackedRow
                  key={kw}
                  keyword={kw}
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
