# Beta sign-ups → Google Sheet → Google Play testers

The website's beta form saves each request as a row in your Google Sheet. You mark the people you want as
**Selected**, export their emails, and paste them into Google Play Console's tester list.

```
website form ──POST──▶ Apps Script web app (Code.gs, runs as you) ──▶ "Beta requests" tab
                                                                         │ you set Status = Selected
                                                                         ▼
                                          Sidekick beta menu → Export → paste into Play Console
```

About 15 minutes, once.

## 0. Make the sheet private first

The sheet will hold people's names and email addresses.

1. Open the sheet → **Share**.
2. Under **General access**, choose **Restricted** (not "Anyone with the link").
3. Remove anyone in the list who shouldn't see testers' details.

The web app doesn't need the sheet to be shared: it writes as you. "Anyone" in step 3 below means anyone
can *send* a request to the script, not that anyone can open the sheet.

## 1. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Delete what's in `Code.gs`, paste the whole of [`Code.gs`](./Code.gs) from this folder, and press **Save**.
3. Rename the project if you like (e.g. *Sidekick beta form*).

## 2. Set up the sheet

1. In the function list at the top of the editor, choose **`setUp`** and press **Run**.
2. Google asks you to authorise it. Choose your account. You'll see *"Google hasn't verified this app"* —
   that's normal for your own script: **Advanced → Go to Sidekick beta form (unsafe) → Allow**.
   The script only asks for access to **this one spreadsheet** (`@OnlyCurrentDoc`).
3. Back in the sheet, a **Beta requests** tab now exists with the column headers, a Status dropdown and
   date columns. Reload the sheet to see the **Sidekick beta** menu.

## 3. Publish it as a web app

1. In the Apps Script editor: **Deploy → New deployment**.
2. Click the gear next to *Select type* → **Web app**.
3. **Execute as: Me**. **Who has access: Anyone**.
4. **Deploy**, then copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`.

Optional: **Project Settings → Script properties → Add** `SITE_URL` = your website's address (e.g.
`https://sidekick.example`). Visitors without JavaScript then get a "Back to Sidekick" link after sending.

## 4. Connect the website

Paste the URL into `website/src/config/site.ts`:

```ts
const BETA_FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfy…/exec';
```

(or set `PUBLIC_BETA_FORM_ENDPOINT` in your host's environment instead), then rebuild:

```sh
cd website
npm run build && npm test && npm run test:form
```

The form appears on `/` and `/beta` only once a URL is set.

## 5. Try it once

Submit the form on your deployed site with your own details. Within a few seconds a row appears in
**Beta requests** with Status **New**. Delete that test row afterwards.

If the site says *"Your request didn't go through"*: check the URL ends in `/exec`, that the deployment is
**Anyone**, and open **Executions** in the Apps Script editor for the error.

## Day to day

| Column | Filled by | Meaning |
|---|---|---|
| Submitted at, Name, Google account email, Mac, Android phone, Android version, Country, Most wants Sidekick to, Consent | the form | What the person entered. Values that look like formulas are stored as text |
| **Status** | you | `New` → `Selected` → `Invited`, or `Not this round` |
| Added to Play | the menu | Date you added them to the Play tester list |
| Mac token issued | you | Date you sent their 45-day Mac token |
| Notes | you | Anything else |

The same email is stored only once; a second request from it is ignored.

To get an email when someone signs up: in the sheet, **Tools → Notification settings → Edit notifications →
Any changes are made → Email**.

## Adding selected testers on Google Play

1. In **Beta requests**, set **Status** to **Selected** for the people you want.
2. **Sidekick beta → Export "Selected" emails for Google Play.** A dialog shows the emails comma-separated,
   and the **Play testers export** tab lists them one per row.
3. In **Google Play Console** → your app → **Test and release → Testing** → choose **Internal testing** or
   **Closed testing** → **Testers** tab → create or edit an **email list** → paste the emails (or download
   the export tab as CSV with **File → Download → .csv** and upload it) → **Save**.
4. Copy the test's **opt-in link** ("Join on Android" / "Join on the web") and email it to them with the Mac
   app and their token. Each person must open it signed in with the **same Google account** they gave.
5. **Sidekick beta → Mark "Selected" as added to Play** — sets *Added to Play* to today and Status to
   *Invited*.

For a 3–5 person beta, **Internal testing** is usually the quickest track to set up. Check Play Console's
current limits and review times for whichever track you choose.

> **Before the first Play upload:** Sidekick's Android app requests SMS and Call Log permissions, which
> Google Play restricts (see `docs/permissions.md` in the app repository). Check Play Console's
> permissions declaration requirements for testing tracks before uploading, and use a signed build.

## Changing the script later

Editing `Code.gs` does **not** change the live web app until you publish a new version:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The URL stays the same.

## If the form is abused

The web-app URL is public (it's in the website's code). The script rejects malformed requests, ignores a
hidden honeypot field, caps every field's length, never returns sheet data, and stores each email once. If
spam still gets through: **Deploy → Manage deployments → Archive** the deployment, create a new one, and put
the new URL in the site.

## Checked so far

`npm test` runs `Code.gs` in Node against a stand-in for the Apps Script services (valid row, duplicate
email, honeypot, formula-looking values, invalid fields, no-JS reply, storage failure, export and marking).
`npm run test:form` sends the website's real form submission through `Code.gs` and checks the stored row.
Neither runs on Google's servers, so step 5 is still the real proof.
