import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623]",
        secondary: "border-white/10 bg-white/5 text-white/70",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400",
        outline: "border-white/20 text-white",
        gold: "border-[#F5A623]/30 bg-[#F5A623] text-[#0a0a0a] shadow-[0_0_10px_rgba(245,166,35,0.3)]",
        silver: "border-white/20 bg-white/20 text-white",
        bronze: "border-amber-500/30 bg-amber-500/20 text-amber-400",
        diamond: "border-cyan-400/30 bg-cyan-400/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]",
        platinum: "border-slate-300/30 bg-slate-300/20 text-slate-300",
        accent: "border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623] shadow-[0_0_10px_rgba(245,166,35,0.2)]",
        success: "border-green-500/30 bg-green-500/20 text-green-400",
        elite: "border-[#F5A623]/40 bg-[#F5A623] text-[#0a0a0a] font-bold shadow-[0_0_15px_rgba(245,166,35,0.4)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
