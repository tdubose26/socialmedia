import { useState } from 'react';

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  allowOther?: boolean;
  otherPlaceholder?: string;
};

const baseChip = 'px-3 py-1.5 rounded-full text-sm border transition-colors';
const onChip = `${baseChip} bg-slate-900 text-white border-slate-900`;
const offChip = `${baseChip} bg-white text-slate-700 border-slate-300 hover:border-slate-400`;

export default function ChipSelect({
  options,
  value,
  onChange,
  allowOther = true,
  otherPlaceholder = 'Add your own…',
}: Props) {
  const [draft, setDraft] = useState('');

  function toggle(option: string) {
    if (value.includes(option)) onChange(value.filter((v) => v !== option));
    else onChange([...value, option]);
  }

  function addCustom() {
    const v = draft.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setDraft('');
  }

  // Selected values that aren't in the preset list are custom additions.
  const customChips = value.filter((v) => !options.includes(v));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={value.includes(opt) ? onChip : offChip}
          >
            {opt}
          </button>
        ))}
        {customChips.map((opt) => (
          <button type="button" key={opt} onClick={() => toggle(opt)} className={onChip}>
            {opt} <span className="opacity-70">✕</span>
          </button>
        ))}
      </div>

      {allowOther && (
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder={otherPlaceholder}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addCustom}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
