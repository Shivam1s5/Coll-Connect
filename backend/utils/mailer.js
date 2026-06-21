const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_APP_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_APP_PASSWORD) {
    console.log('Email configuration missing, skipping email to', to);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"Coll-Connect" <${process.env.ADMIN_EMAIL}>`,
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
