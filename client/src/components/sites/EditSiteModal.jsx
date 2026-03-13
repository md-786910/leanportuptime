import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useSiteMutations } from '../../hooks/useSiteMutations';
import { CHECK_INTERVALS } from '../../utils/constants';

export default function EditSiteModal({ isOpen, onClose, site }) {
  const { updateSite } = useSiteMutations();
  const [form, setForm] = useState({ name: '', url: '', interval: 300000, tags: '', expectedKeywords: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (site) {
      setForm({
        name: site.name || '',
        url: site.url || '',
        interval: site.interval || 300000,
        tags: site.tags?.join(', ') || '',
        expectedKeywords: site.expectedKeywords?.join(', ') || '',
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
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        expectedKeywords: form.expectedKeywords ? form.expectedKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check Interval</label>
          <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {CHECK_INTERVALS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Input label="Tags" id="editTags" value={form.tags} onChange={update('tags')} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Keywords (comma separated)</label>
          <textarea
            value={form.expectedKeywords}
            onChange={update('expectedKeywords')}
            placeholder="WordPress, company name, footer text"
            rows={2}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Alert if any keyword is missing from the page</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={updateSite.isPending}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
