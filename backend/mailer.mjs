import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const templatesDir = join(dirname(fileURLToPath(import.meta.url)), 'templates');

// SMTP settings come from hPanel environment variables only — never hardcoded.
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const LEAD_INBOX = process.env.LEAD_INBOX || 'info@kpicktradingcorp.com';

let transporter = null;
let autoresponderHtml = null;
let autoresponderText = null;

export function isMailerConfigured() {
    return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: 465,
            secure: true,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            // SMX-congestion discipline server-side too: fail fast, never hang a request.
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000
        });
    }
    return transporter;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

export async function sendMail({ to, subject, text, html, replyTo, attachments, fromName }) {
    await getTransporter().sendMail({
        from: `"${fromName || 'K-Pick Trading Corp'}" <${SMTP_USER}>`,
        to,
        replyTo: replyTo || undefined,
        subject,
        text,
        html: html || undefined,
        attachments: attachments && attachments.length ? attachments : undefined
    });
}

export async function sendLeadNotification({ subject, replyTo, lines }) {
    const text = lines.map(([label, value]) => `${label}: ${value}`).join('\n');
    const rows = lines
        .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#4B5468;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#10182B;">${escapeHtml(value)}</td></tr>`)
        .join('');
    await getTransporter().sendMail({
        from: `"K-Pick Website" <${SMTP_USER}>`,
        to: LEAD_INBOX,
        replyTo: replyTo || undefined,
        subject,
        text,
        html: `<table style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;border-collapse:collapse;">${rows}</table>`
    });
}

export async function sendAutoResponder({ to, name }) {
    if (autoresponderHtml === null) {
        autoresponderHtml = await readFile(join(templatesDir, 'autoresponder.html'), 'utf8');
        autoresponderText = await readFile(join(templatesDir, 'autoresponder.txt'), 'utf8');
    }
    const safeName = String(name || '').trim() || 'there';
    await getTransporter().sendMail({
        from: `"K-Pick Trading Corp" <${SMTP_USER}>`,
        to,
        replyTo: LEAD_INBOX,
        subject: 'Your K-Pick request is confirmed — PhilMedical Expo 2026',
        text: autoresponderText.replaceAll('{{name}}', safeName),
        html: autoresponderHtml.replaceAll('{{name}}', escapeHtml(safeName))
    });
}
