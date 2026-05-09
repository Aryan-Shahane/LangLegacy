import Link from "next/link";
import { redirect } from "next/navigation";
import CommunityRecordingFlow from "@/components/CommunityRecordingFlow";
import TopBar from "@/components/TopBar";
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
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <TopBar activeTab="dictionary" languageCode={language} />
      <section className="mx-auto max-w-4xl space-y-8 px-6 py-12 md:px-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A3620]">Contribution</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#5A665F]">
            <Link href="/" className="hover:text-[#1B3022] hover:underline">
              Languages
            </Link>
            <span aria-hidden>|</span>
            <Link href={`/${language}`} className="hover:text-[#1B3022] hover:underline">
              Dictionary ({language})
            </Link>
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-[#061B0E] md:text-4xl">Contribute recording · {languageName}</h1>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[#434843]">
            Signed in as <span className="font-medium text-[#1B3022]">{viewer.name}</span>. Record or upload pronunciation audio: it is transcribed locally with Whisper, glossed via IBM Granite
            on watsonx, reviewed by you, then stored in Cloudinary and Cloudant.
          </p>
        </div>

        <CommunityRecordingFlow languageCode={language} languageName={languageName} />
      </section>
    </div>
  );
}
