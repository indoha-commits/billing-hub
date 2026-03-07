import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, AlertTriangle, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Subscription = {
  id: string;
  tenant_id: string;
  monthly_amount: number;
  currency: string;
  status: string;
  next_charge_at: string | null;
  retry_count: number;
  created_at: string;
  mt_tenants: {
    company_name: string;
  } | null;
  mt_pricing_tiers: {
    name: string;
    cargo_min: number;
    cargo_max: number | null;
  } | null;
};

export default function Subscriptions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mt_subscriptions")
        .select("*, mt_tenants(company_name), mt_pricing_tiers:mt_pricing_tiers!mt_subscriptions_tier_id_fkey(name, cargo_min, cargo_max)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
    refetchInterval: 8000,
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { error } = await supabase
        .from("mt_subscriptions")
        .update({ monthly_amount: amount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription updated");
      setEditingSub(null);
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const handleChangePlanPrice = (sub: Subscription) => {
    toast.success(
      "New invoice and payment intent created for cargo limit exceeded",
      { description: `Client: ${sub.mt_tenants?.company_name}` }
    );
  };

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesSearch = sub.mt_tenants?.company_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "tenant",
      header: "Client",
      render: (sub: Subscription) => (
        <div>
          <p className="font-medium">{sub.mt_tenants?.company_name || "—"}</p>
          <p className="text-sm text-muted-foreground">
            Cargo: {sub.cargo_used_current_period || 0}/{sub.mt_pricing_tiers?.cargo_max ?? "∞"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Monthly Amount",
      render: (sub: Subscription) => (
        <span className="font-medium">
          ${Number(sub.monthly_amount).toFixed(2)} {sub.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (sub: Subscription) => (
        <StatusBadge status={sub.status as "active"} />
      ),
    },
    {
      key: "next_charge",
      header: "Next Charge",
      render: (sub: Subscription) => {
        if (!sub.next_charge_at) return <span className="text-muted-foreground">—</span>;
        const d = new Date(sub.next_charge_at);
        if (Number.isNaN(d.getTime())) return <span className="text-muted-foreground">—</span>;
        return format(d, "MMM d, yyyy");
      },
    },
    {
      key: "retry_count",
      header: "Retries",
      render: (sub: Subscription) =>
        sub.retry_count > 0 ? (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <RefreshCw className="mr-1 h-3 w-3" />
            {sub.retry_count}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      key: "cargo_alert",
      header: "Alerts",
      render: (sub: Subscription) => {
        const usage = sub.cargo_used_current_period || 0;
        const limit = sub.mt_pricing_tiers?.cargo_max ?? 1;
        const isOverLimit = usage >= limit;
        return isOverLimit ? (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Over limit
          </Badge>
        ) : null;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (sub: Subscription) => {
        const isOverLimit =
          (sub.cargo_used_current_period || 0) >= (sub.mt_pricing_tiers?.cargo_max ?? 1);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingSub(sub);
                  setEditAmount(String(sub.monthly_amount));
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit Amount
              </DropdownMenuItem>
              {isOverLimit && (
                <DropdownMenuItem onClick={() => handleChangePlanPrice(sub)}>
                  <AlertTriangle className="mr-2 h-4 w-4" /> Change Plan (Over Limit)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DashboardLayout title="Subscriptions" description="Manage recurring billing">
      <DataTable
        columns={columns}
        data={filteredSubscriptions || []}
        isLoading={isLoading}
        searchPlaceholder="Search by client..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No subscriptions found"
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={!!editingSub} onOpenChange={() => setEditingSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update the monthly amount for {editingSub?.mt_tenants?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monthly Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSub(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingSub &&
                updateSubscription.mutate({
                  id: editingSub.id,
                  amount: parseFloat(editAmount),
                })
              }
              disabled={updateSubscription.isPending}
            >
              {updateSubscription.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
