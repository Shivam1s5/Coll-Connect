const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'coder.st.15@gmail.com';
const ADMIN_APP_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'nimscdzabzpvzvki';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use implicit TLS
  auth: {
    user: ADMIN_EMAIL,
    pass: ADMIN_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, html) => {
  if (!ADMIN_EMAIL || !ADMIN_APP_PASSWORD) {
    console.log('Email configuration missing, skipping email to', to);
    return false;
  }
  
  try {
    await transporter.sendMail({
      from: `"Coll-Connect" <${ADMIN_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log('Email sent successfully to', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendEmail };
