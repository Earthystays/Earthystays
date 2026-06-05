import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-4xl">Terms of use</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Placeholder. Replace with real terms before launch. Should cover: booking terms,
          cancellation policy, refunds, liability, governing law.
        </p>
      </div>
    </div>
  );
}
