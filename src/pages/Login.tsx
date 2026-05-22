import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";

export default function Login({ setUser }: { setUser: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden" dir="rtl">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[100px] -ml-64 -mb-64" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-slate-800 bg-white shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-4 text-center pb-8 pt-10 bg-slate-50/50 border-b border-slate-100">
            <div className="mx-auto w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-200">
              د
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black text-slate-800">نظام إدارة الضيافة</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">بوابة الوصول الآمن</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-1">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pr-10 h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-0 transition-all text-sm font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-1">كلمة المرور</Label>
                  <Button variant="link" className="text-[10px] p-0 h-auto text-blue-600 font-bold uppercase tracking-tight">استعادة؟</Button>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pr-10 h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-0 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تسجيل الدخول للنظام"}
              </Button>
            </form>
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                نظام مشفر بالكامل وآمن لمؤسسة الضيافة الطبية الخيرية <br/>
                جميع الحقوق محفوظة © 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

