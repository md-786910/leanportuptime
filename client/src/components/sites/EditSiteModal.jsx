import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useSiteMutations } from '../../hooks/useSiteMutations';
import { CHECK_INTERVALS } from '../../utils/constants';

export default function EditSiteModal({ isOpen, onClose, site }) {
  const { updateSite } = useSiteMutations();
  const [form, setForm] = useState({ name: '', url: '', interval: 300000, isFavorite: false });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (site) {
      setForm({
        name: site.name || '',
        url: site.url || '',
        interval: site.interval || 300000,
        isFavorite: !!site.isFavorite,
      });
    }
  }, [site]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.url.trim()) errs.url = 'URL is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await updateSite.mutateAsync({
      id: site._id,
      data: {
        name: form.name.trim(),
        url: form.url.trim(),
        interval: parseInt(form.interval, 10),
        isFavorite: form.isFavorite,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Site" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Site Name" id="editName" value={form.name} onChange={update('name')} error={errors.name} />
        <Input label="URL" id="editUrl" value={form.url} onChange={update('url')} error={errors.url} />
        <div className="space-y-1">
          <label className="block text-sm font-medium font-label text-brand-on-surface dark:text-brand-outline">Check Interval</label>
          <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="block w-full rounded-lg border border-brand-outline-variant dark:border-brand-outline px-3 py-2 text-sm bg-brand-surface-container-lowest dark:bg-brand-on-surface dark:text-brand-outline-variant focus:outline-none focus:ring-2 focus:ring-brand-primary-container">
            {CHECK_INTERVALS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-on-surface dark:text-brand-outline cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFavorite}
            onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })}
            className="rounded border-brand-outline-variant dark:border-brand-outline text-brand-primary focus:ring-brand-primary-container"
          />
          Mark as favorite
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={updateSite.isPending}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
