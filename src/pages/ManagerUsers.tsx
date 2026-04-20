import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { workerGet, workerPost } from "@/lib/workerClient";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type TenantLite = {
  id: string;
  company_name: string;
  subdomain: string;
  status: string;
};

export default function ManagerUsers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "invited" | "suspended" | "revoked">("active");

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants-lite"],
    queryFn: async () => {
      const res = await workerGet<{ tenants: TenantLite[] }>("/admin/clients");
      return res.tenants;
    },
    refetchInterval: 15000,
  });

  const sortedTenants = useMemo(() => {
    return (tenants ?? []).slice().sort((a, b) => a.company_name.localeCompare(b.company_name));
  }, [tenants]);

  const createManager = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Select a company");
      if (!email.trim()) throw new Error("Enter an email");
      if (!password.trim()) throw new Error("Enter a password");
      await workerPost("/admin/manager-users/create", {
        tenant_id: tenantId,
        email: email.trim(),
        password: password.trim(),
        membership_status: status,
      });
    },
    onSuccess: () => {
      toast.success("Manager user created");
      qc.invalidateQueries({ queryKey: ["tenants-lite"] });
      setOpen(false);
      setTenantId("");
      setEmail("");
      setPassword("");
      setStatus("active");
    },
    onError: (err: any) => {
      toast.error(String(err?.message ?? err));
    },
  });

  return (
    <DashboardLayout title="Manager Users" subtitle="Create allowlisted manager-dashboard accounts by company.">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Managers are stored in <code className="px-1 rounded bg-muted">mt_tenant_users</code> with{" "}
          <code className="px-1 rounded bg-muted">dashboard_type=manager</code>.
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create manager dashboard user</DialogTitle>
              <DialogDescription>
                Creates/updates a Supabase Auth user and grants manager access for the selected company.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={tenantId} onValueChange={setTenantId} disabled={isLoading || createManager.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading companies..." : "Select a company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedTenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.company_name} ({t.subdomain})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@company.com"
                    autoComplete="off"
                    disabled={createManager.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set initial password"
                    type="password"
                    autoComplete="new-password"
                    disabled={createManager.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)} disabled={createManager.isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={createManager.isPending}>
                Cancel
              </Button>
              <Button onClick={() => createManager.mutate()} disabled={createManager.isPending}>
                {createManager.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

