import { Button } from "@/components/ui/button";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#C3C8C1]/30 bg-[#F0EEE9] px-6 py-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-serif text-2xl text-[#061B0E]">LangLegacy</p>
          <p className="text-sm text-[#434843]">© 2024 LangLegacy. Preserving the breath of our ancestors.</p>
        </div>
        <div className="flex gap-6 text-sm text-[#434843]">
          <span>Archives</span>
          <span>Linguists</span>
          <span>Safety</span>
          <span>Terms</span>
        </div>
        <Button>Join the Circle</Button>
      </div>
    </footer>
  );
}
