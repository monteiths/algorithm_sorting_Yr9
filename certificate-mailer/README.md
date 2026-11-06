# Sorting Algorithms certificate email

The original 20-question test stays on GitHub Pages. The mail handler runs in a Google Apps Script web app owned by the school account that authorises it. The test asks for a school email only after completion and offers a printable result even when email is unavailable.

## One-time setup

1. Open [Google Apps Script](https://script.google.com/home) using the school Google account that should send certificates. Create a new project and replace the contents of `Code.gs` with the code in this folder.
2. In `SETTINGS.schoolDomain`, confirm the school’s student email domain. The default accepts addresses at `burnside.school.nz` and its subdomains. Set the actual student domain if it differs.
3. Choose **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then deploy and authorise mail sending. If the school’s Google Workspace policy does not offer **Anyone**, ask your administrator to approve a suitable deployment before enabling the button.
4. Copy the **Web app URL** ending in `/exec` into the root `certificate-mail-config.js` file. It is a public endpoint URL, not an API key or password.
5. After GitHub Pages publishes the change, complete a test and use your own school email to check delivery before assigning it. The send opens a new tab; the page confirms success only after Google accepts the mail request.

## Behaviour

- The email includes the score out of 20, percentage and both section scores, with a PDF certificate attached.
- The student name is optional. The mailer only sends to the configured school domain and subdomains, with a maximum of two certificates per address per day and 80 total sends per day (also subject to Google’s quota).
- Addresses are used for delivery. The mailer stores hashed addresses and counts for the most recent sending day, and replaces those counts on the next sending day. It does not store names or scores in a spreadsheet or database.
- The score comes from the browser, so this is a classroom completion certificate rather than verified assessment evidence.
- See [Google’s web app deployment guide](https://developers.google.com/apps-script/guides/web) for the deployment and authorisation options.
