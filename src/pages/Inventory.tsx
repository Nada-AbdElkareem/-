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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Package, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Search, 
  AlertTriangle,
  MoveUp,
  MoveDown,
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  minQuantity: number;
  currentQuantity: number;
  pricePerUnit: number;
  updatedAt: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transactionType, setTransactionType] = useState<"in" | "out">("in");
  const [categories, setCategories] = useState<string[]>(["طعام", "منظفات", "أدوات مكتبية", "أخرى"]);
  const [itemNamesSuggestions, setItemNamesSuggestions] = useState<string[]>([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "قطعة",
    minQuantity: "10",
    currentQuantity: "0",
    pricePerUnit: "0"
  });

  const [editFormData, setEditFormData] = useState({
    id: 0,
    name: "",
    category: "",
    unit: "قطعة",
    minQuantity: "10",
    currentQuantity: "0",
    pricePerUnit: "0"
  });

  const [transactionData, setTransactionData] = useState({
    quantity: "1",
    reason: ""
  });

  const fetchItems = async () => {
    try {
      const data = await apiRequest("/inventory");
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error("فشل تحميل بيانات المخزن");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const data = await apiRequest("/inventory/transactions");
      setTransactions(data);
      setTransactionCount(data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchTransactions();
    apiRequest("/settings")
      .then(settings => {
        if (settings.inventory_categories) {
          const cats = settings.inventory_categories.split(",").map((s: string) => s.trim());
          setCategories(cats);
          if (cats.length > 0) {
            setFormData(prev => ({ ...prev, category: cats[0] }));
          }
        }
        if (settings.inventory_item_names) {
          setItemNamesSuggestions(settings.inventory_item_names.split(",").map((s: string) => s.trim()));
        }
      })
      .catch(console.error);
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/inventory", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast.success("تم إضافة الصنف بنجاح");
      setIsAddOpen(false);
      setFormData({
        name: "",
        category: categories[0] || "",
        unit: "قطعة",
        minQuantity: "10",
        currentQuantity: "0",
        pricePerUnit: "0"
      });
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await apiRequest(`/inventory/${selectedItem.id}/transaction`, {
        method: "POST",
        body: JSON.stringify({
          type: transactionType,
          quantity: transactionData.quantity,
          reason: transactionData.reason
        })
      });
      toast.success(transactionType === "in" ? "تم توريد الصنف بنجاح" : "تم صرف الصنف بنجاح");
      setIsTransactionOpen(false);
      setTransactionData({ quantity: "1", reason: "" });
      fetchItems();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/inventory/${editFormData.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editFormData.name,
          category: editFormData.category,
          unit: editFormData.unit,
          minQuantity: editFormData.minQuantity,
          currentQuantity: editFormData.currentQuantity,
          pricePerUnit: editFormData.pricePerUnit
        })
      });
      toast.success("تم تحديث الصنف بنجاح");
      setIsEditOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "فشل تحديث الصنف");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الصنف بالكامل؟ سيتم حذف جميع عمليات الصنب والتوريد المسجلة له بشكل نهائي.")) {
      return;
    }
    try {
      await apiRequest(`/inventory/${itemId}`, {
        method: "DELETE"
      });
      toast.success("تم حذف الصنف بنجاح");
      fetchItems();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف الصنف");
    }
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: "اسم الصنف",
      cell: ({ row }) => <span className="font-bold text-slate-800">{row.original.name}</span>
    },
    {
      accessorKey: "category",
      header: "التصنيف",
      cell: ({ row }) => <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">{row.original.category}</Badge>
    },
    {
      accessorKey: "currentQuantity",
      header: "الكمية الحالية",
      cell: ({ row }) => {
        const item = row.original;
        const isLow = item.currentQuantity <= item.minQuantity;
        return (
          <div className="flex items-center gap-2">
            <span className={cn("font-black text-lg", isLow ? "text-red-600" : "text-emerald-600")}>
              {item.currentQuantity}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
            {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
          </div>
        );
      }
    },
    {
      accessorKey: "minQuantity",
      header: "حد الأمان",
      cell: ({ row }) => <span className="font-bold text-slate-400">{row.original.minQuantity}</span>
    },
    {
      accessorKey: "pricePerUnit",
      header: "سعر الوحدة",
      cell: ({ row }) => <span className="font-bold text-slate-700">{row.original.pricePerUnit.toLocaleString()} ج.م</span>
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="text-right w-48" dir="rtl">
            <DropdownMenuItem onClick={() => {
              setSelectedItem(row.original);
              setTransactionType("in");
              setIsTransactionOpen(true);
            }} className="gap-2 focus:bg-emerald-50 focus:text-emerald-600 font-bold">
              <MoveUp className="w-4.5 h-4.5 text-emerald-500" /> توريد (إدخال)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedItem(row.original);
              setTransactionType("out");
              setIsTransactionOpen(true);
            }} className="gap-2 focus:bg-amber-50 focus:text-amber-600 font-bold">
              <MoveDown className="w-4.5 h-4.5 text-amber-500" /> صرف (سحب)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const item = row.original;
              setSelectedItem(item);
              setEditFormData({
                id: item.id,
                name: item.name,
                category: item.category,
                unit: item.unit,
                minQuantity: String(item.minQuantity),
                currentQuantity: String(item.currentQuantity),
                pricePerUnit: String(item.pricePerUnit)
              });
              setIsEditOpen(true);
            }} className="gap-2 focus:bg-blue-50 focus:text-blue-600 font-bold border-t border-slate-100 mt-1 pt-2">
              <Pencil className="w-4 h-4 text-blue-500" /> تعديل بيانات الصنف
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              handleDeleteItem(row.original.id);
            }} className="gap-2 focus:bg-rose-50 focus:text-rose-600 font-bold text-rose-600">
              <Trash2 className="w-4 h-4 text-rose-500" /> حذف الصنف نهائياً
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">المخزن الداخلي</h1>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              إدارة التوريدات والمخزون
            </Badge>
            <p className="text-sm text-slate-500 font-bold">متابعة الكميات، عمليات الصرف، والتنبيه بنقص المخزون</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={(props) => (
              <Button className="h-12 gap-3 bg-slate-900 hover:bg-slate-800 text-sm font-black shadow-lg shadow-slate-200 px-8 rounded-2xl active:scale-95 transition-all" {...props}>
                <Plus className="w-5 h-5" />
                تعريف صنف جديد
              </Button>
            )} />
            <DialogContent className="max-w-md rounded-[2.5rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 text-right">إضافة صنف للمخزن</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">اسم الصنف</Label>
                    <Input 
                      className="h-14 font-bold rounded-xl" 
                      placeholder="مثال: زيت طعام، شاش طبي..." 
                      list="inventory-names"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                    <datalist id="inventory-names">
                      {itemNamesSuggestions.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">التصنيف</Label>
                      <select 
                        className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 font-bold"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الوحدة</Label>
                      <Input 
                        className="h-14 font-bold rounded-xl" 
                        placeholder="قطعة، كجم..." 
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">حد الأمان (تنبيه)</Label>
                      <Input 
                        type="number"
                        className="h-14 font-bold rounded-xl text-center" 
                        value={formData.minQuantity}
                        onChange={e => setFormData({...formData, minQuantity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الكمية الافتتاحية</Label>
                      <Input 
                        type="number"
                        className="h-14 font-bold rounded-xl text-center" 
                        value={formData.currentQuantity}
                        onChange={e => setFormData({...formData, currentQuantity: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100">
                  حفظ الصنف الجديد
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الأصناف</p>
              <h3 className="text-2xl font-black text-slate-800">{items.length} نوع</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">أصناف قاربت على النفاذ</p>
              <h3 className="text-2xl font-black text-slate-800">{items.filter(i => i.currentQuantity <= i.minQuantity).length} صنف</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm cursor-pointer hover:border-blue-200 transition-all group" onClick={() => setIsHistoryOpen(true)}>
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <History className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">حركة المخزن (إجمالي)</p>
              <h3 className="text-2xl font-black text-slate-800">{transactionCount} عملية</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 text-right">سجل حركة المخزن</DialogTitle>
            <CardDescription className="text-right font-bold text-slate-500">
              آخر 100 عملية توريد وصرف من المخزن
            </CardDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {transactions.length > 0 ? transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      t.type === "in" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {t.type === "in" ? <MoveUp className="w-5 h-5" /> : <MoveDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{t.itemName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        بواسطة: {t.performedByName} | {format(new Date(t.transactionDate), "d MMMM yyyy, HH:mm", { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-black",
                      t.type === "in" ? "text-emerald-600" : "text-red-600"
                    )}>
                      {t.type === "in" ? "+" : "-"}{t.quantity}
                    </p>
                    {t.reason && <p className="text-[10px] font-bold text-slate-500">{t.reason}</p>}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400 font-bold">لا توجد حركات مسجلة حالياً</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200 rounded-[2.5rem] bg-white shadow-xl shadow-slate-100/50 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between bg-white/50 backdrop-blur-sm">
          <div>
            <CardTitle className="text-xl font-black text-slate-800">جرد الأصناف الحالي</CardTitle>
            <CardDescription className="font-bold text-slate-400 mt-1">قائمة تفصيلية بكافة محتويات المخزن والكميات المتاحة</CardDescription>
          </div>
          <div className="flex items-center gap-4">
               <div className="relative w-64">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  className="h-12 pr-10 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all font-bold text-xs" 
                  placeholder="ابحث باسم الصنف..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
          </div>
        </CardHeader>
        <div className="p-6">
          <DataTable 
            columns={columns} 
            data={items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))} 
            density="compact"
          />
        </div>
      </Card>

      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 text-right">
              {transactionType === "in" ? "توريد صنف للمخزن" : "صرف صنف من المخزن"}
            </DialogTitle>
            <CardDescription className="text-right font-bold text-slate-500">
              {selectedItem?.name} - الكمية الحالية: {selectedItem?.currentQuantity} {selectedItem?.unit}
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleTransaction} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2 text-right">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الكمية المراد {transactionType === "in" ? "توريدها" : "صرفها"}</Label>
                <Input 
                  type="number"
                  className="h-16 text-2xl font-black text-center rounded-2xl border-2 focus:border-blue-600 focus:ring-8 focus:ring-blue-50" 
                  value={transactionData.quantity}
                  onChange={e => setTransactionData({...transactionData, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2 text-right">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">السبب / الملاحظات</Label>
                <Input 
                  className="h-14 font-bold rounded-xl" 
                  placeholder={transactionType === "in" ? "تبرع من، شراء فواتير..." : "صرف للمطبخ، مريض محدد..."} 
                  value={transactionData.reason}
                  onChange={e => setTransactionData({...transactionData, reason: e.target.value})}
                />
              </div>
            </div>
            <Button 
                type="submit" 
                className={cn(
                    "w-full h-14 font-black rounded-2xl shadow-xl transition-all active:scale-95",
                    transactionType === "in" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-red-600 hover:bg-red-700 shadow-red-100"
                )}
            >
              إتمام عملية {transactionType === "in" ? "التوريد" : "الصرف"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 text-right font-sans">تعديل بيانات الصنف</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditItem} className="space-y-6 py-4 font-sans">
            <div className="space-y-4">
              <div className="space-y-2 text-right">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">اسم الصنف</Label>
                <Input 
                  className="h-14 font-bold rounded-xl" 
                  placeholder="مثال: زيت طعام، شاش طبي..." 
                  list="inventory-names-edit"
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
                <datalist id="inventory-names-edit">
                  {itemNamesSuggestions.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">التصنيف</Label>
                  <select 
                    className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 font-bold"
                    value={editFormData.category}
                    onChange={e => setEditFormData({...editFormData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الوحدة</Label>
                  <Input 
                    className="h-14 font-bold rounded-xl" 
                    placeholder="قطعة، كجم..." 
                    value={editFormData.unit}
                    onChange={e => setEditFormData({...editFormData, unit: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">حد الأمان (تنبيه)</Label>
                  <Input 
                    type="number"
                    className="h-14 font-bold rounded-xl text-center" 
                    value={editFormData.minQuantity}
                    onChange={e => setEditFormData({...editFormData, minQuantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">الكمية الحالية</Label>
                  <Input 
                    type="number"
                    className="h-14 font-bold rounded-xl text-center" 
                    value={editFormData.currentQuantity}
                    onChange={e => setEditFormData({...editFormData, currentQuantity: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">سعر الوحدة (ج.م)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  className="h-14 font-bold rounded-xl" 
                  value={editFormData.pricePerUnit}
                  onChange={e => setEditFormData({...editFormData, pricePerUnit: e.target.value})}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100">
              حفظ التعديلات
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
