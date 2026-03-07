import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthStatus = "checking" | "authed" | "unauth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const redirectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setStatus(data.session ? "authed" : "unauth");
    };

    void check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void check();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== "unauth") return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    navigate("/login", { replace: true, state: { from: location.pathname } });
  }, [status, navigate, location.pathname]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Redirecting to login…</div>
      </div>
    );
  }

  return <>{children}</>;
}
