import nodemailer from 'nodemailer';
import config from '@/config/env.js';
import logger from '@/lib/logger.js';

const transport = nodemailer.createTransport(config.email.smtp);

transport
  .verify()
  .then(() => logger.info('Connected to email server'))
  .catch((error) => logger.error('Mail verification failed', error));

const sendmail = async (to: string, subject: string, html: string) => {
  const msg = { from: 'Loopify team', to, subject, html };
  await transport.sendMail(msg);
};

const sendVertificationCode = async (to: string, code: string) => {
  const subject = 'Your vertification code';
  const html = `
      <h1>Login Verification</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `;
  await sendmail(to, subject, html);
};

export default sendVertificationCode;
