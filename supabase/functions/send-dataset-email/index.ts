import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'CTUIL Intelligence <onboarding@resend.dev>';

const BodySchema = z.object({
  recipient: z.string().email(),
  includeDataset: z.boolean().default(true),
  includeToday: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  filters: z.record(z.string()).default({}),
  freshness: z.string().max(500).default(''),
  summary: z
    .object({
      totalRecords: z.number(),
      totalConnectivityMw: z.number(),
      regions: z.number(),
      applicants: z.number(),
    })
    .optional(),
  datasetCsv: z.string().max(6_000_000).optional(),
  todayCsv: z.string().max(2_000_000).optional(),
  chartImages: z
    .array(z.object({ name: z.string().max(80), dataUrl: z.string().max(4_000_000) }))
    .max(4)
    .default([]),
});

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);

function b64(text: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;
  const messageId = `ctuil-share-${crypto.randomUUID()}`;

  await db.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'ctuil-dataset-share',
    recipient_email: b.recipient,
    status: 'pending',
    metadata: { filters: b.filters, includeDataset: b.includeDataset, includeToday: b.includeToday },
  });

  const fail = async (msg: string, status = 500) => {
    await db.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'ctuil-dataset-share',
      recipient_email: b.recipient,
      status: 'failed',
      error_message: msg,
    });
    return json({ error: msg }, status);
  };

  if (!RESEND_API_KEY) {
    return await fail('Email sending is not configured yet — a verified sender domain and email API key are required.', 503);
  }

  const generatedAt = new Date().toISOString();
  const filterText = Object.entries(b.filters).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'none';
  const s = b.summary;

  const attachments: { filename: string; content: string }[] = [];
  if (b.includeDataset && b.datasetCsv) {
    attachments.push({ filename: `ctuil-dataset-${generatedAt.slice(0, 10)}.csv`, content: b64(b.datasetCsv) });
  }
  if (b.includeToday && b.todayCsv) {
    attachments.push({ filename: `ctuil-applications-today-${generatedAt.slice(0, 10)}.csv`, content: b64(b.todayCsv) });
  }
  if (b.includeCharts) {
    for (const img of b.chartImages) {
      const base = img.dataUrl.split(',')[1];
      if (base) attachments.push({ filename: `${img.name}.png`, content: base });
    }
  }

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#f5f7fa;padding:28px">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#0b1c33;padding:26px 28px">
        <div style="color:#ffffff;font-size:19px;font-weight:700">CTUIL GNA &amp; Connectivity Intelligence</div>
        <div style="color:#7fd8d0;font-size:13px;margin-top:6px">Dataset export from live CTUIL published records</div>
      </div>
      <div style="padding:26px 28px;color:#1e293b;font-size:14px;line-height:1.6">
        <p style="margin:0 0 16px">Here is the CTUIL dataset you requested from the analytics console.</p>
        ${s ? `<table style="width:100%;border-collapse:collapse;margin:0 0 18px;font-size:13px">
          <tr><td style="padding:7px 0;color:#64748b">Records in export</td><td style="text-align:right;font-weight:600">${s.totalRecords.toLocaleString()}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b">Total connectivity / GNA (MW)</td><td style="text-align:right;font-weight:600">${Math.round(s.totalConnectivityMw).toLocaleString()}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b">Regions covered</td><td style="text-align:right;font-weight:600">${s.regions}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b">Distinct applicants</td><td style="text-align:right;font-weight:600">${s.applicants}</td></tr>
        </table>` : ''}
        <div style="background:#f1f5f9;border-radius:10px;padding:14px 16px;font-size:12px;color:#475569">
          <div><strong>Generated:</strong> ${generatedAt}</div>
          <div><strong>Active filters:</strong> ${esc(filterText)}</div>
          <div><strong>Data freshness:</strong> ${esc(b.freshness || 'see console')}</div>
          <div><strong>Attachments:</strong> ${attachments.length ? attachments.map((a) => esc(a.filename)).join(', ') : 'none'}</div>
        </div>
        <p style="margin:18px 0 0;font-size:12px;color:#64748b">
          Source: CTUIL published Connectivity Effective List and monthly Connectivity Granted reports.
          Verify independently before regulatory or commercial use.
        </p>
      </div>
    </div>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [b.recipient],
        subject: `CTUIL GNA & Connectivity dataset — ${generatedAt.slice(0, 10)}`,
        html,
        attachments,
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return await fail(out?.message ?? `Email provider returned HTTP ${res.status}`, 502);

    await db.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'ctuil-dataset-share',
      recipient_email: b.recipient,
      status: 'sent',
      metadata: { provider_id: out?.id ?? null, attachments: attachments.map((a) => a.filename) },
    });
    return json({ ok: true, id: out?.id ?? null, attachments: attachments.length });
  } catch (e) {
    return await fail((e as Error).message);
  }
});
