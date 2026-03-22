import { Resend } from "resend";

const FROM_ADDRESS = "InkBook Bookings <onboarding@resend.dev>";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[InkBook] RESEND_API_KEY not set — skipping email");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendBookingConfirmationToClient(params: {
  clientEmail: string;
  clientName: string;
  artistName: string;
  studioName: string;
  studioAddress: string | null;
  date: string;
  startTime: string;
  endTime: string;
  whatsAppLink: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.clientEmail,
      subject: `Booking Request — ${params.studioName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${params.clientName},</h2>
          <p>Your booking request has been received!</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Artist:</strong> ${params.artistName}</p>
            <p><strong>Studio:</strong> ${params.studioName}</p>
            ${params.studioAddress ? `<p><strong>Address:</strong> ${params.studioAddress}</p>` : ""}
            <p><strong>Date:</strong> ${params.date}</p>
            <p><strong>Time:</strong> ${params.startTime} — ${params.endTime}</p>
          </div>
          <p>The artist will review and confirm your booking shortly.</p>
          ${
            params.whatsAppLink
              ? `<p><a href="${params.whatsAppLink}" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Message ${params.artistName} on WhatsApp</a></p>`
              : ""
          }
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Powered by InkBook</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[InkBook] Failed to send client confirmation email:", error);
  }
}

export async function sendBookingNotificationToArtist(params: {
  ownerEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  artistName: string;
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string | null;
  placement: string | null;
  estimatedSize: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.ownerEmail,
      subject: `New Booking Request — ${params.clientName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New booking request for ${params.artistName}</h2>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Client:</strong> ${params.clientName}</p>
            <p><strong>Email:</strong> ${params.clientEmail}</p>
            <p><strong>Phone:</strong> ${params.clientPhone}</p>
            <p><strong>Date:</strong> ${params.date}</p>
            <p><strong>Time:</strong> ${params.startTime} — ${params.endTime}</p>
            ${params.description ? `<p><strong>Description:</strong> ${params.description}</p>` : ""}
            ${params.placement ? `<p><strong>Placement:</strong> ${params.placement}</p>` : ""}
            ${params.estimatedSize ? `<p><strong>Size:</strong> ${params.estimatedSize}</p>` : ""}
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/bookings" style="display: inline-block; background: #000; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Dashboard</a></p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Powered by InkBook</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[InkBook] Failed to send artist notification email:", error);
  }
}

export async function sendBookingStatusEmail(params: {
  clientEmail: string;
  clientName: string;
  artistName: string;
  studioName: string;
  studioAddress: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
  reason?: string | null;
  whatsAppLink: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const isConfirmed = params.status === "confirmed";
  const subject = isConfirmed
    ? `Booking Confirmed — ${params.studioName}`
    : `Booking Cancelled — ${params.studioName}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.clientEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${params.clientName},</h2>
          <p>${
            isConfirmed
              ? `Your booking with ${params.artistName} has been <strong>confirmed</strong>!`
              : `Your booking with ${params.artistName} has been <strong>cancelled</strong>.`
          }</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Artist:</strong> ${params.artistName}</p>
            <p><strong>Studio:</strong> ${params.studioName}</p>
            ${params.studioAddress ? `<p><strong>Address:</strong> ${params.studioAddress}</p>` : ""}
            <p><strong>Date:</strong> ${params.date}</p>
            <p><strong>Time:</strong> ${params.startTime} — ${params.endTime}</p>
            ${!isConfirmed && params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ""}
          </div>
          ${
            isConfirmed && params.whatsAppLink
              ? `<p><a href="${params.whatsAppLink}" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Message ${params.artistName} on WhatsApp</a></p>`
              : ""
          }
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Powered by InkBook</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[InkBook] Failed to send booking status email:", error);
  }
}
