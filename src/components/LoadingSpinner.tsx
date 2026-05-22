import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  label,
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {label && (
        <p className="text-sm font-black text-slate-500 animate-pulse uppercase tracking-widest">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
