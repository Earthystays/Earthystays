import { describe, expect, it } from "vitest";
import {
  MIN_COLLECTION_INVENTORY,
  destinationsForCollection,
  experiencesForCollection,
  isCollectionIndexable,
  journalForStateName,
  staysForExperience,
} from "./relevance";
import { getPublishedExperiences } from "@/lib/data/experiences";
import { getAllCollections } from "@/lib/data/collections";
import { getVillasByCollection } from "@/lib/data/villas";
import type { Experience } from "@/lib/types";

/** These run against the real catalog, so assertions stay shape-based. */

describe("staysForExperience", () => {
  const sample = getPublishedExperiences()[0];

  it("only returns properties that share the experience's place", () => {
    if (!sample) return;
    const stays = staysForExperience(sample, 5);
    for (const v of stays) {
      const shares =
        v.destinationSlug === sample.citySlug ||
        v.state?.toLowerCase() === sample.state?.toLowerCase() ||
        v.city?.toLowerCase() === sample.city?.toLowerCase();
      expect(shares).toBe(true);
    }
  });

  it("respects the limit", () => {
    if (!sample) return;
    expect(staysForExperience(sample, 2).length).toBeLessThanOrEqual(2);
  });

  it("returns nothing for an experience in a place we have no stays in", () => {
    const nowhere = {
      slug: "x",
      name: "X",
      blurb: "",
      image: { src: "", alt: "" },
      citySlug: "atlantis",
      city: "Atlantis",
      state: "Nowhere",
    } as Experience;
    expect(staysForExperience(nowhere)).toEqual([]);
  });

  it("never suggests a stay for an experience with no location at all", () => {
    const placeless = {
      slug: "y",
      name: "Y",
      blurb: "",
      image: { src: "", alt: "" },
    } as Experience;
    expect(staysForExperience(placeless)).toEqual([]);
  });
});

describe("collection connections", () => {
  const withInventory = getAllCollections().find(
    (c) => getVillasByCollection(c.slug).length > 0,
  );

  it("reports destinations with counts that match the inventory", () => {
    if (!withInventory) return;
    const dests = destinationsForCollection(withInventory.slug);
    const total = dests.reduce((n, d) => n + d.count, 0);
    const villas = getVillasByCollection(withInventory.slug);
    // Every villa with a destination is accounted for exactly once.
    expect(total).toBe(villas.filter((v) => v.destinationSlug).length);
  });

  it("sorts destinations by inventory, densest first", () => {
    if (!withInventory) return;
    const counts = destinationsForCollection(withInventory.slug).map((d) => d.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it("returns nothing for a collection that does not exist", () => {
    expect(destinationsForCollection("no-such-collection")).toEqual([]);
    expect(experiencesForCollection("no-such-collection")).toEqual([]);
  });

  it("only suggests experiences in destinations the collection covers", () => {
    if (!withInventory) return;
    const destSlugs = new Set(
      destinationsForCollection(withInventory.slug).map((d) => d.slug),
    );
    for (const e of experiencesForCollection(withInventory.slug, 10)) {
      expect(destSlugs.has(e.citySlug!)).toBe(true);
    }
  });
});

describe("collection indexability", () => {
  it("marks a collection with no inventory as not indexable", () => {
    expect(isCollectionIndexable("no-such-collection")).toBe(false);
  });

  it("agrees with the inventory threshold for every real collection", () => {
    for (const c of getAllCollections()) {
      const count = getVillasByCollection(c.slug).length;
      expect(isCollectionIndexable(c.slug)).toBe(count >= MIN_COLLECTION_INVENTORY);
    }
  });
});

describe("journalForStateName", () => {
  it("returns nothing for a state with no journal destinations", () => {
    expect(journalForStateName("Atlantis")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(journalForStateName("Goa", 2).length).toBeLessThanOrEqual(2);
  });
});
