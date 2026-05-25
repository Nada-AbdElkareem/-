import * as React from "react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { cn, safeFormat, isValidDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Reports() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    building: "all",
    month: "all"
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/reports/stays");
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredData = reportData.filter(stay => {
    if (filters.building !== "all" && stay.building !== filters.building) return false;
    
    if (filters.month !== "all") {
      const stayMonth = isValidDate(stay.checkInDate) ? new Date(stay.checkInDate).getMonth() + 1 : null;
      if (stayMonth?.toString() !== filters.month) return false;
    }

    if (filters.startDate && isValidDate(stay.checkInDate)) {
      if (new Date(stay.checkInDate) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate && isValidDate(stay.checkInDate)) {
       if (new Date(stay.checkInDate) > new Date(filters.endDate)) return false;
    }

    return true;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["المريض", "الرقم القومي", "الغرفة", "التاريخ", "الخدمات"].join(",") + "\n"
      + filteredData.map(r => [
          r.patientName,
          r.nationalId,
          r.roomNumber,
          safeFormat(r.checkInDate, "yyyy-MM-dd"),
          r.services.map((s: any) => s.name).join("; ")
        ].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_stays_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">تقارير إشغال المرضى</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">التقارير التحليلية</span>
            <p className="text-[11px] text-slate-500 font-medium">سجل تفصيلي للإقامات والخدمات المقدمة للحالات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-9 gap-2 text-xs font-bold border-slate-200"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة
          </Button>
          <Button 
            className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold shadow-md shadow-indigo-200 px-4"
            onClick={handleExport}
          >
            <FileSpreadsheet className="w-4 h-4" />
            تصدير تقرير إكسل
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl border">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">من تاريخ</label>
            <Input 
              type="date" 
              className="h-9 bg-white text-xs border-slate-200 w-40"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">إلى تاريخ</label>
            <Input 
              type="date" 
              className="h-9 bg-white text-xs border-slate-200 w-40"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">المبنى</label>
            <select 
              className="h-9 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none w-32"
              value={filters.building}
              onChange={e => setFilters({...filters, building: e.target.value})}
            >
              <option value="all">الكل</option>
              <option value="Main">المبنى الرئيسي</option>
              <option value="B">مبنى ب</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">الشهر</label>
            <select 
              className="h-9 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none w-32"
              value={filters.month}
              onChange={e => setFilters({...filters, month: e.target.value})}
            >
              <option value="all">كل الشهور</option>
              <option value="1">يناير</option>
              <option value="2">فبراير</option>
              <option value="3">مارس</option>
              <option value="4">إبريل</option>
              <option value="5">مايو</option>
              <option value="6">يونيو</option>
              <option value="7">يوليو</option>
              <option value="8">أغسطس</option>
              <option value="9">سبتمبر</option>
              <option value="10">أكتوبر</option>
              <option value="11">نوفمبر</option>
              <option value="12">ديسمبر</option>
            </select>
          </div>
          <Button 
            variant="ghost" 
            className="h-9 gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4"
            onClick={fetchReport}
          >
            <Filter className="w-3.5 h-3.5" />
            تحديث
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">المريض</TableHead>
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">الإقامة</TableHead>
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">المدة (أيام)</TableHead>
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">الفترة</TableHead>
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">الخدمات الإضافية</TableHead>
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">التكلفة الإجمالية</TableHead>
                <TableHead className="text-[10px] font-black tracking-widest uppercase text-slate-400">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                     جاري جمع البيانات...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                    لا يوجد سجلات للفترة المختارة
                  </TableCell>
                </TableRow>
              ) : filteredData.map((stay, idx) => (
                <TableRow key={`${stay.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{stay.patientName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{stay.nationalId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-600">غرفة: {stay.roomNumber} ({stay.building})</span>
                      <span className="text-[9px] text-slate-400">سرير: {stay.bedNumber}</span>
                    </div>
                  </TableCell>
                   <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-black bg-slate-100 text-slate-600 border-none px-2">
                       {stay.stayDuration || (isValidDate(stay.actualCheckOutDate) && isValidDate(stay.checkInDate) ? 
                         Math.max(1, Math.ceil((new Date(stay.actualCheckOutDate).getTime() - new Date(stay.checkInDate).getTime()) / (1000 * 60 * 60 * 24))) : 
                         isValidDate(stay.checkInDate) ? 
                         Math.max(1, Math.ceil((new Date().getTime() - new Date(stay.checkInDate).getTime()) / (1000 * 60 * 60 * 24))) : 0
                       )} يوم
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] font-medium text-slate-500">
                      <div>من: {safeFormat(stay.checkInDate, "dd MMM yyyy", { locale: ar })}</div>
                      {stay.actualCheckOutDate && (
                         <div>إلى: {safeFormat(stay.actualCheckOutDate, "dd MMM yyyy", { locale: ar })}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {stay.services.map((s: any, idx: number) => (
                        <span key={s.id || `svc-${idx}`} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {s.name} (x{s.quantity})
                        </span>
                      ))}
                      {stay.services.length === 0 && <span className="text-[10px] text-slate-300 italic">لا يوجد</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-black text-slate-800">
                      {(stay.services.reduce((acc: number, s: any) => acc + s.totalCost, 0)).toFixed(2)} ر.س
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      stay.status === "active" ? "text-blue-600 border-blue-200" : "text-emerald-600 border-emerald-200"
                    )}>
                      {stay.status === "active" ? "حالية" : "تمت"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
