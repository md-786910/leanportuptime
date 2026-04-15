import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import { useShareLinks, useShareLinkMutations } from '../../hooks/useShareLinks';
import { formatRelative } from '../../utils/formatters';

const SECTION_OPTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'performance', label: 'Performance' },
  { key: 'ssl', label: 'SSL' },
  { key: 'seo', label: 'SEO' },
  { key: 'security', label: 'Security' },
  { key: 'plugins', label: 'Plugins' },
  { key: 'sitescan', label: 'Site Scan' },
  { key: 'history', label: 'History' },
];

const DEFAULT_SECTIONS = {
  overview: true,
  performance: true,
  ssl: true,
  security: true,
  seo: true,
  plugins: true,
  sitescan: true,
  history: true,
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ShareLinkItem({ link, siteId, mutations }) {
  const shareUrl = `${window.location.origin}/share/${link.token}`;
  const visibleCount = Object.values(link.visibleSections).filter(Boolean).length;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {link.label || 'Untitled link'}
          </span>
          <Badge variant={link.isActive ? 'success' : 'neutral'}>
            {link.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {link.accessCount} views
        </span>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
        <input
          type="text"
          readOnly
          value={shareUrl}
          className="flex-1 bg-transparent text-xs text-gray-600 dark:text-gray-400 outline-none truncate"
        />
        <CopyButton text={shareUrl} />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{visibleCount} sections visible</span>
        <span>Created {formatRelative(link.createdAt)}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => mutations.regenerate.mutate(link._id)}
          isLoading={mutations.regenerate.isPending}
        >
          Regenerate
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => mutations.revoke.mutate(link._id)}
          isLoading={mutations.revoke.isPending}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
}

function CreateShareLinkForm({ siteId, mutations, onCreated }) {
  const [label, setLabel] = useState('');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await mutations.create.mutateAsync({
      label: label.trim(),
      visibleSections: sections,
    });
    setLabel('');
    setSections(DEFAULT_SECTIONS);
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Client A, Investor report"
          maxLength={100}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Visible Sections
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SECTION_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sections[opt.key]}
                onChange={() => toggleSection(opt.key)}
                className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={mutations.create.isPending}>
          Create Share Link
        </Button>
      </div>
    </form>
  );
}

export default function ShareLinkModal({ isOpen, onClose, siteId }) {
  const { links, isLoading } = useShareLinks(siteId);
  const mutations = useShareLinkMutations(siteId);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Links" size="lg">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <>
            {links.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {links.map((link) => (
                  <ShareLinkItem
                    key={link._id}
                    link={link}
                    siteId={siteId}
                    mutations={mutations}
                  />
                ))}
              </div>
            ) : (
              !showCreate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No share links yet. Create one to share this site with clients.
                </p>
              )
            )}

            {showCreate ? (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  New Share Link
                </h4>
                <CreateShareLinkForm
                  siteId={siteId}
                  mutations={mutations}
                  onCreated={() => setShowCreate(false)}
                />
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
                  + Create Share Link
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
