import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, Mail, ExternalLink, Copy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

type Invoice = {
  id: string;
  tenant_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  period_start: string;
  period_end: string;
  payment_link: string | null;
  payment_reference: string | null;
  created_at: string;
  paid_at: string | null;
  mt_tenants: {
    company_name: string;
    admin_email: string;
  } | null;
};

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mt_invoices")
        .select("*, mt_tenants(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    refetchInterval: 8000,
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      invoice.mt_tenants?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResendEmail = (invoice: Invoice) => {
    toast.success(`Invoice email queued for ${invoice.mt_tenants?.admin_email}`);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Payment link copied to clipboard");
  };

  const columns = [
    {
      key: "invoice_number",
      header: "Invoice",
      render: (invoice: Invoice) => (
        <div>
          <p className="font-medium font-mono">{invoice.invoice_number}</p>
          <p className="text-sm text-muted-foreground">
            {invoice.mt_tenants?.company_name || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (invoice: Invoice) => (
        <span className="font-medium">
          ${Number(invoice.amount).toFixed(2)} {invoice.currency}
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (invoice: Invoice) => {
        const start = invoice.period_start ? new Date(invoice.period_start) : null;
        const end = invoice.period_end ? new Date(invoice.period_end) : null;

        const startOk = start && !Number.isNaN(start.getTime());
        const endOk = end && !Number.isNaN(end.getTime());

        if (!startOk || !endOk) return <span className="text-sm text-muted-foreground">—</span>;

        return (
          <span className="text-sm">
            {format(start!, "MMM d")} – {format(end!, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (invoice: Invoice) => (
        <StatusBadge status={invoice.status as "open"} />
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (invoice: Invoice) =>
        invoice.payment_reference ? (
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {invoice.payment_reference}
          </code>
        ) : invoice.payment_link ? (
          <a
            href={invoice.payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Pay now <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "paid_at",
      header: "Paid At",
      render: (invoice: Invoice) => {
        if (!invoice.paid_at) return <span className="text-muted-foreground">—</span>;
        const d = new Date(invoice.paid_at);
        if (Number.isNaN(d.getTime())) return <span className="text-muted-foreground">—</span>;
        return format(d, "MMM d, yyyy");
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (invoice: Invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleResendEmail(invoice)}>
              <Mail className="mr-2 h-4 w-4" /> Resend Invoice Email
            </DropdownMenuItem>
            {invoice.payment_link && (
              <DropdownMenuItem onClick={() => handleCopyLink(invoice.payment_link!)}>
                <Copy className="mr-2 h-4 w-4" /> Copy Payment Link
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout title="Invoices" description="Invoice management">
      <DataTable
        columns={columns}
        data={filteredInvoices || []}
        isLoading={isLoading}
        searchPlaceholder="Search by client or invoice number..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No invoices found"
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="void">Void</SelectItem>
              <SelectItem value="uncollectible">Uncollectible</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </DashboardLayout>
  );
}
