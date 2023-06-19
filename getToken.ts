// ObtainRefreshToken.js
const express =require('express');
const { google } = require('googleapis');

const app = express();

const oauth2Client = new google.auth.OAuth2(
  '462578735413-t8ea52v6krhrkv8j8a6nia20la2cbdmd.apps.googleusercontent.com',
  'REDACTED_ROTATE_ME',
  "http://siimon.ddns.net:3000/oauthcallback"  // Replace with your public IP
);

// generate a URL that asks permissions for Gmail scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly'
];

app.get("/", (req: any, res: { redirect: (arg0: any) => void; }) => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Required to get a refresh token every time
  });
  res.redirect(authorizeUrl);
});

app.get('/oauthcallback', (req: { query: { code: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; send: (arg0: any) => void; }) => {
    const code = req.query.code;
    console.log(code);
    if (typeof code === 'string') {
      oauth2Client.getToken(code, (err: any, tokens: any) => {
        if (err) {
          console.error('Error retrieving access token', err);
          return res.status(500).send('Error retrieving access token');
        }
        console.log(tokens);
        res.send(tokens);
      });
    } else {
      res.status(400).send('Invalid code');
    }
  });
  
app.listen(3000, '0.0.0.0', () => {  // Listen on all network interfaces
  console.log('App is listening on port 3000')
});
