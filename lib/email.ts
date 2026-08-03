import "server-only";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      })
    : null;

// Emails are best-effort: a failed send should never fail the booking,
// payment, or auth action that triggered it. Errors are logged, not thrown.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.warn(`[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipped "${subject}" to ${to}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `RentalCars <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

const INK = "#12151b";
const AMBER = "#e8a33d";
const PAPER = "#f7f7f5";
const MUTED = "#6b7280";
const BORDER = "#e5e5e0";

export function emailLayout({
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:${PAPER};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:28px 32px;border-bottom:1px solid ${BORDER};">
          <span style="font-size:18px;font-weight:700;">Rental<span style="color:${AMBER};">Cars</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">${heading}</h1>
          <div style="font-size:14px;line-height:1.6;color:${INK};">${body}</div>
          ${
            ctaLabel && ctaUrl
              ? `<div style="margin-top:28px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">${ctaLabel}</a>
                 </div>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED};">
          RentalCars &middot; This is an automated message.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
