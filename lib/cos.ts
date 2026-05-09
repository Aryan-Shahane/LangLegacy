export async function uploadAudio(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary configuration");
  }

  const blob = new Blob([buffer], { type: contentType });
  const form = new FormData();
  form.append("file", blob, key);
  form.append("upload_preset", uploadPreset);
  form.append("public_id", key.replace(/\//g, "_"));
  form.append("resource_type", "video");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.status}`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Cloudinary upload returned no secure_url");
  }
  return data.secure_url;
}
