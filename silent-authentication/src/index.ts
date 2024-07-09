import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();
const realm = 'poc';
const clientId = 'poc';
const clientSecret = process.env.CLIENT_SECRET ?? 'invalid-secret';
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
  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: code as string,
    redirect_uri: `http://${appHost}/callback`,
  });
  const url = `http://${keycloakHost}/realms/${realm}/protocol/openid-connect/token`;
  const { data } = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  console.log(data);

  res.json(data);
});

app.get('/silent', async (req, res) => {
  const token = '';
  console.log(`Introspect token: ${token?.substring(0, 100)}...`);

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `http://${appHost}/hi`,
    response_type: 'code',
    scope: 'openid',
    prompt: 'none',
  });

  const url = `http://${keycloakHost}/realms/poc/protocol/openid-connect/auth`;
  const response = await axios.post(url, bodyParams, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  res.send(response.data);
});

app.get('/hello', async (req, res) => {
  res.send('hello');
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
