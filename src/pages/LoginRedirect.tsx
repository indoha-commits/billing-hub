import { useEffect } from "react";

/**
 * Env-driven auth portal redirect.
 *
 * Configure VITE_AUTH_PORTAL_LOGIN_URL, e.g. http://localhost:8082/login
 */
export default function LoginRedirect() {
  useEffect(() => {
    const portal = import.meta.env.VITE_AUTH_PORTAL_LOGIN_URL as string | undefined;
    if (!portal) {
      // Last resort: stay on page.
      // eslint-disable-next-line no-console
      console.error("Missing VITE_AUTH_PORTAL_LOGIN_URL");
      return;
    }

    // Send user to auth portal.
    window.location.href = portal;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Redirecting to login…</div>
    </div>
  );
}
