'use server';
import Enmap from 'enmap';
import nodemailer from 'nodemailer';
import axios from 'axios';
const licenses: Enmap<string, string> = new Enmap({ name: 'licenses' });
const capKey = "REDACTED_ROTATE_ME"
const FRYCapID = 24874;

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

export async function syncLicenses() {
    const {google} = require('googleapis');

    const auth = new google.auth.GoogleAuth({
        keyFile: '/path/to/your/downloaded/json/file.json', // Replace with path to your downloaded JSON file
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();

    const googleSheets = google.sheets({version: 'v4', auth: client});

    const spreadsheetId = '1F-bYXgD8RRgQcUzcjqr1CkzY84Zc-i_mE6HhDboCkzQ'; // Replace with your spreadsheet ID

    const licensesToWrite = Array.from(licenses).map(([key, value]) => [key, value]);

    // Add column headers to the beginning of the array
    licensesToWrite.unshift(['Address', 'License']);

    await googleSheets.spreadsheets.values.update({
        spreadsheetId,
        range: "FRY License!A1", // Adjust with your sheet name and range
        valueInputOption: "USER_ENTERED", 
        resource: {
            values: licensesToWrite
        }
    });
    return licensesToWrite;
}

export async function sendMail(email: string, license: string) {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: 'contact@fryfoundation.com',
            clientId: 'YOUR_CLIENT_ID',
            clientSecret: 'YOUR_CLIENT_SECRET',
            refreshToken: 'YOUR_REFRESH_TOKEN',
        }
    });

    const mailOptions = {
        from: 'contact@fryfoundation.com',
        to: email,
        subject: 'BYOD License',
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

export async function fetchCryptoPrice() {
    try {
      const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest', {
        params: {
          id: FRYCapID,
          convert: 'USD'
        },
        headers: {
          'X-CMC_PRO_API_KEY': capKey
        }
      });
      const price = response.data.data[FRYCapID].quote.USD.price;
      return price;
    } catch (error) {
      console.error(error);
    }
  }