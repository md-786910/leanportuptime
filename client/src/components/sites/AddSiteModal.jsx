import { useState, useRef, useEffect } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const currentInterval = CHECK_INTERVALS.find(opt => opt.value === parseInt(form.interval, 10)) || CHECK_INTERVALS[1];

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please provide a name for this node';
    if (!form.url.trim()) errs.url = 'Endpoint URL is required';
    else if (!/^https?:\/\//i.test(form.url)) errs.url = 'URL must begin with http:// or https://';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Node" size="md">
      <div className="mb-4 p-4 bg-brand-50 dark:bg-brand-400/5 rounded-xl border border-brand-100/50 dark:border-brand-500/10">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Setup Monitoring</h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Register a new service endpoint for global real-time optimization and critical failure detection.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Input 
            label="Name" 
            id="siteName" 
            value={form.name} 
            onChange={update('name')} 
            error={errors.name} 
            placeholder="e.g. Production API Gateway" 
          />
          
          <Input 
            label="URL" 
            id="siteUrl" 
            value={form.url} 
            onChange={update('url')} 
            error={errors.url} 
            placeholder="https://api.example.com/v1" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
          {/* Custom Check Frequency Dropdown */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-0.5">
              Check Frequency
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border rounded-xl text-[13px] font-bold transition-all duration-200 ${
                  isDropdownOpen 
                    ? 'border-brand-500 ring-4 ring-brand-500/10 bg-white dark:bg-slate-900' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{currentInterval.label}</span>
                </div>
                <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="max-h-40 overflow-y-auto scrollbar-hide px-2">
                    {CHECK_INTERVALS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, interval: opt.value });
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold transition-colors rounded-xl mb-0.5 last:mb-0 ${
                          parseInt(form.interval, 10) === opt.value
                            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {parseInt(form.interval, 10) === opt.value && (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-2">
          <Button 
            variant="ghost" 
            type="button" 
            onClick={onClose}
            className="px-6"
          >
            Discard
          </Button>
          <Button 
            type="submit" 
            isLoading={createSite.isPending}
            className="px-8 shadow-lg shadow-brand-600/20"
          >
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
