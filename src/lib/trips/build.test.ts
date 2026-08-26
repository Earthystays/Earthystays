import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  buildTrips,
  classifyTrip,
  nightsBetween,
  toDateKey,
  type BookingLike,
  type TripResolvers,
} from "./build";

const TODAY = "2026-10-01";

const resolvers: TripResolvers = {
  property: (slug) =>
    slug === "casa-earthy"
      ? {
          name: "Casa Earthy",
          href: "/villas/casa-earthy",
          image: { src: "/casa.jpg", alt: "Casa Earthy" },
          city: "Goa",
          state: "Goa",
          locationNote: "Near Candolim beach",
        }
      : null,
  experience: (slug) =>
    slug === "spice-walk"
      ? {
          name: "Spice Plantation Walk",
          href: "/experiences/goa/spice-walk",
          image: null,
        }
      : null,
};

function stayRow(over: Partial<BookingLike> = {}): BookingLike {
  return {
    id: "bk_stay",
    bookingNumber: "ES-20261014-000001",
    kind: "property",
    guestId: "usr_1",
    hostId: "usr_host",
    propertyId: "casa-earthy",
    experienceId: null,
    checkIn: "2026-10-14",
    checkOut: "2026-10-18",
    experienceDate: null,
    guestsCount: 4,
    unitsCount: 1,
    bookingStatus: "CONFIRMED",
    paymentStatus: "PAID",
    ...over,
  };
}

function expRow(over: Partial<BookingLike> = {}): BookingLike {
  return {
    id: "bk_exp",
    bookingNumber: "ES-20261015-000002",
    kind: "experience",
    guestId: "usr_1",
    hostId: "usr_host",
    propertyId: null,
    experienceId: "spice-walk",
    checkIn: null,
    checkOut: null,
    experienceDate: "2026-10-15T09:00:00.000Z",
    guestsCount: 2,
    unitsCount: 1,
    bookingStatus: "CONFIRMED",
    paymentStatus: "PAID",
    ...over,
  };
}

describe("date helpers", () => {
  it("derives a date key without timezone drift", () => {
    expect(toDateKey("2026-10-14")).toBe("2026-10-14");
    expect(toDateKey(new Date("2026-10-14T23:30:00.000Z"))).toBe("2026-10-14");
  });

  it("counts nights between dates", () => {
    expect(nightsBetween("2026-10-14", "2026-10-18")).toBe(4);
    expect(nightsBetween("2026-10-14", "2026-10-14")).toBe(0);
    expect(nightsBetween("bad", "worse")).toBe(0);
  });
});

describe("classifyTrip", () => {
  it.each([
    ["CANCELLED", "cancelled"],
    ["EXPIRED", "cancelled"],
    ["COMPLETED", "past"],
    ["CHECKED_IN", "in_progress"],
  ])("maps %s to %s regardless of dates", (status, expected) => {
    expect(classifyTrip(status, "2026-10-14", "2026-10-18", TODAY)).toBe(expected);
  });

  it("uses dates for confirmed bookings", () => {
    expect(classifyTrip("CONFIRMED", "2026-10-14", "2026-10-18", TODAY)).toBe(
      "upcoming",
    );
    expect(classifyTrip("CONFIRMED", "2026-09-01", "2026-09-05", TODAY)).toBe("past");
    expect(classifyTrip("CONFIRMED", "2026-09-28", "2026-10-03", TODAY)).toBe(
      "in_progress",
    );
  });
});

describe("buildTrips", () => {
  it("attaches an experience that falls inside the stay window", () => {
    const { upcoming } = buildTrips([stayRow(), expRow()], resolvers, TODAY);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].title).toBe("Goa");
    expect(upcoming[0].subtitle).toBe("Casa Earthy");
    expect(upcoming[0].stay?.nights).toBe(4);
    expect(upcoming[0].experiences.map((e) => e.name)).toEqual([
      "Spice Plantation Walk",
    ]);
  });

  it("keeps an out-of-window experience as its own trip", () => {
    const away = expRow({ id: "bk_far", experienceDate: "2026-12-02T09:00:00.000Z" });
    const { upcoming } = buildTrips([stayRow(), away], resolvers, TODAY);
    expect(upcoming).toHaveLength(2);
    const standalone = upcoming.find((t) => t.id === "bk_far");
    expect(standalone?.stay).toBeNull();
    expect(standalone?.title).toBe("Spice Plantation Walk");
  });

  it("never attaches one experience to two stays", () => {
    const second = stayRow({ id: "bk_stay2", bookingNumber: "ES-2" });
    const { upcoming } = buildTrips([stayRow(), second, expRow()], resolvers, TODAY);
    const totalAttached = upcoming.reduce((n, t) => n + t.experiences.length, 0);
    expect(totalAttached).toBe(1);
  });

  it("buckets and sorts: upcoming ascending, past descending", () => {
    const rows = [
      stayRow({ id: "a", checkIn: "2026-11-10", checkOut: "2026-11-12" }),
      stayRow({ id: "b", checkIn: "2026-10-14", checkOut: "2026-10-18" }),
      stayRow({
        id: "c",
        checkIn: "2026-08-01",
        checkOut: "2026-08-04",
        bookingStatus: "COMPLETED",
      }),
      stayRow({
        id: "d",
        checkIn: "2026-09-01",
        checkOut: "2026-09-04",
        bookingStatus: "COMPLETED",
      }),
      stayRow({ id: "e", bookingStatus: "CANCELLED" }),
    ];
    const { upcoming, past, cancelled } = buildTrips(rows, resolvers, TODAY);
    expect(upcoming.map((t) => t.id)).toEqual(["b", "a"]);
    expect(past.map((t) => t.id)).toEqual(["d", "c"]);
    expect(cancelled.map((t) => t.id)).toEqual(["e"]);
  });

  it("falls back to the slug when a property is delisted", () => {
    const { upcoming } = buildTrips(
      [stayRow({ propertyId: "gone-away" })],
      resolvers,
      TODAY,
    );
    expect(upcoming[0].stay?.propertyName).toBe("gone-away");
    expect(upcoming[0].stay?.propertyHref).toBeNull();
  });

  it("drops rows missing the dates their kind requires", () => {
    const broken = stayRow({ id: "bad", checkIn: null, checkOut: null });
    const { upcoming, past, cancelled } = buildTrips([broken], resolvers, TODAY);
    expect([...upcoming, ...past, ...cancelled]).toHaveLength(0);
  });
});

describe("buildTimeline", () => {
  it("lays arrival, experiences, free days and checkout across the stay", () => {
    const { upcoming } = buildTrips([stayRow(), expRow()], resolvers, TODAY);
    const timeline = upcoming[0].timeline;

    expect(timeline.map((t) => `${t.date} ${t.kind}`)).toEqual([
      "2026-10-14 arrival",
      "2026-10-15 experience",
      "2026-10-16 free",
      "2026-10-17 free",
      "2026-10-18 checkout",
    ]);
  });

  it("returns a bare experience list when there is no stay", () => {
    const timeline = buildTimeline(null, [
      {
        bookingId: "x",
        bookingNumber: "ES-3",
        slug: "spice-walk",
        name: "Spice Plantation Walk",
        href: "/experiences/goa/spice-walk",
        image: null,
        date: "2026-12-02T09:00:00.000Z",
        guestsCount: 2,
        bookingStatus: "CONFIRMED",
      },
    ]);
    expect(timeline).toEqual([
      {
        date: "2026-12-02",
        kind: "experience",
        label: "Spice Plantation Walk",
        href: "/experiences/goa/spice-walk",
      },
    ]);
  });
});
