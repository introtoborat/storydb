import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — calm sage-teal, refined depth
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/92 hover:shadow-glow relative overflow-hidden",
        // Gradient brand — premium warm gradient
        gradient:
          "bg-brand-gradient text-white shadow-glow hover:shadow-elev hover:brightness-105 relative overflow-hidden before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10 before:transition-colors",
        // Warm gradient — accent amber for highlights
        warm:
          "bg-accent-gradient text-white shadow-warm hover:shadow-elev hover:brightness-105 relative overflow-hidden",
        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/92",
        // Outline — clean professional border
        outline:
          "border border-border bg-background shadow-soft hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30",
        // Secondary — soft sand surface
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80",
        // Ghost
        ghost: "hover:bg-accent/50 hover:text-accent-foreground",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
        // Soft — soft tinted background
        soft:
          "bg-primary/10 text-primary hover:bg-primary/15 shadow-soft",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3.5 text-xs",
        lg: "h-11 rounded-lg px-7 text-base",
        xl: "h-12 rounded-xl px-8 text-base font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
