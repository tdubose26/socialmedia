import { AI_MODELS } from '../presets';
import type { WizardData } from '../types';

type Props = { data: WizardData; update: (patch: Partial<WizardData>) => void };

export default function ModelStep({ data, update }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Which AI model should write your posts?</p>
      {AI_MODELS.map((m) => {
        const selected = data.aiModel === m.id;
        return (
          <button
            type="button"
            key={m.id}
            onClick={() => update({ aiModel: m.id })}
            className={
              'w-full text-left border rounded-xl px-4 py-3 transition-colors ' +
              (selected
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                : 'border-slate-300 hover:border-slate-400')
            }
          >
            <div className="font-medium">{m.label}</div>
          </button>
        );
      })}
    </div>
  );
}
