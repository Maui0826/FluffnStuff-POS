import nodemailer from 'nodemailer';
import catchAsync from './catchAsync.js';

const sendEmail = option => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailOptions = {
    from: `DA Constance Fluff 'N Stuff <support@DAconstanceFluffnStuff.com>`,
    to: option.email,
    subject: option.subject,
    text: option.message,
  };

  transporter.sendMail(emailOptions);
};

export default sendEmail;
