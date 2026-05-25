import { Link, useNavigate } from "react-router-dom";
import * as React from "react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { cn, safeFormat } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  History, 
  UserCheck, 
  UserMinus, 
  Search, 
  DoorOpen, 
  Bed as BedIcon,
  Timer,
  Clock,
  ArrowLeftRight,
  PlusCircle,
  Plus,
  Loader2,
  Phone,
  CheckCircle,
  FileText,
  Check,
  Users,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "motion/react";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Stays() {
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [activeStays, setActiveStays] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedBed, setSelectedBed] = useState<string>("");
  const [admissionNotes, setAdmissionNotes] = useState("");
  const [bedsList, setBedsList] = useState<any[]>([]);
  const [patientCompanions, setPatientCompanions] = useState<any[]>([]);
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>([]);
  const [patientMobile, setPatientMobile] = useState("");
  const [patientReferralOrg, setPatientReferralOrg] = useState("");
  const [letterDuration, setLetterDuration] = useState("");
  const [letterUrl, setLetterUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sysSettings, setSysSettings] = useState<any>({
    relationships: "درجة أولى, درجة ثانية, صديق, ممرض, أخرى"
  });

  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [renewForm, setRenewForm] = useState({ duration: "", letterUrl: "" });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    { id: 1, title: "المريض", icon: <UserPlus className="w-4 h-4" /> },
    { id: 2, title: "الغرفة", icon: <DoorOpen className="w-4 h-4" /> },
    { id: 3, title: "المرفقات", icon: <FileText className="w-4 h-4" /> },
    { id: 4, title: "المرافقون", icon: <Users className="w-4 h-4" /> }
  ];

  const fetchSettings = () => {
    apiRequest("/settings")
      .then(data => {
        if (Object.keys(data).length > 0) {
          setSysSettings(data);
        }
      })
      .catch(console.error);
  };

  const getList = (key: string) => {
    return (sysSettings[key] || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  };

  // Check-out dialog state
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedStay, setSelectedStay] = useState<any>(null);
  const [dischargeNotes, setDischargeNotes] = useState("");

  // Add Service dialog state
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [expandedStays, setExpandedStays] = useState<Set<number>>(new Set());
  const [isQuickCompanionOpen, setIsQuickCompanionOpen] = useState(false);
  const [quickCompanionData, setQuickCompanionData] = useState({
    fullName: "",
    nationalId: "",
    gender: "male",
    age: "",
    asylumStatus: "refugee",
    relationship: "relative"
  });

  const toggleStay = (id: number) => {
    const newExpanded = new Set(expandedStays);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedStays(newExpanded);
  };

  const handleQuickAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return toast.error("يرجى اختيار المريض أولاً");
    setLoading(true);
    try {
      const newCompanion = await apiRequest("/companions", {
        method: "POST",
        body: JSON.stringify({ ...quickCompanionData, patientId: parseInt(selectedPatient) }),
      });
      setPatientCompanions(prev => [...prev, newCompanion]);
      setSelectedCompanionIds(prev => [...prev, newCompanion.id.toString()]);
      setIsQuickCompanionOpen(false);
      setQuickCompanionData({
        fullName: "",
        nationalId: "",
        gender: "male",
        age: "",
        asylumStatus: "refugee",
        relationship: "relative"
      });
      toast.success("تم إضافة المرافق بنجاح");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [serviceForm, setServiceForm] = useState({
    serviceId: "",
    quantity: "1",
    totalCostOverride: "",
    notes: ""
  });

  const fetchData = async () => {
    try {
      const [patients, rooms, staysData, notifs, svcs] = await Promise.all([
        apiRequest("/patients"),
        apiRequest("/rooms"),
        apiRequest("/stays/active"),
        apiRequest("/stays/notifications"),
        apiRequest("/services"),
      ]);
      setPatientsList(patients);
      setRoomsList(rooms);
      setActiveStays(staysData);
      setNotifications(notifs);
      setServicesList(svcs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      apiRequest(`/rooms/${selectedRoom}/beds`).then(setBedsList);
    } else {
      setBedsList([]);
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedPatient) {
      apiRequest(`/patients/${selectedPatient}`).then(data => {
        setPatientCompanions(data.companions || []);
        setPatientMobile(data.mobile || "");
        setPatientReferralOrg(data.referralOrg || "");
        setSelectedCompanionIds([]);
      });
    } else {
      setPatientCompanions([]);
      setPatientMobile("");
      setPatientReferralOrg("");
      setSelectedCompanionIds([]);
    }
  }, [selectedPatient]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedRoom || !selectedBed) {
      return toast.error("يرجى اختيار المريض والغرفة والسرير");
    }
    setLoading(true);
    try {
      await apiRequest("/stays/check-in", {
        method: "POST",
        body: JSON.stringify({
          patientId: parseInt(selectedPatient),
          roomId: parseInt(selectedRoom),
          bedId: parseInt(selectedBed),
          admissionNotes: admissionNotes,
          companionIds: selectedCompanionIds,
          mobile: patientMobile,
          referralOrg: patientReferralOrg,
          letterDuration: letterDuration ? parseInt(letterDuration) : undefined,
          letterUrl: letterUrl || undefined,
        }),
      });
      toast.success("تم تسجيل الدخول بنجاح");
      // Reset form
      setSelectedPatient("");
      setSelectedRoom("");
      setSelectedBed("");
      setAdmissionNotes("");
      setSelectedCompanionIds([]);
      setPatientMobile("");
      setPatientReferralOrg("");
      setLetterDuration("");
      setLetterUrl("");
      setCurrentStep(1);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedStay) return;
    setLoading(true);
    try {
      await apiRequest(`/stays/${selectedStay.id}/check-out`, {
        method: "POST",
        body: JSON.stringify({
          dischargeNotes: dischargeNotes,
          actualCheckOutDate: new Date().toISOString(),
        }),
      });
      toast.success("تم إغلاق الإقامة بنجاح");
      setIsCheckOutOpen(false);
      setSelectedStay(null);
      setDischargeNotes("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay || !serviceForm.serviceId) return;
    setLoading(true);
    try {
      await apiRequest(`/stays/${selectedStay.id}/services`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: parseInt(serviceForm.serviceId),
          quantity: parseInt(serviceForm.quantity),
          notes: serviceForm.notes,
          totalCostOverride: serviceForm.totalCostOverride ? parseFloat(serviceForm.totalCostOverride) : undefined
        })
      });
      toast.success("تمت إضافة الخدمة للعملية بنجاح");
      setIsServiceOpen(false);
      setServiceForm({ serviceId: "", quantity: "1", totalCostOverride: "", notes: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay) return;
    setLoading(true);
    try {
      await apiRequest(`/stays/${selectedStay.id}/renew`, { 
        method: "POST",
        body: JSON.stringify({
          letterDuration: renewForm.duration ? parseInt(renewForm.duration) : undefined,
          letterUrl: renewForm.letterUrl || undefined,
        })
      });
      toast.success("تم تجديد الإقامة بنجاح");
      setIsRenewOpen(false);
      setSelectedStay(null);
      setRenewForm({ duration: "", letterUrl: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedMasterService = servicesList.find(s => s.id === parseInt(serviceForm.serviceId));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-800 leading-tight">إدارة السكن والتسكين</h1>
        <p className="text-[11px] text-slate-500 font-medium">سجل الحركات اليومية لعمليات الدخول والخروج والتحويل</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-6 bg-amber-500 rounded-full" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">تنبيهات عاجلة (خروج خلال 48 ساعة)</h2>
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px] font-black h-5">
            {notifications.length} تنبيه
          </Badge>
        </div>

        {notifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.map((notif, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={notif.id || `notif-${idx}`} 
                className="group bg-white border-2 border-amber-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  <Clock className="w-6 h-6 border-2 border-amber-200 rounded-full p-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-black text-slate-900 truncate">{notif.patientName}</p>
                    <Badge className="text-[9px] h-4 bg-slate-900 text-white font-black border-0">غرفة {notif.roomNumber}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <Timer className="w-3 h-3" />
                    <p className="text-[10px] font-bold">خروج متوقع: {safeFormat(notif.expectedCheckOutDate, "EEEE dd MMM - HH:mm", { locale: ar })}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
               <CheckCircle className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">لا توجد إقامات تقترب من موعد الخروج حالياً</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <UserCheck className="w-24 h-24" />
              </div>
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black tracking-tight">وحدة التسكين المتكاملة</CardTitle>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">توجيه الحالات للغرف والأسرة المتاحة</p>
                </div>
              </div>
            </div>
            <CardContent className="p-8">
              {/* Step Progress Bar */}
              <div className="mb-10 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500 rounded-full" 
                  style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                />
                
                <div className="relative z-10 flex justify-between items-center">
                  {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                          currentStep >= step.id 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                            : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {currentStep > step.id ? <Check className="w-5 h-5" /> : step.icon}
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        currentStep >= step.id ? "text-blue-700" : "text-slate-400"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-8">
                {currentStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">البحث عن المريض في السجل الطبي</Label>
                      <select 
                        className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50 text-[15px] font-black focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.5rem center', backgroundSize: '1.2rem' }}
                        value={selectedPatient}
                        onChange={e => setSelectedPatient(e.target.value)}
                      >
                        <option value="">-- اختر الحالة --</option>
                        {patientsList.map((p, pIdx) => (
                          <option key={p.id || `p-${pIdx}`} value={p.id}>{p.fullName} ({p.nationalId})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الهاتف النشط</Label>
                        <Input 
                          className="h-14 text-right bg-slate-50 border-slate-100 rounded-2xl text-[14px] font-black focus:ring-4 focus:ring-blue-100"
                          placeholder="01xxxxxxxxx"
                          value={patientMobile || ""}
                          onChange={e => setPatientMobile(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-6">
                       <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الغرفة</Label>
                        <select 
                          className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50 text-[14px] font-black focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.2rem center', backgroundSize: '1rem' }}
                          value={selectedRoom}
                          onChange={e => setSelectedRoom(e.target.value)}
                        >
                          <option value="">-- الغرفة --</option>
                          {roomsList.filter(r => r.status !== "maintenance").map((r, rIdx) => (
                            <option key={r.id || `r-${rIdx}`} value={r.id}>غرفة {r.roomNumber} ({r.type})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم السرير</Label>
                        <select 
                          className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50 text-[14px] font-black focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 transition-all appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.2rem center', backgroundSize: '1rem' }}
                          disabled={!selectedRoom}
                          value={selectedBed}
                          onChange={e => setSelectedBed(e.target.value)}
                        >
                          <option value="">-- السرير --</option>
                          {bedsList.filter(b => b.status === "available").map((b, bIdx) => (
                            <option key={b.id || `b-${bIdx}`} value={b.id}>سرير {b.bedNumber}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">الجهة المرسلة للحالة</Label>
                      <Input 
                        className="h-14 text-right bg-slate-50 border-slate-100 rounded-2xl text-[14px] font-black focus:ring-4 focus:ring-blue-100"
                        placeholder="اسم المستشفى أو الجمعية الطبية"
                        value={patientReferralOrg || ""}
                        onChange={e => setPatientReferralOrg(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 text-blue-600">مدة الخطاب (يوم)</Label>
                        <Input 
                          type="number"
                          className="h-14 text-center bg-blue-50 border-blue-100 rounded-2xl text-xl font-black text-blue-700 shadow-inner"
                          placeholder="30"
                          value={letterDuration || ""}
                          onChange={e => setLetterDuration(e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 text-blue-600">مرفق خطاب التحويل</Label>
                        <div className="relative group">
                           <Input 
                             className="h-14 text-right bg-blue-50 border-blue-100 rounded-2xl text-[12px] font-bold pr-12"
                             placeholder="رابط المستند..."
                             value={letterUrl || ""}
                             onChange={e => setLetterUrl(e.target.value)}
                           />
                           <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">ملاحظات إضافية عند الدخول</Label>
                      <Textarea 
                        className="min-h-[100px] bg-slate-50 border-slate-100 rounded-2xl p-4 text-xs font-medium"
                        placeholder="أدخل أي ملاحظات طبية أو فندقية..."
                        value={admissionNotes}
                        onChange={e => setAdmissionNotes(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center justify-between border-b border-white pb-4">
                        <Label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">تسكين المرافقين الملحقين</Label>
                        <button 
                          type="button"
                          onClick={() => {
                            if(!selectedPatient) return toast.error("يرجى اختيار المريض أولاً");
                            setIsQuickCompanionOpen(true);
                          }}
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-50 flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" /> إضافة مرافق
                        </button>
                      </div>
                      
                      {patientCompanions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                          {patientCompanions.map((companion, idx) => (
                            <div 
                              key={companion.id || `comp-${idx}`} 
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                selectedCompanionIds.includes(companion.id.toString()) 
                                  ? "bg-white border-blue-200 shadow-sm" 
                                  : "bg-white/40 border-transparent"
                              )}
                              onClick={() => {
                                const id = companion.id.toString();
                                if (selectedCompanionIds.includes(id)) {
                                  setSelectedCompanionIds(selectedCompanionIds.filter(x => x !== id));
                                } else {
                                  setSelectedCompanionIds([...selectedCompanionIds, id]);
                                }
                              }}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center",
                                selectedCompanionIds.includes(companion.id.toString()) ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"
                              )}>
                                 {selectedCompanionIds.includes(companion.id.toString()) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-[11px] font-black text-slate-800">{companion.fullName}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{companion.relationship}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 bg-white/40 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center">
                           <Users className="w-8 h-8 text-slate-100 mb-2" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">لا يوجد مرافقين مسجلين</p>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 h-16 text-sm font-black shadow-2xl rounded-2xl mt-4" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> جاري التسكين...</div>
                      ) : (
                        <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5" /> إتمام عملية التسكين</div>
                      )}
                    </Button>
                  </motion.div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  {currentStep > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1 h-14 rounded-2xl font-black text-slate-400 hover:bg-slate-50"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                      السابق
                    </Button>
                  )}
                  {currentStep < totalSteps && (
                    <Button 
                      type="button" 
                      className={cn(
                        "h-14 rounded-2xl font-black transition-all",
                        currentStep === 1 ? "w-full" : "flex-1"
                      )}
                      disabled={
                        (currentStep === 1 && !selectedPatient) ||
                        (currentStep === 2 && (!selectedRoom || !selectedBed))
                      }
                      onClick={() => setCurrentStep(prev => prev + 1)}
                    >
                      التالي
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/30 p-4 rounded-xl border border-dashed">
            <div className="flex items-center gap-2 text-amber-700 mb-2 font-bold text-xs uppercase tracking-tight">
               <Timer className="w-3.5 h-3.5" />
               تعليمات النظام
            </div>
            <p className="text-[10px] text-amber-800/70 leading-relaxed font-medium">
               يجب مطابقة بيانات الهوية الوطنية للمريض مع بيانات التسكين الصادرة. في حال وجود مرافق، يرجى إضافته من تبويب إدارة المرضى أولاً.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">حالات الإقامة النشطة</h2>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديث مباشر</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeStays.length === 0 ? (
              <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">لا توجد حالات إقامة نشطة حالياً</p>
              </div>
            ) : activeStays.map((stay, i) => (
              <Card 
                key={`${stay.id}-${i}`} 
                className={cn(
                  "border-slate-100 shadow-sm hover:shadow-md transition-all border group overflow-hidden bg-white rounded-2xl relative cursor-pointer",
                  expandedStays.has(stay.id) && "ring-2 ring-blue-500 ring-offset-2"
                )}
                onClick={() => toggleStay(stay.id)}
              >
                <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-xs shadow-inner">
                        {stay.patient?.photoUrl ? (
                          <img src={stay.patient.photoUrl} className="w-full h-full object-cover" />
                        ) : (
                          stay.patient?.fullName?.charAt(0) || "P"
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-none mb-1">{stay.patient?.fullName}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">الحالة: {stay.patient?.caseStatus || "مستقرة"}</p>
                      </div>
                    </div>
                    <Badge className="text-[8px] h-4 font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 rounded-md">
                      نشط
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                    <div className="text-center border-l border-slate-200" title={stay.room?.type}>
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">الغرفة</p>
                      <p className="text-xs font-black text-slate-800">{stay.room?.roomNumber}</p>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">السرير</p>
                      <p className="text-xs font-black text-slate-800">{stay.bed?.bedNumber}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">الدخول</p>
                      <p className="text-xs font-black text-slate-800">{safeFormat(stay.checkInDate, "MM/dd")}</p>
                    </div>
                  </div>

                  {expandedStays.has(stay.id) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-4 space-y-3 pt-2 border-t border-slate-100"
                    >
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ملاحظات الدخول</p>
                        <p className="text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                          {stay.admissionNotes || "لا توجد ملاحظات مسجلة عند الدخول"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">بيانات المريض</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                           <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="w-3 h-3 opacity-50" /> {stay.patient?.mobile}
                           </div>
                           <div className="flex items-center gap-1.5 text-slate-600">
                              <Search className="w-3 h-3 opacity-50" /> {stay.patient?.nationalId}
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                     <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-40" />
                        ID: {stay.id}
                     </span>
                     <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => {
                            setSelectedStay(stay);
                            setIsServiceOpen(true);
                          }}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStay(stay);
                            setIsRenewOpen(true);
                          }}
                          title="تجديد الإقامة"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          onClick={() => {
                            setSelectedStay(stay);
                            setIsCheckOutOpen(true);
                          }}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Service Dialog */}
          <Dialog open={isServiceOpen} onOpenChange={setIsServiceOpen}>
            <DialogContent className="max-w-xl bg-slate-50 border-0 shadow-3xl rounded-[2rem] p-0 overflow-hidden flex flex-col" dir="rtl">
              <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black flex items-center gap-3 text-slate-900">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    إضافة خدمة طبية / فندقية لـ {selectedStay?.patient?.fullName}
                  </DialogTitle>
                </DialogHeader>
                <Button variant="ghost" size="icon" onClick={() => setIsServiceOpen(false)} className="rounded-xl">
                  <Plus className="w-5 h-5 rotate-45" />
                </Button>
              </div>

              <form onSubmit={handleAddService} className="p-8 space-y-8 text-right overflow-y-auto">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">قائمة الخدمات المتاحة</Label>
                    <Select 
                      value={serviceForm.serviceId} 
                      onValueChange={v => setServiceForm({ ...serviceForm, serviceId: v })}
                    >
                      <SelectTrigger className="text-right h-14 bg-slate-50 border-slate-100 rounded-xl text-sm font-black focus:ring-4 focus:ring-blue-100 transition-all">
                        <SelectValue placeholder="تحديد نوع الخدمة المطلوبة..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {servicesList.map((s, sIdx) => (
                          <SelectItem key={s.id || `svc-${sIdx}`} value={s.id.toString()} className="text-right font-bold text-xs py-3">{s.name} ({s.unitCost.toLocaleString()} ج.م)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">الكمية المسجلة</Label>
                      <Input 
                        type="number" 
                        className="h-14 text-center bg-slate-50 border-slate-100 rounded-xl text-lg font-black focus:ring-4 focus:ring-blue-100" 
                        value={serviceForm.quantity || ""}
                        onChange={e => setServiceForm({ ...serviceForm, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">إجمالي التكلفة (تعديل يدوي)</Label>
                      <Input 
                        type="number" 
                        placeholder={selectedMasterService ? (parseFloat(serviceForm.quantity || "0") * selectedMasterService.unitCost).toString() : "0"}
                        className="h-14 text-center bg-slate-50 border-slate-100 rounded-xl text-lg font-black text-blue-600 focus:ring-4 focus:ring-blue-100" 
                        value={serviceForm.totalCostOverride || ""}
                        onChange={e => setServiceForm({ ...serviceForm, totalCostOverride: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">ملحوظات التنفيذ والبنود الطبية</Label>
                    <Textarea 
                      className="min-h-[120px] bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-medium leading-relaxed"
                      placeholder="أدخل أي تفاصيل إضافية عن الخدمة المنفذة..."
                      value={serviceForm.notes || ""}
                      onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="ghost" className="h-12 px-8 text-xs font-black rounded-xl" onClick={() => setIsServiceOpen(false)}>تجاهل الأمر</Button>
                  <Button type="submit" className="h-12 bg-blue-600 hover:bg-blue-700 text-sm font-black px-12 rounded-xl shadow-xl shadow-blue-100" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : "اعتماد الخدمة وحفظ التكلفة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Check-out Dialog */}
          <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
            <DialogContent className="max-w-xl bg-white border-0 shadow-3xl rounded-[2rem] p-0 overflow-hidden flex flex-col" dir="rtl">
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-50">
                  <UserMinus className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-900 text-center">إغلاق الإقامة وتصريح الخروج</DialogTitle>
                  </DialogHeader>
                  <p className="text-slate-400 text-sm font-bold">يرجى تأكيد رغبتك في إخلاء السرير النهائي للمريض</p>
                </div>

                <div className="w-full p-6 bg-slate-50 rounded-2xl border border-slate-100 text-right space-y-4">
                   <div className="flex justify-between items-center text-right border-b border-white pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المريض</span>
                      <span className="text-sm font-black text-red-600">{selectedStay?.patient?.fullName}</span>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-1">توصيات الخروج والملاحظات الطبية</Label>
                      <Textarea 
                        className="min-h-[140px] bg-white border-slate-200 rounded-xl p-4 text-sm font-medium leading-relaxed"
                        placeholder="أدخل مخلص الحالة عند الخروج..."
                        value={dischargeNotes || ""}
                        onChange={e => setDischargeNotes(e.target.value)}
                      />
                   </div>
                </div>

                <div className="flex flex-col w-full gap-3 pt-2">
                  <Button className="h-14 bg-red-600 hover:bg-red-700 text-sm font-black rounded-2xl shadow-2xl shadow-red-100 transition-all uppercase tracking-tight" onClick={handleCheckOut} disabled={loading}>
                    {loading ? "جاري تنفيذ أمر الخروج..." : "تأكيد إخلاء السرير وإصدار الفاتورة"}
                  </Button>
                  <Button variant="ghost" className="h-14 text-sm font-black text-slate-400 rounded-2xl hover:bg-slate-50" onClick={() => setIsCheckOutOpen(false)}>إلغاء الأمر</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          
          <Button variant="ghost" className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-slate-50/50">
            تصفح أرشيف التسكين الكامل
          </Button>

          {/* Quick Companion Dialog */}
          <Dialog open={isQuickCompanionOpen} onOpenChange={setIsQuickCompanionOpen}>
             <DialogContent className="max-w-2xl bg-white border-0 shadow-3xl rounded-[2rem] p-0 overflow-hidden flex flex-col" dir="rtl">
               <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                 <DialogHeader>
                   <DialogTitle className="text-xl font-black flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-xl ring-1 ring-white/10">
                        <UserPlus className="w-6 h-6 text-emerald-400" />
                      </div>
                      إضافة مرافق سريع ونسبـه للمريض
                   </DialogTitle>
                 </DialogHeader>
                 <Button variant="ghost" size="icon" onClick={() => setIsQuickCompanionOpen(false)} className="text-white hover:bg-white/10 rounded-xl">
                    <Plus className="w-5 h-5 rotate-45" />
                 </Button>
               </div>
               
               <form onSubmit={handleQuickAddCompanion} className="p-8 space-y-8 text-right overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">الاسم الكامل للمرافق</Label>
                      <Input 
                        required 
                        className="h-14 bg-slate-50 border-slate-100 rounded-xl text-sm font-black focus:ring-4 focus:ring-emerald-100"
                        placeholder="أدخل الاسم الثلاثي أو الرباعي..."
                        value={quickCompanionData.fullName || ""}
                        onChange={e => setQuickCompanionData({...quickCompanionData, fullName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">تاريخ الميلاد أو السن</Label>
                      <Input 
                        required 
                        type="number"
                        className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black text-center"
                        value={quickCompanionData.age || ""}
                        onChange={e => setQuickCompanionData({...quickCompanionData, age: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">النوع</Label>
                      <select 
                        className="w-full h-14 px-6 border border-slate-100 bg-slate-50 rounded-xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-emerald-100 appearance-none"
                        value={quickCompanionData.gender}
                        onChange={e => setQuickCompanionData({...quickCompanionData, gender: e.target.value})}
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الهوية الوطنية</Label>
                      <Input 
                        required 
                        className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black font-mono tracking-widest text-center"
                        value={quickCompanionData.nationalId || ""}
                        onChange={e => setQuickCompanionData({...quickCompanionData, nationalId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">درجة القرابة</Label>
                      <select 
                        className="w-full h-14 px-6 border border-slate-100 bg-slate-50 rounded-xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-emerald-100 appearance-none"
                        value={quickCompanionData.relationship}
                        onChange={e => setQuickCompanionData({...quickCompanionData, relationship: e.target.value})}
                      >
                        {getList("relationships").map((rel, idx) => (
                          <option key={`${rel}-${idx}`} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">موقف الإقامة / اللجوء</Label>
                      <select 
                        className="w-full h-14 px-6 border border-slate-100 bg-slate-50 rounded-xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-emerald-100 appearance-none"
                        value={quickCompanionData.asylumStatus}
                        onChange={e => setQuickCompanionData({...quickCompanionData, asylumStatus: e.target.value})}
                      >
                        <option value="refugee">لاجئ مسجل</option>
                        <option value="seeker">طالب لجوء</option>
                        <option value="residence">إقامة سياحية / أخرى</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <Button type="button" variant="ghost" className="h-12 px-8 text-xs font-black rounded-xl" onClick={() => setIsQuickCompanionOpen(false)}>إلغاء</Button>
                    <Button type="submit" className="h-12 bg-emerald-600 hover:bg-emerald-700 text-sm font-black px-12 rounded-xl shadow-xl shadow-emerald-100" disabled={loading}>
                      {loading ? "جاري المعالجة..." : "حفظ المرافق وربطه بالقيد الحالي"}
                    </Button>
                  </div>
               </form>
             </DialogContent>
          </Dialog>

          {/* Renew Dialog */}
          <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
             <DialogContent className="max-w-xl bg-white border-0 shadow-3xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col" dir="rtl">
               <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex flex-col items-center text-center space-y-4">
                 <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-100">
                    <ArrowLeftRight className="w-10 h-10 text-emerald-600" />
                 </div>
                 <div className="space-y-1">
                   <DialogHeader>
                     <DialogTitle className="text-2xl font-black text-slate-900 text-center">تجديد مدة إقامة الحالة</DialogTitle>
                   </DialogHeader>
                   <p className="text-slate-500 text-sm font-bold tracking-tight">إصدار تصريح إقامة جديد لنفس الحالة: <span className="text-emerald-700">{selectedStay?.patient?.fullName}</span></p>
                 </div>
               </div>
               
               <form onSubmit={handleRenewStay} className="p-10 space-y-8 text-right overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">مدة الإقامة الجديدة (بالأيام)</Label>
                      <Input 
                        type="number" 
                        className="h-14 bg-slate-50 border-slate-100 rounded-xl text-xl font-black text-center focus:ring-4 focus:ring-emerald-100"
                        placeholder="مثلاً: 30"
                        value={renewForm.duration}
                        onChange={e => setRenewForm({...renewForm, duration: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رابط المستند الجديد (خطاب التحويل)</Label>
                       <Input 
                         className="h-14 bg-slate-50 border-slate-100 rounded-xl text-xs font-bold"
                         placeholder="URL لخطاب التحويل الجديد"
                         value={renewForm.letterUrl}
                         onChange={e => setRenewForm({...renewForm, letterUrl: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                        <AlertCircle className="w-5 h-5" />
                     </div>
                     <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                        تنبيه: التجديد سيقوم بإغلاق الإقامة الحالية مع موازنتها، وفتح سجل إقامة جديد يبدأ من تاريخ اللحظة الحالية. يرجى التأكد من المرفقات.
                     </p>
                  </div>

                  <div className="flex flex-col w-full gap-3 pt-4">
                    <Button type="submit" className="h-14 bg-emerald-600 hover:bg-emerald-700 text-sm font-black rounded-2xl shadow-2xl shadow-emerald-100" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : "إتمام عملية التجديد المباشر"}
                    </Button>
                    <Button type="button" variant="ghost" className="h-14 text-sm font-black text-slate-400 rounded-2xl" onClick={() => setIsRenewOpen(false)}>إلغاء الأمر</Button>
                  </div>
               </form>
             </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

