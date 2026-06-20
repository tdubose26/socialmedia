import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

type Me = {
  user: {
    id: number;
    clerkId: string;
    email: string;
    name: string | null;
    plan: string;
    credits: number;
    createdAt: string;
  };
};

type CreditPack = {
  id: string;
  label: string;
  description: string;
  credits: number;
  amountCents: number;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [me, setMe] = useState<Me | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const checkout = searchParams.get('checkout');

  const loadMe = useCallback(() => {
    apiFetch('/api/me')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Me) => setMe(data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadMe();
    apiFetch('/api/credit-packs')
      .then((r) => r.json())
      .then((data: { packs: CreditPack[] }) => setPacks(data.packs))
      .catch(() => {});
  }, [loadMe]);

  // After returning from a successful checkout, credits are granted asynchronously by
  // the Stripe webhook. Poll /api/me a few times so the new balance shows up.
  useEffect(() => {
    if (checkout !== 'success') return;
    let tries = 0;
    const interval = setInterval(() => {
      tries += 1;
      loadMe();
      if (tries >= 5) clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [checkout, loadMe]);

  async function buy(packId: string) {
    setBuying(packId);
    try {
      const r = await apiFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'Could not start checkout');
        setBuying(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'checkout failed');
      setBuying(null);
    }
  }

  function dismissBanner() {
    searchParams.delete('checkout');
    setSearchParams(searchParams, { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-slate-600 mb-8">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}.
      </p>

      {checkout === 'success' && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-center justify-between">
          <span>Payment received! Your credits will appear here within a few seconds.</span>
          <button onClick={dismissBanner} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        </div>
      )}
      {checkout === 'cancel' && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 flex items-center justify-between">
          <span>Checkout canceled — no charge was made.</span>
          <button onClick={dismissBanner} className="text-amber-700 hover:text-amber-900">
            ✕
          </button>
        </div>
      )}

      {/* Credit balance */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-sm font-medium text-slate-500 mb-1">Credit balance</h2>
        {error && <p className="text-red-600 text-sm">Error: {error}</p>}
        {!me && !error && <p className="text-slate-500">Loading...</p>}
        {me && (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{me.user.credits}</span>
            <span className="text-slate-500">credits</span>
            <span className="ml-auto text-sm text-slate-400">Plan: {me.user.plan}</span>
          </div>
        )}
      </div>

      {/* Buy credits */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-sm font-medium text-slate-500 mb-4">Buy credits</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {packs.map((pack) => (
            <div key={pack.id} className="border border-slate-200 rounded-xl p-4 flex flex-col">
              <div className="font-semibold">{pack.label}</div>
              <div className="text-sm text-slate-500 mb-3">{pack.description}</div>
              <div className="text-2xl font-bold mb-4">
                ${(pack.amountCents / 100).toFixed(2)}
              </div>
              <button
                onClick={() => buy(pack.id)}
                disabled={buying !== null}
                className="mt-auto bg-slate-900 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {buying === pack.id ? 'Redirecting…' : `Buy ${pack.credits} credits`}
              </button>
            </div>
          ))}
          {packs.length === 0 && <p className="text-slate-400 text-sm">Loading packs…</p>}
        </div>
      </div>
    </div>
  );
}
