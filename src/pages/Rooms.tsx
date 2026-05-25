import * as React from "react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  Bed as BedIcon, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Construction,
  Filter,
  Plus,
  Loader2,
  Edit,
  Trash2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    roomNumber: "",
    floor: "1",
    type: "standard",
    capacity: "2"
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [editRoomData, setEditRoomData] = useState({
    roomNumber: "",
    floor: "1",
    type: "standard",
    capacity: "2",
    status: "available"
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    apiRequest("/rooms")
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/rooms", {
        method: "POST",
        body: JSON.stringify(newRoomData)
      });
      setIsAddOpen(false);
      setNewRoomData({ roomNumber: "", floor: "1", type: "standard", capacity: "2" });
      fetchData();
      toast.success("تم تسجيل بيانات الغرفة بنجاح");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء إضافة الغرفة");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (room: any) => {
    setSelectedRoom(room);
    setEditRoomData({
      roomNumber: room.roomNumber || "",
      floor: room.floor || "1",
      type: room.type || "standard",
      capacity: String(room.capacity || "2"),
      status: room.status || "available"
    });
    setIsEditOpen(true);
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setLoading(true);
    try {
      await apiRequest(`/rooms/${selectedRoom.id}`, {
        method: "PATCH",
        body: JSON.stringify(editRoomData)
      });
      setIsEditOpen(false);
      setSelectedRoom(null);
      fetchData();
      toast.success("تم تحديث بيانات الغرفة بنجاح");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء تعديل بيانات الغرفة");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (room: any) => {
    setRoomToDelete(room);
    setIsDeleteOpen(true);
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setLoading(true);
    try {
      await apiRequest(`/rooms/${roomToDelete.id}`, {
        method: "DELETE"
      });
      setIsDeleteOpen(false);
      setRoomToDelete(null);
      fetchData();
      toast.success("تم حذف الغرفة وجميع أسرتها بنجاح");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء حذف الغرفة");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "available": return { color: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "متاح", dot: "bg-emerald-500", icon: CheckCircle2 };
      case "occupied": return { color: "bg-blue-50 text-blue-700 border-blue-100", label: "مشغول", dot: "bg-blue-500", icon: BedIcon };
      case "maintenance": return { color: "bg-red-50 text-red-700 border-red-100", label: "صيانة", dot: "bg-red-500", icon: Construction };
      case "reserved": return { color: "bg-amber-50 text-amber-700 border-amber-100", label: "محجوز", dot: "bg-amber-500", icon: Clock };
      default: return { color: "bg-slate-50 text-slate-700 border-slate-100", label: status, dot: "bg-slate-400", icon: Home };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">حالة السكن وتوزيع الغرف</h1>
          <div className="flex items-center gap-4 mt-1.5 font-bold">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> متاح
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase tracking-widest text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> مشغول
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> صيانة
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold">العدد الإجمالي: {rooms.length} تميز</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-2 text-xs font-bold border-slate-200 hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5" />
              تصفية الطوابق
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger 
                render={(props) => (
                  <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-xs font-black px-6 gap-2 shadow-xl shadow-blue-100 rounded-xl" {...props}>
                    <Plus className="w-4 h-4" />
                    تكويد غرفة جديدة
                  </Button>
                )}
              />
              <DialogContent className="max-w-xl bg-slate-50 border-0 shadow-3xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col" dir="rtl">
                <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-4 text-slate-900">
                      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                        <Home className="w-7 h-7" />
                      </div>
                      إضافة غرفة سكنية جديدة
                    </DialogTitle>
                  </DialogHeader>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                     <Plus className="w-5 h-5 rotate-45" />
                  </Button>
                </div>

                <form onSubmit={handleAddRoom} className="p-10 space-y-8 text-right overflow-y-auto">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الغرفة (المعرف الرقمي)</Label>
                        <Input 
                          required 
                          placeholder="مثلاً: 101"
                          className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black text-center focus:ring-4 focus:ring-blue-100"
                          value={newRoomData.roomNumber || ""}
                          onChange={e => setNewRoomData({...newRoomData, roomNumber: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الطابق</Label>
                        <Input 
                          required 
                          type="number"
                          className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black text-center focus:ring-4 focus:ring-blue-100"
                          value={newRoomData.floor || ""}
                          onChange={e => setNewRoomData({...newRoomData, floor: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">تصنيف الغرفة</Label>
                      <select 
                        className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-slate-50 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-100 appearance-none"
                        value={newRoomData.type}
                        onChange={e => setNewRoomData({...newRoomData, type: e.target.value})}
                      >
                        <option value="standard">غرفة إقامة قياسية (Standard)</option>
                        <option value="suite">جناح إقامة ملكي (Suite)</option>
                        <option value="intensive">وحدة عناية متوسطة (Intensive)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">السعة السريرية (عدد الأسرة المتوفرة)</Label>
                      <Input 
                        required 
                        type="number"
                        min="1"
                        className="h-14 bg-slate-50 border-slate-100 rounded-xl text-xl font-black text-center focus:ring-4 focus:ring-blue-100 text-blue-600"
                        value={newRoomData.capacity || ""}
                        onChange={e => setNewRoomData({...newRoomData, capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-3">
                    <Button type="submit" className="h-16 bg-blue-600 hover:bg-blue-700 text-base font-black rounded-2xl shadow-2xl shadow-blue-100 uppercase tracking-tight" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center gap-3">
                           <Loader2 className="w-5 h-5 animate-spin" />
                           جاري حفظ البيانات...
                        </div>
                      ) : "حفظ بيانات الغرفة وتفعيلها"}
                    </Button>
                    <Button type="button" variant="ghost" className="h-14 text-sm font-black text-slate-400 rounded-2xl hover:bg-slate-50" onClick={() => setIsAddOpen(false)}>تجاهل</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {loading && !rooms.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Card key={i} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between bg-slate-50/20 mb-3">
                <div className="flex items-center gap-2.5 pb-3 w-full">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-8 ml-auto" />
                    <Skeleton className="h-3 w-6 ml-auto" />
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            rooms.reduce((acc: any, room) => {
              const floor = room.floor || "غير محدد";
              if (!acc[floor]) acc[floor] = [];
              acc[floor].push(room);
              return acc;
            }, {})
          ).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]: [string, any]) => {
            const totalBeds = floorRooms.reduce((sum: number, r: any) => sum + (Number(r.capacity) || 0), 0);
            const occupiedBeds = floorRooms.reduce((sum: number, r: any) => 
               sum + (r.beds?.filter((b: any) => b.status === "occupied").length || 0), 0
            );
            const availableBeds = totalBeds - occupiedBeds;

            return (
              <div key={floor} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-4 gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-lg shadow-lg">
                       {floor}
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">الطابق {floor}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">إحصائيات الطابق الحالي</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 md:gap-12">
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الأسرة</p>
                        <p className="text-xl font-black text-slate-800">{totalBeds}</p>
                     </div>
                     <div className="text-center border-x border-slate-100 px-6 md:px-12">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">المشغولة</p>
                        <p className="text-xl font-black text-blue-600">{occupiedBeds}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">المتاحة</p>
                        <p className="text-xl font-black text-emerald-600">{availableBeds}</p>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {floorRooms.map((room: any, i: number) => {
                    const info = getStatusInfo(room.status);
                    return (
                      <motion.div
                        key={`${room.id}-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group bg-white cursor-pointer overflow-hidden rounded-2xl">
                          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/20 mb-3">
                            <div className="flex items-center gap-2.5 pb-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shadow-inner relative group-hover:bg-blue-100 transition-colors">
                                {room.roomNumber}
                                <span className={cn(
                                  "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                                  info.dot
                                )} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-xs font-black text-slate-800 tracking-tight">غرفة {room.roomNumber}</h3>
                                  <Badge variant="outline" className={cn("text-[8px] h-4 font-black px-1.5", info.color)}>
                                    {info.label}
                                  </Badge>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide group-hover:text-slate-500 transition-colors">
                                  {room.type === "standard" ? "قياسية" : room.type === "suite" ? "جناح" : "عناية"}
                                </p>
                              </div>
                            </div>
                            <div className="text-left mb-3">
                               <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border block",
                                info.color
                              )}>
                                {info.label}
                              </span>
                              <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                                السعة: {room.beds?.filter((b: any) => b.status === "occupied").length}/{room.capacity} مشغول
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                               <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">حالة الأسرة وتوزيع النزلاء</Label>
                               <div className="grid grid-cols-2 gap-2">
                                 {room.beds?.map((bed: any, idx: number) => (
                                   <div 
                                      key={bed.id || `bed-${idx}`} 
                                      className={cn(
                                        "flex items-center gap-2 p-2 rounded-xl border transition-all",
                                        bed.status === "occupied" ? "bg-blue-50/50 border-blue-100 shadow-sm" : 
                                        bed.status === "maintenance" ? "bg-red-50/30 border-red-100" : "bg-slate-50/50 border-slate-100"
                                      )}
                                   >
                                      <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                                        bed.status === "occupied" ? "bg-blue-600 text-white" : 
                                        bed.status === "maintenance" ? "bg-red-100 text-red-600" : "bg-white text-slate-400 border border-slate-100"
                                      )}>
                                        <BedIcon className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 overflow-hidden">
                                        <p className="text-[10px] font-black text-slate-700 leading-none mb-0.5">{bed.bedNumber}</p>
                                        <p className={cn(
                                          "text-[9px] font-bold truncate",
                                          bed.status === "occupied" ? "text-blue-600" : "text-slate-400"
                                        )}>
                                          {bed.patientName || (bed.status === "maintenance" ? "خارج الخدمة" : "متاح للحجز")}
                                        </p>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                              <div className="flex items-center gap-1.5">
                                 <info.icon className={cn("w-3 h-3", info.dot.replace('bg-', 'text-'))} />
                                 <span className={cn("text-[10px] font-bold", info.dot.replace('bg-', 'text-'))}>
                                    {room.status === "maintenance" ? "صيانة جارية" : room.status === "available" ? "متاحة فوراً" : "إقامة فعالة"}
                                 </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-7 h-7 text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(room);
                                  }}
                                  title="تعديل بيانات الغرفة"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-7 h-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDelete(room);
                                  }}
                                  title="حذف الغرفة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Room Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl bg-slate-50 border-0 shadow-3xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col" dir="rtl">
          <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-4 text-slate-900">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                  <Edit className="w-7 h-7" />
                </div>
                تعديل بيانات الغرفة {selectedRoom?.roomNumber}
              </DialogTitle>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(false)} className="rounded-xl">
               <Plus className="w-5 h-5 rotate-45" />
            </Button>
          </div>

          <form onSubmit={handleEditRoom} className="p-10 space-y-8 text-right overflow-y-auto">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الغرفة (المعرف الرقمي)</Label>
                  <Input 
                    required 
                    placeholder="مثلاً: 101"
                    className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black text-center focus:ring-4 focus:ring-blue-100"
                    value={editRoomData.roomNumber || ""}
                    onChange={e => setEditRoomData({...editRoomData, roomNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">رقم الطابق</Label>
                  <Input 
                    required 
                    type="number"
                    className="h-14 bg-slate-50 border-slate-100 rounded-xl text-lg font-black text-center focus:ring-4 focus:ring-blue-100"
                    value={editRoomData.floor || ""}
                    onChange={e => setEditRoomData({...editRoomData, floor: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">تصنيف الغرفة</Label>
                <select 
                  className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-slate-50 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-100 appearance-none font-sans"
                  value={editRoomData.type}
                  onChange={e => setEditRoomData({...editRoomData, type: e.target.value})}
                >
                  <option value="standard">غرفة إقامة قياسية (Standard)</option>
                  <option value="suite">جناح إقامة ملكي (Suite)</option>
                  <option value="intensive">وحدة عناية متوسطة (Intensive)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1">السعة السريرية (عدد الأسرة المتوفرة)</Label>
                <Input 
                  required 
                  type="number"
                  min="1"
                  className="h-14 bg-slate-50 border-slate-100 rounded-xl text-xl font-black text-center focus:ring-4 focus:ring-blue-100 text-blue-600"
                  value={editRoomData.capacity || ""}
                  onChange={e => setEditRoomData({...editRoomData, capacity: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-1 block text-right">حالة الغرفة</Label>
                <select 
                  className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-slate-50 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-100 appearance-none font-sans"
                  value={editRoomData.status}
                  onChange={e => setEditRoomData({...editRoomData, status: e.target.value})}
                >
                  <option value="available">متاحة (Available)</option>
                  <option value="maintenance">تحت الصيانة (Maintenance)</option>
                  <option value="reserved">محجوزة (Reserved)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button type="submit" className="h-16 bg-blue-600 hover:bg-blue-700 text-base font-black rounded-2xl shadow-2xl shadow-blue-100 uppercase tracking-tight" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-3">
                     <Loader2 className="w-5 h-5 animate-spin" />
                     جاري حفظ التعديلات...
                  </div>
                ) : "حفظ التعديلات"}
              </Button>
              <Button type="button" variant="ghost" className="h-14 text-sm font-black text-slate-400 rounded-2xl hover:bg-slate-50" onClick={() => setIsEditOpen(false)}>تجاهل</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Room Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white border-0 shadow-3xl rounded-3xl p-8 overflow-hidden flex flex-col" dir="rtl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
               <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 leading-tight">حذف الغرفة {roomToDelete?.roomNumber}؟</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذه الغرفة بشكل نهائي؟ سيتم حذف جميع الأسرة التابعة لها تلقائياً من النظام. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button 
              type="button" 
              className="h-14 bg-red-600 hover:bg-red-700 text-sm font-black rounded-xl text-white shadow-xl shadow-red-100"
              onClick={handleDeleteRoom}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحذف...
                </div>
              ) : "نعم، تأكيد الحذف النهائي"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="h-12 text-xs font-black text-slate-500 rounded-xl hover:bg-slate-50" 
              onClick={() => setIsDeleteOpen(false)}
            >
              تراجع وإلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

