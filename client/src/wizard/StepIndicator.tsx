type Props = {
  steps: { key: string; title: string }[];
  current: number;
  maxReached: number;
  onJump: (index: number) => void;
};

export default function StepIndicator({ steps, current, maxReached, onJump }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= maxReached;

          let dotClass = 'bg-slate-100 text-slate-400 cursor-not-allowed';
          if (active) dotClass = 'bg-slate-900 text-white';
          else if (done) dotClass = 'bg-slate-700 text-white';
          else if (reachable) dotClass = 'bg-slate-200 text-slate-600 hover:bg-slate-300';

          return (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onJump(i)}
                title={s.title}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${dotClass}`}
              >
                {done ? '✓' : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${i < current ? 'bg-slate-700' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-sm text-slate-500">
        Step {current + 1} of {steps.length} —{' '}
        <span className="text-slate-900 font-medium">{steps[current].title}</span>
      </div>
    </div>
  );
}
