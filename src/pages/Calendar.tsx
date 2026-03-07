import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ExternalLink, Check, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { toast } from "sonner";

type CalendarEvent = {
  id: string;
  tenant_id: string | null;
  google_event_id: string | null;
  title: string;
  start_time: string;
  end_time: string | null;
  meeting_link: string | null;
  is_attended: boolean;
  walkthrough_complete: boolean;
  created_at: string;
  mt_tenants: {
    company_name: string;
  } | null;
};

export default function Calendar() {
  const queryClient = useQueryClient();
  const now = new Date();
  const twoWeeksFromNow = addDays(now, 14);

  const { data: events, isLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*, mt_tenants(company_name)")
        .gte("start_time", now.toISOString())
        .lte("start_time", twoWeeksFromNow.toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  const markAttended = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .update({ is_attended: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Marked as attended");
    },
  });

  const markWalkthroughComplete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .update({ walkthrough_complete: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Walkthrough marked complete");
    },
  });

  // Group events by date
  const eventsByDate = events?.reduce((acc, event) => {
    const date = format(new Date(event.start_time), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const isPast = (dateStr: string) => isBefore(new Date(dateStr), now);

  return (
    <DashboardLayout title="Calendar" description="Upcoming meetings (next 14 days)">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-6">
          {eventsByDate &&
            Object.entries(eventsByDate).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {format(new Date(date), "EEEE, MMMM d")}
                </h3>
                <div className="space-y-3">
                  {dateEvents.map((event) => (
                    <Card key={event.id} className={event.walkthrough_complete ? "opacity-60" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{event.title}</CardTitle>
                              <CardDescription>
                                {format(new Date(event.start_time), "h:mm a")}
                                {event.end_time &&
                                  ` – ${format(new Date(event.end_time), "h:mm a")}`}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.is_attended && (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                <Check className="mr-1 h-3 w-3" /> Attended
                              </Badge>
                            )}
                            {event.walkthrough_complete && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                <Check className="mr-1 h-3 w-3" /> Walkthrough Done
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {event.mt_tenants?.company_name || "No client mapped"}
                          </div>
                          <div className="flex items-center gap-2">
                            {event.meeting_link && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={event.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" /> Join
                                </a>
                              </Button>
                            )}
                            {!event.is_attended && isPast(event.start_time) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAttended.mutate(event.id)}
                                disabled={markAttended.isPending}
                              >
                                <Check className="mr-1 h-3 w-3" /> Mark Attended
                              </Button>
                            )}
                            {event.is_attended && !event.walkthrough_complete && (
                              <Button
                                size="sm"
                                onClick={() => markWalkthroughComplete.mutate(event.id)}
                                disabled={markWalkthroughComplete.isPending}
                              >
                                <Check className="mr-1 h-3 w-3" /> Complete Walkthrough
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No upcoming meetings</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Connect your Google Calendar to see upcoming client meetings here.
            </p>
            <Button className="mt-4" variant="outline">
              Connect Google Calendar
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
