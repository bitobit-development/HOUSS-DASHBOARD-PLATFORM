// components/status-section-cards.tsx
// -----------------------------------------------------------------------------
// Two ShadCN cards (plant + inverter) always side‑by‑side (grid‑cols‑2 at base).
// -----------------------------------------------------------------------------
'use client';

import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { StatusPieCard } from '@/components/status-pie';

export type Summary = {
  total: number;
  normal: number;
  offline: number;
  warning: number;
  fault: number;
  protect: number;
};

type Props = {
  plantSummary?: Summary;
  inverterSummary?: Summary;
};

export default function StatusSectionCards({ plantSummary, inverterSummary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 lg:px-6">
      {/* Plant card */}
      <Card data-slot="card" className="@container/card">
        <CardHeader className="pb-0">
          <CardDescription>Plant Health</CardDescription>
          {plantSummary && (
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {plantSummary.total ?? '--'} total
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {plantSummary && <StatusPieCard title="Plant Status" summary={plantSummary} />}
        </CardContent>
      </Card>

      {/* Inverter card */}
      <Card data-slot="card" className="@container/card">
        <CardHeader className="pb-0">
          <CardDescription>Inverter Health</CardDescription>
          {inverterSummary && (
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {inverterSummary.total ?? '--'} total
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {inverterSummary && <StatusPieCard title="Inverter Status" summary={inverterSummary} />}
        </CardContent>
      </Card>
    </div>
  );
}
