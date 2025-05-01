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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  ArrowUpDownIcon,
} from 'lucide-react';

import getEstatePlants from '@/lib/api/get_estate_plants_table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export interface EstatePlantRow {
  id: number;
  name: string;
  residential_estates: {
    id: number;
    estate_name: string;
    physical_address: string;
    estate_type: string;
    estate_description: string;
    estate_area: string;
  };
  status: number;
  pac: number;
  efficiency: number;
  etoday: number;
  etotal: number;
  thumb_url?: string;
  address?: string;
}

interface ApiResp {
  rows: EstatePlantRow[];
  total: number;
  pageSize: number;
  pageNumber: number;
}

// Fetch a page from the API
async function fetchPage(page: number): Promise<ApiResp> {
  const { data, error } = await getEstatePlants({ page, pageSize: 30 });
  if (error || !data) throw error ?? new Error('Unexpected empty payload');
  return data as unknown as ApiResp; // satisfy TS
}

// -----------------------------------------------------------------------------
// Column definitions
// -----------------------------------------------------------------------------
const columns: ColumnDef<EstatePlantRow>[] = [
  {
    accessorFn: (row) => row.residential_estates.estate_name,
    id: 'estate',
    header: 'Estate',
    enableSorting: true,
  },
  { accessorKey: 'name', header: 'Plant', enableSorting: true },
  {
    accessorKey: 'pac',
    header: 'kW',
    cell: ({ row }) => (row.original.pac / 1000).toFixed(1),
    enableSorting: true,
  },
  { accessorKey: 'etoday', header: 'Today (kWh)', enableSorting: true },
  { accessorKey: 'etotal', header: 'Total (kWh)', enableSorting: true },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function EstatePlantsTable() {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading, isValidating } = useSWR<ApiResp>(
    ['estate-plants', page],
    () => fetchPage(page)
  );

  const rows      = data?.rows     ?? [];
  const total     = data?.total    ?? 0;
  const pageSize  = data?.pageSize ?? 30;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const loading   = isLoading || isValidating;

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _id, val) =>
      row.original.name.toLowerCase().includes(String(val).toLowerCase()) ||
      row.original.residential_estates.estate_name
        .toLowerCase()
        .includes(String(val).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount,
  });

  // Pagination helpers
  const pagesToShow = () => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end   = Math.min(pageCount, page + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  const Pagination = () => (
    <div className="flex items-center gap-2">
      <Button size="icon" variant="outline"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1 || loading}>
        <ChevronLeftIcon className="size-4" />
      </Button>
      {pagesToShow().map((n) => (
        <Button key={n} size="sm" variant={n === page ? 'default' : 'outline'}
          onClick={() => setPage(n)} disabled={loading}>
          {n}
        </Button>
      ))}
      <Button size="icon" variant="outline"
        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        disabled={page >= pageCount || loading}>
        <ChevronRightIcon className="size-4" />
      </Button>
      <Input
        type="number"
        min={1}
        max={pageCount}
        value={page}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val >= 1 && val <= pageCount) setPage(val);
        }}
        className="w-16"
        placeholder="#"
      />
    </div>
  );

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------
  return (
    <div className="relative space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Input
          placeholder="Search estate or plant…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-64"
        />
        <Pagination />
      </div>

      {/* Loading overlay */}
      <div className={`absolute inset-x-0 top-24 bottom-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
        loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <Loader2Icon className="size-8 animate-spin" />
      </div>

      {/* Table */}
      <Table className={`transition-opacity duration-300 ${
        loading ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="cursor-pointer select-none"
                  onClick={() => h.column.toggleSorting()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanSort() && <ArrowUpDownIcon className="size-3 opacity-50" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((r) => (
              <TableRow key={r.id}>
                {r.getVisibleCells().map((c) => (
                  <TableCell key={c.id}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Bottom pagination */}
      <div className="flex justify-end px-4 lg:px-6">
        <Pagination />
      </div>
    </div>
  );
}
