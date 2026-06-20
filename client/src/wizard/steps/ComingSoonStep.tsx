type Props = { title: string; description: string };

export default function ComingSoonStep({ title, description }: Props) {
  return (
    <div className="text-center py-10">
      <div className="text-3xl mb-3">🚧</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-slate-500 max-w-sm mx-auto">{description}</p>
      <p className="text-xs text-slate-400 mt-4">Skipped for MVP — just click Next to continue.</p>
    </div>
  );
}
