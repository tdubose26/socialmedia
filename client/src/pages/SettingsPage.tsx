import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function SettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch('/api/stripe/portal', { method: 'POST' });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'Could not open billing portal');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'portal failed');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-sm font-medium text-slate-500 mb-3">Account</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd>{user?.primaryEmailAddress?.emailAddress ?? '—'}</dd>
          <dt className="text-slate-500">Name</dt>
          <dd>{user?.fullName ?? '—'}</dd>
        </dl>
        <p className="text-xs text-slate-400 mt-3">
          To change your email, password, or profile, use the account menu (avatar, top-right).
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-sm font-medium text-slate-500 mb-3">Billing</h2>
        <p className="text-slate-600 text-sm mb-4">
          Manage your payment methods and view past invoices in the Stripe billing portal.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">Error: {error}</p>}
        <button
          onClick={openPortal}
          disabled={loading}
          className="bg-slate-900 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Opening…' : 'Manage billing'}
        </button>
      </div>
    </div>
  );
}
