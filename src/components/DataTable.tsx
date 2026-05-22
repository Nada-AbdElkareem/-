"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnResizeMode,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDown, 
  ArrowUpDown, 
  Pin, 
  GripVertical, 
  Settings2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Maximize2, 
  Minimize2 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  pinnedColumns?: string[] // IDs of columns to pin to the right (since it's RTL)
  renderExpandedRow?: (row: TData) => React.ReactNode
  expandedRowIds?: Set<string | number>
  onRowClick?: (row: TData) => void
  density?: "compact" | "normal"
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pinnedColumns = [],
  renderExpandedRow,
  expandedRowIds = new Set(),
  onRowClick,
  density = "normal",
  pageSize = 20,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnResizeMode] = React.useState<ColumnResizeMode>("onChange")
  const [localDensity, setLocalDensity] = React.useState<"compact" | "normal">(density)
  
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  })

  React.useEffect(() => {
    setLocalDensity(density)
  }, [density])

  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageSize }))
  }, [pageSize])

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {searchKey && (
          <Input
            placeholder="البحث السريع..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm h-11 border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 text-right text-sm font-bold rounded-xl"
            dir="rtl"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {/* Density size controls to satisfy Arabic instruction of 'controlling size/density of the list visual elements' */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Button
              variant={localDensity === "compact" ? "secondary" : "ghost"}
              className={cn(
                "h-9 px-3 gap-2 text-xs font-black rounded-lg transition-all",
                localDensity === "compact" && "bg-white text-blue-600 shadow-sm"
              )}
              onClick={() => setLocalDensity("compact")}
              title="مظهر مضغوط لعرض بيانات أكثر في الشاشة"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              عرض مضغوط
            </Button>
            <Button
              variant={localDensity === "normal" ? "secondary" : "ghost"}
              className={cn(
                "h-9 px-3 gap-2 text-xs font-black rounded-lg transition-all",
                localDensity === "normal" && "bg-white text-blue-600 shadow-sm"
              )}
              onClick={() => setLocalDensity("normal")}
              title="مظهر عادي بمسافات مريحة"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              عرض مريح
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button variant="outline" className="h-11 border-slate-200 gap-2 shadow-sm rounded-xl font-black text-xs" {...props}>
                  <ChevronDown className="h-4 w-4" />
                  تخصيص الأعمدة
                </Button>
              )}
            />
            <DropdownMenuContent align="end" className="w-[200px] text-right rounded-xl" dir="rtl">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="rounded-lg font-bold"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table style={{ width: table.getCenterTotalSize(), minWidth: '100%', tableLayout: 'fixed' }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "relative group p-0 text-right",
                        pinnedColumns.includes(header.column.id) && "sticky left-0 z-20 bg-slate-50 border-r border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]"
                      )}
                    >
                      <div className={cn(
                        "px-4 h-full flex items-center bg-inherit font-black text-xs text-slate-500 uppercase tracking-widest justify-start",
                        localDensity === "compact" ? "py-2" : "py-4"
                      )}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                      
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute left-0 top-0 h-full w-1.5 cursor-col-resize user-select-none touch-none hover:bg-blue-400 group-hover:opacity-100 opacity-0 transition-all flex items-center justify-center z-30",
                            header.column.getIsResizing() && "bg-blue-600 opacity-100 w-1"
                          )}
                        >
                           <div className="w-0.5 h-6 bg-slate-300 rounded-full group-hover:bg-blue-200" />
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-blue-50/20 transition-colors border-b-slate-100 cursor-pointer",
                      expandedRowIds.has((row.original as any).id) && "bg-blue-50/40"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isPinned = pinnedColumns.includes(cell.column.id)
                      return (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={cn(
                            isPinned && "sticky left-0 z-10 bg-white border-r border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] text-right",
                            localDensity === "compact" ? "py-2" : "py-4"
                          )}
                        >
                          <div className={cn(isPinned && "bg-inherit")}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {expandedRowIds.has((row.original as any).id) && renderExpandedRow && (
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="p-4 bg-blue-50/10">
                          {renderExpandedRow(row.original)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-slate-400 font-bold text-sm">
                  لا توجد نتائج مطابقة للبحث أو البيانات فارغة.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination control allowing user to fully specify list/table page size and see rows */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2" dir="rtl">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500 font-bold">
          <span>
            تم اختيار {table.getFilteredSelectedRowModel().rows.length} من{" "}
            {table.getFilteredRowModel().rows.length} صف(وف).
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400">حجم الصفحة:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  إظهار {size} صفوف
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* First page button */}
          <Button
            variant="outline"
            className="h-9 w-9 p-0 border-slate-200 rounded-lg active:scale-95 transition-all"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="الصفحة الأولى"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          {/* Previous page button */}
          <Button
            variant="outline"
            className="h-9 px-3 gap-1 border-slate-200 rounded-lg font-bold text-xs active:scale-95 transition-all"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <span className="text-xs font-bold text-slate-500 px-2 select-none">
            صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount() || 1}
          </span>

          {/* Next page button */}
          <Button
            variant="outline"
            className="h-9 px-3 gap-1 border-slate-200 rounded-lg font-bold text-xs active:scale-95 transition-all"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            التالي
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            className="h-9 w-9 p-0 border-slate-200 rounded-lg active:scale-95 transition-all"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="الصفحة الأخيرة"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
