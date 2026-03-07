import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  primary: "from-primary/10 to-primary/5 border-primary/20",
  success: "from-success/10 to-success/5 border-success/20",
  warning: "from-warning/10 to-warning/5 border-warning/20",
  danger: "from-destructive/10 to-destructive/5 border-destructive/20",
};

const iconVariantStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "primary",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              <span className="text-muted-foreground font-normal">vs last month</span>
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
