const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'coder.st.15@gmail.com';
const ADMIN_APP_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'nimscdzabzpvzvki';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: ADMIN_EMAIL,
    pass: ADMIN_APP_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  if (!ADMIN_EMAIL || !ADMIN_APP_PASSWORD) {
    console.log('Email configuration missing, skipping email to', to);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"Coll-Connect" <${ADMIN_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log('Email sent successfully to', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
