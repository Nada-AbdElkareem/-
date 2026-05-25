import * as React from "react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Tag, DollarSign, Edit3, MoreVertical, Filter, Loader2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { DataTable } from "@/components/DataTable";
import { getColumns, Service } from "@/pages/services/columns";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeStays, setActiveStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<string[]>(["Meals", "Transportation", "Laundry", "Medical"]);

  const columns = getColumns(
    (service) => openEditDialog(service),
    async (id) => {
      if (confirm("هل أنت متأكد من حذف هذه الخدمة؟")) {
        try {
          await apiRequest(`/services/${id}`, { method: "DELETE" });
          toast.success("تم حذف الخدمة بنجاح");
          fetchServices();
        } catch (err: any) {
          toast.error(err.message || "فشل حذف الخدمة");
        }
      }
    }
  );
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Meals",
    unitCost: ""
  });

  const [editData, setEditData] = useState({
    name: "",
    category: "Meals",
    unitCost: ""
  });

  const [assignData, setAssignData] = useState({
    serviceId: null as number | null,
    stayId: "",
    quantity: "1",
    notes: ""
  });

  const fetchServices = () => {
    setLoading(true);
    Promise.all([
      apiRequest("/services"),
      apiRequest("/stays/active"),
      apiRequest("/settings")
    ])
    .then(([svcs, stays, settings]) => {
      setServices(svcs);
      setActiveStays(stays);
      if (settings.service_categories) {
        setCategories(settings.service_categories.split(",").map((s: string) => s.trim()));
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/services", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast.success("تمت إضافة الخدمة بنجاح");
      setIsAddOpen(false);
      setFormData({ name: "", category: "Meals", unitCost: "" });
      fetchServices();
    } catch (err: any) {
      toast.error(err.message || "فشل إضافة الخدمة");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignData.serviceId || !assignData.stayId) return;
    setSaving(true);
    try {
      await apiRequest(`/stays/${assignData.stayId}/services`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: assignData.serviceId,
          quantity: parseInt(assignData.quantity),
          notes: assignData.notes
        })
      });
      toast.success("تم تخصيص الخدمة للحالة بنجاح");
      setIsAssignOpen(false);
      setAssignData({ serviceId: null, stayId: "", quantity: "1", notes: "" });
    } catch (err: any) {
      toast.error(err.message || "فشل تخصيص الخدمة");
    } finally {
      setSaving(false);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setSaving(true);
    try {
      await apiRequest(`/services/${selectedService.id}`, {
        method: "PATCH",
        body: JSON.stringify(editData)
      });
      toast.success("تم تحديث بيانات الخدمة بنجاح");
      setIsEditOpen(false);
      fetchServices();
    } catch (err: any) {
      toast.error(err.message || "فشل تحديث بيانات الخدمة");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (service: any) => {
    setSelectedService(service);
    setEditData({
      name: service.name,
      category: service.category,
      unitCost: service.unitCost.toString()
    });
    setIsEditOpen(true);
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">دليل الخدمات والأسعار</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">قائمة التسعير</span>
            <p className="text-[11px] text-slate-500 font-medium">إدارة الخدمات الإضافية المقدمة للمرضى والمرافقين</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-9 gap-2 text-xs font-bold text-slate-600 hover:bg-slate-100 px-4">
              <Filter className="w-3.5 h-3.5" />
              تصفية الفئات
            </Button>
            
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger 
                render={(props) => (
                  <Button className="h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-xs font-black shadow-xl shadow-blue-100 px-6 rounded-xl transition-all active:scale-95" {...props}>
                    <Plus className="w-4 h-4" />
                    إضافة خدمة جديدة
                  </Button>
                )}
              />
              <DialogContent className="max-w-2xl bg-slate-50 border-0 shadow-3xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col" dir="rtl">
                <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-4 text-slate-900 leading-tight">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                        <Tag className="w-7 h-7" />
                      </div>
                      تكويد خدمة أو منتج جديد
                    </DialogTitle>
                  </DialogHeader>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                     <Plus className="w-5 h-5 rotate-45" />
                  </Button>
                </div>

                <form onSubmit={handleAddService} className="p-10 space-y-8 text-right overflow-y-auto">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">مسمى الخدمة (بالعربية)</Label>
                      <Input 
                        required 
                        className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black focus:ring-4 focus:ring-blue-100"
                        placeholder="مثلاً: وجبة غداء فاخرة، غسيل ملابس..."
                        value={formData.name || ""}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">تصنيف الخدمة</Label>
                        <Select 
                          value={formData.category || ""} 
                          onValueChange={v => setFormData({ ...formData, category: v })}
                        >
                          <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-xl text-sm font-black focus:ring-4 focus:ring-blue-100">
                            <SelectValue placeholder="اختر التصنيف..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat} className="text-right">{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">سعر البيع الافتراضي (EGP)</Label>
                        <Input 
                          type="number" 
                          required 
                          className="h-14 text-center bg-slate-50 border-slate-100 rounded-xl text-xl font-black text-emerald-600 focus:ring-4 focus:ring-blue-100"
                          placeholder="0.00"
                          value={formData.unitCost || ""}
                          onChange={e => setFormData({ ...formData, unitCost: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-3">
                    <Button type="submit" className="h-16 bg-blue-600 hover:bg-blue-700 text-base font-black rounded-2xl shadow-2xl shadow-blue-200 transition-all" disabled={saving}>
                      {saving ? (
                        <div className="flex items-center gap-3">
                           <Loader2 className="w-5 h-5 animate-spin" />
                           جاري الحفظ...
                        </div>
                      ) : "حفظ الخدمة في الدليل"}
                    </Button>
                    <Button type="button" variant="ghost" className="h-14 text-sm font-black text-slate-400 rounded-2xl hover:bg-slate-50" onClick={() => setIsAddOpen(false)}>إلغاء الأمر</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 -mr-4 -mt-4 rounded-full" />
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الخدمات</p>
              <p className="text-2xl font-black text-slate-800">{services.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 -mr-4 -mt-4 rounded-full" />
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">خدمات نشطة</p>
              <p className="text-2xl font-black text-slate-800">{services.length}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
        <div className="p-8">
          <DataTable 
            columns={columns} 
            data={services} 
            searchKey="name"
            pinnedColumns={["actions"]}
          />
        </div>
      </Card>

      {/* Assign to Stay Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تخصيص خدمة لحالة إقامة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignService} className="space-y-4 pt-4 text-right">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">اختر الحالة النشطة</Label>
              <Select 
                value={assignData.stayId} 
                onValueChange={v => setAssignData({ ...assignData, stayId: v })}
              >
                <SelectTrigger className="text-right h-10 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {activeStays.map(stay => (
                    <SelectItem key={stay.id} value={stay.id.toString()}>
                      {stay.patient?.fullName} - غرفة {stay.room?.number}
                    </SelectItem>
                  ))}
                  {activeStays.length === 0 && (
                    <div className="p-2 text-center text-xs text-slate-400">لا توجد حالات نشطة حالياً</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">الكمية</Label>
              <Input 
                type="number" 
                required 
                className="text-right h-10 bg-slate-50 border-slate-200"
                value={assignData.quantity || ""}
                onChange={e => setAssignData({ ...assignData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">ملاحظات / تفاصيل البند</Label>
              <Textarea 
                className="text-right bg-slate-50 border-slate-200 min-h-[80px]"
                placeholder="أدخل أي ملاحظات إضافية..."
                value={assignData.notes || ""}
                onChange={e => setAssignData({ ...assignData, notes: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" className="text-xs font-bold" onClick={() => setIsAssignOpen(false)}>إلغاء</Button>
              <Button type="submit" className="bg-emerald-600 text-xs font-bold px-8 hover:bg-emerald-700" disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" /> : null}
                تأكيد التخصيص
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل بيانات الخدمة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditService} className="space-y-4 pt-4 text-right">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">اسم الخدمة</Label>
              <Input 
                required 
                className="text-right h-10 bg-slate-50 border-slate-200"
                value={editData.name || ""}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">التصنيف</Label>
              <Select 
                value={editData.category || ""} 
                onValueChange={v => setEditData({ ...editData, category: v })}
              >
                <SelectTrigger className="text-right h-10 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">تكلفة الوحدة (ج.م)</Label>
              <Input 
                type="number" 
                required 
                className="text-right h-10 bg-slate-50 border-slate-200"
                value={editData.unitCost || ""}
                onChange={e => setEditData({ ...editData, unitCost: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" className="text-xs font-bold" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
              <Button type="submit" className="bg-blue-600 text-xs font-bold px-8" disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" /> : null}
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

