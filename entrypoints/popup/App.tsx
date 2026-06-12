import { Card, CardContent, CardFooter, CardHeader } from "../../components/ui/card";
import { DomainList } from "../../components/DomainList";
import { Header } from "../../components/Header";
import { StatusBadge } from "../../components/StatusBadge";
import { useTrackerData } from "../../hooks/useTrackerData";
import { formatTime } from "../../lib/format";

export default function App() {
  const { entries, totalSeconds } = useTrackerData();

  return (
    <Card className="w-80 border-0 shadow-none rounded-none min-h-[200px]">
      <CardHeader className="pb-3">
        <Header
          subtitle={totalSeconds > 0 ? `total hoje: ${formatTime(totalSeconds)}` : "aguardando dados..."}
        />
      </CardHeader>

      <CardContent className="pt-0 px-4">
        <DomainList entries={entries} totalSeconds={totalSeconds} />
      </CardContent>

      <CardFooter className="pt-2 px-4 justify-end">
        <StatusBadge />
      </CardFooter>
    </Card>
  );
}
