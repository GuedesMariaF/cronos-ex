import { formatTime } from "../lib/format";
import { Separator } from "./ui/separator";

interface DomainRowProps {
  domain: string;
  seconds: number;
  totalSeconds: number;
  rank: number;
}

export function DomainRow({ domain, seconds, totalSeconds, rank }: DomainRowProps) {
  const pct = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums text-right">
            {rank}
          </span>
          <img
            src={`https://www.google.com/s2/favicons?sz=16&domain=${domain}`}
            alt=""
            className="w-4 h-4 shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-sm truncate">{domain}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
          {formatTime(seconds)}
        </span>
      </div>
      <div className="h-px bg-secondary ml-6 overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
