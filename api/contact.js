// Contact form endpoint: validates the enquiry and emails it through Resend.
// Needs RESEND_API_KEY in the Vercel project env. CONTACT_TO and CONTACT_FROM are optional.
// Until a domain is verified in Resend, the default sender can only deliver to the Resend account's own address.

const TO = process.env.CONTACT_TO || 'ufukkyavuz51@gmail.com';
const FROM = process.env.CONTACT_FROM || 'joke studio site <onboarding@resend.dev>';

const LIMITS = { name: 120, brand: 120, email: 200, need: 2000, budget: 60, website: 200 };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'bad_request' });

  const f = {};
  for (const k of Object.keys(LIMITS)) f[k] = clean(body[k], LIMITS[k]);
  if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    return res.status(400).json({ ok: false, error: 'invalid_fields' });
  }

  const rows = [['Name', f.name], ['Brand', f.brand], ['Email', f.email], ['Need', f.need], ['Budget', f.budget], ['Website / Instagram', f.website]]
    .filter(([, v]) => v);
  const html = '<table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif">' +
    rows.map(([k, v]) => `<tr><td style="border-bottom:1px solid #ddd"><b>${esc(k)}</b></td><td style="border-bottom:1px solid #ddd">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('') +
    '</table>';
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  // Header values must not carry line breaks.
  const subjectName = (f.brand || f.name).replace(/[\r\n]+/g, ' ');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: f.email,
        subject: `New project enquiry: ${subjectName}`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.error('resend_error', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('resend_exception', e && e.name);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
};
