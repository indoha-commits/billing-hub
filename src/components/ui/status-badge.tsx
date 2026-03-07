import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = 
  | "pending_payment" 
  | "ready_to_provision" 
  | "provisioning" 
  | "active" 
  | "past_due" 
  | "suspended"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible"
  | "canceled"
  | "paused"
  | "trialing"
  | "queued"
  | "running";

const statusConfig: Record<StatusType, { label: string; variant: "success" | "warning" | "destructive" | "info" | "default" }> = {
  // Tenant statuses
  pending_payment: { label: "Pending Payment", variant: "warning" },
  ready_to_provision: { label: "Ready to Provision", variant: "info" },
  provisioning: { label: "Provisioning", variant: "info" },
  active: { label: "Active", variant: "success" },
  past_due: { label: "Past Due", variant: "destructive" },
  suspended: { label: "Suspended", variant: "destructive" },
  
  // Payment statuses
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "default" },
  
  // Invoice statuses
  draft: { label: "Draft", variant: "default" },
  open: { label: "Open", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  void: { label: "Void", variant: "default" },
  uncollectible: { label: "Uncollectible", variant: "destructive" },
  
  // Subscription statuses
  canceled: { label: "Canceled", variant: "default" },
  paused: { label: "Paused", variant: "warning" },
  trialing: { label: "Trialing", variant: "info" },
  
  // Provisioning statuses
  queued: { label: "Queued", variant: "warning" },
  running: { label: "Running", variant: "info" },
};

const variantStyles = {
  success: "bg-success/10 text-success border-success/20 hover:bg-success/15",
  warning: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
  destructive: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
  info: "bg-info/10 text-info border-info/20 hover:bg-info/15",
  default: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "default" as const };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        variantStyles[config.variant],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
