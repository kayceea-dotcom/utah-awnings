interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function TopBar({ title, subtitle, children }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-3 sticky top-14 lg:top-0 z-20">
      <div className="flex-1 min-w-0">
        <h1 className="text-base lg:text-sm font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </header>
  );
}
