import * as React from "react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, 
  Plus, 
  Wrench, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2,
  MoreHorizontal,
  LayoutGrid
} from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Asset {
  id: number;
  name: string;
  category: string;
  status: string;
  roomNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number;
  serialNumber: string | null;
}

interface MaintenanceSchedule {
  id: number;
  assetId: number;
  taskName: string;
  frequencyDays: number;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string;
  assignedTo: string | null;
}

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isLogMaintenanceOpen, setIsLogMaintenanceOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>(["أثاث", "كهربائيات", "تجهيزات طبية", "تكييفات", "أخرى"]);
  const [assetNamesSuggestions, setAssetNamesSuggestions] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>(["working", "maintenance", "broken", "decommissioned"]);

  const [assetFormData, setAssetFormData] = useState({
    name: "",
    category: "",
    roomId: "",
    purchaseDate: format(new Date(), "yyyy-MM-dd"),
    purchaseCost: "0",
    lifespanMonths: "60",
    serialNumber: "",
    description: ""
  });

  const [logFormData, setLogFormData] = useState({
    actionTaken: "",
    result: "تم بنجاح",
    cost: "0",
    performedBy: "",
    notes: ""
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    taskName: "",
    frequencyDays: "30",
    nextMaintenanceDate: format(new Date(), "yyyy-MM-dd"),
    assignedTo: ""
  });

  const fetchAssets = async () => {
    try {
      const data = await apiRequest("/assets");
      setAssets(data);
    } catch (err) {
      console.error(err);
      toast.error("فشل تحميل بيانات الأصول");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const data = await apiRequest("/maintenance/overview");
      setUpcomingMaintenance(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchUpcoming();
    apiRequest("/settings")
      .then(settings => {
        if (settings.asset_categories) {
          const cats = settings.asset_categories.split(",").map((s: string) => s.trim());
          setCategories(cats);
          if (cats.length > 0) {
            setAssetFormData(prev => ({ ...prev, category: cats[0] }));
          }
        }
        if (settings.asset_names) {
          setAssetNamesSuggestions(settings.asset_names.split(",").map((s: string) => s.trim()));
        }
        if (settings.asset_statuses) {
          setStatuses(settings.asset_statuses.split(",").map((s: string) => s.trim()));
        }
      })
      .catch(console.error);
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/assets", {
        method: "POST",
        body: JSON.stringify(assetFormData)
      });
      toast.success("تم إضافة الأصل بنجاح");
      setIsAddAssetOpen(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await apiRequest(`/assets/${selectedAsset.id}/maintenance-schedule`, {
        method: "POST",
        body: JSON.stringify(scheduleFormData)
      });
      toast.success("تم جدولة الصيانة بنجاح");
      setIsScheduleOpen(false);
      fetchUpcoming();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await apiRequest("/maintenance-logs", {
        method: "POST",
        body: JSON.stringify({
          ...logFormData,
          assetId: selectedAsset.id,
          scheduleId: selectedSchedule?.id
        })
      });
      toast.success("تم تسجيل بيانات الصيانة وإهلاك التكاليف");
      setIsLogMaintenanceOpen(false);
      fetchAssets();
      fetchUpcoming();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: "name",
      header: "اسم الأصل",
      cell: ({ row }) => <span className="font-bold text-slate-800">{row.original.name}</span>
    },
    {
      accessorKey: "category",
      header: "التصنيف",
      cell: ({ row }) => <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none">{row.original.category}</Badge>
    },
    {
      accessorKey: "roomNumber",
      header: "المكان / الغرفة",
      cell: ({ row }) => row.original.roomNumber ? <Badge className="bg-slate-900 border-none">غرفة {row.original.roomNumber}</Badge> : <span className="text-slate-300 font-bold">غير محدد</span>
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge className={cn(
            "border-none",
            s === "active" ? "bg-emerald-100 text-emerald-700" : 
            s === "maintenance" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          )}>
            {s === "active" ? "يعمل بكفاءة" : s === "maintenance" ? "تحت الصيانة" : "معطل"}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
            onClick={() => {
              setSelectedAsset(row.original);
              setIsScheduleOpen(true);
            }}
            title="جدولة صيانة"
          >
            <Clock className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
            onClick={() => {
              setSelectedAsset(row.original);
              setSelectedSchedule(null);
              setIsLogMaintenanceOpen(true);
            }}
            title="تسجيل صيانة تمت"
          >
            <Wrench className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">إدارة الأصول والصيانة</h1>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              نظام استدامة المنشأة
            </Badge>
            <p className="text-sm text-slate-500 font-bold">تتبع الأصول، جدولة الصيانة الدورية، واحتساب دورة الإهلاك</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
            <DialogTrigger render={(props) => (
              <Button className="h-12 gap-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 px-8 rounded-2xl active:scale-95 transition-all font-black text-sm" {...props}>
                <Plus className="w-5 h-5" />
                إضافة أصل جديد
              </Button>
            )} />
            <DialogContent className="max-w-xl rounded-[2.5rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 text-right">تسجيل أصل جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddAsset} className="space-y-6 py-4">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">اسم الأصل</Label>
                      <Input 
                        className="h-14 font-bold rounded-xl" 
                        placeholder="تكييف، سرير طبي، ثلاجة..." 
                        list="asset-names"
                        value={assetFormData.name}
                        onChange={e => setAssetFormData({...assetFormData, name: e.target.value})}
                        required
                      />
                      <datalist id="asset-names">
                        {assetNamesSuggestions.map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">التصنيف</Label>
                      <select 
                        className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 font-bold"
                        value={assetFormData.category}
                        onChange={e => setAssetFormData({...assetFormData, category: e.target.value})}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">تاريخ الشراء</Label>
                      <Input 
                        type="date"
                        className="h-14 font-bold rounded-xl" 
                        value={assetFormData.purchaseDate}
                        onChange={e => setAssetFormData({...assetFormData, purchaseDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">سعر الشراء (ج.م)</Label>
                      <Input 
                        type="number"
                        className="h-14 font-bold rounded-xl" 
                        value={assetFormData.purchaseCost}
                        onChange={e => setAssetFormData({...assetFormData, purchaseCost: e.target.value})}
                      />
                    </div>
                 </div>
                 <div className="space-y-2 text-right">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الرقم التسلسلي</Label>
                    <Input 
                      className="h-14 font-bold rounded-xl" 
                      placeholder="S/N XXXXXXXX" 
                      value={assetFormData.serialNumber}
                      onChange={e => setAssetFormData({...assetFormData, serialNumber: e.target.value})}
                    />
                  </div>
                 <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100">
                   حفظ الأصل بالنظام
                 </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-200 rounded-[2.5rem] bg-white shadow-xl shadow-slate-100/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between bg-white/50 backdrop-blur-sm">
              <div>
                <CardTitle className="text-xl font-black text-slate-800">قائمة الأصول والتجهيزات</CardTitle>
                <CardDescription className="font-bold text-slate-400 mt-1">كافة المحتويات والمعدات المسجلة في الدار</CardDescription>
              </div>
              <LayoutGrid className="w-6 h-6 text-slate-200" />
            </CardHeader>
            <div className="p-6">
              <DataTable columns={columns} data={assets} density="compact" />
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none rounded-[2.5rem] bg-slate-900 text-white shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-16 -mt-16" />
            <CardHeader className="p-8 pb-4 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                  مواعيد صيانة قادمة
                </CardTitle>
                <Badge className="bg-blue-600/20 text-blue-400 border-none font-black">{upcomingMaintenance.length}</Badge>
              </div>
              <CardDescription className="text-slate-400 font-bold mt-2">التذكرة بالمواعيد المجدولة خلال الأسبوع القادم</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4 relative">
              {upcomingMaintenance.length > 0 ? upcomingMaintenance.map((m) => (
                <div key={m.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{m.assetName}</span>
                    <Badge className="bg-amber-500/10 text-amber-500 border-none text-[10px] h-5">بعد {Math.ceil((new Date(m.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 3600 * 24))} يوم</Badge>
                  </div>
                  <h4 className="text-base font-black mb-4">{m.taskName}</h4>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(m.nextMaintenanceDate), "dd MMMM yyyy", { locale: ar })}
                     </span>
                     <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-4 rounded-xl text-[10px] font-black bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => {
                          const asset = assets.find(a => a.id === m.assetId);
                          if (asset) setSelectedAsset(asset);
                          setSelectedSchedule(m);
                          setIsLogMaintenanceOpen(true);
                        }}
                     >
                        تنفيذ الآن
                     </Button>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-500 font-bold">لا توجد أعمال صيانة مجدولة قريباً</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 rounded-[2.5rem] bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                تحليل الإهلاك
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                    <span>تحمل الأصول الحالية</span>
                    <span className="text-slate-800">72%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[72%]" />
                  </div>
               </div>
               <p className="text-xs font-bold text-slate-400 leading-relaxed">بناءً على سجلات الصيانة الأخيرة، 15% من الأصول تحتاج لاستبدال خلال 6 أشهر للحفاظ على جودة الخدمة.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 text-right">تسجيل أصل جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-6 py-4">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">اسم الأصل</Label>
                  <Input 
                    className="h-14 font-bold rounded-xl" 
                    placeholder="تكييف، سرير طبي، ثلاجة..." 
                    value={assetFormData.name}
                    onChange={e => setAssetFormData({...assetFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">التصنيف</Label>
                  <select 
                    className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 font-bold"
                    value={assetFormData.category}
                    onChange={e => setAssetFormData({...assetFormData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">تاريخ الشراء</Label>
                  <Input 
                    type="date"
                    className="h-14 font-bold rounded-xl" 
                    value={assetFormData.purchaseDate}
                    onChange={e => setAssetFormData({...assetFormData, purchaseDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">سعر الشراء (ج.م)</Label>
                  <Input 
                    type="number"
                    className="h-14 font-bold rounded-xl" 
                    value={assetFormData.purchaseCost}
                    onChange={e => setAssetFormData({...assetFormData, purchaseCost: e.target.value})}
                  />
                </div>
             </div>
             <div className="space-y-2 text-right">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الرقم التسلسلي</Label>
                <Input 
                  className="h-14 font-bold rounded-xl" 
                  placeholder="S/N XXXXXXXX" 
                  value={assetFormData.serialNumber}
                  onChange={e => setAssetFormData({...assetFormData, serialNumber: e.target.value})}
                />
              </div>
             <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100">
               حفظ الأصل بالنظام
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 text-right">جدولة دورة صيانة</DialogTitle>
            <CardDescription className="text-right font-bold text-slate-500">للأصل: {selectedAsset?.name}</CardDescription>
          </DialogHeader>
          <form onSubmit={handleAddSchedule} className="space-y-6 py-4">
             <div className="space-y-4">
                <div className="space-y-2 text-right">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">مهمة الصيانة</Label>
                    <Input className="h-14 font-bold rounded-xl" placeholder="مثال: تنظيف فلاتر، تزييد تروس..." value={scheduleFormData.taskName} onChange={e => setScheduleFormData({...scheduleFormData, taskName: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">التكرار (بالأيام)</Label>
                        <Input type="number" className="h-14 font-bold rounded-xl text-center" value={scheduleFormData.frequencyDays} onChange={e => setScheduleFormData({...scheduleFormData, frequencyDays: e.target.value})} />
                    </div>
                    <div className="space-y-2 text-right">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الموعد القادم</Label>
                        <Input type="date" className="h-14 font-bold rounded-xl" value={scheduleFormData.nextMaintenanceDate} onChange={e => setScheduleFormData({...scheduleFormData, nextMaintenanceDate: e.target.value})} />
                    </div>
                </div>
             </div>
             <Button type="submit" className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-100">
               تفعيل الجدول الزمني
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogMaintenanceOpen} onOpenChange={setIsLogMaintenanceOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 text-right">تسجيل تقرير صيانة</DialogTitle>
            <CardDescription className="text-right font-bold text-slate-500">للأصل: {selectedAsset?.name}</CardDescription>
          </DialogHeader>
          <form onSubmit={handleLogMaintenance} className="space-y-6 py-4">
             <div className="space-y-4">
                <div className="space-y-2 text-right">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">ما تم إنجازه</Label>
                    <Input className="h-14 font-bold rounded-xl" placeholder="وصف للأعمال التي تمت..." value={logFormData.actionTaken} onChange={e => setLogFormData({...logFormData, actionTaken: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">نتيجة الصيانة</Label>
                        <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 font-bold" value={logFormData.result} onChange={e => setLogFormData({...logFormData, result: e.target.value})}>
                            <option value="تم بنجاح">تم بنجاح</option>
                            <option value="تحتاج قطع غيار">تحتاج قطع غيار</option>
                            <option value="تم الاستبدال">تم الاستبدال</option>
                            <option value="غير قابلة للإصلاح">غير قابلة للإصلاح</option>
                        </select>
                    </div>
                    <div className="space-y-2 text-right">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">التكلفة (ج.م)</Label>
                        <Input type="number" className="h-14 font-bold rounded-xl text-center" value={logFormData.cost} onChange={e => setLogFormData({...logFormData, cost: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-2 text-right">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">بواسطة</Label>
                    <Input className="h-14 font-bold rounded-xl" placeholder="اسم الفني أو الشركة..." value={logFormData.performedBy} onChange={e => setLogFormData({...logFormData, performedBy: e.target.value})} />
                </div>
             </div>
             <Button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest">
               إعتماد التقرير وترحيله
             </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
