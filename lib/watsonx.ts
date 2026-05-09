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
    return `{"entries":[{"word":"Mokopuna","translation":"Grandchild","definition":"Descendant, grandchild. Represents the future generations.","phonetic":"/mo.ko.pu.na/","part_of_speech":"noun","example_sentence":"Arohanui ki aku mokopuna.","example_translation":"Much love to my grandchildren."}]}`;
  }

  const token = await getIAMToken();
  const baseUrl = process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com";
  const projectId = requireEnv("WATSONX_PROJECT_ID");
  const candidateModels = [
    process.env.WATSONX_MODEL_ID,
    "ibm/granite-13b-instruct-v2",
    "ibm/granite-3-8b-instruct",
  ].filter((v): v is string => Boolean(v));

  let lastError = "";
  for (const modelId of candidateModels) {
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
      return data.results?.[0]?.generated_text ?? "";
    }

    lastError = await res.text();
    if (res.status !== 404 || !lastError.includes("model_not_supported")) {
      break;
    }
  }

  throw new Error(`watsonx generation failed: ${lastError}`);
}
