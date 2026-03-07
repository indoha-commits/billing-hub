import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
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

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success border-success/20",
  update: "bg-info/10 text-info border-info/20",
  delete: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const entityTypes = [...new Set(logs?.map((l) => l.entity_type) || [])];

  const columns = [
    {
      key: "action",
      header: "Action",
      render: (log: AuditLog) => {
        const actionType = log.action.split("_")[0] || log.action;
        return (
          <Badge
            variant="outline"
            className={actionColors[actionType] || "bg-muted"}
          >
            {log.action}
          </Badge>
        );
      },
    },
    {
      key: "entity_type",
      header: "Entity",
      render: (log: AuditLog) => (
        <div>
          <p className="font-medium capitalize">{log.entity_type}</p>
          {log.entity_id && (
            <code className="text-xs text-muted-foreground">
              {log.entity_id.slice(0, 8)}...
            </code>
          )}
        </div>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (log: AuditLog) =>
        log.details && Object.keys(log.details).length > 0 ? (
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {JSON.stringify(log.details).slice(0, 50)}...
          </code>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (log: AuditLog) =>
        log.actor_id ? (
          <code className="text-xs text-muted-foreground">
            {log.actor_id.slice(0, 8)}...
          </code>
        ) : (
          <span className="text-muted-foreground">System</span>
        ),
    },
    {
      key: "created_at",
      header: "Time",
      render: (log: AuditLog) =>
        format(new Date(log.created_at), "MMM d, yyyy h:mm:ss a"),
    },
  ];

  return (
    <DashboardLayout title="Audit Log" description="System activity history">
      <DataTable
        columns={columns}
        data={filteredLogs || []}
        isLoading={isLoading}
        searchPlaceholder="Search actions..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No audit logs found"
        actions={
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </DashboardLayout>
  );
}
