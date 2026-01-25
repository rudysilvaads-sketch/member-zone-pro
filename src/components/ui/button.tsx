import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#F5A623] text-[#0a0a0a] hover:bg-[#F5A623]/90 hover:shadow-[0_0_20px_rgba(245,166,35,0.3)] font-semibold",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        outline: "border border-[#F5A623]/20 bg-transparent text-white hover:bg-[#F5A623]/10 hover:border-[#F5A623]/40",
        secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
        ghost: "text-white/70 hover:bg-white/5 hover:text-white",
        link: "text-[#F5A623] underline-offset-4 hover:underline",
        gold: "bg-[#F5A623] text-[#0a0a0a] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] hover:scale-105 font-bold",
        accent: "bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 hover:bg-[#F5A623]/20 hover:shadow-[0_0_20px_rgba(245,166,35,0.2)] font-semibold",
        glass: "bg-white/5 backdrop-blur-lg border border-white/10 text-white hover:bg-white/10",
        elite: "bg-[#F5A623] text-[#0a0a0a] hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] hover:scale-105 font-bold tracking-wide",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
