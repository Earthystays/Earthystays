import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-display text-4xl">Privacy policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          This is placeholder copy. Replace with your real privacy policy before launch — what
          you collect, why, how long you keep it, who you share it with, and how users can
          delete their data.
        </p>
        <p>
          Until then: we collect the contact details you submit through the inquiry form and use
          them only to respond to your inquiry.
        </p>
      </div>
    </div>
  );
}
