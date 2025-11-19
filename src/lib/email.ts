import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const from = process.env.RESEND_FROM || "no-reply@yourdomain.com";

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Resend Error:", error);
    return { success: false, error };
  }
}
