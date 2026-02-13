'use server';
import { google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Options } from 'nodemailer/lib/mailer/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let oAuth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

const requiredEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set`);
    }
    return value;
};

const getOAuth2Client = () => {
    if (oAuth2Client) return oAuth2Client;

    const clientId = requiredEnv('GMAIL_OAUTH_CLIENT_ID');
    const clientSecret = requiredEnv('GMAIL_OAUTH_CLIENT_SECRET');
    const redirectUri =
        process.env.GMAIL_OAUTH_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
    const refreshToken = requiredEnv('GMAIL_OAUTH_REFRESH_TOKEN');
    const accessToken = process.env.GMAIL_OAUTH_ACCESS_TOKEN;
    const expiryDate = process.env.GMAIL_OAUTH_EXPIRY_DATE
        ? Number(process.env.GMAIL_OAUTH_EXPIRY_DATE)
        : undefined;

    oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({
        refresh_token: refreshToken,
        ...(accessToken ? { access_token: accessToken } : {}),
        ...(expiryDate ? { expiry_date: expiryDate } : {}),
    });

    return oAuth2Client;
};

// Helpers
const getGmailService = () => {
    return google.gmail({ version: 'v1', auth: getOAuth2Client() });
};

const encodeMessage = (message: Buffer) => {
    return message.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createMail = async (options: Options) => {
    const mailComposer = new MailComposer(options);
    const message = await mailComposer.compile().build();
    return encodeMessage(message);
};

// Minimal redaction helpers for logs
const redactEmail = (email?: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `**@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

// Enhanced email logging utility (keeps logs consistent with wixPayments style)
const emailLog = {
    info: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] 📧 ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    success: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ✅📧 ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    warning: (message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ⚠️📧 ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, error?: any) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ❌📧 ${message}`);
        if (error) {
            if (error.message) console.log(`   📧 Error: ${error.message}`);
            if (error.code) console.log(`   📧 Code: ${error.code}`);
            if (error.response?.data) console.log(`   📧 Response: ${JSON.stringify(error.response.data)}`);
        }
    }
};

export const sendMailApi = async (options: any): Promise<any> => {
    emailLog.info(`API CALL - Attempting to send email`, {
        to: redactEmail(options.to),
        subject: options.subject,
        hasHtml: !!options.html,
        hasText: !!options.text
    });

    const gmail = getGmailService();
    const rawMessage = await createMail(options);

    try {
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
            },
        });

        emailLog.success(`API SUCCESS - Email sent successfully`, {
            to: redactEmail(options.to),
            messageId: result.data.id,
            threadId: result.data.threadId
        });

        return result;
    } catch (error: any) {
        emailLog.error(`API ERROR - Failed to send email to ${redactEmail(options.to)}`, error);

        // Handle expired/invalid tokens by attempting refresh once, then retry
        // google-auth-library may surface numeric codes; check message as well
        const isAuthError =
            error?.code === 401 ||
            (typeof error?.message === 'string' && error.message.toLowerCase().includes('invalid_grant')) ||
            (error?.response?.status === 401);

        if (isAuthError) {
            emailLog.warning(`OAUTH TOKEN ISSUE - Attempting to refresh access token`);
            try {
                const client = getOAuth2Client();
                // refreshAccessToken is deprecated in newer google-auth-library versions,
                // but older code uses refreshAccessToken. We attempt both patterns.
                let refreshed: any;
                if (typeof (client as any).refreshAccessToken === 'function') {
                    refreshed = await (client as any).refreshAccessToken();
                } else {
                    refreshed = await client.getAccessToken(); // fallback: triggers internal refresh
                }

                const newTokens = refreshed?.credentials || refreshed;
                emailLog.info(`OAUTH REFRESH ATTEMPT`, {
                    hasNewToken: !!newTokens?.access_token
                });

                if (newTokens) {
                    client.setCredentials(newTokens);
                }

                emailLog.info(`OAUTH REFRESH SUCCESS - Retrying email send`);
                return await sendMailApi(options);
            } catch (refreshError: any) {
                emailLog.error(`OAUTH REFRESH FAILED - Cannot refresh access token`, refreshError);
                throw new Error(`Email failed: OAuth token refresh failed - ${refreshError?.message || refreshError}`);
            }
        } else {
            emailLog.error(`API FATAL ERROR - Non-recoverable error`, error);
            throw new Error(`Email failed: ${error?.message || 'Unknown Gmail API error'}`);
        }
    }
};

export async function sendMail(email: string, license: string): Promise<any> {
    emailLog.info(`EMAIL PREP - Preparing BYOD license email for ${redactEmail(email)}`, {
        licenseLength: license?.length || 0
    });

    try {
        // Load HTML template (config directory located at ../../../config relative to this file)
        const templatePath = path.resolve(__dirname, '../../../config/HTMLtemplate.html');
        emailLog.info(`TEMPLATE LOADING - Reading HTML template from ${templatePath}`);
        const htmlFile = fs.readFileSync(templatePath, 'utf8');

        // Single-license HTML block (as user confirmed one license per email)
        const htmlLicense = `
            <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#495057;font-family:Arial,sans-serif;">License:</p>
            <p style="margin:0;font-size:22px;line-height:1.4;font-family:'Consolas','Monaco','Courier New',monospace;font-weight:bold;letter-spacing:1px;color:#000000;background-color:#ffffff;padding:15px;border:2px solid #dee2e6;border-radius:5px;word-break:keep-all;white-space:nowrap;overflow-x:auto;">${license}</p>
        `;

        const edited = htmlFile.replace('LICENSE_REPLACE_TEXT', htmlLicense);

        emailLog.success(`TEMPLATE PREPARED - Email content ready`, {
            licensePreview: license ? `${license.slice(0, 6)}...[redacted]` : undefined
        });

        const textFallback = `Your BYOD License:\n\n${license}\n\nPlease save this email for future reference.\n\nBest regards,\nFRY Networks Team`;

        const options = {
            from: 'no-reply@frynetworks.com',
            to: email,
            subject: 'Your BYOD License - FRY Networks',
            text: textFallback,
            html: edited,
        };

        emailLog.info(`EMAIL SENDING START - Calling mail API`);
        const result = await sendMailApi(options);

        emailLog.success(`EMAIL SENT SUCCESSFULLY - BYOD license delivered to ${redactEmail(email)}`, {
            messageId: result?.data?.id,
            recipient: redactEmail(email)
        });

        return result;
    } catch (error: any) {
        emailLog.error(`EMAIL SENDING FAILED - Could not send BYOD license to ${redactEmail(email)}`, error);
        throw error;
    }
}
