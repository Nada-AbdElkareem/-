import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/DataTableColumnHeader"
import { MoreHorizontal, Edit, Trash, Settings, Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export interface Service {
  id: number
  name: string
  category: string
  unitCost: number
  [key: string]: any
}

export const getColumns = (
  onEdit: (service: Service) => void,
  onDelete: (id: number) => void
): ColumnDef<Service>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => <span className="text-[10px] font-mono text-slate-400">#{row.getValue("id")}</span>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الخدمة" />
    ),
    cell: ({ row }) => {
      const service = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
             <Settings className="w-4 h-4 opacity-50" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{service.name}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{service.category}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التصنيف" />
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return (
        <Badge className="text-[9px] h-5 font-black uppercase tracking-widest bg-slate-100 text-slate-600 border-none">
          {category === "Meals" ? "وجبات" : 
           category === "Medical" ? "طبي" : 
           category === "Transport" ? "انتقالات" : 
           category === "Laundry" ? "مغسلة" : category}
        </Badge>
      )
    },
  },
  {
    accessorKey: "unitCost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التكلفة" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs font-bold text-slate-700">
        {(row.getValue("unitCost") as number).toLocaleString()} <span className="text-[9px] text-slate-300">ج.م</span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "خيارات",
    cell: ({ row }) => {
      const service = row.original
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
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Edit className="ml-2 h-4 w-4" />
              تعديل الخدمة
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={() => onDelete(service.id)}
            >
              <Trash className="ml-2 h-4 w-4" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
