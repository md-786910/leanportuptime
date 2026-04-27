import { useState, useEffect, useMemo, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useBacklinksManualOverride } from '../../hooks/useBacklinks';

const SNAPSHOT_FIELDS = [
  { key: 'domainRank', label: 'Domain Authority', placeholder: 'e.g. 26' },
  { key: 'backlinksCount', label: 'Backlinks (total)', placeholder: 'e.g. 784' },
  { key: 'referringDomains', label: 'Ref. Domains', placeholder: 'e.g. 215' },
];

const ACTIVITY_FIELDS = [
  { key: 'newLinksLast30d', label: 'New Links', placeholder: 'e.g. 69' },
  { key: 'lostLinksLast30d', label: 'Lost Links', placeholder: 'e.g. 34' },
];

function toInput(v) {
  return v == null ? '' : String(v);
}

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

function isoToDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthLabel(iso) {
  const d = isoToDate(iso);
  return d ? format(d, 'MMMM yyyy') : '';
}

function monthKey(iso) {
  return iso ? iso.slice(0, 7) : '';
}

const DateButton = forwardRef(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm rounded-xl border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-low/50 dark:bg-brand-on-surface/50 text-brand-on-surface dark:text-brand-outline-variant hover:border-brand-outline-variant focus:outline-none focus:ring-4 focus:ring-brand-primary-container/10 focus:border-brand-500/50 transition-all"
  >
    <span className={value ? '' : 'text-brand-outline'}>{value || placeholder}</span>
    <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </button>
));
DateButton.displayName = 'DateButton';

export default function EditDomainAuthorityModal({ isOpen, onClose, siteId, current }) {
  const override = useBacklinksManualOverride(siteId);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [effectiveDate, setEffectiveDate] = useState(todayIso());

  const today = useMemo(() => todayIso(), []);
  const isBackfill = monthKey(effectiveDate) !== monthKey(today);

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
    setEffectiveDate(todayIso());
  }, [isOpen, current]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveDate) {
      setErrors({ _form: 'Pick a date' });
      return;
    }
    if (effectiveDate > today) {
      setErrors({ _form: 'Date cannot be in the future' });
      return;
    }
    const payload = { effectiveDate };
    const nextErrors = {};
    for (const { key } of [...SNAPSHOT_FIELDS, ...ACTIVITY_FIELDS]) {
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
    if (Object.keys(payload).length <= 1) {
      setErrors({ _form: 'Update at least one field' });
      return;
    }
    await override.mutateAsync(payload);
    onClose();
  };

  const submitLabel = isBackfill ? `Backfill ${monthLabel(effectiveDate)}` : 'Save changes';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Domain Authority" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date picker + context note */}
        <div className="space-y-2">
          <label className="block text-[13px] font-bold font-label text-brand-on-surface dark:text-brand-outline ml-0.5">
            As of
          </label>
          <DatePicker
            selected={isoToDate(effectiveDate)}
            onChange={(d) => setEffectiveDate(d ? format(d, 'yyyy-MM-dd') : '')}
            maxDate={new Date()}
            dateFormat="MMM d, yyyy"
            todayButton="Today"
            customInput={<DateButton placeholder="Pick a date" />}
            popperPlacement="bottom-start"
            popperProps={{ strategy: 'fixed' }}
            wrapperClassName="w-full block"
          />
          <div className={`flex items-start gap-2 text-[12px] rounded-lg px-3 py-2 font-label ${
            isBackfill
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              : 'bg-brand-surface-container-low dark:bg-brand-on-surface/40 text-brand-on-surface-variant dark:text-brand-outline'
          }`}>
            <svg className="w-4 h-4 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {isBackfill
                ? `Backfilling ${monthLabel(effectiveDate)} — only affects period charts. Live dashboard numbers stay as they are.`
                : 'Saving for the current month — also updates the live dashboard.'}
            </span>
          </div>
        </div>

        {/* Snapshot section */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-outline dark:text-brand-on-surface-variant font-label mb-3 ml-0.5">
            Snapshot
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SNAPSHOT_FIELDS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                id={`da-${key}`}
                type="number"
                inputMode="numeric"
                value={form[key] ?? ''}
                onChange={update(key)}
                error={errors[key]}
                placeholder={placeholder}
              />
            ))}
          </div>
        </div>

        {/* Activity section */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-outline dark:text-brand-on-surface-variant font-label mb-3 ml-0.5">
            Activity in this period
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITY_FIELDS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                id={`da-${key}`}
                type="number"
                inputMode="numeric"
                value={form[key] ?? ''}
                onChange={update(key)}
                error={errors[key]}
                placeholder={placeholder}
              />
            ))}
          </div>
        </div>

        {errors._form && (
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 font-label ml-0.5">{errors._form}</p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-outline-variant dark:border-brand-outline/60">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={override.isPending}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
