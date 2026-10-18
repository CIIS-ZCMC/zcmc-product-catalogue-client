# Admin user management: API contract

The client screen at `/admin/users` (`src/pages/admin/users-page.jsx`) is built against this contract.
**None of these endpoints exist yet** in `CIIS-ZCMC/zcmc-product-catalogue-server`. As of this writing the
server has only `users.is_admin` and a public `POST /register`. Until the server implements this, the screen
loads but shows the server's 404 as an error. Field names and shapes below are a proposal for the server team.

## Roles

| Role | Stored as | Product access |
| --- | --- | --- |
| Administrator | `is_admin = true` | Everything: all internal categories, delete, user management. |
| Encoder | `is_admin = false` plus one or more assigned internal categories | View all products. Create and edit products **only** in assigned internal categories. Cannot delete. Still sends `confirm_password` to edit. |

An encoder must have at least one assigned internal category. An administrator's assignments are ignored.

## Schema change

New pivot table `internal_category_user` (`user_id`, `internal_category_id`, unique pair, cascade on delete).
Add `users.is_active boolean default true`.

## User resource

```json
{
  "id": 7,
  "first_name": "Maria",
  "last_name": "Santos",
  "name": "Maria Santos",
  "email": "maria@zcmc.gov.ph",
  "is_admin": false,
  "is_active": true,
  "internal_category_ids": [3, 9],
  "internal_categories": [{ "id": 3, "name": "Office Supplies", "code": "OF-SUP" }],
  "created_at": "2026-10-18T02:00:00Z"
}
```

`POST /auth/login` and `GET /auth/me` return the same `user` shape (without `internal_categories` is fine).
The client reads `is_admin` and `internal_category_ids` from it to hide controls the user cannot use.
Inactive users get `403` on login.

## Endpoints (all under `auth:sanctum`, administrators only; others get `403`)

| Method and path | Purpose |
| --- | --- |
| `GET /users` | Paginated list. Query: `search` (name or email), `role` (`admin` or `encoder`), `internal_category_id`, `status` (`active` or `inactive`), `page`, `per_page`. Laravel paginator shape (`data`, `current_page`, `last_page`, `per_page`, `total`, `from`, `to`), like `/products`. |
| `POST /users` | Create. Body: `first_name`, `last_name`, `email`, `password`, `password_confirmation`, `is_admin`, `is_active`, `internal_category_ids[]`. Returns `{ data: User }`. |
| `PUT /users/{id}` | Update. Same body; `password` and `password_confirmation` are optional (omit to keep). Returns `{ data: User }`. |
| `DELETE /users/{id}` | Delete. |

Validation errors use the usual Laravel `422` with `errors`. Keys the client maps onto fields:
`first_name`, `last_name`, `email`, `password`, `password_confirmation`, `internal_category_ids`.

Rules the server must enforce (the client only mirrors them):

- Email unique, lower-cased. Password policy: at least 8 characters, 1 number, 1 special character.
- `internal_category_ids` required (min 1) when `is_admin` is false; every id must exist.
- An administrator cannot delete, deactivate or demote their own account, and the last active administrator can never be removed or demoted (`422` or `403` with a message).
- Deleting a user keeps their activity log rows (null the actor or soft-delete).

## Changes to existing endpoints

- **Remove public registration.** Delete `POST /register` and `POST /auth/register`. Accounts are created only through `POST /users`.
- **Product writes** (`POST /products`, `PUT /products/{id}`, `POST /products/import`, price edits): for encoders, reject with `403` when the product's `internal_category_id` is not assigned to them. Both the old and the new category are checked on update. `DELETE /products/{id}` stays administrator only (already so).
- **`GET /internal-categories`** stays open to all signed-in users (the filters need it).
- **UNSPSC categories** (`POST /categories`, `PUT /categories/{key}`, `DELETE /categories/{key}`): administrators only, `403` for everyone else. Today any signed-in user can call them. The client hides the Add, Edit and Delete controls from non-administrators, which is not a security boundary. Reads (`GET /categories*`) stay open to all signed-in users.
