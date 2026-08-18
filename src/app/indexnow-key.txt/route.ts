/**
 * IndexNow key verification file, served at /indexnow-key.txt. IndexNow
 * (and search engines that support the protocol) fetch this to confirm
 * whoever is pinging api.indexnow.org actually controls this domain.
 * See lib/indexnow.ts for the ping side.
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(key, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
