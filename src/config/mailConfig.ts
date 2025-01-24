import nodemailer from 'nodemailer';
import { HOST_EMAIL_ID, HOST_EMAIL_PASSKEY } from './envConfig';

// configuring node-mailer

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
        user: HOST_EMAIL_ID,
        pass: HOST_EMAIL_PASSKEY
    }
});

export default transporter;
