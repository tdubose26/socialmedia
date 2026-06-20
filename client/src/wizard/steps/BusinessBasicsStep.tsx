import ChipSelect from '../ChipSelect';
import { BRAND_TONES, TOPIC_PRESETS } from '../presets';
import type { WizardData } from '../types';

type Props = { data: WizardData; update: (patch: Partial<WizardData>) => void };

const baseChip = 'px-3 py-1.5 rounded-full text-sm border transition-colors';
const onChip = `${baseChip} bg-slate-900 text-white border-slate-900`;
const offChip = `${baseChip} bg-white text-slate-700 border-slate-300 hover:border-slate-400`;

export default function BusinessBasicsStep({ data, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Industry / business <span className="text-red-500">*</span>
        </label>
        <input
          value={data.industry}
          onChange={(e) => update({ industry: e.target.value })}
          placeholder="e.g. Dental clinic, Coffee shop, Real estate"
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <p className="text-xs text-slate-400 mt-1">Used in the AI prompt and the CSV file name.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Brand tone <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BRAND_TONES.map((tone) => (
            <button
              type="button"
              key={tone}
              onClick={() => update({ brandTone: tone })}
              className={data.brandTone === tone ? onChip : offChip}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Call to action</label>
        <input
          value={data.callToAction}
          onChange={(e) => update({ callToAction: e.target.value })}
          placeholder="e.g. Book your appointment today"
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <p className="text-xs text-slate-400 mt-1">Optional. A default CTA the AI can weave into posts.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Topics / themes</label>
        <ChipSelect
          options={TOPIC_PRESETS}
          value={data.topics}
          onChange={(topics) => update({ topics })}
          otherPlaceholder="Add a custom topic…"
        />
        <p className="text-xs text-slate-400 mt-1">Optional. What should the posts focus on?</p>
      </div>
    </div>
  );
}
