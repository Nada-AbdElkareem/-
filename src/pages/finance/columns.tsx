import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/DataTableColumnHeader"
import { MoreHorizontal, FileText, CheckCircle2, Clock, XCircle, User, Download } from "lucide-react"
import { cn, safeFormat } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export interface Invoice {
  id: number
  patientId: number
  patient: {
    fullName: string
  }
  totalAmount: number
  paidAmount: number
  status: string
  createdAt: string
  updatedAt: string
  [key: string]: any
}

export const getColumns = (
  onView: (invoice: Invoice) => void,
  onPay: (invoice: Invoice) => void
): ColumnDef<Invoice>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الفاتورة" />
    ),
    cell: ({ row }) => <span className="font-mono text-[10px] font-black text-slate-400 font-bold">#INV-{row.getValue("id")}</span>,
  },
  {
    accessorKey: "patient.fullName",
    id: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المريض / العميل" />
    ),
    cell: ({ row }) => {
      const patientName = row.original.patient?.fullName
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">{patientName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المبلغ الإجمالي" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-black text-slate-800">
        {(row.getValue("totalAmount") as number).toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span>
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge className={cn(
          "text-[9px] h-5 font-black uppercase tracking-widest border",
          status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
          status === "partial" ? "bg-blue-50 text-blue-700 border-blue-100" :
          "bg-slate-50 text-slate-500 border-slate-200"
        )}>
          {status === "paid" ? "مدفوعة" :
           status === "partial" ? "مدفوعة جزئياً" : "غير مدفوعة"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإصدار" />
    ),
    cell: ({ row }) => (
      <span className="text-[10px] font-bold text-slate-500">
        {safeFormat(row.getValue("createdAt"), "dd MMMM yyyy", { locale: ar })}
      </span>
    ),
  },
  {
    id: "actions",
    header: "إدارة",
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button variant="ghost" className="h-8 w-8 p-0" {...props}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          />
          <DropdownMenuContent align="end" className="text-right">
            <DropdownMenuLabel>الإجراءات المالية</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(invoice)}>
              <FileText className="ml-2 h-4 w-4" />
              عرض الفاتورة
            </DropdownMenuItem>
            {invoice.status !== "paid" && (
              <DropdownMenuItem onClick={() => onPay(invoice)} className="text-emerald-500">
                <CheckCircle2 className="ml-2 h-4 w-4" />
                تحصيل دفعة
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-slate-400">
              <Download className="ml-2 h-4 w-4" />
              تحميل PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
