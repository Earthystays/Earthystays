const SITE_HOST = "earthystays.com";

/**
 * Pings IndexNow (picked up by Bing, and increasingly by other engines)
 * whenever a villa page is created or changes, so it gets recrawled within
 * minutes instead of waiting for the next scheduled sitemap crawl.
 *
 * No-ops when INDEXNOW_KEY isn't set. Never throws — a failed ping must
 * never block the admin action that triggered it.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key,
        keyLocation: `https://${SITE_HOST}/indexnow-key.txt`,
        urlList: urls,
      }),
    });
    if (!res.ok) {
      console.error("[indexnow] ping rejected", res.status, await res.text());
    }
  } catch (err) {
    console.error("[indexnow] ping failed", err);
  }
}
