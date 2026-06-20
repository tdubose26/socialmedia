import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, downloadCsvForRequest } from '../lib/api';

type Status = 'pending' | 'processing' | 'completed' | 'failed';

type HistoryItem = {
  id: string;
  status: Status;
  progressStage: string | null;
  industry: string | null;
  platforms: string[];
  dayLimit: number;
  postCount: number;
  creditsUsed: number | null;
  hasCsv: boolean;
  csvFilename: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

const STATUS_BADGE: Record<Status, string> = {
  pending: 'bg-slate-100 text-slate-700',
  processing: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatPlatforms(list: string[]): string {
  if (list.length <= 3) return list.join(', ') || '—';
  return `${list.slice(0, 3).join(', ')} +${list.length - 3} more`;
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await apiFetch('/api/content-history');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setItems(json.items as HistoryItem[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'load failed');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function download(item: HistoryItem) {
    setDownloadingId(item.id);
    setDownloadError(null);
    try {
      await downloadCsvForRequest(item.id);
    } catch (err) {
      setDownloadError(`Could not download ${item.csvFilename ?? 'CSV'}: ${err instanceof Error ? err.message : err}`);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">History</h1>
        <Link
          to="/generate"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          New generation
        </Link>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 text-sm">
          Could not load history: {loadError}
        </div>
      )}
      {downloadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 text-sm">
          {downloadError}
        </div>
      )}

      {items === null && !loadError && (
        <p className="text-slate-500 text-sm">Loading…</p>
      )}

      {items && items.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <p className="text-slate-600 mb-3">No generations yet.</p>
          <Link
            to="/generate"
            className="inline-block px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800"
          >
            Generate your first batch
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Created</th>
                <th className="text-left px-5 py-3 font-medium">Industry</th>
                <th className="text-left px-5 py-3 font-medium">Platforms</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Credits</th>
                <th className="text-right px-5 py-3 font-medium">CSV</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                    <div className="text-xs text-slate-400">
                      {item.dayLimit} days · {item.postCount} posts
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-900">{item.industry || '—'}</td>
                  <td className="px-5 py-3 text-slate-700">{formatPlatforms(item.platforms)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                    {item.status === 'failed' && item.errorMessage && (
                      <div className="text-xs text-red-700 mt-1 max-w-xs">{item.errorMessage}</div>
                    )}
                    {item.status === 'processing' && item.progressStage && (
                      <div className="text-xs text-amber-700 mt-1">{item.progressStage}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {item.creditsUsed != null ? item.creditsUsed : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {item.hasCsv ? (
                      <button
                        onClick={() => download(item)}
                        disabled={downloadingId !== null}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                      >
                        {downloadingId === item.id ? 'Downloading…' : 'Download'}
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
