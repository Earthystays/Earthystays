/**
 * Organization JSON-LD for the homepage.
 *
 * Tells Google: this is Earthy Stays, a brand, here's the logo + contact.
 * Over time this is what powers:
 *   - Logo next to the brand name in search results
 *   - Knowledge-panel candidacy on right-hand side of Google
 *   - Cleaner "About this result" cards
 *
 * Sitelinks (the StayVista-style quick-link tree) are awarded by Google
 * based on site authority + traffic — structured data helps but doesn't
 * guarantee them. They typically appear once a brand has been crawled +
 * trusted for several months.
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Earthy Stays",
    legalName: "Earthy Stays",
    url: "https://earthystays.com",
    logo: "https://earthystays.com/icon-512.png",
    image: "https://earthystays.com/opengraph-image.jpg",
    description:
      "Curated villa rentals across India — Goa beachfront homes, hill retreats, heritage stays. Private pools, full staff, unforgettable stays.",
    telephone: "+91-9657100004",
    email: "reservations@earthyrooms.com",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: "Goa",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    sameAs: [
      // Add your social URLs once they're live:
      // "https://www.instagram.com/earthystays",
      // "https://www.facebook.com/earthystays",
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
