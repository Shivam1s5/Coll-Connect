const { Resend } = require('resend');

// Initialize Resend with the provided API key
const resend = new Resend('re_6CwZ74pW_C5VLhevmKPEsgV4anzxftPcY');

/**
 * Sends an email using Resend HTTP API.
 * This completely bypasses Render's SMTP port blocks since it uses port 443 (HTTP).
 */
const sendEmail = async (to, subject, html) => {
  if (!to) {
    console.error('[Mailer] No recipient email provided');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Coll-Connect <onboarding@resend.dev>', // Resend free tier allows sending from onboarding@resend.dev
      to: [to],
      subject,
      html
    });

    if (error) {
      console.error(`[Mailer] FAILED to send email to ${to} via Resend:`, error);
      return false;
    }

    console.log(`[Mailer] Email sent to ${to} | Resend ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`[Mailer] FAILED to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = { sendEmail };
