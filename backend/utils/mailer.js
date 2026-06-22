const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'coder.st.15@gmail.com';
const ADMIN_APP_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'nimscdzabzpvzvki';

/**
 * Sends an email using Gmail SMTP via Nodemailer.
 * Important: This requires outbound SMTP ports (465/587) to be open.
 * Free tier hosting providers like Render and Vercel block these ports.
 */
const sendEmail = async (to, subject, html) => {
  if (!to) {
    console.error('[Mailer] No recipient email provided');
    return false;
  }

  try {
    // Create a fresh transporter each time to avoid stale socket issues
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: ADMIN_EMAIL,
        pass: ADMIN_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"Coll-Connect" <${ADMIN_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log(`[Mailer] Email sent to ${to} | MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Mailer] FAILED to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = { sendEmail };
