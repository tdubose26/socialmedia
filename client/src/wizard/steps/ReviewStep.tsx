import { AI_MODELS } from '../presets';
import type { WizardData } from '../types';

type Props = { data: WizardData };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value || '—'}</dd>
    </>
  );
}

export default function ReviewStep({ data }: Props) {
  const modelLabel = AI_MODELS.find((m) => m.id === data.aiModel)?.label ?? '';

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Review your choices, then generate.</p>
      <dl className="grid grid-cols-2 gap-y-2 text-sm bg-slate-50 rounded-xl p-4">
        <Row label="Industry" value={data.industry} />
        <Row label="Brand tone" value={data.brandTone} />
        <Row label="Call to action" value={data.callToAction} />
        <Row label="Topics" value={data.topics.join(', ')} />
        <Row label="AI model" value={modelLabel} />
        <Row label="Representation" value={data.representation.join(', ')} />
        <Row label="Location / setting" value={data.location.join(', ')} />
        <Row label="Outfit / style" value={data.outfitStyle.join(', ')} />
        <Row label="Platforms" value={data.platforms.join(', ')} />
        <Row label="Start date" value={data.postingDate} />
        <Row label="Duration" value={`${data.dayLimit} days (${data.dayLimit * 2} posts)`} />
        <Row label="Times" value={data.times.join(', ')} />
      </dl>
    </div>
  );
}
