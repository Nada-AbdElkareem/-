import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { DataTable } from "@/components/DataTable";
import { getColumns, Invoice } from "@/pages/finance/columns";

export default function Finance() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<any>({ totalRevenue: 0, paidAmount: 0, unpaidAmount: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const columns = getColumns(
    (invoice) => console.log("View", invoice),
    (invoice) => console.log("Pay", invoice)
  );

  const fetchData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (dateFrom) query.append("from", dateFrom);
    if (dateTo) query.append("to", dateTo);
    if (search) query.append("q", search);

    try {
      const [invData, summaryData] = await Promise.all([
        apiRequest(`/finance/invoices?${query.toString()}`),
        apiRequest(`/finance/summary?${query.toString()}`)
      ]);
      setInvoices(invData);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, dateFrom, dateTo]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">إدارة المعاملات المالية</h1>
          <p className="text-slate-500 text-sm font-medium">متابعة الفواتير والتحصيلات والتقارير المالية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-xs font-bold border-slate-200" onClick={() => window.print()}>
            <Download className="w-4 h-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-xl bg-slate-900 border-r-4 border-r-blue-600 text-white overflow-hidden relative group">
          <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <DollarSign className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <CardDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">إجمالي المستحقات</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">{(summary.totalRevenue || 0).toLocaleString()} <span className="text-sm font-medium text-slate-400">ج.م</span></CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold bg-blue-400/5 py-1 px-2 rounded-md w-fit">
              <Activity className="w-3 h-3" />
              <span>إجمالي قيمة الفواتير المصدرة</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 border-r-4 border-r-emerald-500 text-white overflow-hidden relative group">
          <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <CheckCircle2 className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <CardDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">إجمالي التحصيلات</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">{(summary.paidAmount || 0).toLocaleString()} <span className="text-sm font-medium text-slate-400">ج.م</span></CardTitle>
          </CardHeader>
          <CardContent className="relative">
             <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-400/5 py-1 px-2 rounded-md w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>تم السداد الفعلي بنجاح</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 border-r-4 border-r-rose-500 text-white overflow-hidden relative group">
          <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <Clock className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <CardDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">إجمالي المتأخرات</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums text-rose-400">{(summary.unpaidAmount || 0).toLocaleString()} <span className="text-sm font-medium text-slate-400">ج.م</span></CardTitle>
          </CardHeader>
          <CardContent className="relative">
             <div className="flex items-center gap-2 text-[10px] text-rose-400 font-bold bg-rose-400/5 py-1 px-2 rounded-md w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>فواتير لم يتم تحصيلها بعد</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 border-r-4 border-r-amber-500 text-white overflow-hidden relative group">
          <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
            <CreditCard className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <Filter className="w-5 h-5" />
            </div>
            <CardDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">إجمالي الفواتير</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">{(summary.count || 0).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
             <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold bg-amber-400/5 py-1 px-2 rounded-md w-fit">
              <span>آخر إحصائيات المعاملات</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="h-1 bg-slate-100" />
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="رقم الفاتورة أو المريض..." 
                  className="pr-9 h-10 bg-slate-50 border-slate-200 text-xs font-bold"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">من تاريخ</Label>
              <Input 
                type="date" 
                className="h-10 bg-slate-50 border-slate-200 text-xs font-bold"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إلى تاريخ</Label>
              <Input 
                type="date" 
                className="h-10 bg-slate-50 border-slate-200 text-xs font-bold"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant={statusFilter === "all" ? "default" : "outline"} 
                className="flex-1 h-10 text-xs font-bold"
                onClick={() => setStatusFilter("all")}
              >الكل</Button>
              <Button 
                variant={statusFilter === "paid" ? "default" : "outline"} 
                className="flex-1 h-10 text-xs font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                onClick={() => setStatusFilter("paid")}
              >محصل</Button>
              <Button 
                variant={statusFilter === "unpaid" ? "default" : "outline"} 
                className="flex-1 h-10 text-xs font-bold border-rose-100 text-rose-600 hover:bg-rose-50"
                onClick={() => setStatusFilter("unpaid")}
              >متأخر</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
        <CardHeader className="pb-0 px-8 pt-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-800">سجل المعاملات والفواتير</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400">إدارة التدفقات المالية وفواتير المرضى والموردين</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <DataTable 
            columns={columns} 
            data={filteredInvoices} 
            searchKey="fullName"
            pinnedColumns={["actions"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
