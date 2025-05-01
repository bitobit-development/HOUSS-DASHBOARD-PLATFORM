// components/plants-table.tsx — completed code including loading overlay, top & bottom pagination, status legend
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { differenceInMinutes, parseISO } from 'date-fns';

import { getPlants } from '@/lib/api/get_plants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  MinusCircleIcon,
} from 'lucide-react';

export interface PlantRow {
  id: number;
  name: string;
  status: number; // 1: normal, 2: warning, 3: fault, 0: offline
  pac: number;
  efficiency: number;
  etoday: number;
  etotal: number;
  updateAt: string | null;
}

interface ApiResp {
  data: {
    total: number;
    pageSize: number;
    pageNumber: number;
    infos: PlantRow[];
  };
}

const STATUS_MAP = {
  1: { label: 'Normal',  icon: CheckCircle2Icon,  color: 'text-green-500'  },
  2: { label: 'Warning', icon: AlertTriangleIcon, color: 'text-yellow-500' },
  3: { label: 'Fault',   icon: XCircleIcon,      color: 'text-red-500'    },
  0: { label: 'Offline', icon: MinusCircleIcon,  color: 'text-muted-foreground' },
} as const;

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

const columnDefs: ColumnDef<PlantRow>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    cell: ({ row }) => {
      const s = STATUS_MAP[row.original.status] || STATUS_MAP[0];
      const Icon = s.icon;
      return <Icon className={`size-4 ${s.color}`} title={s.label} />;
    },
    sortingFn: (a, b) => a.original.status - b.original.status,
  },
  { accessorKey: 'name', header: 'Plant', enableSorting: true },
  {
    accessorKey: 'efficiency',
    header: () => (
      <div className="flex flex-col leading-none">
        <span>Efficiency</span>
        <span className="text-xs text-muted-foreground">Power / %</span>
      </div>
    ),
    enableSorting: true,
    cell: ({ row }) => {
      const pct = row.original.efficiency * 100;
      const kw = (row.original.pac / 1000).toFixed(1);
      return (
        <div className="flex flex-col w-48">
          <div className="flex justify-between text-xs mb-0.5">
            <span>{kw} kW</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      );
    },
  },
  { accessorKey: 'etoday', header: 'Today (kWh)', enableSorting: true },
  { accessorKey: 'etotal', header: 'Total (kWh)', enableSorting: true },
  {
    accessorKey: 'updateAt',
    header: 'Last update',
    enableSorting: true,
    cell: ({ row }) => timeAgoQuarterWords(row.original.updateAt),
  },
];

export default function PlantsTable() {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading, isValidating } = useSWR<ApiResp>(['plants', page], () => getPlants(page));

  const rows = data?.data.infos || [];
  const total = data?.data.total || 0;
  const pageSize = data?.data.pageSize || 30;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { sorting, columnFilters, globalFilter, pagination: { pageIndex: page - 1, pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _id, val) => row.original.name.toLowerCase().includes(String(val).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount,
  });

  const loading = isLoading || isValidating;

  const pagesToShow = () => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(pageCount, page + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  const PaginationControls = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
        <ChevronLeftIcon className="size-4" />
      </Button>
      {pagesToShow().map(num => (
        <Button key={num} size="sm" variant={num === page ? 'default' : 'outline'} onClick={() => setPage(num)} disabled={loading}>
          {num}
        </Button>
      ))}
      <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount || loading}>
        <ChevronRightIcon className="size-4" />
      </Button>
      <Input
        type="number"
        min={1}
        max={pageCount}
        value={page}
        onChange={e => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val >= 1 && val <= pageCount) setPage(val);
        }}
        className="w-16"
        placeholder="#"
      />
    </div>
  );

  return (
    <div className="relative space-y-4">
      {/* Search & top pagination */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Input
          placeholder="Search plant…"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="w-64"
        />
        <PaginationControls />
      </div>

      {/* Loading overlay */}
      <div
        className={`absolute inset-x-0 top-24 bottom-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Loader2Icon className="size-8 animate-spin" />
      </div>

      {/* Table */}
      <Table className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(header => (
                <TableHead
                  key={header.id}
                  className="select-none cursor-pointer"
                  onClick={() => header.column.toggleSorting()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <ArrowUpDownIcon className="size-3 opacity-50" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.original.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell ?? cell.column.columnDef.accessorKey, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnDefs.length} className="text-center">
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Legend + bottom pagination */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          {Object.entries(STATUS_MAP).map(([key,{icon: Icon, label, color}]) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              <Icon className={`size-4 ${color}`} /> <span>{label}</span>
            </div>
          ))}
        </div>
        <PaginationControls />
      </div>
    </div>
  );
}
