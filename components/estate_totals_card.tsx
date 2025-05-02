'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  differenceInMinutes,
  parseISO,
} from 'date-fns';

import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from '@/components/ui/table';

import { b2bApi } from '@/lib/b2b-api';
import getEstateTotals from '@/lib/api/get_estate_totals';
import getOfflinePlants from '@/lib/api/get_offline_plants';

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────
async function fetchEstates() {
  const res = await b2bApi.get('/db/residential_estates');
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ id: number; estate_name: string }[]>;
}

const useTotals  = (id: number) => useSWR(['estate-totals', id], () => getEstateTotals(id));
const useOffline = (id: number, open: boolean) =>
  useSWR(open ? ['offline', id] : null, () => getOfflinePlants(id));

// Time-ago helper (quarters of an hour)
function timeAgoQuarterWords(iso: string | null) {
  if (!iso) return '—';
  const mins = Math.max(1, differenceInMinutes(new Date(), parseISO(iso)));
  const quarters = Math.round(mins / 15);
  const h = Math.floor(quarters / 4);
  const rem = (quarters % 4) * 15;
  if (h === 0 && rem === 0) return 'just now';
  if (h === 0) return `${rem} min ago`;
  if (rem === 0) return `${h} h ago`;
  return `${h}h ${rem}m ago`;
}

// Efficiency bar
const EfficiencyCell = ({ kw, pct }: { kw: number; pct: number }) => (
  <div className="mx-auto flex w-48 flex-col">
    <div className="mb-0.5 flex justify-between text-xs">
      <span>{kw.toFixed(1)} kW</span>
      <span>{pct.toFixed(1)}%</span>
    </div>
    <Progress value={pct} className="h-2" />
  </div>
);

// Row component
function EstateRow({ id, name }: { id: number; name: string }) {
  const { data: totals, isValidating } = useTotals(id);
  const [open, setOpen] = useState(false);
  const { data: offline } = useOffline(id, open);

  const offlineCount = totals?.offline_count ?? 0;
  const onlineCount  = totals?.online_count  ?? 0;
  const lastUpdate   = totals?.last_update   ?? null;

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{name}</TableCell>

        {isValidating ? (
          <>
            <TableCell><Skeleton className="mx-auto h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="mx-auto h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="mx-auto h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="mx-auto h-6 w-10" /></TableCell>
            <TableCell><Skeleton className="mx-auto h-6 w-10" /></TableCell>
            <TableCell><Skeleton className="mx-auto h-4 w-24" /></TableCell>
          </>
        ) : totals ? (
          <>
            {/* Efficiency */}
            <TableCell className="text-center">
              <EfficiencyCell kw={totals.total_kw} pct={totals.efficiency_pct} />
            </TableCell>

            {/* Today / Total */}
            <TableCell className="text-right">{totals.total_today.toFixed(2)}</TableCell>
            <TableCell className="text-right">{totals.total_total.toLocaleString()}</TableCell>

            {/* Online */}
            <TableCell className="text-right">
              <Button size="sm" /* 3-character width, green background */
                className="bg-green-600 hover:bg-green-700 text-white w-[4ch] justify-center">
                {onlineCount}
              </Button>
            </TableCell>

            {/* Offline */}
            <TableCell className="text-right">
              <Button
                variant={offlineCount ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => offlineCount && setOpen(true)}
              >
                {offlineCount}
              </Button>
            </TableCell>

            {/* Last update */}
            <TableCell className="text-right">
              {timeAgoQuarterWords(lastUpdate)}
            </TableCell>
          </>
        ) : (
          <TableCell colSpan={6} className="text-muted-foreground">
            No data
          </TableCell>
        )}
      </TableRow>

      {/* Modal (offline plants) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offline plants – {name}</DialogTitle>
          </DialogHeader>

          {offline ? (
            offline.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plant</TableHead>
                    <TableHead className="text-right">kW</TableHead>
                    <TableHead className="text-right">Today</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offline.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">
                        {(p.pac / 1000).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.etoday.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.etotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No offline plants 🎉</p>
            )
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ──────────────────────────────────────────────────
// Main card
// ──────────────────────────────────────────────────
export default function EstateTotalsCard() {
  const { data: estates, error: listErr } = useSWR('estates', fetchEstates);
  const [selected, setSelected]           = useState<number[]>([]);

  // Default selection
  useEffect(() => {
    if (estates && selected.length === 0) {
      const defaults = estates.filter(e => ['The Precinct', 'INDAWO'].includes(e.estate_name));
      setSelected(defaults.map(d => d.id));
    }
  }, [estates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Select-all helpers
  const allIds      = estates?.map(e => e.id) ?? [];
  const allSelected = selected.length === allIds.length && selected.length > 0;
  const toggleAll   = (chk: boolean) => setSelected(chk ? [...allIds] : []);
  const toggleOne   = (id:number,chk:boolean) =>
    setSelected(prev => chk ? [...prev,id] : prev.filter(x=>x!==id));

  const estateMap = Object.fromEntries((estates ?? []).map(e => [e.id,e.estate_name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estate energy snapshot</CardTitle>
        <p className="text-sm text-muted-foreground">Data in this table is refreshed automatically every hour.</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dropdown */}
        {estates ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-64 justify-between">
                {allSelected
                  ? 'All selected HOUSS estates'
                  : selected.length
                  ? `${selected.length} selected`
                  : 'Choose estates…'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuCheckboxItem
                checked={allSelected}
                onCheckedChange={(c) => toggleAll(c as boolean)}
                {...(
                  selected.length > 0 && selected.length < allIds.length
                    ? { 'data-state': 'indeterminate' as const }   // ← Radix understands this
                    : {}
                )}
              >
                Select all
              </DropdownMenuCheckboxItem>
              <div className="my-1 h-px bg-border" />
              {estates.map(e => (
                <DropdownMenuCheckboxItem
                  key={e.id}
                  checked={selected.includes(e.id)}
                  onCheckedChange={c => toggleOne(e.id, c as boolean)}
                >
                  {e.estate_name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : listErr ? (
          <p className="text-destructive">Failed to load estates.</p>
        ) : (
          <Skeleton className="h-10 w-64" />
        )}

        {selected.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Select estates to view KPIs.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estate</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col leading-none">
                    <span>(Current) Efficiency</span>
                    <span className="text-xs text-muted-foreground">
                      Power&nbsp;/&nbsp;%
                    </span>
                  </div>
                </TableHead>
                <TableHead className="text-right">Today&nbsp;(kWh)</TableHead>
                <TableHead className="text-right">Total&nbsp;(kWh)</TableHead>
                <TableHead className="text-right">Online</TableHead>
                <TableHead className="text-right">Offline</TableHead>
                <TableHead className="text-right">Last update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selected.map(id => (
                <EstateRow key={id} id={id} name={estateMap[id] ?? `Estate #${id}`} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
