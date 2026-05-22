import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Bed, 
  CalendarCheck, 
  LogOut, 
  Bell, 
  Search,
  Settings,
  Database,
  FileText,
  CreditCard,
  Plus,
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";

const menuItems = [
  { name: "لوحة التحكم", icon: LayoutDashboard, path: "/", emoji: "📊", roles: ["admin", "reception", "finance", "medical", "data_entry"] },
  { name: "إدارة المرضى", icon: Users, path: "/patients", emoji: "👤", roles: ["admin", "reception", "data_entry"] },
  { name: "توزيع الغرف", icon: CalendarCheck, path: "/stays", emoji: "🛏️", roles: ["admin", "reception", "data_entry"] },
  { name: "حالة السكن", icon: Bed, path: "/rooms", emoji: "🏠", roles: ["admin", "reception"] },
  { name: "المخزن الداخلي", icon: Database, path: "/inventory", emoji: "📦", roles: ["admin", "room_supervisor", "data_entry"] },
  { name: "الأصول والصيانة", icon: Settings, path: "/assets", emoji: "🛠️", roles: ["admin", "room_supervisor"] },
  { name: "الخدمات الطبية", icon: FileText, path: "/services", emoji: "📝", roles: ["admin", "medical", "data_entry"] },
  { name: "المعاملات المالية", icon: CreditCard, path: "/finance", emoji: "💳", roles: ["admin", "finance"] },
  { name: "التقارير والإحصائيات", icon: Database, path: "/reports", emoji: "📉", roles: ["admin", "finance", "reception"] },
  { name: "إعدادات النظام", icon: Settings, path: "/settings", emoji: "⚙️", roles: ["admin"] },
];

export function LayoutContent({ user, setUser }: { user: any; setUser: any }) {
  const { open, setOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setOpen(isFullscreen); // When exiting fullscreen, reopen sidebar
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans select-none overflow-hidden" dir="rtl">
      {!isFullscreen && (
        <Sidebar side="right" className="bg-slate-900 border-l-0 shadow-xl z-20">
          <SidebarHeader className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                +
              </div>
              <div>
                <h1 className="text-white font-bold text-xs leading-tight">دار الضيافة الطبي</h1>
                <p className="text-slate-400 text-[9px]">نظام الإدارة المتكامل</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-slate-900 border-none">
            <ScrollArea className="h-full py-2 px-2">
              <SidebarMenu className="space-y-0.5">
                {filteredMenuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      render={(props) => <Link to={item.path} {...props} />}
                      isActive={location.pathname === item.path}
                      className={cn(
                        "py-1 px-3 gap-3 text-xs font-medium transition-all duration-200 border-r-4 h-11",
                        location.pathname === item.path 
                          ? "bg-blue-600/10 text-blue-400 border-blue-600" 
                          : "text-slate-300 hover:bg-slate-800 border-transparent hover:text-white"
                      )}
                    >
                      <span className="text-base leading-none opacity-80">{item.emoji}</span>
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarContent>
          <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl mb-4 group cursor-pointer transition-colors hover:bg-slate-700">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm shadow-inner text-white text-base">
                👨‍💻
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-bold truncate">{user.name}</p>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 p-3 h-10 text-xs" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>
        </Sidebar>
      )}

      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className={cn(
          "h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 transition-all font-sans",
          isFullscreen && "h-0 overflow-hidden border-none"
        )}>
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-slate-500 hover:bg-slate-100" />
            <div className="hidden sm:flex flex-col px-4 border-r border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 leading-tight">
                {user.role === "admin" ? "مرحباً بك يا مدير، " : 
                 user.role === "finance" ? "مرحباً بك يا محاسب، " :
                 user.role === "medical" ? "أهلاً بك يا حكيم، " :
                 user.role === "reception" ? "أهلاً بك يا زميل، " : "أهلاً بك، "}
                {user.name}
              </span>
              <p className="text-[9px] text-blue-600 font-black uppercase tracking-wider">
                {user.role === "admin" ? "مدير النظام" : 
                 user.role === "reception" ? "قسم الاستقبال" :
                 user.role === "finance" ? "الشؤون المالية" :
                 user.role === "medical" ? "المتابعة الطبية" : "مدخل بيانات"}
              </p>
            </div>
            <div className="relative w-64 hidden lg:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input 
                placeholder="البحث عن مريض، رقم هوية، أو غرفة..." 
                className="w-full bg-slate-50 border-slate-200 rounded-md py-1.5 pr-9 pl-3 text-[10px] focus-visible:ring-blue-500 outline-none h-8"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:bg-slate-100 p-1.5 rounded-full h-8 w-8">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full h-8 w-8"
              title={isFullscreen ? "تصغير" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button className="bg-orange-500 text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-orange-600 transition-colors shadow-sm gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              تسجيل مريض
            </Button>
          </div>
        </header>

        {isFullscreen && (
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={toggleFullscreen}
            className="fixed bottom-6 left-6 z-50 rounded-full shadow-2xl opacity-50 hover:opacity-100 transition-opacity bg-white/80 backdrop-blur"
            title="خروج من ملء الشاشة"
          >
            <Minimize2 className="w-5 h-5 text-slate-600" />
          </Button>
        )}

        <div className={cn(
          "p-6 md:p-8 space-y-6 flex-1 overflow-auto bg-slate-50 font-sans transition-all",
          isFullscreen && "p-0 space-y-0"
        )}>
          <Outlet />
        </div>

        {!isFullscreen && (
          <footer className="flex justify-between items-center px-4 py-2 bg-slate-200/30 border-t border-slate-200 text-slate-400 shrink-0">
            <div className="flex items-center gap-4 text-[10px] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                النظام متصل ومستقر
              </span>
              <span className="h-2 w-px bg-slate-300" />
              <span>توقيت الخادم: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400/60">
              إصدار 2.4.0 — دار الضيافة الطبي
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

export default function Layout({ user, setUser }: { user: any; setUser: any }) {
  return (
    <SidebarProvider>
      <LayoutContent user={user} setUser={setUser} />
    </SidebarProvider>
  );
}
