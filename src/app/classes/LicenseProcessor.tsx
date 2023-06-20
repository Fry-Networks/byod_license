'use server';
import Enmap from 'enmap';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
const licenses: Enmap<string, User> = new Enmap({ name: 'licenses' });

export type User = {
    id: string;
    email: string;
    license: string;
    stripe: boolean;
    fry: boolean;
}

export type UserData = {
    stripe: boolean;
    fry: boolean;
}


const capKey = "REDACTED_ROTATE_ME"
const FRYCapID = 24874;

export async function getUser(email: string): Promise<User | null> {
    console.log(licenses)
    const user = licenses.find(user => user.email === email);
    return user || null;
}
export async function setUser(user: User) {
    licenses.set(user.id, user);
}

export async function getUserData(email: string): Promise<UserData> {
    const user = await getUser(email);
    if (!user) {
        return {
            stripe: false,
            fry: false
        }
    }
    return {
        stripe: user.stripe,
        fry: user.fry
    }
}

export async function isUser(email: string) {
    return licenses.some(user => user.email === email);
}
function generateID() {
    //generate a string only ID
    let id = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40));
    while (licenses.get(id)) {
        id = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40));
    }
    return id;
}

export async function setLicense(email: string, license: string) {
    if (await isUser(email)) {
        const user = (await getUser(email)) as User;
        user.license = license;
        licenses.set(user.id, user);
    } else {
        const id = generateID();
        const user = {
            id,
            email: '',
            license: license,
            stripe: false,
            fry: false
        }
        licenses.set(id, user);
    }
}

export async function createLicense() {
    let license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    while (licenses.get(license)) {
        license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    }
    return license;
}

export async function createUser(email: string) {
    const id = generateID();
    const user = {
        id,
        email,
        license: '',
        stripe: false,
        fry: false
    }
    licenses.set(id, user);
    return user;
}



export async function syncLicensesGSheet() {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: 'REDACTED_ROTATE_ME' });

    const googleSheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const spreadsheetId = '1F-bYXgD8RRgQcUzcjqr1CkzY84Zc-i_mE6HhDboCkzQ';

    const licensesToWrite = Array.from(licenses).map(([key, value]) => [key, value]);

    // Add column headers to the beginning of the array
    licensesToWrite.unshift(['Address', 'License']);

    await googleSheets.spreadsheets.values.update({
        spreadsheetId,
        range: "FRY License!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
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
            clientId: '462578735413-t8ea52v6krhrkv8j8a6nia20la2cbdmd.apps.googleusercontent.com',
            clientSecret: 'REDACTED_ROTATE_ME',
            refreshToken: '1//03kMpgwsYoT0SCgYIARAAGAMSNwF-L9Ir7i4nMRk3PuL7myMtPKTvzJq6nyXYVp7Q7Pb15eCfrrBfreXroExJq5B1NouFlAEu1rU',
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