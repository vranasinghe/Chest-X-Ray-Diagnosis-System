import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@radiology-platform.com';

let transporter;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_PORT == 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn('SMTP credentials not fully configured in .env. Using mock email transporter.');
  transporter = {
    sendMail: async (options) => {
      console.log('--- [MOCK EMAIL SENT] ---');
      console.log(`From: ${options.from || SMTP_FROM}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text || options.html}`);
      if (options.attachments) {
        console.log(`Attachments: ${options.attachments.map(a => a.filename).join(', ')}`);
      }
      console.log('-------------------------');
      return { messageId: 'mock-email-id' };
    }
  };
}

export async function sendEmail({ to, subject, text, html, attachments }) {
  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
