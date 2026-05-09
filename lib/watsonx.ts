let cachedToken: string | null = null;
let tokenExpiry = 0;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function getIAMToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const apiKey = requireEnv("WATSONX_API_KEY");
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
  });

  if (!res.ok) {
    throw new Error(`IBM IAM token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function generateText(prompt: string): Promise<string> {
  if (!process.env.WATSONX_API_KEY) {
    throw new Error("WATSONX_API_KEY is not configured.");
  }

  const token = await getIAMToken();
  const baseUrl = process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com";
  const projectId = requireEnv("WATSONX_PROJECT_ID");

  // Only use models that actually exist on Watsonx
  const candidateModels = [
    process.env.WATSONX_MODEL_ID,
    "ibm/granite-3-8b-instruct",
  ].filter((v): v is string => Boolean(v));

  let lastError = "";
  for (const modelId of candidateModels) {
    // Add a small delay between retries to avoid rate limits
    if (lastError) {
      await new Promise((r) => setTimeout(r, 1500));
    }

    try {
      const res = await fetch(`${baseUrl}/ml/v1/text/generation?version=2023-05-29`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: modelId,
          project_id: projectId,
          input: prompt,
          parameters: {
            decoding_method: "greedy",
            max_new_tokens: 2000,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ generated_text?: string }>;
        };
        const text = data.results?.[0]?.generated_text;
        if (text) return text;
      }

      lastError = await res.text();
      console.warn(`Watsonx model ${modelId} failed: ${lastError}`);
    } catch (err) {
      console.error(`Fetch error for model ${modelId}:`, err);
      lastError = String(err);
    }
  }

  // No mock fallback — throw so callers can use their own fallback logic
  throw new Error(`All Watsonx models failed. Last error: ${lastError}`);
}
