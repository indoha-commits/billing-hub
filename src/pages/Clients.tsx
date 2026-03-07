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
  DialogTrigger,
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
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { workerDelete, workerGet, workerPost } from "@/lib/workerClient";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type PricingTier = {
  id: string;
  tier_code: string;
  name: string;
  cargo_min: number;
  cargo_max: number | null;
  price_amount: number;
  currency: string;
} | null;

type Subscription = {
  id: string;
  status: string;
  monthly_amount: number;
  currency: string;
  cargo_used_current_period: number;
  tier_id: string | null;
  mt_pricing_tiers: PricingTier;
} | null;

type Tenant = {
  id: string;
  company_name: string;
  country: string | null;
  currency: string | null;
  subdomain: string;
  status: string;
  created_at: string;
  mt_subscriptions: Subscription;
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    company_name: "",
    admin_email: "",
    admin_phone: "",
    country: "",
    setup_price: "",
    monthly_plan_price: "",
    cargo_limit: "100",
  });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await workerGet<{ tenants: Tenant[] }>("/admin/clients");
      return res.tenants;
    },
    refetchInterval: 8000,
  });

  const deleteTenant = useMutation({
    mutationFn: async (tenantId: string) => {
      return workerDelete<{ ok: boolean }>(`/admin/clients/${tenantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Client removed");
    },
    onError: (err: any) => {
      toast.error(String(err?.message ?? err));
    },
  });

  const createTenant = useMutation({
    mutationFn: async (data: typeof formData) => {
      await workerPost("/admin/clients/create", {
        company_name: data.company_name,
        admin_email: data.admin_email,
        admin_phone: data.admin_phone || null,
        country: data.country || null,
        currency: "RWF",
        setup_price: parseFloat(data.setup_price) || 0,
        monthly_plan_price: parseFloat(data.monthly_plan_price) || 0,
        cargo_limit: parseInt(data.cargo_limit) || 100,
        // optional: billing_provider: 'momo' | 'mpesa'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Client created successfully");
      setIsDialogOpen(false);
      setFormData({
        company_name: "",
        admin_email: "",
        admin_phone: "",
        country: "",
        setup_price: "",
        monthly_plan_price: "",
        cargo_limit: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to create client: " + error.message);
    },
  });

  const startProvisioning = useMutation({
    mutationFn: async (tenant_id: string) => {
      await workerPost("/admin/provision/start", { tenant_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Provisioning started");
    },
    onError: (error) => {
      toast.error("Failed to start provisioning: " + error.message);
    },
  });

  const filteredTenants = tenants?.filter((tenant) => {
    const matchesSearch =
      tenant.company_name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.subdomain?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "company_name",
      header: "Company",
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary">
            {tenant.company_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{tenant.company_name}</p>
            <p className="text-sm text-muted-foreground">{tenant.subdomain}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subdomain",
      header: "Subdomain",
      render: (tenant: Tenant) =>
        tenant.subdomain ? (
          <div className="flex items-center gap-1">
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {tenant.subdomain}
            </code>
            <a
              href={`https://${tenant.subdomain}.indataflow.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (tenant: Tenant) => <StatusBadge status={tenant.status as "active"} />,
    },
    {
      key: "cargo",
      header: "Cargo Usage",
      render: (tenant: Tenant) => {
        const usage = tenant.mt_subscriptions?.cargo_used_current_period ?? 0;
        const limit = tenant.mt_subscriptions?.mt_pricing_tiers?.cargo_max ?? null;
        const usagePercent = limit ? (usage / limit) * 100 : 0;

        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{usage}</span>
              <span className="text-muted-foreground">/ {limit ?? "∞"}</span>
            </div>
            <Progress
              value={Math.min(100, usagePercent)}
              className={usagePercent > 90 ? "[&>div]:bg-destructive" : ""}
            />
          </div>
        );
      },
    },
    {
      key: "tier",
      header: "Tier",
      render: (tenant: Tenant) => (
        <span className="font-medium">
          {tenant.mt_subscriptions?.mt_pricing_tiers?.name || "—"}
        </span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (tenant: Tenant) => {
        const amt = tenant.mt_subscriptions?.monthly_amount ?? 0;
        const cur = tenant.mt_subscriptions?.currency ?? tenant.currency ?? "RWF";
        return <span className="font-medium">{cur} {Number(amt).toFixed(2)}/mo</span>;
      },
    },
    {
      key: "next_billing",
      header: "Next Billing",
      render: (_tenant: Tenant) => <span className="text-muted-foreground">—</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          {tenant.status === "ready_to_provision" && (
            <Button
              size="sm"
              onClick={() => startProvisioning.mutate(tenant.id)}
              disabled={startProvisioning.isPending}
            >
              Start Provisioning
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={deleteTenant.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove client</DialogTitle>
                <DialogDescription>
                  This will permanently delete <strong>{tenant.company_name}</strong> and related billing/provisioning data.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteTenant.mutate(tenant.id)}
                  disabled={deleteTenant.isPending}
                >
                  {deleteTenant.isPending ? "Removing..." : "Remove"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Clients" description="Manage your client tenants">
      <DataTable
        columns={columns}
        data={filteredTenants || []}
        isLoading={isLoading}
        searchPlaceholder="Search clients..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No clients found"
        actions={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="ready_to_provision">Ready to Provision</SelectItem>
                <SelectItem value="provisioning">Provisioning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                  <DialogDescription>
                    Add a new client tenant to the platform.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createTenant.mutate(formData);
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({ ...formData, company_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="admin_email">Admin Email *</Label>
                        <Input
                          id="admin_email"
                          type="email"
                          value={formData.admin_email}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_email: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="admin_phone">Admin Phone (MSISDN)</Label>
                        <Input
                          id="admin_phone"
                          value={formData.admin_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_phone: e.target.value })
                          }
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="setup_price">Setup Price (RWF)</Label>
                        <Input
                          id="setup_price"
                          type="number"
                          step="1"
                          value={formData.setup_price}
                          onChange={(e) =>
                            setFormData({ ...formData, setup_price: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="monthly_plan_price">Monthly Price (optional)</Label>
                        <Input
                          id="monthly_plan_price"
                          type="number"
                          step="0.01"
                          value={formData.monthly_plan_price}
                          onChange={(e) =>
                            setFormData({ ...formData, monthly_plan_price: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cargo_limit">Cargo Limit</Label>
                        <Input
                          id="cargo_limit"
                          type="number"
                          value={formData.cargo_limit}
                          onChange={(e) =>
                            setFormData({ ...formData, cargo_limit: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTenant.isPending}>
                      {createTenant.isPending ? "Creating..." : "Create Client"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
    </DashboardLayout>
  );
}
