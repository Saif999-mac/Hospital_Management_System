import { useAuth } from "@clerk/nextjs";

export function useApi() {
  const { getToken } = useAuth();
  async function request(path: string, options: RequestInit = {}) {
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok)
      throw new Error((await res.json()).message || "Request failed");
    return res.json();
  }

  return { request };
}
