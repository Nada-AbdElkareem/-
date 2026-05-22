import * as React from "react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { cn, safeFormat } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  UserPlus, 
  Settings as SettingsIcon, 
  Shield, 
  Trash2, 
  Edit, 
  Key,
  Home,
  FileText,
  Activity,
  Plus,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Monitor,
  Coins,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Users,
  Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Rooms from "./Rooms";
import Services from "./Services";
import { useAuth } from "@/lib/auth";

export default function Settings() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // System Settings state
  const [sysSettings, setSysSettings] = useState<any>({
    currency: "ر.س",
    room_types: "Single, Double, Ward",
    service_categories: "Meals, Transportation, Laundry, Medical",
    inventory_categories: "الطعام, المنظفات, الأثاث, مستلزمات طبية, أخرى",
    governorates: "القاهرة, الجيزة, الإسكندرية, مطروح, أسوان",
    referral_entities: "المنظمة الدولية للهجرة, مفوضية اللاجئين, أطباء بلا حدود",
    relationships: "درجة أولى, درجة ثانية, صديق, ممرض, أخرى",
    asset_categories: "أثاث, كهربائيات, تجهيزات طبية, تكييفات, أخرى",
    asset_names: "سرير طبي, مكيف شارب, ثلاجة توشيبا, شاشة سامسونج",
    inventory_item_names: "لحم بقري, أرز بسمتي, صابون سائل, كمامات طبية",
    asset_statuses: "working, maintenance, broken, decommissioned"
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "data_entry"
  });

  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    role: "data_entry"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    apiRequest("/users")
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchSettings = () => {
    apiRequest("/settings")
      .then(data => {
        if (Object.keys(data).length > 0) {
          setSysSettings(data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiRequest("/settings", {
        method: "POST",
        body: JSON.stringify(sysSettings)
      });
      toast.success("تم حفظ إعدادات النظام بنجاح");
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ الإعدادات");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    // ... (existing logic)
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("كلمة المرور الجديدة غير متطابقة");
    }
    setChangingPassword(true);
    try {
      await apiRequest("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      toast.success("تم تغيير كلمة المرور بنجاح");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "فشل تغيير كلمة المرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
      toast.success("تم إضافة المستخدم بنجاح");
      setIsAddUserOpen(false);
      setUserData({ name: "", email: "", password: "", role: "data_entry" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "فشل إضافة المستخدم");
    } finally {
      setSavingUser(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      await apiRequest(`/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(editUserData)
      });
      toast.success("تم تحديث بيانات المستخدم");
      setIsEditUserOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "فشل التحديث");
    } finally {
      setSavingUser(false);
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      await apiRequest(`/users/${id}`, { method: "DELETE" });
      toast.success("تم حذف المستخدم");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "admin": return <Badge className="bg-red-50 text-red-600 border-red-100 font-bold text-[10px]">مدير نظام</Badge>;
      case "reception": return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold text-[10px]">موظف استقبال</Badge>;
      case "financial_manager": return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold text-[10px]">مدير عمليات مالية</Badge>;
      case "room_supervisor": return <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold text-[10px]">مشرف إدارة غرف</Badge>;
      case "medical": return <Badge className="bg-purple-50 text-purple-600 border-purple-100 font-bold text-[10px]">خدمات طبية</Badge>;
      case "data_entry": return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">مدخل بيانات</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            مركز الضبط والإدارة
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2 mr-1">تهيئة تفضيلات النظام، إدارة الصلاحيات، وتأمين الحسابات</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <div className="border-b border-slate-200 mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-transparent h-14 w-full justify-start gap-8 rounded-none border-b-0 p-0 overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-sm font-black transition-all px-1 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              إدارة المستخدمين
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-sm font-black transition-all px-1 flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              تهيئة النظام
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-sm font-black transition-all px-1 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              الأمان والحساب
            </TabsTrigger>
            <TabsTrigger 
              value="rooms" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-sm font-black transition-all px-1 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              قوائم الغرف
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-sm font-black transition-all px-1 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              الخدمات والبيانات
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30 p-8">
              <div className="text-right">
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  المستخدمين والصلاحيات
                </CardTitle>
                <CardDescription className="text-sm font-bold text-slate-400 mt-1">إضافة وتعديل حسابات الموظفين وتخصيص الأدوار والمهام</CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger
                  render={(props) => (
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-6 text-sm font-black shadow-lg shadow-blue-100 rounded-2xl" {...props}>
                      <UserPlus className="w-4 h-4" />
                      إضافة مستخدم جديد
                    </Button>
                  )}
                />
                <DialogContent className="sm:max-w-[425px] rounded-3xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right">إضافة حساب موظف جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4 pt-4 text-right">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">الاسم بالكامل</Label>
                      <div className="relative">
                        <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          required 
                          className="pr-9 pr-10 text-right h-10 bg-slate-50"
                          value={userData.name || ""}
                          onChange={e => setUserData({...userData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">البريد الإلكتروني / اسم المستخدم</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          required 
                          type="email"
                          className="pr-10 text-right h-10 bg-slate-50"
                          value={userData.email || ""}
                          onChange={e => setUserData({...userData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          required 
                          type="password"
                          className="pr-10 text-right h-10 bg-slate-50"
                          value={userData.password || ""}
                          onChange={e => setUserData({...userData, password: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">الدور / الصلاحية</Label>
                      <Select 
                        value={userData.role} 
                        onValueChange={v => setUserData({...userData, role: v})}
                      >
                        <SelectTrigger className="text-right h-10 bg-slate-50">
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير نظام (Admin)</SelectItem>
                          <SelectItem value="reception">موظف استقبال (Reception)</SelectItem>
                          <SelectItem value="financial_manager">مدير عمليات مالية (Finance Mgr)</SelectItem>
                          <SelectItem value="room_supervisor">مشرف إدارة غرف (Room Sup)</SelectItem>
                          <SelectItem value="medical">خدمات طبية (Medical)</SelectItem>
                          <SelectItem value="data_entry">مدخل بيانات (Data Entry)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-4 gap-2">
                      <Button type="button" variant="ghost" className="text-xs font-bold" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button>
                      <Button type="submit" className="bg-blue-600 text-xs font-bold px-8" disabled={savingUser}>
                        {savingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" /> : null}
                        إنشاء الحساب
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-right font-bold text-xs">الموظف</TableHead>
                      <TableHead className="text-right font-bold text-xs">الصلاحية</TableHead>
                      <TableHead className="text-right font-bold text-xs">تاريخ الإضافة</TableHead>
                      <TableHead className="text-left font-bold text-xs">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1,2,3].map(i => (
                        <TableRow key={i}>
                          <TableCell colSpan={4} className="h-12 animate-pulse bg-slate-50/50" />
                        </TableRow>
                      ))
                    ) : (
                      users.map((user, idx) => (
                        <TableRow 
                          key={`${user.id}-${idx}`} 
                          className={cn(
                            "transition-colors hover:bg-slate-50 group border-slate-50",
                            currentUser?.id === user.id && "bg-blue-50/30 border-r-2 border-r-blue-600"
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                                currentUser?.id === user.id ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-slate-100 text-slate-500"
                              )}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                  {currentUser?.id === user.id && (
                                    <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black uppercase">أنت</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-[10px] text-slate-400 font-medium">
                            {safeFormat(user.createdAt, "dd MMMM yyyy", { locale: ar })}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-8 h-8 rounded-full text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {currentUser?.id !== user.id && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-full text-red-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-8">
                  <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    تهيئة النظام الأساسية
                  </CardTitle>
                  <CardDescription className="text-sm font-bold text-slate-400 mt-1">تحديد الإعدادات الافتراضية والعملة المستخدمة في الفواتير والتقارير</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSaveSettings} className="space-y-8">
                    {/* General Settings Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                        <Monitor className="w-5 h-5 text-blue-600" />
                        الإعدادات العامة
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Coins className="w-4 h-4 text-amber-500" />
                            العملة الأساسية للنظام
                          </Label>
                          <Input 
                            className="bg-slate-50 h-12 font-black text-lg border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.currency || ""} 
                            onChange={e => setSysSettings({...sysSettings, currency: e.target.value})}
                          />
                          <p className="text-[10px] font-bold text-slate-400 italic">ستظهر هذه العملة في جميع واجهات النظام والتقارير</p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-blue-500" />
                            تصنيفات الغرف
                          </Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.room_types || ""}
                            onChange={e => setSysSettings({...sysSettings, room_types: e.target.value})}
                          />
                          <p className="text-[10px] font-bold text-slate-400 italic">فصل الأنواع بـ (،)</p>
                        </div>
                      </div>
                    </div>

                    {/* Operations Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        الخدمات والعمليات
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-500" />
                            تصنيفات الخدمات والوجبات
                          </Label>
                          <Input 
                            className="bg-slate-50 h-14 text-sm font-bold border-slate-200 focus:bg-white transition-all shadow-sm" 
                            value={sysSettings.service_categories || ""}
                            onChange={e => setSysSettings({...sysSettings, service_categories: e.target.value})}
                          />
                          <p className="text-[10px] font-bold text-slate-400 italic">فصل التصنيفات بـ (،)</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <LayoutGrid className="w-4 h-4 text-orange-500" />
                              تصنيفات المخزون
                            </Label>
                            <Input 
                              className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                              value={sysSettings.inventory_categories || ""}
                              onChange={e => setSysSettings({...sysSettings, inventory_categories: e.target.value})}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Plus className="w-4 h-4 text-orange-500" />
                              أسماء بنود الأصناف الجاهزة
                            </Label>
                            <Input 
                              className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                              value={sysSettings.inventory_item_names || ""}
                              placeholder="أرز، سكر، زيت..."
                              onChange={e => setSysSettings({...sysSettings, inventory_item_names: e.target.value})}
                            />
                            <p className="text-[10px] font-bold text-slate-400 italic">أسماء مقترحة عند إضافة صنف جديد</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patients & Referrals Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        المرضى والجهات الخارجية
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            قائمة المحافظات
                          </Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.governorates || ""}
                            onChange={e => setSysSettings({...sysSettings, governorates: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            جهات تحويل الحالات (المنظمات)
                          </Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.referral_entities || ""}
                            onChange={e => setSysSettings({...sysSettings, referral_entities: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            قائمة صلة القرابة
                          </Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.relationships || ""}
                            onChange={e => setSysSettings({...sysSettings, relationships: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assets & Maintenance Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                        <LayoutGrid className="w-5 h-5 text-amber-600" />
                        إعدادات الأصول والصيانة
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تصنيفات الأصول</Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.asset_categories || ""}
                            onChange={e => setSysSettings({...sysSettings, asset_categories: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أسماء الأصول (القوالب)</Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.asset_names || ""}
                            placeholder="تكييف، ثلاجة، غسالة..."
                            onChange={e => setSysSettings({...sysSettings, asset_names: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3 col-span-full">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالات الأصول التشغيلية</Label>
                          <Input 
                            className="bg-slate-50 h-12 text-sm font-bold border-slate-200 focus:bg-white transition-all" 
                            value={sysSettings.asset_statuses || ""}
                            onChange={e => setSysSettings({...sysSettings, asset_statuses: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 px-10 font-black h-12 shadow-xl shadow-blue-100 rounded-2xl"
                        disabled={savingSettings}
                      >
                        {savingSettings ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                        حفظ جميع إعدادات النظام
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-blue-600 text-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-200" />
                    معلومات النظام
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">الإصدار الحالي</p>
                    <p className="text-xl font-black">v2.4.0 Stable</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">آخر تحديث</p>
                    <p className="text-sm font-bold">منذ يومين (13 مايو 2026)</p>
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-white/20">
                     <div className="flex -space-x-2 space-x-reverse">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-400" />
                        ))}
                     </div>
                     <p className="text-[10px] font-bold">12 مستخدم مسجل</p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                 <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                   <LayoutGrid className="w-4 h-4 text-slate-400" />
                   اختصارات سريعة
                 </h4>
                 <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:bg-slate-50">
                       <FileText className="w-5 h-5 text-blue-500" />
                       <span className="text-[10px] font-black">التقارير</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-slate-200 bg-white hover:bg-slate-50">
                       <UserPlus className="w-5 h-5 text-emerald-500" />
                       <span className="text-[10px] font-black">موظف جديد</span>
                    </Button>
                 </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-100 bg-slate-50/30">
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  كلمة المرور والأمان
                </CardTitle>
                <CardDescription className="text-sm font-bold text-slate-500">تحديث كلمة المرور بانتظام يعزز أمان حسابك الشخصي</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة المرور الحالية</Label>
                    <Input 
                      type="password" 
                      required 
                      className="bg-slate-50 border-slate-200 h-12 focus:bg-white transition-all"
                      value={passwordData.currentPassword || ""}
                      onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة المرور الجديدة</Label>
                      <Input 
                        type="password" 
                        required 
                        className="bg-slate-50 border-slate-200 h-12 focus:bg-white transition-all"
                        value={passwordData.newPassword || ""}
                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تأكيد كلمة المرور</Label>
                      <Input 
                        type="password" 
                        required 
                        className="bg-slate-50 border-slate-200 h-12 focus:bg-white transition-all"
                        value={passwordData.confirmPassword || ""}
                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-black shadow-lg shadow-blue-100 rounded-2xl" disabled={changingPassword}>
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Key className="w-4 h-4 ml-2" />}
                    تحديث كلمة المرور الآن
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    حالة أمان الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:shadow-md transition-all">
                     <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-emerald-800">الحساب مؤمن بالكامل</h4>
                        <p className="text-[10px] font-bold text-emerald-600/70 mt-1">لا توجد ثغرات تم اكتشافها في حسابك حالياً، كلمة المرور تبدو قوية.</p>
                     </div>
                  </div>

                  <div className="space-y-4 text-[11px] font-bold text-slate-600">
                    <div className="flex gap-3">
                       <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                       <p>لا تقم بمشاركة كلمة المرور الخاصة بك مع أي طرف ثالث تحت أي ظرف.</p>
                    </div>
                    <div className="flex gap-3">
                       <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                       <p>يرجى تسجيل الخروج عند استخدام النظام من أجهزة عامة أو مشتركة.</p>
                    </div>
                    <div className="flex gap-3">
                       <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                       <p>جميع محاولات الدخول الفاشلة يتم تسجيلها ومراعاتها أمنياً.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
                <CardContent className="p-8 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الموقع الجغرافي المسجل</p>
                      <p className="text-sm font-black">القاهرة، مصر (عبر IP الحالي)</p>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-slate-400" />
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">تعديل بيانات الموظف</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4 pt-4 text-right">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">الاسم بالكامل</Label>
                <Input 
                  required 
                  className="text-right h-10 bg-slate-50"
                  value={editUserData.name || ""}
                  onChange={e => setEditUserData({...editUserData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">البريد الإلكتروني / اسم المستخدم</Label>
                <Input 
                  required 
                  type="email"
                  className="text-right h-10 bg-slate-50"
                  value={editUserData.email || ""}
                  onChange={e => setEditUserData({...editUserData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">الدور / الصلاحية</Label>
                <Select 
                  value={editUserData.role} 
                  onValueChange={v => setEditUserData({...editUserData, role: v})}
                >
                  <SelectTrigger className="text-right h-10 bg-slate-50">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير نظام (Admin)</SelectItem>
                    <SelectItem value="reception">موظف استقبال (Reception)</SelectItem>
                    <SelectItem value="financial_manager">مدير عمليات مالية (Finance Mgr)</SelectItem>
                    <SelectItem value="room_supervisor">مشرف إدارة غرف (Room Sup)</SelectItem>
                    <SelectItem value="medical">خدمات طبية (Medical)</SelectItem>
                    <SelectItem value="data_entry">مدخل بيانات (Data Entry)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="ghost" className="text-xs font-bold" onClick={() => setIsEditUserOpen(false)}>إلغاء</Button>
                <Button type="submit" className="bg-blue-600 text-xs font-bold px-8" disabled={savingUser}>
                  {savingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" /> : null}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <TabsContent value="rooms">
          <Rooms />
        </TabsContent>

        <TabsContent value="services">
          <Services />
        </TabsContent>
      </Tabs>
    </div>
  );
}
