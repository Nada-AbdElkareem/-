import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/DataTableColumnHeader"
import { Phone, MapPin, Activity, MoreHorizontal, User, Eye, Edit, Trash } from "lucide-react"
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

export interface Patient {
  id: number
  fullName: string
  nationalId: string
  mobile: string
  governorate: string
  diagnosis: string
  hospital: string
  caseStatus: string
  photoUrl?: string
  registrationDate: string
  asylumStatus: string
  [key: string]: any
}

export const getColumns = (
  onView: (patient: Patient) => void,
  onEdit: (patient: Patient) => void,
  onDelete: (id: number) => void
): ColumnDef<Patient>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => <span className="text-xs font-mono text-slate-400">#{row.getValue("id")}</span>,
  },
  {
    accessorKey: "fullName",
    size: 320,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المريض" />
    ),
    cell: ({ row }) => {
      const patient = row.original
      return (
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner overflow-hidden">
            {patient.photoUrl ? (
              <img src={patient.photoUrl} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <User className="w-5 h-5 opacity-30" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-800">{patient.fullName}</p>
              <span className={cn(
                "w-2.5 h-2.5 rounded-full border border-white",
                patient.caseStatus === "critical" ? "bg-red-500 animate-pulse" :
                patient.caseStatus === "stable" ? "bg-emerald-500" :
                patient.caseStatus === "discharged" ? "bg-slate-400" :
                "bg-blue-500"
              )} />
            </div>
            <p className="text-xs font-mono text-slate-400 tracking-tight">{patient.nationalId}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "mobile",
    size: 160,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الهاتف" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Phone className="w-4 h-4 opacity-50" />
        {row.getValue("mobile")}
      </div>
    ),
  },
  {
    accessorKey: "governorate",
    size: 160,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المحافظة" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <MapPin className="w-4 h-4 opacity-50" />
        {row.getValue("governorate")}
      </div>
    ),
  },
  {
    accessorKey: "diagnosis",
    size: 400,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التشخيص" />
    ),
    cell: ({ row }) => (
      <div className="space-y-1 py-1">
        <p className="text-xs font-black text-slate-700 leading-tight">{row.getValue("diagnosis") || "بدون تشخيص"}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{row.original.hospital || "غير محدد"}</p>
      </div>
    ),
  },
  {
    accessorKey: "caseStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("caseStatus") as string
      return (
        <Badge className={cn(
          "text-xs h-7 font-black tracking-tighter border-2 px-3",
          status === "critical" ? "bg-red-50 text-red-700 border-red-100" :
          status === "stable" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
          status === "discharged" ? "bg-slate-50 text-slate-600 border-slate-200" :
          "bg-blue-50 text-blue-700 border-blue-100"
        )}>
          {status === "stable" ? "مستقر" :
           status === "critical" ? "حرج" :
           status === "discharged" ? "خروج" : status || "مستقر"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "registrationDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ التسجيل" />
    ),
    cell: ({ row }) => (
      <span className="text-xs font-black text-slate-500 whitespace-nowrap">
        {safeFormat(row.getValue("registrationDate"), "dd/MM/yyyy", { locale: ar })}
      </span>
    ),
  },
  {
    id: "actions",
    size: 80,
    enableHiding: false,
    header: "خيارات",
    cell: ({ row }) => {
      const patient = row.original
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
            <DropdownMenuLabel>العمليات</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(patient)}>
              <Eye className="ml-2 h-4 w-4" />
              عرض الملف الشامل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(patient)}>
              <Edit className="ml-2 h-4 w-4" />
              تعديل البيانات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={() => onDelete(patient.id)}
            >
              <Trash className="ml-2 h-4 w-4" />
              حذف المريض
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
