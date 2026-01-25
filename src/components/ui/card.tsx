import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border text-card-foreground",
  {
    variants: {
      variant: {
        default: "bg-[#0a0a0a]/80 border-[#F5A623]/10 backdrop-blur-sm",
        gradient: "bg-[#0a0a0a]/90 border-[#F5A623]/10 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.5)]",
        glass: "bg-[#0a0a0a]/70 backdrop-blur-xl border-[#F5A623]/10",
        gold: "bg-[#0a0a0a]/90 border-[#F5A623]/20 shadow-[0_0_20px_rgba(245,166,35,0.1)]",
        accent: "bg-[#0a0a0a]/90 border-[#F5A623]/20 shadow-[0_0_20px_rgba(245,166,35,0.1)]",
        interactive: "bg-[#0a0a0a]/80 border-[#F5A623]/10 hover:border-[#F5A623]/30 hover:shadow-[0_0_30px_rgba(245,166,35,0.15)] transition-all duration-300 cursor-pointer",
        elite: "bg-[#0a0a0a]/95 border-[#F5A623]/20 shadow-[0_0_40px_rgba(245,166,35,0.1)] backdrop-blur-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
