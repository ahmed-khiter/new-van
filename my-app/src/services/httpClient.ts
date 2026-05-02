import { getApiBaseUrl } from "@/constants/env";

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | undefined | null>;
};

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = new URL(path, `${baseUrl}/`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url.pathname}`);
  }

  return (await response.json()) as T;
}
