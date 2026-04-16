import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import SiteMultiSelect from './SiteMultiSelect';
import { useInvitationMutations } from '../../hooks/useInvitations';

const emptyRow = () => ({ email: '', role: 'viewer', siteIds: [] });

export default function InviteModal({ isOpen, onClose }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [errors, setErrors] = useState({});
  const { createInvitations } = useInvitationMutations();

  const updateRow = (index, field, value) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows([...rows, emptyRow()]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    rows.forEach((row, i) => {
      if (!row.email) errs[`${i}.email`] = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(row.email)) errs[`${i}.email`] = 'Invalid email';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await createInvitations.mutateAsync(rows);
      setRows([emptyRow()]);
      setErrors({});
      onClose();
    } catch {
      // handled by mutation
    }
  };

  const handleClose = () => {
    setRows([emptyRow()]);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Users" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Input
                  label="Email"
                  id={`email-${index}`}
                  type="email"
                  value={row.email}
                  onChange={(e) => updateRow(index, 'email', e.target.value)}
                  error={errors[`${index}.email`]}
                  placeholder="user@example.com"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  value={row.role}
                  onChange={(e) => updateRow(index, 'role', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="mt-7 text-gray-400 hover:text-red-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {row.role === 'viewer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Share Projects
                </label>
                <SiteMultiSelect
                  selected={row.siteIds}
                  onChange={(ids) => updateRow(index, 'siteIds', ids)}
                />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
        >
          + Add another user
        </button>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createInvitations.isPending}>
            Send Invitations
          </Button>
        </div>
      </form>
    </Modal>
  );
}
