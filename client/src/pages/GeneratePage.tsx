import { useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import GenerationStatus from '../components/GenerationStatus';
import StepIndicator from '../wizard/StepIndicator';
import { initialWizardData, type WizardData } from '../wizard/types';
import {
  REPRESENTATION_PRESETS,
  LOCATION_PRESETS,
  OUTFIT_PRESETS,
} from '../wizard/presets';
import BusinessBasicsStep from '../wizard/steps/BusinessBasicsStep';
import ModelStep from '../wizard/steps/ModelStep';
import ComingSoonStep from '../wizard/steps/ComingSoonStep';
import PreferenceStep from '../wizard/steps/PreferenceStep';
import PlatformsStep from '../wizard/steps/PlatformsStep';
import ScheduleStep from '../wizard/steps/ScheduleStep';
import ReviewStep from '../wizard/steps/ReviewStep';

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

type StepDef = {
  key: string;
  title: string;
  render: () => ReactNode;
  isValid: (d: WizardData) => boolean;
};

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'created'; requestId: string }
  | { status: 'error'; message: string };

export default function GeneratePage() {
  const [data, setData] = useState<WizardData>(initialWizardData);
  const [current, setCurrent] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const todayStr = useMemo(todayString, []);

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const steps: StepDef[] = [
    {
      key: 'basics',
      title: 'Business basics',
      render: () => <BusinessBasicsStep data={data} update={update} />,
      isValid: (d) => d.industry.trim() !== '' && d.brandTone !== '',
    },
    {
      key: 'model',
      title: 'Choose AI model',
      render: () => <ModelStep data={data} update={update} />,
      isValid: (d) => d.aiModel !== '',
    },
    {
      key: 'image-prompts',
      title: 'Image prompts',
      render: () => (
        <ComingSoonStep
          title="Image prompt options"
          description="Soon you'll be able to set AI image-generation options for your posts."
        />
      ),
      isValid: () => true,
    },
    {
      key: 'representation',
      title: 'Representation',
      render: () => (
        <PreferenceStep
          description="How should people be represented in your content?"
          options={REPRESENTATION_PRESETS}
          value={data.representation}
          onChange={(v) => update({ representation: v })}
        />
      ),
      isValid: () => true,
    },
    {
      key: 'location',
      title: 'Location & setting',
      render: () => (
        <PreferenceStep
          description="What locations or settings fit your brand?"
          options={LOCATION_PRESETS}
          value={data.location}
          onChange={(v) => update({ location: v })}
        />
      ),
      isValid: () => true,
    },
    {
      key: 'reference-upload',
      title: 'Reference image',
      render: () => (
        <ComingSoonStep
          title="Reference image upload"
          description="Soon you'll be able to upload a reference image to guide the look of generated visuals."
        />
      ),
      isValid: () => true,
    },
    {
      key: 'outfit',
      title: 'Outfit & style',
      render: () => (
        <PreferenceStep
          description="Any outfit or styling preferences?"
          options={OUTFIT_PRESETS}
          value={data.outfitStyle}
          onChange={(v) => update({ outfitStyle: v })}
        />
      ),
      isValid: () => true,
    },
    {
      key: 'platforms',
      title: 'Platforms',
      render: () => <PlatformsStep data={data} update={update} />,
      isValid: (d) => d.platforms.length > 0,
    },
    {
      key: 'schedule',
      title: 'Schedule',
      render: () => <ScheduleStep data={data} update={update} todayStr={todayStr} />,
      isValid: (d) =>
        d.postingDate !== '' &&
        d.postingDate >= todayStr &&
        d.times.length >= 1 &&
        d.times.every((t) => /^\d{2}:\d{2}$/.test(t)),
    },
    {
      key: 'review',
      title: 'Review & generate',
      render: () => <ReviewStep data={data} />,
      isValid: () => true,
    },
  ];

  const step = steps[current];
  const canProceed = step.isValid(data);
  const isLast = current === steps.length - 1;

  function next() {
    if (!canProceed) return;
    const n = Math.min(current + 1, steps.length - 1);
    setCurrent(n);
    setMaxReached((m) => Math.max(m, n));
  }

  function back() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  function jump(i: number) {
    if (i <= maxReached) setCurrent(i);
  }

  async function generate() {
    setSubmit({ status: 'submitting' });
    try {
      const res = await apiFetch('/api/content-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        let message =
          (Array.isArray(json?.details) && json.details.join(', ')) ||
          json?.error ||
          `HTTP ${res.status}`;
        if (res.status === 402) {
          message = `Not enough credits — you need ${json.needed}, but have ${json.have}. Buy more on the dashboard.`;
        }
        setSubmit({ status: 'error', message });
        return;
      }
      setSubmit({ status: 'created', requestId: json.requestId });
    } catch (err) {
      setSubmit({ status: 'error', message: err instanceof Error ? err.message : 'request failed' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Generate content</h1>

      <StepIndicator steps={steps} current={current} maxReached={maxReached} onJump={jump} />

      <div className="bg-white rounded-2xl shadow p-6 min-h-[260px]">{step.render()}</div>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={back}
          disabled={current === 0}
          className="px-5 py-2.5 rounded-lg border border-slate-300 font-medium disabled:opacity-40 hover:bg-slate-100"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={generate}
            disabled={submit.status === 'submitting' || submit.status === 'created'}
            className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-40"
          >
            {submit.status === 'submitting' ? 'Generating…' : 'Generate'}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canProceed}
            className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-medium disabled:opacity-40 hover:bg-slate-800"
          >
            Next
          </button>
        )}
      </div>

      {!canProceed && !isLast && (
        <p className="text-xs text-amber-600 mt-2">Complete the required fields to continue.</p>
      )}

      {submit.status === 'created' && (
        <GenerationStatus
          requestId={submit.requestId}
          onReset={() => {
            setData(initialWizardData);
            setCurrent(0);
            setMaxReached(0);
            setSubmit({ status: 'idle' });
          }}
        />
      )}

      {submit.status === 'error' && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 text-red-800 p-4">
          <div className="font-medium mb-1">Could not start generation</div>
          <div className="text-sm">{submit.message}</div>
        </div>
      )}
    </div>
  );
}
