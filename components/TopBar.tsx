interface Props { title: string; subtitle?: string; children?: React.ReactNode; }
export default function TopBar({ title, subtitle, children }: Props) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
