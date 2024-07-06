import express from 'express';

const realm = 'poc';
const clientId = 'poc';
const appHost = 'localhost:3000';
const keycloakHost = 'localhost:8080';
const keycloakDockerHost = 'keycloak:8080';
const app = express();

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


app.listen(3000, () => {
  console.log('Listening on port 3000');
});
