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
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CreditCard,
  Server,
  AlertTriangle,
  Webhook,
  Package,
  CheckCircle,
  Play,
  RefreshCw,
  Ban,
  Power,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notification = {
  id: string;
  tenant_id: string | null;
  type: string;
  title: string;
  description: string | null;
  is_read: boolean;
  is_resolved: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  mt_tenants: {
    company_name: string;
  } | null;
};

const typeIcons: Record<string, typeof Bell> = {
  payment_confirmed: CreditCard,
  provisioning_failed: Server,
  payment_failed: AlertTriangle,
  webhook_issue: Webhook,
  cargo_limit_exceeded: Package,
};

const typeColors: Record<string, string> = {
  payment_confirmed: "bg-success/10 text-success",
  provisioning_failed: "bg-destructive/10 text-destructive",
  payment_failed: "bg-destructive/10 text-destructive",
  webhook_issue: "bg-warning/10 text-warning",
  cargo_limit_exceeded: "bg-warning/10 text-warning",
};

export default function Notifications() {
  const [search, setSearch] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mt_notifications")
        .select("*, mt_tenants(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
  });

  const markResolved = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mt_notifications")
        .update({ is_resolved: true, is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Marked as resolved");
      setSelectedNotification(null);
    },
  });

  const handleAction = (action: string, notification: Notification) => {
    toast.success(`Action: ${action}`, {
      description: `For ${notification.mt_tenants?.company_name || "Unknown client"}`,
    });
  };

  const filteredNotifications = notifications?.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.mt_tenants?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: "type",
      header: "Type",
      className: "w-12",
      render: (n: Notification) => {
        const Icon = typeIcons[n.type] || Bell;
        return (
          <div className={`p-2 rounded-lg ${typeColors[n.type] || "bg-muted"}`}>
            <Icon className="h-4 w-4" />
          </div>
        );
      },
    },
    {
      key: "title",
      header: "Notification",
      render: (n: Notification) => (
        <div>
          <p className={`font-medium ${n.is_read ? "text-muted-foreground" : ""}`}>
            {n.title}
          </p>
          {n.description && (
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {n.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "tenant",
      header: "Client",
      render: (n: Notification) => (
        <span>{n.mt_tenants?.company_name || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (n: Notification) =>
        n.is_resolved ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="mr-1 h-3 w-3" /> Resolved
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Pending
          </Badge>
        ),
    },
    {
      key: "created_at",
      header: "Time",
      render: (n: Notification) =>
        format(new Date(n.created_at), "MMM d, h:mm a"),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (n: Notification) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedNotification(n)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout title="Notifications" description="Actionable events">
      <DataTable
        columns={columns}
        data={filteredNotifications || []}
        isLoading={isLoading}
        searchPlaceholder="Search notifications..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No notifications"
      />

      <Dialog
        open={!!selectedNotification}
        onOpenChange={() => setSelectedNotification(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && (
                <>
                  {(() => {
                    const Icon = typeIcons[selectedNotification.type] || Bell;
                    return (
                      <div
                        className={`p-2 rounded-lg ${
                          typeColors[selectedNotification.type] || "bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })()}
                  {selectedNotification.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification?.mt_tenants?.company_name} •{" "}
              {selectedNotification &&
                format(new Date(selectedNotification.created_at), "MMM d, yyyy h:mm a")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedNotification?.description && (
              <p className="text-sm">{selectedNotification.description}</p>
            )}

            {selectedNotification?.metadata &&
              Object.keys(selectedNotification.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Details</h4>
                  <ScrollArea className="h-[150px] rounded-md border bg-muted/30 p-3">
                    <pre className="text-xs">
                      {JSON.stringify(selectedNotification.metadata, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

            <div>
              <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNotification?.type === "payment_confirmed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAction("Start Provisioning", selectedNotification)
                    }
                  >
                    <Play className="mr-1 h-3 w-3" /> Start Provisioning
                  </Button>
                )}
                {selectedNotification?.type === "provisioning_failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAction("Retry Provisioning", selectedNotification)
                    }
                  >
                    <RefreshCw className="mr-1 h-3 w-3" /> Retry Provisioning
                  </Button>
                )}
                {selectedNotification?.type === "payment_failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAction("Retry Payment", selectedNotification)
                    }
                  >
                    <RefreshCw className="mr-1 h-3 w-3" /> Retry Payment
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAction("Suspend Tenant", selectedNotification!)
                  }
                >
                  <Ban className="mr-1 h-3 w-3" /> Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAction("Re-activate Tenant", selectedNotification!)
                  }
                >
                  <Power className="mr-1 h-3 w-3" /> Re-activate
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedNotification(null)}
            >
              Close
            </Button>
            {!selectedNotification?.is_resolved && (
              <Button
                onClick={() => markResolved.mutate(selectedNotification!.id)}
                disabled={markResolved.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
