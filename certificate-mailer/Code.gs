/**
 * Techquity Sorting Algorithms certificate sender.
 * Deploy as a web app, executing as the deploying school account.
 * This is a classroom completion certificate for a browser-scored test.
 */
const SETTINGS = {
  schoolDomain: 'burnside.school.nz', // Also accepts subdomains, e.g. student.burnside.school.nz.
  dailyLimit: 80,
  perAddressLimit: 2,
  timezone: 'Pacific/Auckland'
};

function doGet() {
  return resultPage_('Certificate mailer ready', 'To request a certificate, finish the Sorting Algorithms test and use its email button.');
}

function doPost(e) {
  const fields = e && e.parameter || {};
  const email = String(fields.email || '').trim().toLowerCase();
  const name = String(fields.studentName || '').trim().replace(/\s+/g, ' ');
  const sort = scorePart_(fields.sortingScore);
  const knowledge = scorePart_(fields.knowledgeScore);
  const domain = email.split('@')[1];
  if (email.length > 254 || !/^[a-z0-9][a-z0-9._+-]*@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email) ||
      !(domain === SETTINGS.schoolDomain || domain.endsWith('.' + SETTINGS.schoolDomain))) {
    return resultPage_('Check your email address', 'Enter your school email address (' + SETTINGS.schoolDomain + '). No email was sent.');
  }
  if (sort === null || knowledge === null || name.length > 100) {
    return resultPage_('Result not recognised', 'Return to the completed test and try again. No email was sent.');
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(12000)) {
    return resultPage_('Please try again', 'The mailer is busy. Wait a moment and try again from your result page.');
  }
  try {
    const props = PropertiesService.getScriptProperties();
    const day = Utilities.formatDate(new Date(), SETTINGS.timezone, 'yyyy-MM-dd');
    const addrKey = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email)).slice(0,24);
    const saved = JSON.parse(props.getProperty('certificateLimits') || 'null');
    const limits = saved && saved.day === day ? saved : {day:day,total:0,addresses:{}};
    const count = limits.addresses[addrKey] || 0;
    if (count >= SETTINGS.perAddressLimit) {
      return resultPage_('Daily address limit reached', 'Check your inbox or save the certificate from your test result page.');
    }
    if (limits.total >= SETTINGS.dailyLimit || MailApp.getRemainingDailyQuota() < 1) {
      return resultPage_('Daily sending limit reached', 'You can still print or save your certificate from the test result page.');
    }
    const score = sort + knowledge;
    const date = Utilities.formatDate(new Date(), SETTINGS.timezone, 'd MMMM yyyy');
    const attachment = Utilities.newBlob(certificateHtml_(name, score, sort, knowledge, date), 'text/html', 'sorting-certificate.html')
      .getAs(MimeType.PDF).setName('Sorting-Algorithms-Certificate.pdf');
    // Reserve the send before contacting MailApp so concurrent requests respect the limits.
    limits.total++;
    limits.addresses[addrKey] = count + 1;
    props.setProperty('certificateLimits', JSON.stringify(limits));
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Your Sorting Algorithms certificate',
        name: 'Techquity Computer Science',
        body: 'You completed the Sorting Algorithms test and scored ' + score + '/20 (' + score*5 + '%).\n\n' +
          'Sorting challenges: ' + sort + '/10\nKnowledge questions: ' + knowledge + '/10\n\nYour certificate is attached.',
        attachments: [attachment]
      });
    } catch (err) {
      limits.total--;
      if (count) limits.addresses[addrKey] = count; else delete limits.addresses[addrKey];
      props.setProperty('certificateLimits', JSON.stringify(limits));
      return resultPage_('Certificate could not be sent', 'Try again later or save the certificate from your test result page.');
    }
    return resultPage_('Certificate sent', 'Check your school inbox for your certificate. Your score was ' + score + '/20.');
  } catch (err) {
    return resultPage_('Certificate could not be sent', 'Try again later or save the certificate from your test result page.');
  } finally {
    lock.releaseLock();
  }
}

function scorePart_(value) {
  const text = String(value == null ? '' : value);
  return /^(?:[0-9]|10)$/.test(text) ? Number(text) : null;
}

function escape_(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function certificateHtml_(name, score, sort, knowledge, date) {
  return '<!doctype html><html lang="en-NZ"><meta charset="utf-8"><body style="font:18px Arial,sans-serif;color:#262331;padding:42px">' +
    '<main style="border:6px double #651394;text-align:center;padding:42px">' +
    '<p style="font-size:14px;font-weight:bold;letter-spacing:1px;color:#651394">TECHQUITY / COMPUTER SCIENCE</p>' +
    '<h1 style="color:#651394">Certificate of Completion</h1>' +
    (name ? '<p>Awarded to <strong>' + escape_(name) + '</strong></p>' : '') +
    '<p>Completed the 20-question Sorting Algorithms Test.</p>' +
    '<p style="font-size:36px;font-weight:bold;color:#651394">' + score + '/20 (' + score*5 + '%)</p>' +
    '<p>Sorting challenges: ' + sort + '/10<br>Knowledge questions: ' + knowledge + '/10</p>' +
    '<p>' + escape_(date) + '</p></main></body></html>';
}

function resultPage_(title, message) {
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en-NZ"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="max-width:36em;margin:3em auto;padding:0 1em;font:1rem/1.5 Arial,sans-serif;color:#262331">' +
    '<h1 style="color:#651394">' + escape_(title) + '</h1><p>' + escape_(message) + '</p>' +
    '<p>You can close this tab and return to your test.</p></body></html>').setTitle(title);
}
