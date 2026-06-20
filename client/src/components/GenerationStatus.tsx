import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, downloadCsvForRequest } from '../lib/api';

type StatusPayload = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressStage: string | null;
  errorMessage: string | null;
  csvFilename: string | null;
  completedAt: string | null;
};

const STAGE_LABEL: Record<string, string> = {
  queued: 'Queued',
  started: 'Starting up',
  researching: 'Researching your audience',
  'generating posts': 'Writing your posts',
  'building CSV': 'Building the CSV',
  completed: 'Completed',
  error: 'Failed',
};

function friendlyStage(stage: string | null): string {
  if (!stage) return 'Working…';
  return STAGE_LABEL[stage] ?? stage;
}

export default function GenerationStatus({
  requestId,
  onReset,
}: {
  requestId: string;
  onReset: () => void;
}) {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cancelledRef = useRef(false);

  // Poll every 3s using chained setTimeout (avoids overlapping requests).
  useEffect(() => {
    cancelledRef.current = false;
    let timer: number | null = null;

    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const r = await apiFetch(`/api/content-status/${requestId}`);
        if (!r.ok) {
          setPollError(`Status request failed (HTTP ${r.status})`);
        } else {
          const json = (await r.json()) as StatusPayload;
          setPollError(null);
          setData(json);
          if (json.status === 'completed' || json.status === 'failed') return; // stop
        }
      } catch (err) {
        setPollError(err instanceof Error ? err.message : 'network error');
      }
      if (!cancelledRef.current) {
        timer = window.setTimeout(tick, 3000);
      }
    };
    tick();

    return () => {
      cancelledRef.current = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [requestId]);

  const download = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadCsvForRequest(requestId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'download failed');
    } finally {
      setDownloading(false);
    }
  }, [requestId]);

  // Initial loading state (no payload yet).
  if (!data) {
    return (
      <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-slate-700">Checking status…</span>
        </div>
        {pollError && <p className="text-xs text-amber-600 mt-2">{pollError}</p>}
      </div>
    );
  }

  if (data.status === 'failed') {
    return (
      <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-5">
        <div className="font-semibold text-red-900 mb-1">Generation failed</div>
        <p className="text-sm text-red-800">
          {data.errorMessage ?? 'Something went wrong while generating your posts.'}
        </p>
        <p className="text-xs text-red-700/80 mt-3">
          No credits were charged. You can try again.
        </p>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (data.status === 'completed') {
    return (
      <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-5">
        <div className="font-semibold text-green-900 mb-1">Your content is ready 🎉</div>
        <p className="text-sm text-green-800 mb-4">
          File: <span className="font-mono">{data.csvFilename}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={download}
            disabled={downloading}
            className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {downloading ? 'Downloading…' : 'Download CSV'}
          </button>
          <button
            onClick={onReset}
            className="px-5 py-2.5 rounded-lg border border-slate-300 font-medium hover:bg-slate-100"
          >
            Generate another
          </button>
        </div>
        {downloadError && (
          <p className="text-xs text-red-600 mt-3">Download error: {downloadError}</p>
        )}
      </div>
    );
  }

  // pending or processing
  return (
    <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <Spinner />
        <span className="font-medium text-slate-900">{friendlyStage(data.progressStage)}</span>
      </div>
      <p className="text-xs text-slate-500">
        Request ID: <span className="font-mono break-all">{data.id}</span>
      </p>
      <p className="text-xs text-slate-400 mt-2">
        This usually takes 20–60 seconds. Status updates every 3 seconds.
      </p>
      {pollError && <p className="text-xs text-amber-600 mt-2">{pollError}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin"
      aria-label="loading"
    />
  );
}
