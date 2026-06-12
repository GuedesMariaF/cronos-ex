import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  pendingCount: number;
}

export function StatusBadge({ pendingCount }: StatusBadgeProps) {
  if (pendingCount === 0) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        sync ok
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      {pendingCount} pendente(s)
    </Badge>
  );
}
