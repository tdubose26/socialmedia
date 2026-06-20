import ChipSelect from '../ChipSelect';

type Props = {
  description: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export default function PreferenceStep({ description, options, value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{description}</p>
      <ChipSelect options={options} value={value} onChange={onChange} otherPlaceholder="Add your own…" />
      <p className="text-xs text-slate-400">Optional — pick any that apply, or add your own.</p>
    </div>
  );
}
