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
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
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

export async function findDocuments(
  db: string,
  selector: Json,
  limit = 20,
  skip = 0
): Promise<Json[]> {
  const { base } = cloudantConfig();
  const headers = await getCloudantHeaders();
  const res = await fetch(`${base}/${db}/_find`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({ selector, limit, skip }),
  });
  if (!res.ok) {
    throw new Error(`Cloudant _find failed: ${res.status}`);
  }
  const data = (await res.json()) as { docs?: Json[] };
  return data.docs ?? [];
}

export async function getAllDocuments(db: string): Promise<Json[]> {
  const { base } = cloudantConfig();
  const headers = await getCloudantHeaders();
  const res = await fetch(`${base}/${db}/_all_docs?include_docs=true`, {
    headers,
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
  const headers = await getCloudantHeaders();
  const res = await fetch(`${base}/${db}`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    throw new Error(`Cloudant save failed: ${res.status}`);
  }
  return (await res.json()) as Json;
}

export async function getDocument(db: string, id: string): Promise<Json | null> {
  const { base } = cloudantConfig();
  const headers = await getCloudantHeaders();
  const res = await fetch(`${base}/${db}/${encodeURIComponent(id)}`, {
    headers,
    cache: "no-store",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Cloudant get document failed: ${res.status}`);
  }
  return (await res.json()) as Json;
}

export async function putDocument(db: string, id: string, doc: Json): Promise<Json> {
  const { base } = cloudantConfig();
  const headers = await getCloudantHeaders();
  const res = await fetch(`${base}/${db}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers,
    cache: "no-store",
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    throw new Error(`Cloudant put document failed: ${res.status}`);
  }
  return (await res.json()) as Json;
}
