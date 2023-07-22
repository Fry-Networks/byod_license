'use server';
import Enmap from 'enmap';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { google } from 'googleapis';
import key from '../../../config/serviceAcc.json'; // replace with your json key file path
import { sendMailApi } from './MailProcessor';
import fs from 'fs';
import path from 'path';
import { confirmTransaction } from './TransactionProcessor';
import { getMongoUser, updateByod } from '../db/utils';
import { connect } from '../db/connect';

const licenses: Enmap<string, User> = new Enmap({ name: 'licenses' });

export type User = {
    id: string;
    email: string;
    stripe: boolean;
    fry: boolean;
    license?: string
    licenses: string[];
    payments?: Date[];
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

export async function addLicense(email: string, address: string, license: string) {
    if (await isUser(email)) {
        const user = (await getUser(email)) as User;
        user.licenses ? user.licenses.push(license) : user.licenses = [license];
        user.fry = true;
        if (!user.payments) {
            user.payments = [new Date()];
        }
        else {
            user.payments.push(new Date());
        }
        licenses.set(user.id, user);
        updateByod(user, address)

    } else {
        const id = generateID();
        const user = {
            id,
            email: email,
            licenses: [license],
            stripe: false,
            fry: false,
            payments: [new Date()]
        }
        licenses.set(id, user);
        updateByod(user, address)
    }
}

export async function createLicense(email: string, address: string, txId: string) {
    let license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    while (licenses.get(license)) {
        license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    }
    const user = await getUser(email);
    if (!user) return null;
    if (!user.stripe) return null;
    const confirmation = await confirmTransaction(txId);
    if (!confirmation) return 'spoofed transaction'
    await connect();
    const mongoUser = await getMongoUser({address, email});
    await addLicense(email, address, license);
    sendMail(email, license);
    syncLicensesGSheet();
    return license;
}

export async function createUser(email: string) {
    const id = generateID();
    const user = {
        id,
        email,
        licenses: [],
        stripe: false,
        fry: false
    }
    licenses.set(id, user);
    return user;
}



export async function syncLicensesGSheet() {
    const jwtClient = new google.auth.JWT(
        key.client_email,
        undefined,
        key.private_key,
        ['https://www.googleapis.com/auth/spreadsheets'],
        undefined
    );

    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log("Successfully connected to Google Sheets API!");
        }
    });


    const googleSheets = google.sheets({ version: 'v4', auth: jwtClient });

    const spreadsheetId = '1F-bYXgD8RRgQcUzcjqr1CkzY84Zc-i_mE6HhDboCkzQ';

    const licensesToWrite = licenses.filter(user => (!!user.email && !!user.licenses.length)).map(user => {
        const lonelyLicense = user.license

        return [user.email, user.licenses.join('\n') + (lonelyLicense ? '\n' + lonelyLicense : '')];

    });

    // Add column headers to the beginning of the array
    licensesToWrite.unshift(['Email', 'Licenses']);

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

    //read the html file here ../../../config/HTMLtemplate.html

    const htmlFile = fs.readFileSync(path.resolve(__dirname, '../../../config/HTMLtemplate.html'), 'utf8');

    const edited = htmlFile.replace('LICENSE_REPLACE_TEXT', license);


    const options = {
        from: 'contact@fryfoundation.com',
        to: email,
        subject: 'Your FRY BYOD License',
        text: 'Your FRY BYOD License is: ' + license + '. Please save this email for future reference.',
        html: edited,
    };
    await sendMailApi(options);

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

export async function repayLicense(email: string) {
    const user = await getUser(email);
    if (!user) return false;
    const condition = user.fry && user.stripe;
    if (condition) {
        user.fry = false;
        user.stripe = false;
        await setUser(user);
    }
    return condition;
}