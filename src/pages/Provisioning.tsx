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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProvisioningJob = {
  id: string;
  tenant_id: string;
  status: string;
  attempts: number;
  last_error: string | null;
  logs: Array<{ timestamp: string; message: string; level: string }>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  mt_tenants: {
    company_name: string;
  } | null;
};

export default function Provisioning() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewingLogs, setViewingLogs] = useState<ProvisioningJob | null>(null);
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["provisioning-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mt_provisioning_jobs")
        .select("*, mt_tenants(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProvisioningJob[];
    },
  });

  const startProvisioning = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("mt_provisioning_jobs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provisioning-jobs"] });
      toast.success("Provisioning started");
    },
    onError: (error) => {
      toast.error("Failed to start: " + error.message);
    },
  });

  const retryProvisioning = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("mt_provisioning_jobs")
        .update({
          status: "queued",
          last_error: null,
          started_at: null,
          completed_at: null,
        })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provisioning-jobs"] });
      toast.success("Job queued for retry");
    },
    onError: (error) => {
      toast.error("Failed to retry: " + error.message);
    },
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch = job.mt_tenants?.company_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "tenant",
      header: "Client",
      render: (job: ProvisioningJob) => (
        <p className="font-medium">{job.mt_tenants?.company_name || "—"}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (job: ProvisioningJob) => (
        <StatusBadge status={job.status as "queued"} />
      ),
    },
    {
      key: "attempts",
      header: "Attempts",
      render: (job: ProvisioningJob) => (
        <Badge variant="outline">{job.attempts}</Badge>
      ),
    },
    {
      key: "last_error",
      header: "Last Error",
      render: (job: ProvisioningJob) =>
        job.last_error ? (
          <span className="text-sm text-destructive truncate max-w-[200px] block">
            {job.last_error}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "started_at",
      header: "Started",
      render: (job: ProvisioningJob) =>
        job.started_at ? (
          format(new Date(job.started_at), "MMM d, h:mm a")
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "completed_at",
      header: "Completed",
      render: (job: ProvisioningJob) =>
        job.completed_at ? (
          format(new Date(job.completed_at), "MMM d, h:mm a")
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (job: ProvisioningJob) => (
        <div className="flex items-center gap-2">
          {job.status === "queued" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startProvisioning.mutate(job.id)}
              disabled={startProvisioning.isPending}
            >
              <Play className="mr-1 h-3 w-3" /> Start
            </Button>
          )}
          {job.status === "failed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retryProvisioning.mutate(job.id)}
              disabled={retryProvisioning.isPending}
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingLogs(job)}
          >
            <Eye className="mr-1 h-3 w-3" /> Logs
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Provisioning" description="Tenant provisioning jobs">
      <DataTable
        columns={columns}
        data={filteredJobs || []}
        isLoading={isLoading}
        searchPlaceholder="Search by client..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No provisioning jobs found"
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={!!viewingLogs} onOpenChange={() => setViewingLogs(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provisioning Logs</DialogTitle>
            <DialogDescription>
              {viewingLogs?.mt_tenants?.company_name} - Job #{viewingLogs?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
            {viewingLogs?.logs && viewingLogs.logs.length > 0 ? (
              <div className="space-y-2 font-mono text-sm">
                {viewingLogs.logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground">
                      {format(new Date(log.timestamp), "HH:mm:ss")}
                    </span>
                    <span
                      className={
                        log.level === "error"
                          ? "text-destructive"
                          : log.level === "warn"
                          ? "text-warning"
                          : "text-foreground"
                      }
                    >
                      [{log.level.toUpperCase()}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No logs available</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
