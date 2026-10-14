import { getSiteBaseUrl } from "@/lib/utils";

export function getServerApiUrl(): string {
    let url = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://melktoday.com/backend/api";
    url = url.trim().replace(/\/+$/, "");

    // Remap direct server IP to domain to ensure valid SSL and correct vhost routing
    if (url.includes("109.122.254.238")) {
        url = url.replace(/https?:\/\/109\.122\.254\.238(:\d+)?/, "https://melktoday.com");
    }

    // Ensure /backend/api or /api path exists
    if (!url.endsWith("/api") && !url.includes("/api/")) {
        url = `${url}/backend/api`;
    }

    // Enforce HTTPS for production domains
    if (url.startsWith("http://melktoday.com")) {
        url = url.replace(/^http:/, "https:");
    }

    return url;
}

export async function serverFetch<T>(
    endpoint: string,
    options: { revalidate?: number; timeoutMs?: number } = {}
): Promise<T | null> {
    const { revalidate = 60, timeoutMs = 3500 } = options;
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const baseUrl = getServerApiUrl();
    const url = `${baseUrl}${cleanEndpoint}`;

    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(timeoutMs),
            redirect: "error", // Prevent infinite SSR loops if redirected to HTML page
            next: { revalidate },
            headers: {
                Accept: "application/json",
            },
        });

        if (!res.ok) return null;
        const json = await res.json();
        return (json && typeof json === "object" && "data" in json) ? json.data : json;
    } catch {
        return null;
    }
}
