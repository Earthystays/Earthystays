/**
 * Sanity schema definitions. Not wired up to next-sanity yet — when you're
 * ready to switch from mock data to live CMS:
 *
 *   1. Create a free Sanity project at https://sanity.io/manage
 *   2. cd /Users/apple/villa-site && npx sanity@latest init --bare
 *   3. Add @sanity/types, next-sanity, @sanity/image-url, sanity, @sanity/vision
 *   4. Mount Studio at /studio (see https://www.sanity.io/docs/sanity-with-nextjs)
 *   5. Replace src/lib/data/* helpers with GROQ queries (sketch below)
 *
 * Sample GROQ:
 *   *[_type == "villa"]{
 *     slug, name, tagline, description,
 *     "destinationSlug": destination->slug.current,
 *     bedrooms, maxGuests, bathrooms, pricePerNight, rating, reviewCount,
 *     amenities, highlights, "images": images[]{ "src": asset->url, alt },
 *     houseRules, locationNote, featured
 *   }
 */

export const villaSchema = {
  name: "villa",
  title: "Villa",
  type: "document",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" }, validation: (r: { required: () => unknown }) => r.required() },
    { name: "tagline", type: "string" },
    { name: "description", type: "text" },
    { name: "destination", type: "reference", to: [{ type: "destination" }] },
    { name: "collections", type: "array", of: [{ type: "reference", to: [{ type: "collection" }] }] },
    { name: "bedrooms", type: "number" },
    { name: "bathrooms", type: "number" },
    { name: "maxGuests", type: "number" },
    { name: "pricePerNight", type: "number" },
    { name: "rating", type: "number" },
    { name: "reviewCount", type: "number" },
    { name: "amenities", type: "array", of: [{ type: "string" }] },
    { name: "highlights", type: "array", of: [{ type: "string" }] },
    { name: "houseRules", type: "array", of: [{ type: "string" }] },
    { name: "locationNote", type: "string" },
    { name: "featured", type: "boolean" },
    {
      name: "images",
      type: "array",
      of: [{ type: "image", fields: [{ name: "alt", type: "string" }] }],
    },
  ],
};

export const destinationSchema = {
  name: "destination",
  title: "Destination",
  type: "document",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" }, validation: (r: { required: () => unknown }) => r.required() },
    { name: "region", type: "string" },
    { name: "blurb", type: "text" },
    { name: "description", type: "text" },
    { name: "image", type: "image", fields: [{ name: "alt", type: "string" }] },
  ],
};

export const collectionSchema = {
  name: "collection",
  title: "Collection",
  type: "document",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" } },
    { name: "blurb", type: "text" },
    { name: "image", type: "image", fields: [{ name: "alt", type: "string" }] },
  ],
};

export const inquirySchema = {
  name: "inquiry",
  title: "Inquiry",
  type: "document",
  fields: [
    { name: "name", type: "string" },
    { name: "email", type: "string" },
    { name: "phone", type: "string" },
    { name: "checkIn", type: "date" },
    { name: "checkOut", type: "date" },
    { name: "guests", type: "number" },
    { name: "message", type: "text" },
    { name: "villa", type: "reference", to: [{ type: "villa" }] },
    { name: "createdAt", type: "datetime" },
  ],
};

export const schemaTypes = [villaSchema, destinationSchema, collectionSchema, inquirySchema];
