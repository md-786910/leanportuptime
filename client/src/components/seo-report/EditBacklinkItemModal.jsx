import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useUpdateBacklinkItem } from '../../hooks/useBacklinks';

const LINK_TYPES = ['anchor', 'image', 'redirect', 'canonical', 'alternate'];

function isoDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}

export default function EditBacklinkItemModal({ isOpen, onClose, siteId, item }) {
  const update = useUpdateBacklinkItem(siteId);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !item) return;
    setForm({
      sourceUrl: item.sourceUrl || '',
      targetUrl: item.targetUrl || '',
      anchor: item.anchor || '',
      linkType: item.linkType || 'anchor',
      doFollow: !!item.doFollow,
      domainFromRank: item.domainFromRank == null ? '' : String(item.domainFromRank),
      firstSeen: isoDate(item.firstSeen),
      lastSeen: isoDate(item.lastSeen),
    });
    setErrors({});
  }, [isOpen, item]);

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item?._id) return;
    const errs = {};
    if (!form.sourceUrl?.trim()) errs.sourceUrl = 'Source URL is required';
    let drNum;
    if (form.domainFromRank !== '' && form.domainFromRank != null) {
      drNum = Number(form.domainFromRank);
      if (!Number.isFinite(drNum)) errs.domainFromRank = 'DR must be a number';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await update.mutateAsync({
      itemId: item._id,
      payload: {
        sourceUrl: form.sourceUrl.trim(),
        targetUrl: form.targetUrl.trim() || null,
        anchor: form.anchor || null,
        linkType: form.linkType || null,
        doFollow: !!form.doFollow,
        domainFromRank: form.domainFromRank === '' ? null : drNum,
        firstSeen: form.firstSeen || null,
        lastSeen: form.lastSeen || null,
      },
    });
    onClose();
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit backlink" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Source URL *"
          id="ebl-sourceUrl"
          value={form.sourceUrl ?? ''}
          onChange={setField('sourceUrl')}
          error={errors.sourceUrl}
        />
        <Input
          label="Target URL"
          id="ebl-targetUrl"
          value={form.targetUrl ?? ''}
          onChange={setField('targetUrl')}
        />
        <Input
          label="Anchor text"
          id="ebl-anchor"
          value={form.anchor ?? ''}
          onChange={setField('anchor')}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium font-label text-brand-on-surface dark:text-brand-outline">Link type</label>
            <select
              value={form.linkType ?? 'anchor'}
              onChange={setField('linkType')}
              className="block w-full rounded-lg border border-brand-outline-variant dark:border-brand-outline px-3 py-2 text-sm bg-brand-surface-container-lowest dark:bg-brand-on-surface dark:text-brand-outline-variant focus:outline-none focus:ring-2 focus:ring-brand-primary-container"
            >
              {LINK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Input
            label="DR (domainFromRank)"
            id="ebl-domainFromRank"
            type="number"
            inputMode="numeric"
            value={form.domainFromRank ?? ''}
            onChange={setField('domainFromRank')}
            error={errors.domainFromRank}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-on-surface dark:text-brand-outline cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.doFollow}
            onChange={(e) => setForm({ ...form, doFollow: e.target.checked })}
            className="rounded border-brand-outline-variant dark:border-brand-outline text-brand-primary focus:ring-brand-primary-container"
          />
          DoFollow link
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First seen"
            id="ebl-firstSeen"
            type="date"
            value={form.firstSeen ?? ''}
            onChange={setField('firstSeen')}
          />
          <Input
            label="Last seen"
            id="ebl-lastSeen"
            type="date"
            value={form.lastSeen ?? ''}
            onChange={setField('lastSeen')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={update.isPending}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
