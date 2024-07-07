import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { decodeQR } from './qrcode-reader';
import axios from 'axios';

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
    client_secret: '5y4VqRkFE1P6qXd7oiGw46eDOG5KhtOV',
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

  const url = `http://${keycloakDockerHost}/realms/${realm}/protocol/openid-connect/token/introspect`;
  const response = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  console.log(response.data);

  res.sendStatus(204);
});

app.post('/introspect', async (req, res) => {
  const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJUbjFIam80cjNLNTRrdkhHRHV6NmxTMUs2eVIwNG5yZnlfNWlUNTVWanpVIn0.eyJleHAiOjE3MjAzMTk5NTUsImlhdCI6MTcyMDMxOTY1NSwiYXV0aF90aW1lIjoxNzIwMzE4NDk3LCJqdGkiOiJkYzZmZDdmMy1lMTZiLTQwMjktYThjOC0wYjI3MTJiNjk3Y2QiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL3BvYyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiIzZjVjMmExOS1lZjFiLTQ2NmEtYWJlNC0zMzJhYzI3MjY0MjAiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJwb2MiLCJzZXNzaW9uX3N0YXRlIjoiNzdkMzNhYjYtMmU3Ni00MGYwLWJjN2UtZGUyNjg3ZmVjNWU5IiwiYWNyIjoiMCIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLXBvYyIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiNzdkMzNhYjYtMmU3Ni00MGYwLWJjN2UtZGUyNjg3ZmVjNWU5IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidXNlcjEgZG9lIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidXNlcjEiLCJnaXZlbl9uYW1lIjoidXNlcjEiLCJmYW1pbHlfbmFtZSI6ImRvZSIsImVtYWlsIjoidXNlcjFAZ21haWwuY29tIn0.AzmblX7ioQstbai5Pz_O_md77nSBJ3XHEtOPTUDNQ3aEwXL3uX8gYMbX232T-WMOtMnahNvP0i1uF9r6sGu7XSb3lHmgQXK4KeibD5G60NH6D72JYhwJHgfbz8a-l9ik3q_uRGFfI10WDzHbVsCe3DLoC5PL2Oc8G9W544PzeTMXAtchCXXCrk4sjTSFA0foGLhe8I8AS_aLzZDM-GiQOnLHiqYKZNZ-0l7x-eqeOEXBlNNCo6msTXYb259XxIqpT7X6OtfGXsHIfrwkdE3mchYdvLBMGFwmQT-W3Mu1tcoWjIpQctf2ry7m6vRyc0PwyxJlYZ7vxhxz0JAX8tzIZg';
  console.log(`Introspect token: ${token?.substring(0, 100)}...`);

  const bodyParams = new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: '5y4VqRkFE1P6qXd7oiGw46eDOG5KhtOV',
  });

  const url = `http://${keycloakDockerHost}/realms/poc/protocol/openid-connect/token/introspect`;
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
