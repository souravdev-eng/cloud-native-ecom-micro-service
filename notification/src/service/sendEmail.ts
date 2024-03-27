import { createTransport, SendMailOptions } from 'nodemailer';
import { config } from '../config';

export const sendResetTokenEmail = async (
  receiverEmail: string,
  emailTopic: string,
  emailData: string
) => {
  const transporter = createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions: SendMailOptions = {
    from: {
      name: 'Ecom',
      address: config.EMAIL_USER!,
    },
    to: `To ${receiverEmail}`,
    subject: emailTopic,
    text: emailTopic,
    html: `<b> ${emailData} </b>`,
  };

  await transporter.sendMail(mailOptions);
  console.log('Email send success fully');
};
