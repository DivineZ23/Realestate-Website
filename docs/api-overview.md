# API overview

All endpoints use `/api/v1`. JSON enums use camel-case stable values. List endpoints return `items`, `page`, `pageSize`, `totalItems`, `totalPages`, `hasPreviousPage`, and `hasNextPage`.

| Area | Representative endpoints | Access |
|---|---|---|
| Auth | `GET /auth/discord`, `GET /auth/discord/callback`, `GET /auth/me`, `POST /auth/logout` | Mixed |
| Public properties | `GET /properties/available`, `GET /properties/featured`, `GET /properties/{id}` | Visitor |
| Property management | `GET/POST /properties`, `PUT /properties/{id}`, `PATCH /properties/{id}/status`, assignment, eviction, history | Agent/Manager; create/delete Manager |
| Blocks | `GET /blocks/public`, internal CRUD under `/blocks` | Mixed; mutations Manager |
| Enquiries | `POST /enquiries`, internal list/update | Mixed |
| Users | list, pending, approve, reject, promote, demote, revoke, restore, delete | Manager |
| Tenants | `GET /tenants` | Agent/Manager |
| Dashboard | `GET /dashboard` | Agent/Manager |
| Audit | `GET /audit-logs` | Manager |
| Images | `POST /uploads/images` | Agent/Manager |
| Team settings | `GET /settings/team`, `PUT /settings/team` | Public read; Manager write |

Errors use `statusCode`, `errorCode`, `message`, optional field `errors`, and `traceId`. Authentication failures intentionally avoid sensitive details.

Public property projection never includes active tenant IDs, CID, internal notes, booking identifiers, Discord IDs, or audit data.
