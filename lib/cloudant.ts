type Json = Record<string, unknown>;
let cachedToken: string | null = null;
let tokenExpiry = 0;

function cloudantConfig() {
  const base = process.env.CLOUDANT_URL;
  const apiKey = process.env.CLOUDANT_API_KEY;
  if (!base || !apiKey) {
    throw new Error("Missing Cloudant credentials");
  }
  return { base, apiKey };
}

async function getCloudantHeaders(): Promise<Record<string, string>> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return {
      Authorization: `Bearer ${cachedToken}`,
      "Content-Type": "application/json",
    };
  }

  const { apiKey } = cloudantConfig();
  const body = new URLSearchParams({
    grant_type: "urn:ibm:params:oauth:grant-type:apikey",
    apikey: apiKey,
  });
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Cloudant IAM token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return {
    Authorization: `Bearer ${cachedToken}`,
    "Content-Type": "application/json",
  };
}

function clearCachedToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

async function cloudantFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const initialHeaders = await getCloudantHeaders();
  const first = await fetch(input, {
    ...init,
    headers: { ...initialHeaders, ...(init.headers ?? {}) },
  });
  if (first.status !== 401) {
    return first;
  }

  // IAM tokens can be revoked/expired early; refresh once and retry.
  clearCachedToken();
  const refreshedHeaders = await getCloudantHeaders();
  return fetch(input, {
    ...init,
    headers: { ...refreshedHeaders, ...(init.headers ?? {}) },
  });
}

/** CouchDB/Cloudant often responds to POST/PUT with `{ ok, id, rev }` only — merge so callers receive the full document. */
function mergeWriteResponse(doc: Json, result: unknown): Json {
  if (!result || typeof result !== "object") {
    return doc;
  }
  const r = result as Record<string, unknown>;
  if (r.ok === true && typeof r.id === "string" && typeof r.rev === "string") {
    return { ...doc, _id: r.id, _rev: r.rev } as Json;
  }
  return result as Json;
}

async function ensureDatabase(db: string): Promise<void> {
  const { base } = cloudantConfig();
  const res = await cloudantFetch(`${base}/${db}`, {
    method: "PUT",
    cache: "no-store",
  });
  if (res.ok || res.status === 412) {
    // 412 means database already exists.
    return;
  }
  throw new Error(`Cloudant ensure database failed: ${res.status}`);
}

export async function findDocuments(
  db: string,
  selector: Json,
  limit = 20,
  skip = 0
): Promise<Json[]> {
  const { base } = cloudantConfig();
  let res = await cloudantFetch(`${base}/${db}/_find`, {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({ selector, limit, skip }),
  });
  if (res.status === 404) {
    await ensureDatabase(db);
    res = await cloudantFetch(`${base}/${db}/_find`, {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({ selector, limit, skip }),
    });
  }
  if (!res.ok) {
    throw new Error(`Cloudant _find failed: ${res.status}`);
  }
  const data = (await res.json()) as { docs?: Json[] };
  return data.docs ?? [];
}

export async function getAllDocuments(db: string): Promise<Json[]> {
  const { base } = cloudantConfig();
  const res = await cloudantFetch(`${base}/${db}/_all_docs?include_docs=true`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Cloudant _all_docs failed: ${res.status}`);
  }
  const data = (await res.json()) as { rows?: Array<{ doc?: Json }> };
  return (data.rows ?? [])
    .map((r) => r.doc)
    .filter((d): d is Json => Boolean(d && typeof d._id === "string" && !(d._id as string).startsWith("_")));
}

export async function saveDocument(db: string, doc: Json): Promise<Json> {
  const { base } = cloudantConfig();
  let res = await cloudantFetch(`${base}/${db}`, {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify(doc),
  });
  if (res.status === 404) {
    await ensureDatabase(db);
    res = await cloudantFetch(`${base}/${db}`, {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify(doc),
    });
  }
  if (!res.ok) {
    throw new Error(`Cloudant save failed: ${res.status}`);
  }
  const result = await res.json();
  return mergeWriteResponse(doc, result);
}

export async function getDocument(db: string, id: string): Promise<Json | null> {
  try {
    const { base } = cloudantConfig();
    const res = await cloudantFetch(`${base}/${db}/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      console.warn(`[cloudant] getDocument ${db}/${id} HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as Json;
  } catch (err) {
    // `fetch` throws (e.g. "fetch failed") when the host is unreachable, TLS/DNS fails, or URL is invalid.
    console.warn(`[cloudant] getDocument ${db}/${id}`, err);
    return null;
  }
}

export async function putDocument(db: string, id: string, doc: Json): Promise<Json> {
  const { base } = cloudantConfig();
  let res = await cloudantFetch(`${base}/${db}/${encodeURIComponent(id)}`, {
    method: "PUT",
    cache: "no-store",
    body: JSON.stringify(doc),
  });
  if (res.status === 404) {
    await ensureDatabase(db);
    res = await cloudantFetch(`${base}/${db}/${encodeURIComponent(id)}`, {
      method: "PUT",
      cache: "no-store",
      body: JSON.stringify(doc),
    });
  }
  if (!res.ok) {
    throw new Error(`Cloudant put document failed: ${res.status}`);
  }
  const result = await res.json();
  return mergeWriteResponse(doc, result);
}
