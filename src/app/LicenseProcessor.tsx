'use server';
import Enmap from 'enmap';
import nodemailer from 'nodemailer';
const licenses = new Enmap({ name: 'licenses' });

export async function getLicence(address: string) {
    return licenses.get(address);
}

export async function setLicence(address: string, licence: string) {
    return licenses.set(address, licence);
}

export async function createLicence(address:string) {
    let license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    while(licenses.get(license)) {
        license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    }
    licenses.set(address, license);
    return license
}

export async function sendMail(email: string, license: string) {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: 'your-email@your-domain.com',
            clientId: 'YOUR_CLIENT_ID',
            clientSecret: 'YOUR_CLIENT_SECRET',
            refreshToken: 'YOUR_REFRESH_TOKEN',
        }
    });

    const mailOptions = {
        from: 'your-email@your-domain.com',
        to: email,
        subject: 'Hello from Node.js',
        text: license
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log('Error: ' + err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

}