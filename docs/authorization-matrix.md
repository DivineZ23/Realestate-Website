# Authorization matrix

| Capability | Visitor | Agent | Manager |
|---|:---:|:---:|:---:|
| View active Available properties | ✓ | ✓ | ✓ |
| Submit property enquiry | ✓ | ✓ | ✓ |
| View internal dashboard | — | ✓ | ✓ |
| View all property statuses | — | ✓ | ✓ |
| Edit property information | — | ✓ | ✓ |
| Book property / assign tenant / evict | — | ✓ | ✓ |
| Process enquiries | — | ✓ | ✓ |
| View tenant summaries | — | ✓ | ✓ |
| Create or delete property | — | — | ✓ |
| Create, edit, or delete block | — | — | ✓ |
| View and manage users | — | — | ✓ |
| Promote, demote, revoke, restore | — | — | ✓ |
| View audit logs and settings | — | — | ✓ |

Pending, rejected, revoked, inactive, and deleted employee records cannot use approved internal APIs. Frontend guards improve navigation but backend policies enforce every protected operation. Self-promotion, self-revocation, self-deletion, and removal of the final active manager are prohibited.

