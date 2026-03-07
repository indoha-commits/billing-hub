import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Users,
  ArrowRight,
  Bell,
  Server,
  CreditCard,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function Dashboard() {
  // Fetch KPIs
  const { data: tenants } = useQuery({
    queryKey: ["tenants-kpi"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mt_tenants").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices-kpi"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mt_invoices").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mt_notifications")
        .select("*, mt_tenants(company_name)")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Calculate KPIs
  const activeTenants = tenants?.filter((t) => t.status === "active").length || 0;
  const mrr = tenants?.reduce((sum, t) => sum + (Number(t.monthly_plan_price) || 0), 0) || 0;
  const paidInvoicesThisMonth =
    invoices?.filter(
      (i) =>
        i.status === "paid" &&
        new Date(i.paid_at || "").getMonth() === new Date().getMonth()
    ).length || 0;
  const pastDueCount = tenants?.filter((t) => t.status === "past_due").length || 0;

  const actionItems = notifications || [];

  return (
    <DashboardLayout title="Dashboard" description="Overview of your operations">
      {/* Action Required Section */}
      {actionItems.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">Action Required</CardTitle>
              <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground">
                {actionItems.length}
              </span>
            </div>
            <CardDescription>
              These items need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-warning/10 p-2">
                      {item.type === "payment_confirmed" && (
                        <CreditCard className="h-4 w-4 text-warning" />
                      )}
                      {item.type === "provisioning_failed" && (
                        <Server className="h-4 w-4 text-destructive" />
                      )}
                      {item.type === "payment_failed" && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {!["payment_confirmed", "provisioning_failed", "payment_failed"].includes(item.type) && (
                        <Bell className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.mt_tenants?.company_name} • {format(new Date(item.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Link to="/notifications">
                    <Button variant="ghost" size="sm">
                      View <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard
          title="Monthly Recurring Revenue"
          value={`$${mrr.toLocaleString()}`}
          subtitle="Total MRR from active subscriptions"
          icon={DollarSign}
          variant="primary"
        />
        <KPICard
          title="Paid Invoices (This Month)"
          value={paidInvoicesThisMonth}
          subtitle="Successfully processed payments"
          icon={FileText}
          variant="success"
        />
        <KPICard
          title="Past Due Accounts"
          value={pastDueCount}
          subtitle="Accounts with failed payments"
          icon={AlertTriangle}
          variant={pastDueCount > 0 ? "danger" : "success"}
        />
        <KPICard
          title="Active Tenants"
          value={activeTenants}
          subtitle="Currently active customers"
          icon={Users}
          variant="primary"
        />
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Clients</CardTitle>
            <CardDescription>Latest client registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-3">
                {tenants.slice(0, 5).map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {tenant.company_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tenant.company_name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.admin_email}</p>
                      </div>
                    </div>
                    <StatusBadge status={tenant.status as "active"} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No clients yet</p>
            )}
            <Link to="/clients">
              <Button variant="ghost" className="mt-4 w-full">
                View all clients <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Invoices</CardTitle>
            <CardDescription>Pending invoice payments</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices && invoices.filter((i) => i.status === "open").length > 0 ? (
              <div className="space-y-3">
                {invoices
                  .filter((i) => i.status === "open")
                  .slice(0, 5)
                  .map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(invoice.amount).toFixed(2)} {invoice.currency}
                        </p>
                      </div>
                      <StatusBadge status="open" />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No open invoices</p>
            )}
            <Link to="/invoices">
              <Button variant="ghost" className="mt-4 w-full">
                View all invoices <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
            <CardDescription>Provisioning & payment health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Gateway</span>
                <span className="flex items-center gap-2 text-sm font-medium text-success">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provisioning Service</span>
                <span className="flex items-center gap-2 text-sm font-medium text-success">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Webhook Handler</span>
                <span className="flex items-center gap-2 text-sm font-medium text-success">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
                  Operational
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
