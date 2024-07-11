# Authorization Code Flow

## Flow - Refresh token
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
    web->>user: show QR Code with<br />target URL and refresh token<br />as query parameter
```
---
### device
```mermaid
sequenceDiagram
    actor user
    participant web
    participant keycloak

    user->>web: read QR Code<br />to get the refresh token
    web->>keycloak: request access_token<br />with refresh token
    
```
---
## Flow - Refresh token and user code
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
    web-->>service_0: create QR code request
    service_0-->>service_0: generate QR code with URL<br />with refresh token as query parameter (1)
    service_0-->>service_0: create and store the user_code and<br />user_id association
    service_0-->>web: return the user_code and QR code
    web->>user: show QR Code with<br />target URL and refresh token<br />as query parameter
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

    user->>web: read QR Code<br />to get the refresh token (2)
    web->>user: ask for user_code (shown in the web)
    user->>web: input user_code
    web->>service_0: check user_code and<br />user_id association
```
---
1. The refresh token can be encrypted (aes-128-cbc) to avoid tampering.
2. If the refresh token is encrypted, a request to service_0 is needed to decrypt it.
