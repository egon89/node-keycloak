import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { decodeQR } from './qrcode-reader';

const realm = 'poc';
const clientId = 'poc';
const appHost = 'localhost:3000';
const keycloakHost = 'localhost:8080';
const keycloakDockerHost = 'keycloak:8080';
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
    grant_type: 'authorization_code',
    code: req.query.code as string,
    redirect_uri: `http://${appHost}/callback`,
  });

  const url = `http://${keycloakDockerHost}/realms/${realm}/protocol/openid-connect/token`;

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

app.post('/create-qr-code', async (req, res) => {
  const bearerToken = req.headers.authorization;
  const token = bearerToken?.split(' ')[1] ?? 'no-token';
  // const qrCode = await QRCode.toString(token, { type: 'terminal', small: true });
  const qrCode = await QRCode.toDataURL(token);

  try {
    await QRCode.toFile('./output/qr-code.png', token);
    console.log('QR code saved to ./output/qr-code.png');
  } catch (err) {
    console.error('Error generating QR code: ', err);
  }

  res.json({ qrCode });
});

app.get('/qr-code', async (req, res) => {
  const qrCodeContent = await decodeQR('./output/qr-code.png')

  console.log('QR code content:', qrCodeContent);

  res.send(qrCodeContent);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
