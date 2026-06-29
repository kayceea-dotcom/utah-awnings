interface Props {
  label: string;
  children: React.ReactNode;
  hint?: string;
}
export default function Field({ label, children, hint }: Props) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
