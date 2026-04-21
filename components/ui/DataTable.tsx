// components/ui/DataTable.tsx
'use client';

import React, { useState, useMemo } from 'react';  // ← agregado React
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Row,
} from '@tanstack/react-table';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
export interface DataTableProps<TData> {
  data:           TData[];
  columns:        ColumnDef<TData, any>[];
  loading?:       boolean;
  emptyText?:     string;
  searchable?:    boolean;
  searchPlaceholder?: string;
  pageSizes?:     number[];
  defaultPageSize?: number;
  renderExpanded?: (row: Row<TData>) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  toolbar?: React.ReactNode;
}

const PAGE_SIZES_DEFAULT = [10, 25, 50, 100];

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS BASE
// ─────────────────────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '9px 14px',
  fontSize: '.56rem',
  fontWeight: 600,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: '#9ab8a2',
  borderBottom: '1px solid rgba(0,0,0,.1)',
  whiteSpace: 'nowrap',
  fontFamily: 'monospace',
  background: 'rgba(0,0,0,.03)',
  userSelect: 'none',
  cursor: 'pointer',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (!sorted) return <span style={{ marginLeft: 4, opacity: .4, fontSize: '.65rem', color: '#9ab8a2' }}>↕</span>;
  return <span style={{ marginLeft: 4, fontSize: '.65rem', color: '#3a9956' }}>{sorted === 'asc' ? '↑' : '↓'}</span>;
}

function Skeleton() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} style={{ padding: '12px 14px' }}>
              <div style={{
                height: 12, borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(0,0,0,.06) 25%, rgba(0,0,0,.03) 50%, rgba(0,0,0,.06) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
                width: `${60 + Math.random() * 30}%`,
              }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function DataTable<TData>({
  data,
  columns,
  loading = false,
  emptyText = 'No hay registros que coincidan.',
  searchable = true,
  searchPlaceholder = 'Buscar...',
  pageSizes = PAGE_SIZES_DEFAULT,
  defaultPageSize = 10,
  renderExpanded,
  onRowClick,
  toolbar,
}: DataTableProps<TData>) {
  const [sorting,          setSorting]          = useState<SortingState>([]);
  const [globalFilter,     setGlobalFilter]     = useState('');
  const [columnFilters,    setColumnFilters]    = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expandedRows,     setExpandedRows]     = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility },
    onSortingChange:          setSorting,
    onGlobalFilterChange:     setGlobalFilter,
    onColumnFiltersChange:    setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel:          getCoreRowModel(),
    getSortedRowModel:        getSortedRowModel(),
    getFilteredRowModel:      getFilteredRowModel(),
    getPaginationRowModel:    getPaginationRowModel(),
    initialState: { pagination: { pageSize: defaultPageSize } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows   = table.getFilteredRowModel().rows.length;
  const totalPages  = table.getPageCount();
  const visibleFrom = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const visibleTo   = Math.min((pageIndex + 1) * pageSize, totalRows);

  const toggleExpanded = (rowId: string) =>
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, Math.min(pageIndex - 2, totalPages - 5));
    const end   = Math.min(totalPages, start + 5);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  }, [pageIndex, totalPages]);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .dt-row:hover { background: #f5faf6 !important; }
        .dt-row-clickable { cursor: pointer; }
        .dt-th:hover { background: rgba(0,0,0,.05) !important; }
        .dt-page-btn:hover:not(:disabled) { background: rgba(58,153,86,.08) !important; border-color: rgba(58,153,86,.3) !important; color: #2e7d46 !important; }
      `}</style>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8, padding: '13px 20px',
        borderBottom: '1px solid rgba(0,0,0,.06)', background: 'rgba(0,0,0,.02)' }}>

        <p style={{ fontFamily: 'monospace', fontSize: '.65rem', color: '#6b8f75' }}>
          <span style={{ fontWeight: 600, color: '#2e7d46' }}>{totalRows.toLocaleString('es-CL')}</span> registros
        </p>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {searchable && (
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                width: 12, height: 12, color: '#9ab8a2', pointerEvents: 'none' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={e => { setGlobalFilter(e.target.value); table.setPageIndex(0); }}
                style={{ padding: '6px 12px 6px 28px', borderRadius: 7, fontSize: '.75rem',
                  border: '1px solid rgba(0,0,0,.1)', background: '#fff', color: '#1a2e22',
                  outline: 'none', fontFamily: 'monospace', width: 200 }}
                onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
              />
              {globalFilter && (
                <button onClick={() => setGlobalFilter('')}
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ab8a2',
                    display: 'flex', alignItems: 'center', padding: 0 }}>
                  <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          )}

          <select
            value={pageSize}
            onChange={e => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0); }}
            style={{ padding: '6px 28px 6px 10px', borderRadius: 7, fontFamily: 'monospace',
              fontSize: '.72rem', border: '1px solid rgba(0,0,0,.1)', background: '#fff',
              color: '#3d5c47', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
            {pageSizes.map(s => <option key={s} value={s}>{s} / pág</option>)}
          </select>

          {toolbar}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id} className="dt-th"
                    style={{
                      ...thStyle,
                      textAlign: (header.column.columnDef.meta as any)?.align ?? 'left',
                      width:     (header.column.columnDef.meta as any)?.minWidth ?? header.column.columnDef.size ?? undefined,
                      minWidth:  (header.column.columnDef.meta as any)?.minWidth ?? undefined,
                    }}
                    onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon sorted={header.column.getIsSorted()} />
                    )}
                  </th>
                ))}
                {renderExpanded && <th style={{ ...thStyle, width: 28 }} />}
              </tr>
            ))}
          </thead>

          {loading ? <Skeleton /> : (
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (renderExpanded ? 1 : 0)}
                    style={{ padding: '40px', textAlign: 'center', color: '#9ab8a2',
                      fontFamily: 'monospace', fontSize: '.78rem' }}>
                    {emptyText}
                  </td>
                </tr>
              ) : table.getRowModel().rows.map((row, i) => (
                // ✅ CORRECCIÓN: React.Fragment con key en lugar de <>
                <React.Fragment key={row.id}>
                  <tr
                    className={`dt-row${onRowClick || renderExpanded ? ' dt-row-clickable' : ''}`}
                    style={{ borderBottom: '1px solid rgba(0,0,0,.04)', transition: 'background .12s',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.01)' }}
                    onClick={() => {
                      if (renderExpanded) toggleExpanded(row.id);
                      if (onRowClick) onRowClick(row.original);
                    }}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{
                        padding: '11px 14px', verticalAlign: 'middle',
                        textAlign: (cell.column.columnDef.meta as any)?.align ?? 'left',
                        minWidth: (cell.column.columnDef.meta as any)?.minWidth ?? undefined,
                      }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    {renderExpanded && (
                      <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{ color: '#9ab8a2', display: 'inline-flex', transition: 'transform .2s',
                          transform: expandedRows[row.id] ? 'rotate(180deg)' : 'none' }}>
                          <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </span>
                      </td>
                    )}
                  </tr>
                  {renderExpanded && expandedRows[row.id] && (
                    <tr style={{ background: 'rgba(0,0,0,.015)', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                      <td colSpan={columns.length + 1} style={{ padding: 0 }}>
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* ── Paginación ── */}
      {!loading && totalRows > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8, padding: '13px 20px', borderTop: '1px solid rgba(0,0,0,.04)' }}>
          <p style={{ fontSize: '.65rem', color: '#6b8f75', fontFamily: 'monospace' }}>
            Mostrando {visibleFrom}–{visibleTo} de{' '}
            <span style={{ color: '#2e7d46', fontWeight: 600 }}>{totalRows}</span>
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: '«', action: () => table.setPageIndex(0),             disabled: !table.getCanPreviousPage() },
              { label: '‹', action: () => table.previousPage(),              disabled: !table.getCanPreviousPage() },
            ].map(({ label, action, disabled }) => (
              <button key={label} onClick={action} disabled={disabled}
                className="dt-page-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 30, height: 30, padding: '0 8px', borderRadius: 6,
                  fontFamily: 'monospace', fontSize: '.7rem', fontWeight: 600,
                  border: '1px solid rgba(0,0,0,.1)', background: '#fff', color: '#6b8f75',
                  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1 }}>
                {label}
              </button>
            ))}

            {pageNumbers.map(p => (
              <button key={p} onClick={() => table.setPageIndex(p)}
                className="dt-page-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 30, height: 30, padding: '0 8px', borderRadius: 6,
                  fontFamily: 'monospace', fontSize: '.7rem', fontWeight: 600,
                  border: `1px solid ${p === pageIndex ? 'rgba(58,153,86,.3)' : 'rgba(0,0,0,.1)'}`,
                  background: p === pageIndex ? 'rgba(58,153,86,.08)' : '#fff',
                  color: p === pageIndex ? '#2e7d46' : '#6b8f75',
                  cursor: 'pointer' }}>
                {p + 1}
              </button>
            ))}

            {[
              { label: '›', action: () => table.nextPage(),                  disabled: !table.getCanNextPage() },
              { label: '»', action: () => table.setPageIndex(totalPages - 1),disabled: !table.getCanNextPage() },
            ].map(({ label, action, disabled }) => (
              <button key={label} onClick={action} disabled={disabled}
                className="dt-page-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 30, height: 30, padding: '0 8px', borderRadius: 6,
                  fontFamily: 'monospace', fontSize: '.7rem', fontWeight: 600,
                  border: '1px solid rgba(0,0,0,.1)', background: '#fff', color: '#6b8f75',
                  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1 }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}