// components/metrics-card.tsx
import {
  Card, CardHeader, CardTitle, CardDescription, CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";

export interface Metric {
  id: string;                 // unique key
  label: string;              // “Total Plants”, “Offline”, …
  value: string | number;     // formatted value
  trend?: string;             // “+12.5%”
  trendDir?: "up" | "down";   // arrow direction
  note?: string;              // footer line 1
  subNote?: string;           // footer line 2
}

export function MetricsCard({
  label, value, trend, trendDir = "up", note, subNote,
}: Metric) {
  return (
    <Card data-slot="card" className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums"
        >
          {value}
        </CardTitle>

        {trend && (
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {trendDir === "up" ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {trend}
            </Badge>
          </div>
        )}
      </CardHeader>

      {(note || subNote) && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {note && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {note}
              {trendDir === "up" ? (
                <TrendingUpIcon className="size-4" />
              ) : (
                <TrendingDownIcon className="size-4" />
              )}
            </div>
          )}
          {subNote && <div className="text-muted-foreground">{subNote}</div>}
        </CardFooter>
      )}
    </Card>
  );
}
