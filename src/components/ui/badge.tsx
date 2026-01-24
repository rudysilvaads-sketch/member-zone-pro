import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        gold: "border-transparent bg-gradient-gold text-primary-foreground shadow-glow-gold",
        silver: "border-transparent bg-silver text-primary-foreground",
        bronze: "border-transparent bg-bronze text-primary-foreground",
        diamond: "border-transparent bg-rank-diamond text-primary-foreground shadow-glow-accent",
        platinum: "border-transparent bg-rank-platinum text-primary-foreground",
        accent: "border-transparent bg-gradient-accent text-accent-foreground shadow-glow-accent",
        success: "border-transparent bg-success text-success-foreground",
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
