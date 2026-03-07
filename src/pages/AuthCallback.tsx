import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function parseHashParams(hash: string): Record<string, string> {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const p = new URLSearchParams(h);
  const out: Record<string, string> = {};
  for (const [k, v] of p.entries()) out[k] = v;
  return out;
}

/**
 * Receives a Supabase session handoff from the auth portal.
 * Expected hash params: access_token, refresh_token
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const hash = parseHashParams(window.location.hash);
        const access_token = hash.access_token;
        const refresh_token = hash.refresh_token;

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        }

        // Strip hash and go home.
        window.location.hash = "";
        navigate("/", { replace: true });
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-muted-foreground">
        {error ? `Auth callback failed: ${error}` : "Signing you in…"}
      </div>
    </div>
  );
}
