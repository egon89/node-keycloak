import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { decodeQR } from './qrcode-reader';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { decrypt, encrypt } from './crypto';

dotenv.config();
const realm = 'poc';
const clientId = 'poc';
const clientSecret = process.env.CLIENT_SECRET ?? 'invalid-secret';
const appHost = 'host.docker.internal:3000';
const keycloakHost = 'host.docker.internal:8080';
const encryptedSecretKey = process.env.ENCRYPTION_SECRET_KEY ?? 'invalid-secret-key';

const app = express();
app.use(cors());

app.get('/login', (req, res) => {
  const loginParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `http://${appHost}/callback`,
    response_type: 'code',
    scope: 'openid',
  });

  const url = `http://${keycloakHost}/realms/${realm}/protocol/openid-connect/auth?${loginParams.toString()}`;
  console.log(url);

  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  console.log(req.query);

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: req.query.code as string,
    redirect_uri: `http://${appHost}/callback`,
  });

  const url = `http://${keycloakHost}/realms/${realm}/protocol/openid-connect/token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const result = await response.json();
  console.log(result);

  res.json(result);
});

// create QR code with target URL using the token as query parameter
app.post('/create-qr-code', async (req, res) => {
  const bearerToken = req.headers.authorization;
  const token = bearerToken?.split(' ')[1];
  if (!token) {
    throw new Error('Bearer token not found in the request headers');
  }
  const encryptedToken = encrypt(token, encryptedSecretKey);
  const queryParameters = new URLSearchParams({ token: encryptedToken });
  const url = `http://${appHost}/pre-action?${queryParameters.toString()}`;
  const qrCode = await QRCode.toDataURL(url, { errorCorrectionLevel: 'L' });

  try {
    await QRCode.toFile(
      './output/qr-code.png',
      url,
      { errorCorrectionLevel: 'L' }
    );
    console.log('QR code saved to ./output/qr-code.png');
  } catch (err) {
    console.error('Error generating QR code: ', err);
  }

  res.json({ qrCode });
});

// scan QR code and redirect to the URL
app.get('/scan-qr-code', async (req, res) => { 
  const qrCodeContent = await decodeQR('./output/qr-code.png')
  console.log(`QR Code scanned and redirect to ${qrCodeContent.substring(0, 100)}...`);
  const { data } = await axios.get(qrCodeContent);

  res.json(data);
});

app.get('/pre-action', async (req, res) => {
  const { token } = req.query as { token: string };
  const decryptedToken = decrypt(token, encryptedSecretKey);
  console.log(`Pre-action token: ${decryptedToken?.substring(0, 100)}...`);

  // instropect token
  const bodyParams = new URLSearchParams({
    token: decryptedToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const url = `http://${keycloakHost}/realms/${realm}/protocol/openid-connect/token/introspect`;
  const { data } = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  res.json(data);
});

app.post('/introspect', async (req, res) => {
  const token = '';
  console.log(`Introspect token: ${token?.substring(0, 100)}...`);

  const bodyParams = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const url = `http://${keycloakHost}/realms/poc/protocol/openid-connect/token/introspect`;
  const response = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  res.json(response.data);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
