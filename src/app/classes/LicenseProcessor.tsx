'use server';
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
import ByodModel from '../db/byod-schema';

connect();
//export to json file
export type User = {
    email: string;
    algo: boolean;
    fry: boolean;
    licenses: string[];
    payments?: Date[];
}


export type UserData = {
    algo: boolean;
    fry: boolean;
}


//const capKey = "REDACTED_ROTATE_ME"
//const FRYCapID = 24874;
//const AlgoCapID = 4030;
const FRYVerID = 924268058;
const fryURL = `https://free-api.vestige.fi/assets/${FRYVerID}/price`
const algoURL = "https://free-api.vestige.fi/currency/prices"
let currentFRYPrice = {
    lastFetched: 0,
    price: 0
}
let currentAlgoPrice = {
    lastFetched: 0,
    price: 0
}

export async function getFRYPrice() {
    if (Date.now() - currentFRYPrice.lastFetched > 1000 * 60 * 1) {
        const response = await axios.get(fryURL);
        currentFRYPrice.price = response.data.price;
        currentFRYPrice.lastFetched = Date.now();
    }
    return currentFRYPrice.price;
}

export async function getAlgoPrice() {
    if (Date.now() - currentAlgoPrice.lastFetched > 1000 * 60 * 1) {
        const response = await axios.get(algoURL);
        currentAlgoPrice.price = response.data.USD;
        currentAlgoPrice.lastFetched = Date.now();
    }
    return currentAlgoPrice.price;
}








export async function getUser(email: string): Promise<User | null> {
    const user = await ByodModel.findOne({ email })
    return user ? user.toObject() : null;
}
export async function setUser(user: User) {
    ByodModel.findOneAndUpdate({ email: user.email }, user, { upsert: true, new: true }).exec();
    console.log('set user')
}

export async function getUserData(email: string): Promise<UserData> {
    const user = await getUser(email);
    if (!user) {
        return {
            algo: false,
            fry: false
        }
    }
    return {
        algo: user.algo,
        fry: user.fry
    }
}

export async function isUser(email: string) {
    return (await ByodModel.exists({ email })) ? true : false;
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
        setUser(user);
        updateByod(user, address)

    } else {
        const user = {
            email: email,
            licenses: [license],
            algo: false,
            fry: false,
            payments: [new Date()]
        }
        setUser
        updateByod(user, address)
    }
}

export async function createLicense(email: string, address: string, txId: string) {
    let license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    while (await ByodModel.exists({ licenses: license })) {
        license = (Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40) + Math.random().toString(36).substring(2, 40)).toUpperCase();
    }
    const user = await getUser(email);
    if (!user) return null;
    if (!user.algo) return null;
    const confirmation = await confirmTransaction(txId, "fry", email)
    if (confirmation !== 0) return 'spoofed transaction code: ' + confirmation;
    await connect();
    const mongoUser = await getMongoUser({ address, email });
    console.log(`Creating license for ${email} with address ${address}: ${license}`);
    await addLicense(email, address, license);
    sendMail(email, license);
    if (process.env.NODE_ENV === 'production') syncLicensesGSheet();
    return license;
}

export async function createUser(email: string) {
    const user = {
        email,
        licenses: [],
        algo: false,
        fry: false
    }
    setUser(user);
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
    const licenses = await ByodModel.find({});
    const licensesToWrite = licenses.filter(user => (!!user.email && !!user.licenses?.length)).map(user => {
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

export async function fetchCryptoPrice(asset: "algo" | "fry") {
    try {
        if (asset === "algo") return await getAlgoPrice();
        else return await getFRYPrice();
    }
    catch (err) {
        console.log(err);
        return 0;
    }
}

export async function repayLicense(email: string) {
    const user = await getUser(email);
    if (!user) return false;
    //@ts-ignore
    const condition = user.stripe ? user.fry && user.stripe : user.fry && user.algo;
    if (condition) {
        user.fry = false;
        user.algo = false;
        await setUser(user);
    }
    return condition;
}