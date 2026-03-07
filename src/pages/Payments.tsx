import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type PaymentIntent = {
  id: string;
  tenant_id: string;
  intent_type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  external_reference: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  mt_tenants: {
    company_name: string;
  } | null;
};

const providerColors: Record<string, string> = {
  momo: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  mpesa: "bg-green-500/10 text-green-600 border-green-500/20",
  stripe: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  manual: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export default function Payments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payment-intents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mt_payment_intents")
        .select("*, mt_tenants(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PaymentIntent[];
    },
    refetchInterval: 8000,
  });

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.mt_tenants?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      payment.external_reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesProvider = providerFilter === "all" || payment.provider === providerFilter;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const columns = [
    {
      key: "tenant",
      header: "Client",
      render: (payment: PaymentIntent) => (
        <div>
          <p className="font-medium">{payment.mt_tenants?.company_name || "—"}</p>
          <p className="text-sm text-muted-foreground capitalize">{payment.intent_type}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (payment: PaymentIntent) => (
        <span className="font-medium">
          ${Number(payment.amount).toFixed(2)} {payment.currency}
        </span>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (payment: PaymentIntent) => (
        <Badge variant="outline" className={providerColors[payment.provider] || ""}>
          {payment.provider.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment: PaymentIntent) => (
        <StatusBadge status={payment.status as "pending"} />
      ),
    },
    {
      key: "external_reference",
      header: "Reference",
      render: (payment: PaymentIntent) =>
        payment.external_reference ? (
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {payment.external_reference}
          </code>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "last_error",
      header: "Last Error",
      render: (payment: PaymentIntent) =>
        payment.last_error ? (
          <span className="text-sm text-destructive truncate max-w-[200px] block">
            {payment.last_error}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (payment: PaymentIntent) =>
        format(new Date(payment.created_at), "MMM d, yyyy h:mm a"),
    },
  ];

  return (
    <DashboardLayout title="Payments" description="Payment intents and transactions">
      <DataTable
        columns={columns}
        data={filteredPayments || []}
        isLoading={isLoading}
        searchPlaceholder="Search by client or reference..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No payment intents found"
        actions={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="momo">MoMo</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </DashboardLayout>
  );
}
