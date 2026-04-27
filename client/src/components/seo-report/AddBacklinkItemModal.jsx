import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAddBacklinkItem } from '../../hooks/useBacklinks';

const LINK_TYPES = ['anchor', 'image', 'redirect', 'canonical', 'alternate'];

const EMPTY = {
  sourceUrl: '',
  targetUrl: '',
  anchor: '',
  linkType: 'anchor',
  doFollow: true,
  domainFromRank: '',
  firstSeen: '',
  lastSeen: '',
};

export default function AddBacklinkItemModal({ isOpen, onClose, siteId }) {
  const add = useAddBacklinkItem(siteId);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY);
    setErrors({});
  }, [isOpen]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.sourceUrl.trim()) errs.sourceUrl = 'Source URL is required';
    let drNum;
    if (form.domainFromRank !== '' && form.domainFromRank != null) {
      drNum = Number(form.domainFromRank);
      if (!Number.isFinite(drNum)) errs.domainFromRank = 'DR must be a number';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await add.mutateAsync({
      sourceUrl: form.sourceUrl.trim(),
      targetUrl: form.targetUrl.trim() || null,
      anchor: form.anchor || null,
      linkType: form.linkType || null,
      doFollow: !!form.doFollow,
      domainFromRank: drNum,
      firstSeen: form.firstSeen || null,
      lastSeen: form.lastSeen || null,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add backlink" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Source URL *"
          id="abl-sourceUrl"
          value={form.sourceUrl}
          onChange={update('sourceUrl')}
          error={errors.sourceUrl}
          placeholder="https://example.com/post"
        />
        <Input
          label="Target URL"
          id="abl-targetUrl"
          value={form.targetUrl}
          onChange={update('targetUrl')}
          placeholder="https://your-site.com/page"
        />
        <Input
          label="Anchor text"
          id="abl-anchor"
          value={form.anchor}
          onChange={update('anchor')}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium font-label text-brand-on-surface dark:text-brand-outline">Link type</label>
            <select
              value={form.linkType}
              onChange={update('linkType')}
              className="block w-full rounded-lg border border-brand-outline-variant dark:border-brand-outline px-3 py-2 text-sm bg-brand-surface-container-lowest dark:bg-brand-on-surface dark:text-brand-outline-variant focus:outline-none focus:ring-2 focus:ring-brand-primary-container"
            >
              {LINK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Input
            label="DR (domainFromRank)"
            id="abl-domainFromRank"
            type="number"
            inputMode="numeric"
            value={form.domainFromRank}
            onChange={update('domainFromRank')}
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
            id="abl-firstSeen"
            type="date"
            value={form.firstSeen}
            onChange={update('firstSeen')}
          />
          <Input
            label="Last seen"
            id="abl-lastSeen"
            type="date"
            value={form.lastSeen}
            onChange={update('lastSeen')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={add.isPending}>Add backlink</Button>
        </div>
      </form>
    </Modal>
  );
}
