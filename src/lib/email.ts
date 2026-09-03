import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();
const apiKey = env.RESEND_API_KEY;
const from = env.EMAIL_FROM;
const appUrl = env.NEXT_PUBLIC_APP_URL;

export type EmailKind = "signup" | "reset" | "email";

function layout(title: string, bodyHtml: string, code: string, kind: EmailKind): string {
  const isReset = kind === "reset";
  return `
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#09090b;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:0.02em;">RuangMekanik</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#18181b;">${title}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">${bodyHtml}</p>
          <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Kode Verifikasi Anda</p>
            <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:0.3em;color:#09090b;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</p>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
            Kode ini berlaku 15 menit dan hanya dapat digunakan sekali. Jangan bagikan kode ini kepada siapa pun.
            ${isReset ? "Reset password dilakukan atas permintaan anda." : "Jika anda tidak meminta perubahan ini, abaikan email ini."}
          </p>
        </td></tr>
        <tr>
          <td style="border-top:1px solid #e4e4e7;padding:16px 32px;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">© 2026 RuangMekanik · Repositori Teknis &amp; Forum Diagnosa. · ${appUrl}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>`;
}

export function buildSignupEmail(code: string): { subject: string; html: string } {
  return {
    subject: "Verifikasi Email — RuangMekanik",
    html: layout(
      "Verifikasi akun Anda",
      "Terima kasih telah mendaftar di RuangMekanik. Gunakan kode di bawah untuk mengaktifkan akun dan mulai berkontribusi di komunitas.",
      code,
      "signup"
    ),
  };
}

export function buildResetEmail(code: string): { subject: string; html: string } {
  return {
    subject: "Kode Reset Kata Sandi — RuangMekanik",
    html: layout(
      "Atur ulang kata sandi Anda",
      "Kami menerima permintaan untuk mengatur ulang kata sandi akun RuangMekanik Anda. Masukkan kode di bawah untuk melanjutkan.",
      code,
      "reset"
    ),
  };
}

export function buildEmailChangeEmail(code: string): { subject: string; html: string } {
  return {
    subject: "Verifikasi Email Baru — RuangMekanik",
    html: layout(
      "Konfirmasi perubahan email",
      "Anda meminta untuk mengubah alamat email akun RuangMekanik. Masukkan kode di bawah untuk mengonfirmasi alamat email baru Anda.",
      code,
      "email"
    ),
  };
}

async function dispatch(to: string, subject: string, html: string): Promise<boolean> {
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) {
        console.error("Resend error:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to send via Resend:", error);
      return false;
    }
  }
  // Development fallback: print the code to the server log so flows can be tested.
  console.log(
    `\n[email:dev] To: ${to} | Subject: ${subject}\n--- EMAIL BODY (HTML strip) ---\n` +
      html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() +
      `\n--- end email ---\n`
  );
  return true;
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  kind: EmailKind
): Promise<boolean> {
  const builder =
    kind === "signup"
      ? buildSignupEmail
      : kind === "reset"
        ? buildResetEmail
        : buildEmailChangeEmail;
  const { subject, html } = builder(code);
  return dispatch(to, subject, html);
}
