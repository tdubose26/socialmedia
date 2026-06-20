import { PLATFORMS } from '../presets';
import type { WizardData } from '../types';

type Props = { data: WizardData; update: (patch: Partial<WizardData>) => void };

export default function PlatformsStep({ data, update }: Props) {
  function toggle(platform: string) {
    const has = data.platforms.includes(platform);
    update({
      platforms: has
        ? data.platforms.filter((x) => x !== platform)
        : [...data.platforms, platform],
    });
  }

  return (
    <div>
      <p className="text-sm text-slate-600 mb-3">
        Select the platforms to generate posts for (at least one).
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PLATFORMS.map((p) => {
          const selected = data.platforms.includes(p);
          return (
            <button
              type="button"
              key={p}
              onClick={() => toggle(p)}
              className={
                'border rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                (selected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 hover:border-slate-400')
              }
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
