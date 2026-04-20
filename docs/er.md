# ER Diagram

Auto-generated from `src/lib/db/schema.ts` via `scripts/gen-erd.ts`.
Run `npm run db:erd` to regenerate. Do not edit by hand.

```mermaid
erDiagram
  account {
    text userId FK
    text type
    text provider PK
    text providerAccountId PK
    text refresh_token "nullable"
    text access_token "nullable"
    integer expires_at "nullable"
    text token_type "nullable"
    text scope "nullable"
    text id_token "nullable"
    text session_state "nullable"
  }
  profile {
    text user_id PK,FK
    text public_id UK
    text name
  }
  session {
    text sessionToken PK
    text userId FK
    integer expires
  }
  user {
    text id PK
    text name "nullable"
    text email UK "nullable"
    integer emailVerified "nullable"
    text image "nullable"
  }
  verificationToken {
    text identifier PK
    text token PK
    integer expires
  }
  user ||--o{ account : "userId"
  user ||--o{ profile : "user_id"
  user ||--o{ session : "userId"
```
