# WhatsApp inquiry notifications

Every guest inquiry can ping the admin on WhatsApp the moment it lands.
Uses CallMeBot — a free service designed for server-to-admin WhatsApp
notifications. No Meta business verification, no template approval.

## One-time setup (5 minutes)

### 1. Tell CallMeBot to allow messages to your phone

On the phone that should receive the alerts:

1. Save **+34 644 84 71 84** as a contact (name it `CallMeBot` so you
   recognise replies). This is CallMeBot's bot number.
2. Open WhatsApp → start a chat with that contact.
3. Send the exact message:

   ```
   I allow callmebot to send me messages
   ```

4. Within ~30 seconds the bot replies with your personal API key. Looks
   like `1234567`.

If it doesn't reply, wait a couple of minutes and try once more.

### 2. Add two env vars on the VPS

```
WHATSAPP_NOTIFY_PHONE=919657100004
WHATSAPP_NOTIFY_APIKEY=1234567
```

- `WHATSAPP_NOTIFY_PHONE` — country code + number, **no plus, no spaces**.
  For +91 96571 00004 → `919657100004`.
- `WHATSAPP_NOTIFY_APIKEY` — the key CallMeBot DM'd you.

#### How to set them on the VPS

```
ssh root@187.127.177.237
cd /var/www/earthystays
nano .env.local
```

Add the two lines at the end. Save (Ctrl+O, Enter, Ctrl+X).

Restart so PM2 picks up the env:

```
pm2 restart earthystays --update-env
```

### 3. Test it

On your phone, fill in the Send Inquiry form on a villa page and
submit. Within a few seconds, a message lands on the admin WhatsApp:

```
🔔 Booking inquiry — Earthy Stays

Name: Test Guest
Phone: +91 90000 00001
Villa: Casa Azul
Dates: 2026-06-12 → 2026-06-15
Guests: 2A + 1C
Rooms: 1

Open: https://earthystays.com/admin/inquiries
```

If nothing arrives, check `pm2 logs earthystays` — the line
`[inquiry] callmebot returned …` shows what failed.

## What gets sent

Every inquiry kind triggers a message: booking inquiry, partner inquiry,
callback request, and experience inquiry. The body includes name, phone,
email, villa, dates, guest count, rooms, message, and a direct link to
`/admin/inquiries`.

## Caveats

- CallMeBot is free but has a soft rate limit. For the volume of an
  early-stage rental site, you'll never hit it.
- Only the **one** phone number that ran step 1 will receive alerts. To
  add a second team member, that member repeats step 1 and you stash
  their key separately — we'd need a small code tweak to fan out to
  multiple numbers.
- If CallMeBot is ever down, the inquiry is still saved to
  `data/inquiries.json` and shows in the admin inbox — only the
  WhatsApp ping is missed. Site doesn't break.

## Switching to Meta Cloud API later

If/when you want the official, scalable channel (custom sender number,
templated outbound to customers etc.), the swap is small:

1. Set up Meta Business + WhatsApp Cloud API (1 afternoon).
2. Replace the CallMeBot fetch in `src/lib/whatsapp-notifier.ts` with a
   POST to `https://graph.facebook.com/v18.0/{PHONE_ID}/messages` using
   your access token + an approved template.

Same call site, same env-var-gate pattern, no other code changes needed.
