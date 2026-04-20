import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useSiteMutations } from '../../hooks/useSiteMutations';
import { CHECK_INTERVALS } from '../../utils/constants';

export default function AddSiteModal({ isOpen, onClose }) {
  const { createSite } = useSiteMutations();
  const [form, setForm] = useState({
    name: '',
    url: '',
    interval: 300000,
    isFavorite: false,
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.url.trim()) errs.url = 'URL is required';
    else if (!/^https?:\/\//i.test(form.url)) errs.url = 'Must start with http:// or https://';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      interval: parseInt(form.interval, 10),
      isFavorite: form.isFavorite,
    };
    await createSite.mutateAsync(payload);
    setForm({ name: '', url: '', interval: 300000, isFavorite: false });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Site" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Site Name" id="siteName" value={form.name} onChange={update('name')} error={errors.name} placeholder="My WordPress Site" />
        <Input label="URL" id="siteUrl" value={form.url} onChange={update('url')} error={errors.url} placeholder="https://example.com" />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check Interval</label>
          <select
            value={form.interval}
            onChange={(e) => setForm({ ...form, interval: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CHECK_INTERVALS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFavorite}
            onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })}
            className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
          />
          Mark as favorite
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createSite.isPending}>Add Site</Button>
        </div>
      </form>
    </Modal>
  );
}
