import type { DomainEntry } from "../hooks/useTrackerData";
import { DomainRow } from "./DomainRow";
import { Separator } from "./ui/separator";

interface DomainListProps {
  entries: DomainEntry[];
  totalSeconds: number;
}

export function DomainList({ entries, totalSeconds }: DomainListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
        <span className="text-2xl">_</span>
        <p className="text-xs">nenhum dado registrado ainda</p>
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry, i) => (
        <div key={entry.domain}>
          {i > 0 && <Separator />}
          <DomainRow
            domain={entry.domain}
            seconds={entry.seconds}
            totalSeconds={totalSeconds}
            rank={i + 1}
          />
        </div>
      ))}
    </div>
  );
}
