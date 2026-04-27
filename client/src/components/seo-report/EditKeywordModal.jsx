import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useKeywordManualOverride } from '../../hooks/useKeywords';

const FIELDS = [
  { key: 'position', label: 'Position', hint: 'SERP position (1 = top). Leave blank for Not ranked.' },
  { key: 'url', label: 'URL', hint: 'Landing page URL for this keyword', type: 'text' },
  { key: 'searchVolume', label: 'Search Volume', hint: 'Average monthly searches' },
  { key: 'keywordDifficulty', label: 'Keyword Difficulty', hint: '0 – 100 (higher = harder)' },
  { key: 'cpc', label: 'CPC', hint: 'Cost-per-click in USD' },
];

function toInput(v) {
  return v == null ? '' : String(v);
}

export default function EditKeywordModal({ isOpen, onClose, siteId, item }) {
  const override = useKeywordManualOverride(siteId);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !item) return;
    setForm({
      position: toInput(item.position),
      url: item.url || '',
      searchVolume: toInput(item.searchVolume),
      keywordDifficulty: toInput(item.keywordDifficulty),
      cpc: toInput(item.cpc),
    });
    setErrors({});
  }, [isOpen, item]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    const nextErrors = {};

    for (const { key, type } of FIELDS) {
      const raw = form[key];
      if (raw === undefined) continue;

      if (type === 'text') {
        // string fields: empty string → null
        if (raw !== (item?.[key] ?? '')) payload[key] = raw === '' ? null : raw;
        continue;
      }
      // numeric fields
      if (raw === '' || raw == null) {
        if ((item?.[key] ?? null) !== null) payload[key] = null;
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        nextErrors[key] = 'Must be a number';
        continue;
      }
      if (n !== (item?.[key] ?? null)) payload[key] = n;
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }
    await override.mutateAsync({ keyword: item.keyword, payload });
    onClose();
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit "${item.keyword}"`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[11px] text-brand-outline dark:text-brand-on-surface-variant font-label">
          Manual edits are logged. Changing Position snapshots the previous value so the delta column reflects the change.
        </p>
        {FIELDS.map(({ key, label, hint, type }) => (
          <div key={key} className="space-y-1">
            <Input
              label={label}
              id={`kw-${key}`}
              type={type || 'number'}
              inputMode={type === 'text' ? undefined : 'decimal'}
              value={form[key] ?? ''}
              onChange={update(key)}
              error={errors[key]}
            />
            <p className="text-[11px] text-brand-outline dark:text-brand-on-surface-variant font-label">{hint}</p>
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={override.isPending}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
