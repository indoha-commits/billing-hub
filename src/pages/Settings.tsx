import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Server, Webhook, Bell, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const handleSave = () => {
    toast.success("Settings saved");
  };

  return (
    <DashboardLayout title="Settings" description="Configure your operations hub">
      <div className="space-y-6 max-w-3xl">
        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    Sync meetings for client walkthroughs
                  </p>
                </div>
              </div>
              <Button variant="outline">Connect</Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Payment Providers</p>
                  <p className="text-sm text-muted-foreground">
                    MoMo, M-Pesa, Stripe configurations
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10 text-info">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Cloudflare Workers</p>
                  <p className="text-sm text-muted-foreground">
                    Provisioning and payment endpoints
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Configure webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-worker.workers.dev/webhook"
                defaultValue="https://ops.indataflow.workers.dev/webhook"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="webhook-secret">Webhook Secret</Label>
              <Input
                id="webhook-secret"
                type="password"
                defaultValue="••••••••••••••••"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Confirmed Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when a payment is confirmed and ready for provisioning
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Provisioning Failed Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when a provisioning job fails
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Failed Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when a subscription payment fails
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email for critical alerts
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Access and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin users
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-logout after 30 minutes of inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
