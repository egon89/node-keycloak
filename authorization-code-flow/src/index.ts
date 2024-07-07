import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { decodeQR } from './qrcode-reader';
import axios from 'axios';

const realm = 'poc';
const clientId = 'poc';
const appHost = 'host.docker.internal:3000';
const keycloakHost = 'host.docker.internal:8080';
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
    client_secret: '5y4VqRkFE1P6qXd7oiGw46eDOG5KhtOV',
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

app.post('/create-qr-code', async (req, res) => {
  const bearerToken = req.headers.authorization;
  const token = bearerToken?.split(' ')[1];
  if (!token) {
    throw new Error('Bearer token not found in the request headers');
  }
  const queryParameters = new URLSearchParams({ token });
  const url = `http://${appHost}/pre-action?${queryParameters.toString()}`;
  
  // const qrCode = await QRCode.toString(token, { type: 'terminal', small: true });
  const qrCode = await QRCode.toDataURL(url);

  try {
    await QRCode.toFile('./output/qr-code.png', url);
    console.log('QR code saved to ./output/qr-code.png');
  } catch (err) {
    console.error('Error generating QR code: ', err);
  }

  res.json({ qrCode });
});

app.get('/scan-qr-code', async (req, res) => { 
  const qrCodeContent = await decodeQR('./output/qr-code.png')
  console.log(`QR Code scanned and redirect to ${qrCodeContent.substring(0, 100)}...`);
  await axios.get(qrCodeContent);

  res.sendStatus(204);
});

app.get('/pre-action', async (req, res) => {
  const { token } = req.query as { token: string };
  console.log(`Pre-action token: ${token?.substring(0, 100)}...`);

  // instropect token
  const bodyParams = new URLSearchParams({
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJUbjFIam80cjNLNTRrdkhHRHV6NmxTMUs2eVIwNG5yZnlfNWlUNTVWanpVIn0.eyJleHAiOjE3MjAzMTkyMzAsImlhdCI6MTcyMDMxODkzMCwiYXV0aF90aW1lIjoxNzIwMzE4NDk3LCJqdGkiOiI3YjUyZWZkMi1kNzRhLTQwNDEtOTdlMi0zMWU0ZWYwNWM4YTkiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL3BvYyIsImF1ZCI6InBvYyIsInN1YiI6IjNmNWMyYTE5LWVmMWItNDY2YS1hYmU0LTMzMmFjMjcyNjQyMCIsInR5cCI6IklEIiwiYXpwIjoicG9jIiwic2Vzc2lvbl9zdGF0ZSI6Ijc3ZDMzYWI2LTJlNzYtNDBmMC1iYzdlLWRlMjY4N2ZlYzVlOSIsImF0X2hhc2giOiJ6ME5kV2NnQ0VsNzBYU2ZncVNEX2xRIiwiYWNyIjoiMCIsInNpZCI6Ijc3ZDMzYWI2LTJlNzYtNDBmMC1iYzdlLWRlMjY4N2ZlYzVlOSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6InVzZXIxIGRvZSIsInByZWZlcnJlZF91c2VybmFtZSI6InVzZXIxIiwiZ2l2ZW5fbmFtZSI6InVzZXIxIiwiZmFtaWx5X25hbWUiOiJkb2UiLCJlbWFpbCI6InVzZXIxQGdtYWlsLmNvbSJ9.k9aZAPtGYqP4JpU824AvjnHbkZ0YLvT5KYTXZze6tf_d3ijk4x8gGx-HKmjCkbB20-Exit-FlVJC8Gg0WZ5_xfmQoSlrIotwZEm7tAbqW0USjGG1JEn9F_pn5wEEYxFOHi4acYnawLNtcrjdR508MsHZom_4tZ2sMg-cCror3giXw-y4zN2JjA2j4ypHGl66e7sBqENLqc7sr2uCRYX-UZVL91d1hNTFSduYf46N1f0r5lMqdu2L8PfD89OIAk2nzyIDm0cpkeqSieogkwGJgQULO4wPY5wQpZpr2AmmSGGQhJPduItn0ydiCiktrG3PHBtLDfwe-KmnvOpvcZvF6Q',
    client_id: clientId,
    client_secret: '5y4VqRkFE1P6qXd7oiGw46eDOG5KhtOV',
  });

  const url = `http://${keycloakHost}/realms/${realm}/protocol/openid-connect/token/introspect`;
  const response = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  console.log(response.data);

  res.sendStatus(204);
});

app.post('/introspect', async (req, res) => {
  const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJUbjFIam80cjNLNTRrdkhHRHV6NmxTMUs2eVIwNG5yZnlfNWlUNTVWanpVIn0.eyJleHAiOjE3MjAzMjkzOTgsImlhdCI6MTcyMDMyOTA5OCwiYXV0aF90aW1lIjoxNzIwMzI5MDk4LCJqdGkiOiJlYWY2N2Q4NC02NWM5LTQ1NmItODExNC1lZjI5NDFkNGZmYmIiLCJpc3MiOiJodHRwOi8vaG9zdC5kb2NrZXIuaW50ZXJuYWw6ODA4MC9yZWFsbXMvcG9jIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjNmNWMyYTE5LWVmMWItNDY2YS1hYmU0LTMzMmFjMjcyNjQyMCIsInR5cCI6IkJlYXJlciIsImF6cCI6InBvYyIsInNlc3Npb25fc3RhdGUiOiI1ZmJjYzgzZC0wYzM4LTQ3ODAtYmIxNS01MjRkZGE0NzY3ODkiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtcG9jIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI1ZmJjYzgzZC0wYzM4LTQ3ODAtYmIxNS01MjRkZGE0NzY3ODkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJ1c2VyMSBkb2UiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1c2VyMSIsImdpdmVuX25hbWUiOiJ1c2VyMSIsImZhbWlseV9uYW1lIjoiZG9lIiwiZW1haWwiOiJ1c2VyMUBnbWFpbC5jb20ifQ.SMbTzcGnvK4WQKGd1V-iUcU57fUG7eH7tXzPvMNhUTVnN1wrOQCZekOg6SdHs6ZKjICPJqV3h5djYJHenGjRd6aCY937poLqCUlwIgvGmAmbxkNEcMCHKtQy-8W2qBmN4QHZjFrsUyoFMtbNl8tprQ_FpIXjvLRJdbHxmtXy7qe9TqFSedwaK22WpEcSqPW4hXV9CHeFxBP4n_4dY8wtJVcDDZ5Et3YRKeYVd7t48ZqB4LHf7WOvQ0oeHsDgtp_gvjt_NJ24pJiUAiqRlNGMNhjaM5sMi1S0VSwREzeMaRkT02GtFxs8i6LRo-zg57g58svglfFBlgISExLXfYF0bg';
  console.log(`Introspect token: ${token?.substring(0, 100)}...`);

  const bodyParams = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: '5y4VqRkFE1P6qXd7oiGw46eDOG5KhtOV',
  });

  const url = `http://${keycloakHost}/realms/poc/protocol/openid-connect/token/introspect`;
  const response = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  console.log(response.data);

  res.json(response.data);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
