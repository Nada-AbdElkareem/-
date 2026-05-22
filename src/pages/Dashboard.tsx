import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { cn, safeFormat } from "@/lib/utils";
import { ar } from "date-fns/locale";
import { 
  Users, 
  Home, 
  Bed, 
  CalendarCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity,
  Wrench,
  Clock,
  AlertCircle,
  Coins
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    Promise.all([
      apiRequest("/dashboard/stats"),
      apiRequest("/dashboard/charts"),
      apiRequest("/maintenance/overview")
    ])
    .then(([statsData, charts, alerts]) => {
      setStats(statsData);
      setChartData(charts);
      setMaintenanceAlerts(alerts);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Polling every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const totalRooms = (stats?.occupiedRooms || 0) + (stats?.availableRooms || 0);
  const occupancyRate = totalRooms > 0 ? Math.round((stats?.occupiedRooms / totalRooms) * 100) : 0;

  const kpis = [
    { name: "إجمالي الحالات", value: stats?.totalPatients || 0, emoji: "👥", color: "bg-blue-50 text-blue-600", trend: "مسجل حالياً" },
    { name: "المرافقين", value: stats?.totalCompanions || 0, emoji: "🤝", color: "bg-orange-50 text-orange-600", trend: "مرافقين نشطين" },
    { name: "نسبة الإشغال", value: occupancyRate + "%", emoji: "🏠", color: "bg-amber-50 text-amber-600", trend: "غرف مشغولة" },
    { name: "الغرف المتاحة", value: stats?.availableRooms || 0, emoji: "🛏️", color: "bg-emerald-50 text-emerald-600", trend: "سرير جاهز" },
    { name: "الإيرادات", value: (stats?.totalRevenue || 0).toLocaleString() + " ج.م", emoji: "💰", color: "bg-purple-50 text-purple-600", trend: "تراكمي", isRevenue: true },
  ];

  const occupancyPieData = [
    { name: 'مشغول', value: stats?.occupiedRooms || 0 },
    { name: 'متاح', value: stats?.availableRooms || 0 },
  ];

  if (loading && !stats) {
    return (
      <div className="space-y-6 w-full animate-pulse p-4" dir="rtl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full" dir="rtl">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">لوحة التحكم الرئيسية</h1>
        <p className="text-xs text-slate-500">نظرة عامة على أداء دار الضيافة والحالة التشغيلية والمالية</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white group border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner transition-transform group-hover:scale-110", kpi.color)}>
                  {kpi.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">{kpi.name}</p>
                  <p className={cn("text-2xl font-bold text-slate-800", kpi.isRevenue && "underline decoration-purple-200")}>{kpi.value.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md self-start mt-1 text-slate-400">
                  {kpi.trend}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col rounded-2xl">
          <CardHeader className="p-5 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-slate-800">حركة الدخول والعمليات</CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400">متابعة النشاط الأسبوعي لدار الضيافة</CardDescription>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                  <span className="text-[10px] font-black text-slate-600">تسجيل دخول</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-[10px] font-black text-slate-600">خروج المريض</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDischarges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748b", fontWeight: "700" }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#64748b", fontWeight: "700" }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "16px", 
                      border: "none", 
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", 
                      direction: "rtl", 
                      textAlign: "right",
                      fontFamily: "inherit",
                      padding: "12px"
                    }}
                    labelStyle={{ fontWeight: 900, marginBottom: "8px", fontSize: "14px", color: "#1e293b" }}
                    itemStyle={{ fontSize: "12px", fontWeight: 700, padding: "2px 0" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="admissions" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAdmissions)" 
                    name="حالات دخول"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="discharges" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDischarges)" 
                    name="حالات خروج"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white p-6 rounded-3xl flex flex-col items-center text-center relative overflow-hidden">
            <h2 className="font-black text-slate-800 text-sm mb-6 w-full text-right z-10">تحليل إشغال الأسرة اليوم</h2>
            <div className="h-64 w-full z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={occupancyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="absolute top-[175px]">
               <p className="text-3xl font-black text-slate-800">{occupancyRate}%</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">نسبة الإشغال</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-6 z-10">
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                    <p className="text-xl font-black text-blue-600">{stats?.occupiedRooms || 0}</p>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">غرف مشغولة</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xl font-black text-slate-600">{stats?.availableRooms || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">غرف متاحة</p>
                </div>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 border-slate-200 shadow-sm bg-white p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    الإيرادات الأسبوعية
                </h3>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                            formatter={(value: any) => [`${value} ج.م`, 'الإيرادات']}
                        />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">إجمالي إيرادات الـ 7 أيام الماضية</p>
                <p className="text-2xl font-black text-slate-800 text-center mt-1">
                    {chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0).toLocaleString()} <span className="text-sm font-bold opacity-60">ج.م</span>
                </p>
            </div>
         </Card>

         <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white p-6 rounded-3xl">
            <h2 className="font-black text-slate-800 text-sm mb-6 flex items-center justify-between">
              تنبيهات النظام عاجلة
              {maintenanceAlerts.length > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] px-3 py-1 rounded-full font-black animate-bounce">
                    {maintenanceAlerts.length} صيانة مطلوبة
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenanceAlerts.length > 0 ? maintenanceAlerts.slice(0, 4).map((alert, idx) => (
                <div key={`${alert.id}-${idx}`} className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl group hover:shadow-md hover:bg-white transition-all border border-slate-100/50">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm shrink-0 border border-red-50">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-900 leading-tight">{alert.taskName}</p>
                        <Badge variant="outline" className="text-[8px] bg-red-50 text-red-600 border-red-100">قريب جداً</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">الأصل: {alert.assetName}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-bold">
                        <Clock className="w-3 h-3" />
                        {safeFormat(alert.nextMaintenanceDate, "dd MMMM yyyy", { locale: ar })}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                    <div className="inline-flex w-16 h-16 rounded-full bg-emerald-50 items-center justify-center text-emerald-500 mb-4">
                        <Activity className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">لا توجد تنبيهات عاجلة حالياً</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">النظام يعمل كالمعتاد بكفاءة عالية</p>
                </div>
              )}
            </div>
         </Card>
      </div>
    </div>
  );
}
