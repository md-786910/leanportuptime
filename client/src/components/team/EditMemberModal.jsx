import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import SiteMultiSelect from './SiteMultiSelect';
import { useTeamMutations } from '../../hooks/useInvitations';

export default function EditMemberModal({ isOpen, onClose, member }) {
  const [role, setRole] = useState('viewer');
  const [sharedSites, setSharedSites] = useState([]);
  const { updateMember } = useTeamMutations();

  useEffect(() => {
    if (member) {
      setRole(member.role);
      setSharedSites((member.sharedSites || []).map((s) => (typeof s === 'string' ? s : s._id)));
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMember.mutateAsync({
        userId: member._id,
        data: { role, sharedSites },
      });
      onClose();
    } catch {
      // handled by mutation
    }
  };

  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${member.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {role === 'viewer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shared Projects
            </label>
            <SiteMultiSelect selected={sharedSites} onChange={setSharedSites} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMember.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
