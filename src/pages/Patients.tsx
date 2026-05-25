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
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  FileEdit, 
  Eye, 
  Download,
  Phone,
  MapPin,
  Calendar,
  Users,
  User,
  Heart,
  Upload,
  FileText,
  Camera,
  CheckCircle,
  Archive,
  Activity,
  History,
  ExternalLink,
  Receipt,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  LogOut,
  CreditCard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DataTable } from "@/components/DataTable";
import { getColumns, Patient } from "@/pages/patients/columns";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [profilePatientId, setProfilePatientId] = useState<number | null>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedPatientsData, setExpandedPatientsData] = useState<Record<number, any>>({});
  const [expandedStays, setExpandedStays] = useState<Set<number>>(new Set());
  const [stayServicesMap, setStayServicesMap] = useState<Record<number, any[]>>({});
  const [stayCompanionsMap, setStayCompanionsMap] = useState<Record<number, any[]>>({});
  const [loadingStayDetails, setLoadingStayDetails] = useState<Record<number, boolean>>({});
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [idExists, setIdExists] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState<number | null>(null);
  const [idChecking, setIdChecking] = useState(false);
  const [density, setDensity] = useState<"compact" | "normal">("normal");
  const { isLoading: isProfileLoading, withLoading: withProfileLoading } = useLoading(false);
  const [serviceFormData, setServiceFormData] = useState({
    serviceId: "",
    quantity: "1",
    notes: ""
  });

  const [stats, setStats] = useState<any>(null);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    caseStatus: "all",
    governorate: "all",
    gender: "all"
  });

  const fetchStats = async () => {
    try {
      const data = await apiRequest("/dashboard/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredPatients = React.useMemo(() => {
    return patients.filter(p => {
      const matchesStatus = filters.caseStatus === "all" || p.caseStatus === filters.caseStatus;
      const matchesGov = filters.governorate === "all" || p.governorate === filters.governorate;
      const matchesGender = filters.gender === "all" || p.gender === filters.gender;
      return matchesStatus && matchesGov && matchesGender;
    });
  }, [patients, filters]);

  useEffect(() => {
    let count = 0;
    if (filters.caseStatus !== "all") count++;
    if (filters.governorate !== "all") count++;
    if (filters.gender !== "all") count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleOpenProfile = React.useCallback((id: number) => {
    setProfilePatientId(id);
    setPatientProfile(null);
    setIsProfileOpen(true);
    setIsEditingProfile(false);
    fetchPatientProfile(id);
  }, []);

  const columns = React.useMemo(() => getColumns(
    (patient) => handleOpenProfile(patient.id),
    (patient) => {
      // Handle edit logic here or open profile to edit
      handleOpenProfile(patient.id);
      setIsEditingProfile(true);
    },
    (id) => {
      setPatientToDelete(id);
      setIsDeleteConfirmOpen(true);
    }
  ), [handleOpenProfile]); 

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    try {
      await apiRequest(`/patients/${patientToDelete}`, { method: "DELETE" });
      toast.success("تم حذف المريض بنجاح");
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف المريض");
    } finally {
      setIsDeleteConfirmOpen(false);
      setPatientToDelete(null);
    }
  };

  const toggleRow = async (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Fetch patient details if not already present
      if (!expandedPatientsData[id]) {
        try {
          const profile = await apiRequest(`/patients/${id}`);
          setExpandedPatientsData(prev => ({ ...prev, [id]: profile }));
          
          // Also fetch details for each stay to satisfy the "Total Services Cost" requirement
          if (profile.stays && profile.stays.length > 0) {
            for (const stay of profile.stays) {
              if (!stayServicesMap[stay.id]) {
                const services = await apiRequest(`/stays/${stay.id}/services`);
                setStayServicesMap(prev => ({ ...prev, [stay.id]: services }));
              }
              if (!stayCompanionsMap[stay.id]) {
                const companions = await apiRequest(`/stays/${stay.id}/companions`);
                setStayCompanionsMap(prev => ({ ...prev, [stay.id]: companions }));
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch patient details for expanded row:", err);
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  const fetchServices = async () => {
    try {
      const data = await apiRequest("/services");
      setServicesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [sysSettings, setSysSettings] = useState<any>({
    governorates: "القاهرة, الجيزة, الإسكندرية, مطروح, أسوان",
    relationships: "درجة أولى, درجة ثانية, صديق, ممرض, أخرى"
  });

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

  const toggleStay = async (stayId: number) => {
    const newExpanded = new Set(expandedStays);
    if (newExpanded.has(stayId)) {
      newExpanded.delete(stayId);
    } else {
      newExpanded.add(stayId);
      if (!stayServicesMap[stayId] || !stayCompanionsMap[stayId]) {
        setLoadingStayDetails(prev => ({ ...prev, [stayId]: true }));
        try {
          const [services, companions] = await Promise.all([
            apiRequest(`/stays/${stayId}/services`),
            apiRequest(`/stays/${stayId}/companions`)
          ]);
          setStayServicesMap(prev => ({ ...prev, [stayId]: services }));
          setStayCompanionsMap(prev => ({ ...prev, [stayId]: companions }));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingStayDetails(prev => ({ ...prev, [stayId]: false }));
        }
      }
    }
    setExpandedStays(newExpanded);
  };

  // Companion form state
  const [companionData, setCompanionData] = useState({
    fullName: "",
    nationalId: "",
    mobile: "",
    relationship: "relative",
    notes: "",
    isEmergencyContact: false,
    gender: "male",
    age: "",
    asylumStatus: "refugee"
  });
  const [addToActiveStay, setAddToActiveStay] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    gender: "male",
    dob: "",
    mobile: "",
    emergencyContact: "",
    emergencyPhone: "",
    governorate: "",
    address: "",
    diagnosis: "",
    hospital: "",
    specialty: "",
    doctor: "",
    referralOrg: "",
    caseStatus: "stable",
    photoUrl: "",
  });
  const [addStep, setAddStep] = useState(1);
  const [patientCompanions, setPatientCompanions] = useState<any[]>([]);

  const resetAddForm = () => {
    setFormData({
      fullName: "",
      nationalId: "",
      gender: "male",
      dob: "",
      mobile: "",
      emergencyContact: "",
      emergencyPhone: "",
      governorate: "",
      address: "",
      diagnosis: "",
      hospital: "",
      specialty: "",
      doctor: "",
      referralOrg: "",
      caseStatus: "stable",
      photoUrl: "",
    });
    setPatientCompanions([]);
    setAddStep(1);
  };

  const handleAddCompanionToForm = () => {
    setPatientCompanions([...patientCompanions, {
      fullName: "",
      nationalId: "",
      relationship: "relative",
      mobile: "",
      gender: "male",
      age: "",
      asylumStatus: "refugee",
      isEmergencyContact: false
    }]);
  };

  const updateCompanionInForm = (index: number, field: string, value: any) => {
    const updated = [...patientCompanions];
    updated[index] = { ...updated[index], [field]: value };
    setPatientCompanions(updated);
  };

  const removeCompanionFromForm = (index: number) => {
    setPatientCompanions(patientCompanions.filter((_, i) => i !== index));
  };

  // Document form state
  const [docData, setDocData] = useState({
    name: "",
    category: "medical_report",
    url: "https://example.com/doc.pdf" // Placeholder URL
  });

  useEffect(() => {
    if (isAddOpen) {
      resetAddForm();
    }
  }, [isAddOpen]);

  // Duplicate ID Check
  useEffect(() => {
    const checkId = async () => {
      if (formData.nationalId?.length === 14) {
        setIdChecking(true);
        try {
          const results = await apiRequest(`/patients?q=${formData.nationalId}`);
          const match = results.find((p: any) => p.nationalId === formData.nationalId);
          setIdExists(!!match);
          setExistingPatientId(match ? match.id : null);
        } catch (err) {
          console.error("ID Check failed", err);
        } finally {
          setIdChecking(false);
        }
      } else {
        setIdExists(false);
        setExistingPatientId(null);
      }
    };
    const timer = setTimeout(checkId, 500);
    return () => clearTimeout(timer);
  }, [formData.nationalId]);

  const fetchPatients = async (query = "") => {
    try {
      const data = await apiRequest(`/patients?q=${query}`);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSettings();
    fetchServices();
  }, []);

  const fetchPatientProfile = async (id: number) => {
    try {
      const data = await withProfileLoading(apiRequest(`/patients/${id}`));
      setPatientProfile(data);
      setProfileFormData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profilePatientId) return;
    setUpdatingProfile(true);
    try {
      await apiRequest(`/patients/${profilePatientId}`, {
        method: "PATCH",
        body: JSON.stringify(profileFormData),
      });
      toast.success("تم تحديث بيانات الملف بنجاح");
      setIsEditingProfile(false);
      fetchPatientProfile(profilePatientId);
      fetchPatients(search);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePatientId) return;
    setLoading(true);
    try {
      const newCompanion = await apiRequest("/companions", {
        method: "POST",
        body: JSON.stringify({ ...companionData, patientId: profilePatientId }),
      });
      
      toast.success("تم إضافة المرافق بنجاح");

      // Link to active stay if requested
      const activeStay = patientProfile?.stays?.find((s: any) => s.status === "active");
      if (addToActiveStay && activeStay) {
        await apiRequest(`/stays/${activeStay.id}/companions`, {
          method: "POST",
          body: JSON.stringify({ companionIds: [newCompanion.id] }),
        });
        toast.success("تم ربط المرافق بالإقامة الحالية");
      }

      setCompanionData({ 
        fullName: "", 
        nationalId: "", 
        mobile: "", 
        relationship: "relative", 
        notes: "",
        isEmergencyContact: false,
        gender: "male",
        age: "",
        asylumStatus: "refugee"
      });
      fetchPatientProfile(profilePatientId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCaseStatus = async (newStatus: string) => {
    if (!profilePatientId) return;
    setUpdatingProfile(true);
    try {
      await apiRequest(`/patients/${profilePatientId}`, {
        method: "PATCH",
        body: JSON.stringify({ caseStatus: newStatus }),
      });
      toast.success("تم تحديث الحالة السريرية");
      fetchPatientProfile(profilePatientId);
      fetchPatients(search);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLinkToActiveStay = async (companionId: number) => {
    const activeStay = patientProfile?.stays?.find((s: any) => s.status === "active");
    if (!activeStay) {
      toast.error("لا توجد إقامة نشطة حالياً لهذا المريض");
      return;
    }
    
    setLoading(true);
    try {
      await apiRequest(`/stays/${activeStay.id}/companions`, {
        method: "POST",
        body: JSON.stringify({ companionIds: [companionId] }),
      });
      toast.success("تم ربط المرافق بالإقامة الحالية بنجاح");
      fetchPatientProfile(profilePatientId!);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePatientId) return;
    setLoading(true);
    try {
      await apiRequest(`/patients/${profilePatientId}/documents`, {
        method: "POST",
        body: JSON.stringify(docData),
      });
      toast.success("تم رفع المستند بنجاح");
      setDocData({ name: "", category: "medical_report", url: "https://example.com/doc.pdf" });
      fetchPatientProfile(profilePatientId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.nationalId && formData.nationalId.length !== 14) {
      toast.error("رقم الهوية يجب أن يكون 14 رقماً");
      return;
    }
    
    if (formData.mobile && formData.mobile.length !== 11) {
      toast.error("رقم الهاتف يجب أن يكون 11 رقماً");
      return;
    }

    if (formData.dob && new Date(formData.dob) > new Date()) {
      toast.error("تاريخ الميلاد لا يمكن أن يكون في المستقبل");
      return;
    }

    if (idExists) {
      toast.error("هذا الرقم القومي مسجل بالفعل لمريض آخر. لا يمكن إضافة مريض مكرر.");
      return;
    }

    try {
      await apiRequest("/patients", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          companions: patientCompanions
        }),
      });
      toast.success("تم إضافة المريض بنجاح");
      setIsAddOpen(false);
      setPatientCompanions([]);
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const patientHasActiveStay = patientProfile?.stays?.some((s: any) => s.status === "active");
  const activeStay = patientProfile?.stays?.find((s: any) => s.status === "active");

  const handleAddServiceX = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStay || !serviceFormData.serviceId) return;
    setUpdatingProfile(true);
    try {
      await apiRequest(`/stays/${activeStay.id}/services`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: parseInt(serviceFormData.serviceId),
          quantity: parseInt(serviceFormData.quantity),
          notes: serviceFormData.notes
        })
      });
      toast.success("تمت إضافة الخدمة بنجاح");
      setIsServiceDialogOpen(false);
      setServiceFormData({ serviceId: "", quantity: "1", notes: "" });
      fetchPatientProfile(profilePatientId!);
      fetchPatients(search);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">إدارة ملفات المرضى</h1>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              نظام السجلات الطبية
            </Badge>
            <p className="text-sm text-slate-500 font-bold">إدارة قاعدة بيانات المرضى والمرافقين والتقارير الطبية</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-12 gap-3 text-sm font-black text-slate-700 bg-white hover:bg-slate-50 px-8 rounded-2xl border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <Download className="w-5 h-5 text-emerald-600" />
            تصدير (Excel)
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger
              render={(props) => (
                <Button className="h-12 gap-3 bg-blue-600 hover:bg-blue-700 text-sm font-black shadow-lg shadow-blue-200 px-8 rounded-2xl active:scale-95 transition-all" {...props}>
                  <Plus className="w-5 h-5" />
                  تسجيل مريض جديد
                </Button>
              )}
            />
            <DialogContent className="max-w-[900px] w-full max-h-[95vh] overflow-hidden bg-slate-50 border-0 shadow-3xl rounded-[2.5rem] p-0 flex flex-col my-auto mx-auto" dir="rtl">
              <div className="p-8 border-b border-slate-200/50 bg-white flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                    <UserPlus className="w-10 h-10" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 text-right">تسجيل مريض جديد بالنظام</DialogTitle>
                    <p className="text-sm font-bold text-slate-400 mt-1">المرحلة {addStep} من 3: {addStep === 1 ? "البيانات الشخصية" : addStep === 2 ? "البيانات الطبية" : "بيانات المرافقين"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {[1, 2, 3].map((s) => (
                     <div key={s} className={cn(
                       "w-12 h-2 rounded-full transition-all duration-500",
                       addStep >= s ? "bg-blue-600" : "bg-slate-100"
                     )} />
                   ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto space-y-12 pb-10">
                  <AnimatePresence mode="wait">
                    {addStep === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                        <div className="space-y-8">
                          <div className="flex items-center gap-4 mb-2">
                             <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">01</div>
                             <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">معلومات الهوية والاتصال</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">الاسم الرباعي الكامل</Label>
                              <Input 
                                className="h-16 bg-white text-lg font-bold border-slate-200 px-8 focus:ring-8 focus:ring-blue-50 transition-all rounded-2xl" 
                                placeholder="ادخل اسم المريض كما في الهوية" 
                                value={formData.fullName} 
                                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                              />
                            </div>
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">الرقم القومي (14 رقم)</Label>
                              <div className="relative">
                                <Input 
                                  className={cn(
                                    "h-16 bg-white text-lg font-bold border-slate-200 px-8 font-mono rounded-2xl",
                                    idExists && "border-red-500 bg-red-50"
                                  )} 
                                  placeholder="2990101XXXXXXXX" 
                                  maxLength={14}
                                  value={formData.nationalId} 
                                  onChange={e => setFormData({...formData, nationalId: e.target.value})} 
                                />
                                {idChecking && <Loader2 className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-blue-400" />}
                                {idExists && <span className="text-[10px] font-black text-red-500 absolute -bottom-6 right-2">عفواً! هذا الرقم مسجل مسبقاً بالنظام</span>}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">تاريخ الميلاد</Label>
                              <Input 
                                type="date"
                                className="h-16 bg-white text-base font-bold border-slate-200 px-8 rounded-2xl" 
                                value={formData.dob} 
                                onChange={e => setFormData({...formData, dob: e.target.value})} 
                              />
                            </div>
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">النوع</Label>
                              <select 
                                className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-8 text-base font-bold focus:ring-8 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                              >
                                <option value="male">ذكر</option>
                                <option value="female">أنثى</option>
                              </select>
                            </div>
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">رقم الهاتف الجوال</Label>
                              <Input 
                                className="h-16 bg-white text-lg font-bold border-slate-200 px-8 font-mono rounded-2xl" 
                                placeholder="01XXXXXXXXX" 
                                maxLength={11}
                                value={formData.mobile} 
                                onChange={e => setFormData({...formData, mobile: e.target.value})} 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">المحافظة</Label>
                              <select 
                                className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-8 text-base font-bold transition-all appearance-none cursor-pointer"
                                value={formData.governorate}
                                onChange={e => setFormData({...formData, governorate: e.target.value})}
                              >
                                <option value="">اختر المحافظة...</option>
                                {getList("governorates").map(gov => (
                                  <option key={gov} value={gov}>{gov}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">العنوان بالتفصيل</Label>
                              <Input 
                                className="h-16 bg-white text-base font-bold border-slate-200 px-8 rounded-2xl" 
                                placeholder="المنطقة، الشارع، المبنى" 
                                value={formData.address || ""} 
                                onChange={e => setFormData({...formData, address: e.target.value})} 
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {addStep === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                      >
                        <div className="space-y-10">
                          <div className="flex items-center gap-4 mb-2">
                             <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black">02</div>
                             <h3 className="text-base font-black text-slate-800 uppercase tracking-tight text-right">البيانات السريرية والإحالة</h3>
                          </div>

                          <div className="space-y-4 text-right">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">التشخيص الطبي الأولي</Label>
                            <Textarea 
                              className="min-h-[120px] bg-white text-lg font-bold border-slate-200 p-8 rounded-3xl focus:ring-8 focus:ring-emerald-50 transition-all resize-none" 
                              placeholder="وصف مختصر للحالة المرضية والتشخيص الحالي..." 
                              value={formData.diagnosis || ""} 
                              onChange={e => setFormData({...formData, diagnosis: e.target.value})} 
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">المستشفى المحول منها</Label>
                              <Input 
                                className="h-16 bg-white text-base font-bold border-slate-200 px-8 rounded-2xl" 
                                value={formData.hospital || ""} 
                                onChange={e => setFormData({...formData, hospital: e.target.value})} 
                              />
                            </div>
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">التخصص الطبي</Label>
                              <Input 
                                className="h-16 bg-white text-base font-bold border-slate-200 px-8 rounded-2xl" 
                                value={formData.specialty || ""} 
                                onChange={e => setFormData({...formData, specialty: e.target.value})} 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">جهة الإحالة (جمعية/مؤسسة)</Label>
                              <select 
                                className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-8 text-base font-bold transition-all appearance-none cursor-pointer"
                                value={formData.referralOrg || ""}
                                onChange={e => setFormData({...formData, referralOrg: e.target.value})}
                              >
                                <option value="">اختر الجهة...</option>
                                {getList("referral_entities").map(org => (
                                  <option key={org} value={org}>{org}</option>
                                ))}
                                <option value="other">أخرى (إدخال يدوي)</option>
                              </select>
                              {formData.referralOrg === "other" && (
                                <Input 
                                  className="h-14 bg-slate-50 border-slate-200 mt-2 px-6 rounded-xl font-bold"
                                  placeholder="اكتب اسم الجهة هنا..."
                                  onChange={e => setFormData({...formData, referralOrg: e.target.value})}
                                />
                              )}
                            </div>
                            <div className="space-y-4 text-right">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">الحالة السريرية عند التسجيل</Label>
                              <select 
                                className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-8 text-base font-bold transition-all appearance-none cursor-pointer"
                                value={formData.caseStatus}
                                onChange={e => setFormData({...formData, caseStatus: e.target.value})}
                              >
                                <option value="stable">مستقرة</option>
                                <option value="improving">في تحسن</option>
                                <option value="observation">تحت الملاحظة</option>
                                <option value="critical">حرجة</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {addStep === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                      >
                         <div className="space-y-10">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-black">03</div>
                               <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">بيانات المرافقين (إن وُجد)</h3>
                             </div>
                             <Button 
                                type="button"
                                onClick={handleAddCompanionToForm}
                                className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-6 rounded-xl font-black text-xs gap-3 border-none shadow-lg shadow-amber-100"
                             >
                                <Plus className="w-4 h-4" />
                                إضافة مرافق جديد
                             </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-10">
                            {patientCompanions.map((comp, idx) => (
                              <div key={idx} className="relative bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl shadow-slate-100 animate-in zoom-in-95 duration-300">
                                 <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className="absolute -top-4 -left-4 w-12 h-12 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white shadow-xl shadow-red-100"
                                    onClick={() => removeCompanionFromForm(idx)}
                                 >
                                    <Trash2 className="w-6 h-6" />
                                 </Button>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4 text-right">
                                       <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">اسم المرافق الكامل</Label>
                                       <Input className="h-16 bg-slate-50 border-transparent rounded-2xl px-8 font-bold" value={comp.fullName || ""} onChange={e => updateCompanionInForm(idx, "fullName", e.target.value)} />
                                    </div>
                                    <div className="space-y-4 text-right">
                                       <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">صلة القرابة</Label>
                                       <select 
                                          className="w-full h-16 bg-slate-50 border-transparent rounded-2xl px-8 font-bold appearance-none cursor-pointer"
                                          value={comp.relationship || ""} 
                                          onChange={e => updateCompanionInForm(idx, "relationship", e.target.value)}
                                       >
                                          {getList("relationships").map(rel => (
                                            <option key={rel} value={rel}>{rel}</option>
                                          ))}
                                       </select>
                                    </div>
                                    <div className="space-y-4 text-right">
                                       <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">الرقم القومي للمرافق</Label>
                                       <Input className="h-16 bg-slate-50 border-transparent rounded-2xl px-8 font-bold font-mono" value={comp.nationalId || ""} onChange={e => updateCompanionInForm(idx, "nationalId", e.target.value)} />
                                    </div>
                                    <div className="space-y-4 text-right">
                                       <Label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pr-2 block">رقم هاتف المرافق</Label>
                                       <Input className="h-16 bg-slate-50 border-transparent rounded-2xl px-8 font-bold font-mono" value={comp.mobile || ""} onChange={e => updateCompanionInForm(idx, "mobile", e.target.value)} />
                                    </div>
                                 </div>
                              </div>
                            ))}
                            {patientCompanions.length === 0 && (
                              <div className="py-32 text-center bg-slate-100/50 border-4 border-dashed border-slate-200 rounded-[4rem]">
                                 <Users className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                                 <p className="text-xl font-black text-slate-300">لا يوجد مرافقين مضافين حالياً</p>
                                 <p className="text-sm font-bold text-slate-400 mt-2">اختياري: يمكنك تجاوز هذه الخطوة إذا لم يوجد مرافق</p>
                              </div>
                            )}
                          </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-8 border-t border-slate-200/50 bg-white flex justify-between items-center sticky bottom-0 z-20 shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => addStep === 1 ? setIsAddOpen(false) : setAddStep(addStep - 1)}
                  className="h-14 px-10 text-sm font-black text-slate-500 rounded-2xl hover:bg-slate-50 flex items-center gap-3 transition-all"
                >
                  {addStep === 1 ? "إلغاء وتسوية" : (
                    <>
                      <ChevronRight className="w-5 h-5 ml-1" />
                      الرجوع للسابق
                    </>
                  )}
                </Button>
                
                {addStep < 3 ? (
                  <Button 
                    type="button"
                    onClick={() => setAddStep(addStep + 1)}
                    className="h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm px-16 rounded-[1.25rem] shadow-2xl shadow-slate-200 flex items-center gap-3 active:scale-95 transition-all"
                  >
                    الاستمرار للخطوة التالية
                    <ChevronLeft className="w-5 h-5 mr-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAddPatient} 
                    className="h-14 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all text-white text-sm font-black px-20 shadow-2xl shadow-blue-200 rounded-[1.25rem] flex items-center gap-4 active:scale-95"
                  >
                    <CheckCircle className="w-6 h-6" />
                    حفظ وإصدار الملف الطبي النهائي
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-blue-100/50">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المرضى</p>
              <h3 className="text-2xl font-black text-slate-800">{stats?.totalPatients || 0} <span className="text-xs text-slate-400 font-bold">ملف</span></h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner border border-emerald-100/50">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إقامات نشطة</p>
              <h3 className="text-2xl font-black text-slate-800">{stats?.currentStays || 0} <span className="text-xs text-slate-400 font-bold">حالة</span></h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all" style={{ width: "441.993px" }}>
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner border border-amber-100/50" style={{ width: "415.993px" }}>
              <LogOut className="w-7 h-7" />
            </div>
            <div style={{ width: "472.993px" }}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">غرف شاغرة</p>
              <h3 className="text-2xl font-black text-slate-800">{stats?.availableRooms || 0} <span className="text-xs text-slate-400 font-bold">غرفة</span></h3>
            </div>
            <div style={{ width: "410.993px" }} />
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner border border-purple-100/50">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
              <h3 className="text-2xl font-black text-slate-800">{stats?.totalRevenue?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-bold">ج.م</span></h3>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Search & Actions Bar */}
      <Card className="border-slate-200 bg-white shadow-xl rounded-[2.5rem] overflow-hidden border-none shadow-slate-200/50">
        <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الرقم القومي، أو رقم الهاتف..." 
              className="h-14 bg-slate-50 border-slate-200 rounded-2xl pr-14 pl-6 text-base font-bold focus:ring-8 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
              <SheetTrigger 
                render={
                  <Button 
                    variant="outline" 
                    className={cn(
                      "h-14 gap-4 px-8 rounded-2xl border-slate-200 font-black text-slate-600 transition-all relative whitespace-nowrap",
                      activeFiltersCount > 0 && "bg-blue-50 border-blue-200 text-blue-700"
                    )}
                  >
                    <Filter className="w-5 h-5" />
                    <span>فلترة متقدمة</span>
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white shadow-lg">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[400px] p-0 border-r-0 bg-slate-50" dir="rtl">
                <div className="p-8 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-2xl font-black text-slate-900 text-right">خيارات الفلترة</SheetTitle>
                    <SheetDescription className="text-sm font-bold text-slate-400 text-right">تخصيص بحث المرضى بدقة</SheetDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFilterDrawerOpen(false)} className="rounded-2xl h-12 w-12 bg-slate-50">
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  </Button>
                </div>
                
                <div className="p-8 space-y-10">
                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2 block text-right">الحالة السريرية</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["all", "stable", "improving", "observation", "critical"].map((status) => (
                        <Button 
                          key={status}
                          variant={filters.caseStatus === status ? "default" : "outline"}
                          className={cn(
                            "h-12 rounded-xl text-xs font-black transition-all",
                            filters.caseStatus === status ? "bg-blue-600 shadow-lg shadow-blue-100" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                          )}
                          onClick={() => setFilters({...filters, caseStatus: status})}
                        >
                          {status === "all" ? "الكل" : 
                           status === "stable" ? "مستقرة" : 
                           status === "improving" ? "في تحسن" : 
                           status === "observation" ? "ملاحظة" : "حرجة"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2 block text-right">المحافظة</Label>
                    <select 
                      className="w-full h-14 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100/50 appearance-none cursor-pointer"
                      value={filters.governorate}
                      onChange={e => setFilters({...filters, governorate: e.target.value})}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.25rem center', backgroundSize: '0.8rem' }}
                    >
                      <option value="all">جميع المحافظات</option>
                      {getList("governorates").map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2 block text-right">النوع</Label>
                    <div className="flex gap-4">
                      {["all", "male", "female"].map((gender) => (
                        <Button 
                          key={gender}
                          variant={filters.gender === gender ? "default" : "outline"}
                          className={cn(
                            "flex-1 h-12 rounded-xl text-xs font-black transition-all",
                            filters.gender === gender ? "bg-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
                          )}
                          onClick={() => setFilters({...filters, gender: gender})}
                        >
                          {gender === "all" ? "الكل" : gender === "male" ? "ذكر" : "أنثى"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 bg-white border-t border-slate-200">
                  <Button 
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100 text-base"
                    onClick={() => {
                      setFilterDrawerOpen(false);
                      fetchPatients(search);
                    }}
                  >
                    تطبيق الفلاتر الآن
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 h-10 text-xs font-bold text-slate-400 hover:text-red-500"
                    onClick={() => setFilters({ caseStatus: "all", governorate: "all", gender: "all" })}
                  >
                    إعادة تعيين كافة الفلاتر
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={(props) => (
                  <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 p-0 hover:bg-slate-50" {...props}>
                    <MoreHorizontal className="w-6 h-6 text-slate-400" />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-[200px] rounded-2xl text-right p-2 shadow-2xl border-none" dir="rtl">
                <DropdownMenuLabel className="text-xs font-black text-slate-400 px-3 py-2 uppercase tracking-widest">خيارات العرض</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setDensity("normal")} className="rounded-xl h-10 font-bold focus:bg-blue-50 focus:text-blue-600 gap-3">
                  <Maximize2 className={cn("w-4 h-4", density === "normal" && "text-blue-600")} />
                  عرض واسع (افتراضي)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDensity("compact")} className="rounded-xl h-10 font-bold focus:bg-blue-50 focus:text-blue-600 gap-3">
                  <Minimize2 className={cn("w-4 h-4", density === "compact" && "text-blue-600")} />
                  عرض مضغوط (بيانات أكثر)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <LoadingSpinner />
              <p className="text-sm font-bold text-slate-400 tracking-wide animate-pulse">جاري سحب بيانات المرضى...</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredPatients} 
              searchKey="fullName" 
              pinnedColumns={["actions"]}
              density={density}
              onRowClick={(patient: any) => toggleRow(patient.id)}
              expandedRowIds={expandedRows}
              pageSize={20}
              renderExpandedRow={(patient: any) => {
                const profile = expandedPatientsData[patient.id];
                const staysList = profile?.stays || [];
                
                // Calculate Total Services Cost from state maps
                let totalServicesCost = 0;
                staysList.forEach((s: any) => {
                  const services = stayServicesMap[s.id] || [];
                  totalServicesCost += services.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
                });

                return (
                  <div className="animate-in slide-in-from-top-2 duration-300 p-6 bg-slate-50/80 rounded-[2.5rem] m-4 border-2 border-white shadow-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المرافقين</p>
                            <p className="text-xl font-black text-slate-800">{patient.companionCount || 0}</p>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <History className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الإقامة</p>
                            <p className="text-xl font-black text-slate-800">{patient.totalStayDays || 0} <span className="text-xs font-bold text-slate-400">يوم</span></p>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Receipt className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تكلفة الخدمات</p>
                            <p className="text-xl font-black text-purple-600">{totalServicesCost.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-3xl border border-blue-600 shadow-md flex items-center gap-5 group cursor-pointer hover:bg-blue-600 transition-all" onClick={() => handleOpenProfile(patient.id)}>
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 group-hover:bg-white flex items-center justify-center text-white group-hover:text-blue-600 shadow-lg shadow-blue-200 transition-colors">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="group-hover:text-white transition-colors">
                            <p className="text-[10px] font-black text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mb-1">إجمالي التكلفة</p>
                            <p className="text-xl font-black text-blue-600 group-hover:text-white">{patient.totalCost?.toLocaleString() || 0} <span className="text-xs font-bold opacity-60">ج.م</span></p>
                          </div>
                          <ChevronLeft className="w-5 h-5 mr-auto text-slate-300 group-hover:text-white transition-colors" />
                       </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-500 flex items-center gap-2 pr-2">
                        <History className="w-4 h-4" />
                        سجل الإقامات والخدمات التفصيلي
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {staysList.length > 0 ? staysList.map((stay: any) => {
                          const services = stayServicesMap[stay.id] || [];
                          const comps = stayCompanionsMap[stay.id] || [];
                          return (
                            <div key={stay.id} className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-all">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "px-4 py-1 rounded-full text-[10px] font-black uppercase",
                                    stay.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                  )}>
                                    {stay.status === "active" ? "إقامة نشطة" : "إقامة منتهية"}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                    <span>{safeFormat(stay.checkInDate, "dd/MM/yyyy", { locale: ar })}</span>
                                    {stay.actualCheckOutDate && (
                                      <>
                                        <ChevronLeft className="w-3 h-3 text-slate-300" />
                                        <span>{safeFormat(stay.actualCheckOutDate, "dd/MM/yyyy", { locale: ar })}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-xl">
                                    <Users className="w-3 h-3 text-blue-500" />
                                    <span className="text-[10px] font-black text-blue-700">{comps.length} مرافق</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-xl">
                                    <ClipboardList className="w-3 h-3 text-purple-500" />
                                    <span className="text-[10px] font-black text-purple-700">{services.length} خدمة</span>
                                  </div>
                                </div>
                              </div>
                              
                              {services.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                                  {services.slice(0, 5).map((svc: any) => (
                                    <Badge key={svc.id} variant="outline" className="bg-white border-slate-100 text-[9px] font-bold py-0.5 px-2 text-slate-500">
                                      {svc.service?.name} ({svc.quantity})
                                    </Badge>
                                  ))}
                                  {services.length > 5 && (
                                    <span className="text-[9px] font-black text-slate-300 pr-2">+{services.length - 5} خدمات أخرى...</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }) : (
                          <div className="text-center py-10 bg-slate-100/30 border-2 border-dashed border-slate-200 rounded-[2rem]">
                            <p className="text-xs font-bold text-slate-400">لا يوجد سجل إقامات مسجل لهذا المريض</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      </Card>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none border-none overflow-hidden flex flex-col bg-white" dir="rtl">
          {isProfileLoading || !patientProfile ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size="lg" label="جاري تحميل بيانات المريض..." />
            </div>
          ) : (
            <>
              <div className="p-6 md:p-8 bg-slate-900 text-white relative shrink-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black overflow-hidden ring-4 ring-white/5 shadow-2xl">
                      {patientProfile.photoUrl ? (
                        <img src={patientProfile.photoUrl} className="w-full h-full object-cover" />
                      ) : (
                        patientProfile.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight">{patientProfile.fullName}</h2>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl border border-white/10">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span className="text-xs font-black uppercase tracking-widest text-white/60">الملف الطبي الشامل</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                         <Badge className="bg-blue-600 hover:bg-blue-600 text-sm font-black border-0 h-8 px-4 rounded-xl shadow-lg shadow-blue-900/40">{patientProfile.nationalId}</Badge>
                         <Badge className={cn(
                           "text-sm h-8 px-4 font-black border-0 rounded-xl",
                           patientProfile.caseStatus === "critical" ? "bg-red-500" : 
                           patientProfile.caseStatus === "discharged" ? "bg-slate-500" : "bg-emerald-500"
                         )}>
                           {patientProfile.caseStatus === "stable" ? "حالة مستقرة" : 
                            patientProfile.caseStatus === "critical" ? "حالة حرجة" :
                            patientProfile.caseStatus === "discharged" ? "تم الخروج" : "حالة متابعة"}
                         </Badge>
                          <Badge variant="outline" className="text-sm h-8 px-4 border-white/20 text-white/60 font-black rounded-xl">
                           {patientProfile.gender === "male" ? "ذكر" : "أنثى"} • {isValidDate(patientProfile.dob) ? (new Date().getFullYear() - new Date(patientProfile.dob).getFullYear()) : "---"} سنة
                          </Badge>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                       onClick={() => setIsEditingProfile(!isEditingProfile)}
                       variant="outline" 
                       className="bg-white/10 border-white/20 hover:bg-white/20 text-white h-12 px-8 font-black rounded-2xl transition-all"
                    >
                      {isEditingProfile ? "إلغاء التعديل" : "تعديل الملف"}
                    </Button>
                    {isEditingProfile ? (
                      <Button 
                        onClick={handleSaveProfile}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 font-black shadow-xl shadow-blue-900/40 rounded-2xl"
                        disabled={updatingProfile}
                      >
                        {updatingProfile ? <Loader2 className="w-5 h-5 animate-spin ml-3" /> : <CheckCircle className="w-5 h-5 ml-3" />}
                        حفظ التغييرات
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="bg-emerald-600 border-0 hover:bg-emerald-700 text-white h-12 px-10 font-black shadow-xl shadow-emerald-900/40 rounded-2xl"
                        onClick={() => window.print()}
                      >
                        <Download className="w-5 h-5 ml-3" />
                        تصدير الملف الكامل
                      </Button>
                    )}
                    <Separator orientation="vertical" className="h-10 bg-white/10 mx-4 hidden md:block" />
                    <Button 
                      variant="ghost" 
                      className="text-white h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group lg:mr-4" 
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <ChevronRight className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50/30">
                <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
                  <div className="px-8 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <TabsList className="bg-transparent h-20 w-full justify-start gap-12 rounded-none border-b-0 p-0 overflow-x-auto no-scrollbar">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-base font-black transition-all px-4 tracking-tight">البيانات الأساسية للمريض</TabsTrigger>
                  <TabsTrigger value="medical" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-base font-black transition-all px-4 tracking-tight">السجل الطبي والتشخيص</TabsTrigger>
                  <TabsTrigger value="stays" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-base font-black transition-all px-4 tracking-tight">سجل الإقامات (Rooms)</TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-base font-black transition-all px-4 tracking-tight">الأوراق والمستندات</TabsTrigger>
                  <TabsTrigger value="companions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 rounded-none h-full text-base font-black transition-all px-4 tracking-tight">بيانات المرافقين الشخصية</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 w-full max-w-7xl mx-auto pb-24">
                <AnimatePresence mode="wait">
                  <TabsContent value="overview" className="mt-0 outline-none h-full min-h-[60vh]">
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 border-r-8 border-blue-600 pr-5 mb-8">
                          <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">البيانات الديموغرافية والاتصال</h3>
                            <p className="text-xs font-bold text-slate-400">المعلومات الشخصية الأساسية للملف</p>
                          </div>
                        </div>

                        {isEditingProfile ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Edit fields for basic info */}
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم الكامل</Label>
                              <Input className="h-12 bg-slate-50 border-slate-100 rounded-xl" value={profileFormData.fullName || ""} onChange={e => setProfileFormData({...profileFormData, fullName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الهاتف</Label>
                              <Input className="h-12 bg-slate-50 border-slate-100 rounded-xl" value={profileFormData.mobile || ""} onChange={e => setProfileFormData({...profileFormData, mobile: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحافظة</Label>
                              <select className="flex h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold" value={profileFormData.governorate} onChange={e => setProfileFormData({...profileFormData, governorate: e.target.value})}>
                                {getList("governorates").map((gov, idx) => <option key={`${gov}-${idx}`} value={gov}>{gov}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العنوان</Label>
                              <Input className="h-12 bg-slate-50 border-slate-100 rounded-xl" value={profileFormData.address || ""} onChange={e => setProfileFormData({...profileFormData, address: e.target.value})} />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الهوية</p>
                              <p className="text-lg font-black text-slate-800">{patientProfile.nationalId}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الجوال</p>
                              <p className="text-lg font-black text-slate-800">{patientProfile.mobile}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحافظة</p>
                              <p className="text-lg font-black text-slate-800">{patientProfile.governorate}</p>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العنوان التفصيلي</p>
                              <p className="text-lg font-black text-slate-800">{patientProfile.address || "غير مسجل"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="medical" className="mt-0 outline-none">
                    <motion.div 
                      key="medical"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-r-8 border-emerald-500 pr-5">
                          <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">التشخيص والتاريخ المرضي</h3>
                            <p className="text-xs font-bold text-slate-400">الحالة الطبية الحالية والبيانات السريرية</p>
                          </div>
                        </div>

                        {isEditingProfile ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستشفى</Label>
                                <Input className="h-12 bg-slate-50 border-slate-100 rounded-xl" value={profileFormData.hospital || ""} onChange={e => setProfileFormData({...profileFormData, hospital: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التخصص</Label>
                                <Input className="h-12 bg-slate-50 border-slate-100 rounded-xl" value={profileFormData.specialty || ""} onChange={e => setProfileFormData({...profileFormData, specialty: e.target.value})} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التشخيص</Label>
                              <Textarea className="min-h-[150px] bg-slate-50 border-slate-100 rounded-2xl" value={profileFormData.diagnosis || ""} onChange={e => setProfileFormData({...profileFormData, diagnosis: e.target.value})} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المستشفى</p>
                                <p className="text-sm font-black text-slate-800">{patientProfile.hospital || "غير محدد"}</p>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">التخصص</p>
                                <p className="text-sm font-black text-slate-800">{patientProfile.specialty || "غير محدد"}</p>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الطبيب</p>
                                <p className="text-sm font-black text-slate-800">{patientProfile.doctor || "غير محدد"}</p>
                              </div>
                            </div>
                            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                              <Activity className="absolute -top-10 -right-10 w-64 h-64 opacity-5" />
                              <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-6">التشخيص والوضع السريري</p>
                              <div className="text-xl font-bold leading-relaxed">
                                {patientProfile.diagnosis || "لا يوجد تشخيص مفصل مسجل لهذا المريض."}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="stays" className="mt-0 outline-none">
                    <motion.div 
                      key="stays"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-600" />
                            سجل الإقامات التفصيلي
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">تاريخ الدخول</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">الخروج</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">الغرفة</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">الحالة</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">الإجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {patientProfile.stays?.map((stay: any, idx: number) => {
                                const isExpanded = expandedStays.has(stay.id);
                                const services = stayServicesMap[stay.id] || [];
                                const companions = stayCompanionsMap[stay.id] || [];
                                const isLoading = loadingStayDetails[stay.id];
                                const totalCost = services.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
                                 const totalQty = services.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
                                
                                return (
                                  <React.Fragment key={`stay-${stay.id}-${idx}`}>
                                    <TableRow className={cn("hover:bg-slate-50/30 transition-colors", isExpanded && "bg-blue-50/20")}>
                                      <TableCell className="font-bold text-xs">{safeFormat(stay.checkInDate, "dd MMM yyyy", { locale: ar })}</TableCell>
                                      <TableCell className="font-bold text-xs text-slate-400">
                                        {stay.actualCheckOutDate 
                                          ? safeFormat(stay.actualCheckOutDate, "dd MMM yyyy", { locale: ar }) 
                                          : stay.expectedCheckOutDate 
                                            ? safeFormat(stay.expectedCheckOutDate, "dd MMM yyyy", { locale: ar }) 
                                            : "مستمرة"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-[10px] font-black bg-blue-50 text-blue-700 border-blue-100">غرفة {stay.roomNumber}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={cn(
                                          "text-[9px] font-black uppercase tracking-widest",
                                          stay.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                        )}>
                                          {stay.status === "active" ? "نشطة" : "منتهية"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className={cn("h-8 text-[10px] font-black gap-2 transition-all", isExpanded ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100" : "text-blue-600 hover:bg-blue-50")}
                                          onClick={() => toggleStay(stay.id)}
                                        >
                                          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                          {isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                    
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <TableRow className="bg-slate-50/50 border-inline-transparent">
                                          <TableCell colSpan={5} className="p-1">
                                            <motion.div 
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="p-8 space-y-8">
                                                {isLoading ? (
                                                  <div className="flex items-center justify-center py-10 gap-3">
                                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                                    <span className="text-xs font-black text-slate-400">جاري تحميل البيانات التفصيلية...</span>
                                                  </div>
                                                ) : (
                                                  <>
                                                    {/* Companions for this stay */}
                                                    <div className="space-y-4">
                                                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-emerald-500" />
                                                        المرافقون خلال هذه الإقامة ({companions.length})
                                                      </h4>
                                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {companions.length > 0 ? companions.map((comp: any, cidx: number) => (
                                                          <div key={comp.id || `stay-comp-${cidx}`} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                              <User className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                              <p className="text-xs font-black text-slate-800 leading-none mb-1">{comp.fullName}</p>
                                                              <div className="flex gap-2">
                                                                <Badge className="text-[8px] h-4 bg-emerald-50 text-emerald-600 border-emerald-100">{comp.relationship}</Badge>
                                                                <span className="text-[9px] font-bold text-slate-400">{comp.mobile}</span>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        )) : (
                                                          <div className="col-span-3 py-6 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">لا يوجد مرافقون مسجلون لهذه الفترة</p>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>

                                                    {/* Services for this stay */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between" style={{ width: "430.993px" }}>
                                                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                              <ClipboardList className="w-4 h-4 text-blue-500" />
                                                              سجل الخدمات المباشرة والتكاليف
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-6 px-3">{totalQty} إجمالي الكميات</Badge>
                                                              <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 text-[10px] font-black text-emerald-600 border-emerald-100 hover:bg-emerald-50 gap-2 rounded-xl"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  window.location.href = `/finance?patientId=${patientProfile.id}&stayId=${stay.id}`;
                                                                }}
                                                              >
                                                                <Receipt className="w-3.5 h-3.5" />
                                                                عرض الفاتورة الكاملة
                                                                <ArrowUpRight className="w-3 h-3 opacity-50" />
                                                              </Button>
                                                            </div>
                                                          </div>
                                                          <div className="flex flex-col md:flex-row items-center gap-6">
                                                            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-emerald-100 min-w-[200px]">
                                                              <span className="text-[9px] font-black uppercase opacity-60 mb-1 text-center">إجمالي تكلفة الخدمات:</span>
                                                              <span className="text-xl font-black">{totalCost.toLocaleString()} ج.م</span>
                                                            </div>
                                                            <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-blue-100 min-w-[200px]">
                                                              <span className="text-[9px] font-black uppercase opacity-60 mb-1 text-center">إجمالي تكلفة الإقامة حتى الآن:</span>
                                                              <span className="text-xl font-black">{(totalCost).toLocaleString()} ج.م</span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                        <Table>
                                                          <TableHeader>
                                                            <TableRow className="bg-slate-50/80">
                                                              <TableHead className="text-right text-[9px] font-black py-3">الخدمة</TableHead>
                                                              <TableHead className="text-center text-[9px] font-black">الكمية</TableHead>
                                                              <TableHead className="text-right text-[9px] font-black">التكلفة</TableHead>
                                                              <TableHead className="text-right text-[9px] font-black">تاريخ الإضافة</TableHead>
                                                            </TableRow>
                                                          </TableHeader>
                                                          <TableBody>
                                                            {services.length > 0 ? services.map((svc: any, sIdx: number) => (
                                                              <TableRow key={svc.id || `svc-${sIdx}`} className="hover:bg-slate-50">
                                                                <TableCell className="text-xs font-black text-slate-700">{svc.service?.name}</TableCell>
                                                                <TableCell className="text-center font-bold text-xs">{svc.quantity}</TableCell>
                                                                <TableCell className="text-xs font-black text-blue-600">{svc.totalCost.toLocaleString()} ج.م</TableCell>
                                                                <TableCell className="text-xs font-bold text-slate-400">{safeFormat(svc.createdAt, "dd/MM/yyyy", { locale: ar })}</TableCell>
                                                              </TableRow>
                                                            )) : (
                                                              <TableRow>
                                                                <TableCell colSpan={4} className="h-24 text-center">
                                                                  <p className="text-[10px] font-bold text-slate-400 uppercase">لم يتم تسجيل أي خدمات فندقية لهذه الإقامة بعد</p>
                                                                </TableCell>
                                                              </TableRow>
                                                            )}
                                                          </TableBody>
                                                        </Table>
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            </motion.div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </AnimatePresence>
                                  </React.Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-0 outline-none">
                    <motion.div 
                      key="documents"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {patientProfile.documents?.map((doc: any, idx: number) => (
                        <Card key={doc.id || `doc-${idx}`} className="group hover:border-blue-300 transition-all cursor-pointer rounded-2xl overflow-hidden shadow-sm border-slate-200">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-slate-800 mb-1">{doc.name}</h4>
                                <Badge className="text-[9px] font-black bg-slate-100 text-slate-400 border-0 h-5">
                                  {doc.category === "medical_report" ? "تقرير طبي" : "مستند"}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline" className="w-full h-10 text-xs font-black rounded-xl border-slate-100 bg-slate-50 hover:bg-white" onClick={() => window.open(doc.url, "_blank")}>
                              <ExternalLink className="w-3.5 h-3.5 ml-2" />
                              عرض المستند الآن
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="companions" className="mt-0 outline-none">
                    <motion.div 
                      key="companions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-blue-600" />
                          المرافقين المسجلين ({patientProfile.companions?.length || 0})
                        </h3>
                        {patientProfile.companions?.map((comp: any, idx: number) => (
                          <div key={comp.id || `profile-comp-${idx}`} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                 <Users className="w-6 h-6" />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-slate-800 mb-1">{comp.fullName}</h4>
                                 <div className="flex gap-2">
                                    <Badge className="text-[9px] font-black h-5 bg-blue-50 text-blue-600 border-blue-100">{comp.relationship}</Badge>
                                    <span className="text-[10px] font-bold text-slate-400">{comp.mobile}</span>
                                 </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl sticky top-24">
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6">
                          <UserPlus className="w-5 h-5 text-blue-600" />
                          إضافة مرافق جديد للملف
                        </h4>
                        <form onSubmit={handleAddCompanion} className="space-y-5">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم الكامل</Label>
                            <Input 
                               className="h-11 bg-slate-50 border-slate-200"
                               placeholder="الاسم الرباعي للمرافق"
                               value={companionData.fullName || ""}
                               onChange={e => setCompanionData({...companionData, fullName: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">السن</Label>
                                <Input 
                                  type="number"
                                  className="h-11 bg-slate-50"
                                  value={companionData.age || ""}
                                  onChange={e => setCompanionData({...companionData, age: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">النوع</Label>
                                <select 
                                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                  value={companionData.gender}
                                  onChange={e => setCompanionData({...companionData, gender: e.target.value})}
                                >
                                  <option value="male">ذكر</option>
                                  <option value="female">أنثى</option>
                                </select>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الهوية</Label>
                                <Input className="h-11 bg-slate-50" value={companionData.nationalId || ""} onChange={e => setCompanionData({...companionData, nationalId: e.target.value})} />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الهاتف</Label>
                                <Input className="h-11 bg-slate-50" value={companionData.mobile || ""} onChange={e => setCompanionData({...companionData, mobile: e.target.value})} />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">القرابة</Label>
                                <select className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={companionData.relationship} onChange={e => setCompanionData({...companionData, relationship: e.target.value})}>
                                  {getList("relationships").map((rel, idx) => (
                                    <option key={`${rel}-${idx}`} value={rel}>{rel}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">موقف اللجوء</Label>
                                <select className="w-full h-11 px-3 bg-slate-50 border rounded-lg text-sm" value={companionData.asylumStatus} onChange={e => setCompanionData({...companionData, asylumStatus: e.target.value})}>
                                  <option value="refugee">لاجئ (مسجل)</option>
                                  <option value="seeker">طالب لجوء</option>
                                  <option value="residence">إقامة سياحية</option>
                                  <option value="none">غير ذلك</option>
                                </select>
                              </div>
                           </div>
                           <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <input 
                                type="checkbox" 
                                id="isEmergencyContact" 
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={companionData.isEmergencyContact}
                                onChange={e => setCompanionData({...companionData, isEmergencyContact: e.target.checked})}
                              />
                              <Label htmlFor="isEmergencyContact" className="text-xs font-bold text-slate-700 cursor-pointer">
                                هذا الشخص هو جهة تواصل للطوارئ
                              </Label>
                           </div>
                           <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-sm font-black shadow-lg shadow-blue-100" disabled={loading}>
                              اضافة المرافق وحفظه
                           </Button>
                        </form>
                      </div>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              إضافة خدمة لـ {patientProfile?.fullName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddServiceX} className="py-4 space-y-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">الخدمة / الوجبة</Label>
              <select 
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                value={serviceFormData.serviceId}
                onChange={e => setServiceFormData({...serviceFormData, serviceId: e.target.value})}
                required
              >
                <option value="">اختر من القائمة...</option>
                {servicesList.map((s, idx) => (
                  <option key={s.id || `svc-${idx}`} value={s.id.toString()}>{s.name} ({s.unitCost} EGP)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">الكمية</Label>
              <Input 
                type="number"
                className="bg-slate-50 border-slate-200"
                value={serviceFormData.quantity}
                onChange={e => setServiceFormData({...serviceFormData, quantity: e.target.value})}
                required
                min="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">ملاحظات</Label>
              <Textarea 
                className="min-h-[100px] bg-slate-50 border-slate-200"
                placeholder="أدخل ملاحظات إضافية..."
                value={serviceFormData.notes}
                onChange={e => setServiceFormData({...serviceFormData, notes: e.target.value})}
              />
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="ghost" className="text-xs font-bold" onClick={() => setIsServiceDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-8" disabled={updatingProfile}>
                {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" /> : "إضافة وحفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-[2rem] p-0 overflow-hidden" dir="rtl">
          <div className="p-10 text-center space-y-6 w-[437.993px] mx-auto">
            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner w-[422.993px]">
              <Archive className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">تأكيد حذف الملف</h3>
              <p className="text-slate-500 text-sm font-bold leading-relaxed px-4">
                هل أنت متأكد من حذف سجل هذا المريض نهائياً؟ <br/>
                <span className="text-red-600">هذا الإجراء سيؤدي لحذف كافة البيانات المرتبطة ولن يمكنك التراجع عنه.</span>
              </p>
            </div>
            <div className="flex gap-4 pt-4 px-4 w-[410.993px] mx-auto">
              <Button 
                variant="ghost" 
                className="flex-1 h-14 rounded-2xl text-slate-500 font-black hover:bg-slate-100 transition-all"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                إلغاء الأمر
              </Button>
              <Button 
                className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-100 transition-all border-0"
                onClick={handleDeleteConfirm}
              >
                تأكيد الحذف النهائي
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

