import * as React from "react"
import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-2 space-x-reverse", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-[state=open]:bg-accent text-[10px] font-black uppercase tracking-widest text-slate-400"
              {...props}
            >
              <span>{title}</span>
              {column.getIsSorted() === "desc" ? (
                <ArrowDown className="mr-2 h-3.5 w-3.5" />
              ) : column.getIsSorted() === "asc" ? (
                <ArrowUp className="mr-2 h-3.5 w-3.5" />
              ) : (
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
              )}
            </Button>
          )}
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="ml-2 h-3.5 w-3.5 text-muted-foreground/70" />
            تصاعدي
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="ml-2 h-3.5 w-3.5 text-muted-foreground/70" />
            تنازلي
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="ml-2 h-3.5 w-3.5 text-muted-foreground/70" />
            إخفاء
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
