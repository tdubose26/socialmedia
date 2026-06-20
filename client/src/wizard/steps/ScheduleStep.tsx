import { useEffect } from 'react';
import type { WizardData } from '../types';
import { suggestedTimesFor, suggestionBasis } from '../suggestedTimes';

type Props = {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  todayStr: string;
};

export default function ScheduleStep({ data, update, todayStr }: Props) {
  // On entering this step, if the user hasn't manually edited the times yet,
  // pre-fill suggestions based on their selected platform(s). Re-runs each time
  // the step is entered, so changing platforms updates the suggestion — until
  // the user edits a time, after which we leave their choices alone.
  useEffect(() => {
    if (!data.timesEdited) {
      update({ times: suggestedTimesFor(data.platforms) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTime(index: number, val: string) {
    const next = [...data.times];
    next[index] = val;
    update({ times: next, timesEdited: true });
  }

  function removeTime(index: number) {
    update({ times: data.times.filter((_, i) => i !== index), timesEdited: true });
  }

  function addTime() {
    update({ times: [...data.times, '12:00'], timesEdited: true });
  }

  function useSuggested() {
    // Reset to suggestions and mark as "not edited" so it stays in sync again.
    update({ times: suggestedTimesFor(data.platforms), timesEdited: false });
  }

  const hasNoTimes = data.times.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Start date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          min={todayStr}
          value={data.postingDate}
          onChange={(e) => update({ postingDate: e.target.value })}
          className="border border-slate-300 rounded-lg px-3 py-2"
        />
        <p className="text-xs text-slate-400 mt-1">The first day posts will be scheduled.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">How many days of content?</label>
        <div className="flex gap-2">
          {[5, 10].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => update({ dayLimit: n as 5 | 10 })}
              className={
                'px-5 py-2.5 rounded-lg border font-medium transition-colors ' +
                (data.dayLimit === n
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 hover:border-slate-400')
              }
            >
              {n} days
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Generates 2 posts per day = {data.dayLimit * 2} posts total.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium">
            Posting times <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-400">{suggestionBasis(data.platforms)}</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Pre-filled with suggested times — these are starting guesses based on general
          posting-time studies, not guarantees. Edit them, add slots, or remove any you don't want.
        </p>

        <div className="space-y-2">
          {data.times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={t}
                onChange={(e) => setTime(i, e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={() => removeTime(i)}
                disabled={data.times.length <= 1}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                title={data.times.length <= 1 ? 'At least one time is required' : 'Remove this time'}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={addTime}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100"
          >
            + Add time slot
          </button>
          <button
            type="button"
            onClick={useSuggested}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100"
          >
            Use suggested times
          </button>
        </div>

        {hasNoTimes && (
          <p className="text-xs text-amber-600 mt-2">Add at least one posting time.</p>
        )}
      </div>
    </div>
  );
}
