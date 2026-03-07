import { supabase } from "@/integrations/supabase/client";

const WORKER_BASE_URL = import.meta.env.VITE_WORKER_BASE_URL;

export async function workerGet<T>(path: string): Promise<T> {
  if (!WORKER_BASE_URL) throw new Error("VITE_WORKER_BASE_URL is not configured");

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${WORKER_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}

export async function workerDelete<T>(path: string): Promise<T> {
  if (!WORKER_BASE_URL) throw new Error("VITE_WORKER_BASE_URL is not configured");

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${WORKER_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}

export async function workerPost<T>(path: string, body: any): Promise<T> {
  if (!WORKER_BASE_URL) throw new Error("VITE_WORKER_BASE_URL is not configured");

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${WORKER_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}
