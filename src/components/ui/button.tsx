import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled: [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
 {
 variants: {
 variant: {
 default: "bg-primary text-primary-foreground hover:bg-primary",
 destructive: "bg-destructive text-destructive-foreground hover:bg-destructive",
 outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
 secondary: "bg-secondary text-secondary-foreground hover:bg-secondary",
 ghost: "hover:bg-accent hover:text-accent-foreground",
 link: "text-primary underline-offset-4 hover:underline",
 // bg-primary uses the --primary token directly (was bg-primary, which
 // is a background-image that only accepts gradient syntax - when the token
 // was switched to a solid colour the browser ignored it and the button lost
 // its background entirely). bg-primary always paints solid forest green;
 // text-primary-foreground stays white-on-green in light mode and black-on-
 // sage in dark mode, both contrast-safe.
 gold: "bg-primary text-primary-foreground font-semibold tracking-tight transition-colors duration-200 hover:bg-primary",
 // Outline variant: solid green text on the page background at rest (cream
 // in light, near-black in dark - text-primary is readable on both). On
 // hover the surface fills solid green and text flips to white.
 outlineGold: "border border-gold text-primary bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors",
 },
 size: {
 default: "h-10 px-4 py-2",
 sm: "h-9 rounded-md px-4",
 lg: "h-12 rounded-md px-8 text-[15px]",
 xl: "h-14 rounded-md px-10 text-base",
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
