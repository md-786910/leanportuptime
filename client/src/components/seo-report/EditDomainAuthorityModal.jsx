import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useBacklinksManualOverride } from '../../hooks/useBacklinks';

const FIELDS = [
  { key: 'domainRank', label: 'Domain Authority', hint: 'Provider score (higher is better)' },
  { key: 'backlinksCount', label: 'Backlinks (total)', hint: 'Total inbound links' },
  { key: 'referringDomains', label: 'Ref. Domains', hint: 'Unique referring domains' },
  { key: 'newLinksLast30d', label: 'New Links', hint: 'New links in the selected window' },
  { key: 'lostLinksLast30d', label: 'Lost Links', hint: 'Lost links in the selected window' },
];

function toInput(v) {
  return v == null ? '' : String(v);
}

export default function EditDomainAuthorityModal({ isOpen, onClose, siteId, current }) {
  const override = useBacklinksManualOverride(siteId);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      domainRank: toInput(current?.domainRank),
      backlinksCount: toInput(current?.backlinksCount),
      referringDomains: toInput(current?.referringDomains),
      newLinksLast30d: toInput(current?.newLinksLast30d),
      lostLinksLast30d: toInput(current?.lostLinksLast30d),
    });
    setErrors({});
  }, [isOpen, current]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    const nextErrors = {};
    for (const { key } of FIELDS) {
      const raw = form[key];
      if (raw === '' || raw == null) continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        nextErrors[key] = 'Must be a number';
        continue;
      }
      payload[key] = n;
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (Object.keys(payload).length === 0) {
      setErrors({ _form: 'Update at least one field' });
      return;
    }
    await override.mutateAsync(payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Domain Authority stats" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[11px] text-brand-outline dark:text-brand-on-surface-variant font-label">
          Leave a field blank to keep its current value. Manual edits are logged; the next API refresh may overwrite them.
        </p>
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="space-y-1">
            <Input
              label={label}
              id={`da-${key}`}
              type="number"
              inputMode="numeric"
              value={form[key] ?? ''}
              onChange={update(key)}
              error={errors[key]}
              placeholder={toInput(current?.[key])}
            />
            <p className="text-[11px] text-brand-outline dark:text-brand-on-surface-variant font-label">{hint}</p>
          </div>
        ))}
        {errors._form && (
          <p className="text-xs text-red-500 dark:text-red-400 font-label">{errors._form}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={override.isPending}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
