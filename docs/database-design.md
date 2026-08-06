# Database design

Collections are `blocks`, `properties`, `users`, `tenants`, `enquiries`, `property_status_history`, `audit_logs`, and `application_settings`.

Mongo `_id`/document IDs remain internal strings suitable for ObjectId values; `blockId` and `propertyId` are unique readable business identifiers. Properties reference blocks by internal ID. Active tenants are separate historical records and a property stores only its current tenant reference.

Important indexes include:

- unique block ID and block name;
- unique property ID;
- property block/status and status/active/deleted compounds;
- property text search fields;
- unique Discord user ID and user approval/access/role state;
- tenant property/status;
- enquiry property/status/date;
- property history property/date;
- audit entity/date.

Property counts are queried from properties and are not manually maintained. Blocks with properties cannot be deleted. Business records use soft deletion where history matters.

The public property query always adds `status=Available`, `isActive=true`, and `isDeleted=false` on the server. It cannot be overridden by a client query.

