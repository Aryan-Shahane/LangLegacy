"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AddLanguageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [nativeScript, setNativeScript] = useState("");
  const [sampleGreeting, setSampleGreeting] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          region: region.trim(),
          description: description.trim(),
          native_script: nativeScript.trim(),
          sample_greeting: sampleGreeting.trim(),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || "Unable to save language.");
        return;
      }
      onClose();
      setName("");
      setCode("");
      setRegion("");
      setDescription("");
      setNativeScript("");
      setSampleGreeting("");
      const createdCode =
        typeof (payload as { code?: unknown }).code === "string"
          ? (payload as { code: string }).code
          : code.trim().toLowerCase();
      router.push(`/${encodeURIComponent(createdCode)}`);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-language-title"
    >
      <Card className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto border-[#C3C8C1] bg-[#FBF9F4] p-6">
        <h2 id="add-language-title" className="font-serif text-2xl text-[#061B0E]">
          Add Your Language
        </h2>
        <p className="text-xs text-[#5A665F]">Fields marked with * are required.</p>

        <label className="block text-xs text-[#434843]">
          Language name *
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-xs text-[#434843]">
          Language code (ISO or custom identifier) *
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1" placeholder="e.g. mi" />
        </label>
        <label className="block text-xs text-[#434843]">
          Region *
          <Input value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-xs text-[#434843]">
          Description
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-xs text-[#434843]">
          Native script
          <Input value={nativeScript} onChange={(e) => setNativeScript(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-xs text-[#434843]">
          Sample greeting
          <Input value={sampleGreeting} onChange={(e) => setSampleGreeting(e.target.value)} className="mt-1" />
        </label>

        {error ? <p className="text-sm text-[#A44927]">{error}</p> : null}

        <div className="flex gap-2 pt-2">
          <Button type="button" onClick={() => void submit()} disabled={submitting} className="bg-[#1B3022] text-white hover:bg-[#061B0E]">
            {submitting ? "Saving…" : "Submit"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
