import nodemailer from "nodemailer";

const hasSmtpConfig = Boolean(process.env.EMAIL_SERVER_HOST);

function getTransport() {
  if (!hasSmtpConfig) return null;
  const port = Number(process.env.EMAIL_SERVER_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port,
    secure: port === 465,
    auth: process.env.EMAIL_SERVER_USER
      ? {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        }
      : undefined,
  });
}

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  const transport = getTransport();

  if (!transport) {
    console.log("\n========== EMAIL (dev mode, no SMTP configured) ==========");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(options.html.replace(/<[^>]+>/g, " "));
    console.log("============================================================\n");
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? "MySpace Reborn <no-reply@myspace.local>",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

function emailLayout(options: { preheader: string; heading: string; body: string; cta: { label: string; url: string }; footnote: string }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${options.preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#13121c;border-radius:16px;overflow:hidden;border:1px solid #2a2836;">
            <tr>
              <td style="background:linear-gradient(135deg,#a78bfa,#f472b6);padding:28px 32px;">
                <span style="font-size:22px;font-weight:800;color:#0a0a0f;letter-spacing:-0.02em;">MySpace Reborn</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#f5f5f7;font-weight:700;">${options.heading}</h1>
                <div style="font-size:15px;line-height:1.6;color:#b8b6c4;">${options.body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 36px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px;background:linear-gradient(135deg,#a78bfa,#f472b6);">
                      <a href="${options.cta.url}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#0a0a0f;text-decoration:none;">${options.cta.label}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#6f6c80;word-break:break-all;">
                  Button not working? Paste this into your browser:<br />
                  <a href="${options.cta.url}" style="color:#c4b5fd;text-decoration:underline;">${options.cta.url}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #2a2836;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6f6c80;">${options.footnote}</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#4d4a5c;">MySpace Reborn &middot; You're receiving this because someone used this email address on our site.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to,
    subject: "Verify your MySpace Reborn account",
    html: emailLayout({
      preheader: "Confirm your email to finish setting up your page.",
      heading: "Welcome! Let's verify your email",
      body: "Click the button below to confirm it's really you and activate your account. This unlocks logging in, posting, and connecting with friends.",
      cta: { label: "Verify email", url },
      footnote: "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
    }),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${process.env.APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to,
    subject: "Reset your MySpace Reborn password",
    html: emailLayout({
      preheader: "Reset your password to get back into your account.",
      heading: "Reset your password",
      body: "We received a request to reset your password. Click the button below to choose a new one.",
      cta: { label: "Choose a new password", url },
      footnote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.",
    }),
  });
}
