# Mailchimp mailing-list setup

The "Subscribe" forms on the home and contact pages post directly into Pip's
Mailchimp audience. There's **no server and no API key** — so it works on any
free static host (GitHub Pages, Cloudflare Pages, Netlify free tier).

To switch it on, fill in **three values** in one place: the `MAILCHIMP` object
near the top of `script.js`.

## Where to get the three values

1. Log in to Pip's Mailchimp account.
2. Go to **Audience → Signup forms → Embedded forms** (pick "Condensed" or any).
3. In the generated code, find the form tag: `<form action="https://...">`.
   The URL looks like:

   ```
   https://pipraine.us21.list-manage.com/subscribe/post?u=abc123def456&id=7890xyz
                    ^^^^                                   ^^^^^^^^^^^^     ^^^^^^^
                    server                                u                id
   ```

4. Copy those three pieces into `script.js`:

   ```js
   const MAILCHIMP = {
     server: 'us21',          // the bit before ".list-manage.com"
     u:      'abc123def456',  // the u= value
     id:     '7890xyz',       // the id= value
   };
   ```

Save, reload the site, and a real signup should appear as a contact in
**Audience → All contacts** within a few seconds.

## Notes

- If the audience has **double opt-in** enabled (Mailchimp default), the
  contact is added as "pending" until they click the confirmation email. Turn
  that off in Audience settings if you want instant single opt-in.
- Until the three values are filled in, the form shows a friendly
  "Signup isn't connected yet" message instead of erroring.
- The form also sends a **first name** as `FNAME` (Mailchimp's default
  first-name field), so emails can use the `*|FNAME|*` merge tag.
- If **reCAPTCHA** is enabled on the audience's form settings, Mailchimp refuses
  the in-page signup with `msg: "captcha"`. The form then sends the visitor to
  Mailchimp's hosted page to tick the captcha. Turning reCAPTCHA off (and using
  double opt-in instead) keeps visitors on the site.
- The separate "Send a note" contact form on `contact.html` is **not** wired to
  anything yet — that's a message/enquiry form, not a mailing-list signup.
