# Device Authorization Grant
### Client configurations
![](./docs/client-capability-config.png)

- To prevent the user consent action, the client scopes must be configured as optional:

![](./docs/client-scopes.png)


### desktop
```mermaid
sequenceDiagram
    actor user
    participant web
    participant keycloak
    participant service_0

    user->>web: input credentials
    web->>keycloak: login
    keycloak-->>web: keycloak session created<br />access and refresh tokens returned
    user->>web: go to biometric page
    web->>keycloak: request device authorization grant (1)
    keycloak-->>web: device_code, user_code, verification_uri<br /> and verification_uri_complete returned
    web->>service_0: store device_code, user_code, user_id, check_at<br />and other information
    web->>keycloak: verification_uri_complete requested (2)
    keycloak-->>keycloak: check if user has session
    keycloak-->>web: device authorization granted
    web->>user: show QR Code with<br />target URL with device_code<br />as query parameter
    web->>user: show the user_code to the user
```
---
### device
```mermaid
sequenceDiagram
    actor user
    participant web
    participant service_0
    participant keycloak

    user->>web: read QR Code<br />to get the device_code
    web->>user: ask for user_code (shown in the web)
    user->>web: input user_code
    web->>service_0: check user_code and<br />device_code association
    web->>keycloak: request access_token<br />with device_code (3)
    keycloak-->>web: access_token, refresh_token<br />and other information returned
```
---
1. Device authorization grant request
    ```shell
    curl --request POST \
        --url http://host.docker.internal:8080/realms/device-auth/protocol/openid-connect/auth/device \
        --header 'content-type: application/x-www-form-urlencoded' \
        --data = \
        --data client_id=device-auth
    ```

    ```json
    {
        "device_code": "jm-k2R1TW3UDfjeYAaSBu1_dbjIRDBFh71QHAyUGcIs",
        "user_code": "YOJG-BDNT",
        "verification_uri": "http://host.docker.internal:8080/realms/device-auth/device",
        "verification_uri_complete": "http://host.docker.internal:8080/realms/device-auth/device?user_code=YOJG-BDNT",
        "expires_in": 600,
        "interval": 5
    }
    ```

2. The verification_uri_complete returns the device login successful content if the user has an active session:

    `http://host.docker.internal:8080/realms/device-auth/device?user_code=YOJG-BDNT`

    <img src="./docs/device-login-success.png" width="350px">

    If the user does not have an active session, the verification_uri_complete returns the login page (status code 200)

3. Token request
    ```shell
    curl --request POST \
        --url http://host.docker.internal:8080/realms/device-auth/protocol/openid-connect/token \
        --header 'content-type: application/x-www-form-urlencoded' \
        --data = \
        --data client_id=device-auth \
        --data device_code=jm-k2R1TW3UDfjeYAaSBu1_dbjIRDBFh71QHAyUGcIs \
        --data grant_type=urn:ietf:params:oauth:grant-type:device_code
    ```
    ```json
    {
        "access_token": "x",
        "expires_in": 300,
        "refresh_expires_in": 1745,
        "refresh_token": "y",
        "token_type": "Bearer",
        "not-before-policy": 0,
        "session_state": "b4cf914b-f4c1-4f26-a834-e2495ae27afe",
        "scope": "openid email profile"
    }
    ```

### References
- [keycloak.org](https://www.keycloak.org/docs/latest/securing_apps/index.html#device-authorization-endpoint)
- [RFC8628](https://datatracker.ietf.org/doc/html/rfc8628)
