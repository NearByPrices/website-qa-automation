import axios, { AxiosResponse } from "axios";

export interface HttpResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  error?: string;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; WebsiteQABot/1.0; +https://github.com/nearbyprices/website-qa-automation)";

export async function httpGet(
  url: string,
  options: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<HttpResponse> {
  const start = Date.now();
  try {
    const response: AxiosResponse<string> = await axios.get(url, {
      timeout: options.timeoutMs ?? 15000,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        ...options.headers,
      },
      responseType: "text",
      maxRedirects: 5,
      validateStatus: () => true,
    });

    return {
      url: response.request?.res?.responseUrl ?? url,
      status: response.status,
      headers: normalizeHeaders(response.headers as Record<string, string | string[]>),
      body: String(response.data),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      headers: {},
      body: "",
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function httpHead(
  url: string,
  options: { timeoutMs?: number } = {}
): Promise<{ status: number; headers: Record<string, string>; durationMs: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await axios.head(url, {
      timeout: options.timeoutMs ?? 10000,
      headers: { "User-Agent": DEFAULT_USER_AGENT },
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return {
      status: response.status,
      headers: normalizeHeaders(response.headers as Record<string, string | string[]>),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 0,
      headers: {},
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function normalizeHeaders(headers: Record<string, string | string[]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
  }
  return result;
}
