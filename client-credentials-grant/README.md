# Client Credentials Grant

- [RFC](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4)

```
     +---------+                                  +---------------+
     |         |                                  |               |
     |         |>--(A)- Client Authentication --->| Authorization |
     | Client  |                                  |     Server    |
     |         |<--(B)---- Access Token ---------<|               |
     |         |                                  |               |
     +---------+                                  +---------------+
```
We can use a **specific client** to authenticate and retrieve an access token. No user information is needed in this flow.

![](./docs/client-credentials-grant.png)


### Sequence flow
```mermaid
sequenceDiagram
    web->>service_0: send request to create QR code
    service_0->>service_0: generate QR code with URL<br /> and encrypted user_id as query parameter
    service_0-->>web: QR code returned
    web->>mobile: user reads the QR code
    mobile->>keycloak: [server-side]<br />request for access token<br />using client credentials grant
    keycloak-->>mobile: access token returned
    mobile->>service_1: send content, user_id and access token
    service_1->>keycloak: validate access token
    service_1->>service_1: decrypt user_id
    service_1->>service_2: associate user_id with content<br />and do something
```

### Pros
- the user does not need to authenticate on the mobile
- the QR code will have a short content preventing query parameter length issues
### Cons
- the service_1, service_2 and more services will need to implement a different guard to validate the access token
- if the user wants to continue the flow on the mobile, he will need to authenticate again
- no refresh token to get a new access token [?]

