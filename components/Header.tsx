interface HeaderProps {
  subtitle?: string;
}

export function Header({ subtitle }: HeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center border border-primary bg-primary/10 shrink-0">
        <span className="text-xs font-bold text-primary">C</span>
      </div>
      <div>
        <p className="text-sm font-semibold leading-none tracking-tight">Cronos</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
