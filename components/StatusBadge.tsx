import { Badge } from "./ui/badge";

export function StatusBadge() {
  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      local
    </Badge>
  );
}
