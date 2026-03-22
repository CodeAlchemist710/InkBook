export function getWhatsAppLink(phone: string, message?: string): string {
  // Clean phone: keep digits and leading +
  const cleaned = phone.replace(/(?!^\+)\D/g, "").replace(/^\+/, "");
  const base = `https://wa.me/${cleaned}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export function getBookingWhatsAppLink(params: {
  phone: string;
  artistName: string;
  studioName: string;
  date?: string;
  time?: string;
}): string {
  let message = `Hi ${params.artistName}! I found you on ${params.studioName} on InkBook and I'm interested in booking a tattoo session.`;

  if (params.date) {
    message += ` I'd like to book on ${params.date}`;
    if (params.time) {
      message += ` at ${params.time}`;
    }
    message += ".";
  }

  return getWhatsAppLink(params.phone, message);
}
