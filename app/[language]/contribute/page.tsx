import Link from "next/link";
import { redirect } from "next/navigation";
import CommunityRecordingFlow from "@/components/CommunityRecordingFlow";
import { getSessionFromCookie } from "@/lib/auth";
import { getDocument } from "@/lib/cloudant";

export default async function ContributePage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  const viewer = await getSessionFromCookie();
  if (!viewer) {
    redirect(`/auth?next=/${language}/contribute`);
  }

  const languageDoc = await getDocument("languages", language);
  const languageName = typeof languageDoc?.name === "string" ? languageDoc.name : language;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500/90">Contribution</p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            Languages
          </Link>
          <span aria-hidden>|</span>
          <Link href={`/${language}`} className="hover:text-slate-300">
            Dictionary ({language})
          </Link>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-100">Contribute recording · {languageName}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-400">
          Signed in as {viewer.name}. Record or upload pronunciation audio: it is transcribed locally with Whisper, glossed via IBM Granite
          on watsonx, reviewed by you, then stored in Cloudinary and Cloudant.
        </p>
      </div>

      <CommunityRecordingFlow languageCode={language} languageName={languageName} />
    </section>
  );
}
