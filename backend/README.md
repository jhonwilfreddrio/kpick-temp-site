# K-Pick Quote / PO Backend

This backend is intentionally small and dependency-free so it can run on the dev PC now and move to the Mac later.

Primary runtime: Node.js 24+ because this version uses Node's built-in `node:sqlite` module.

Fallback runtime: Python server remains available as `backend/server.py`.

## Run Locally

```powershell
npm.cmd run dev
```
$env:KPICK_HOST='0.0.0.0'
$env:KPICK_ADMIN_PASSWORD='choose-a-strong-admin-fallback-password'
$env:KPICK_AUTH_SECRET=(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
npm.cmd run dev


Open:

```text
http://127.0.0.1:8000/request.htm
```

## API

- `GET /api/health` checks server/database status.
- `GET /api/products` returns active products from SQLite.
- `POST /api/quote-requests` saves a quote/PO request.
- `POST /api/login` logs staff in with ID number and password.
- `GET /api/quote-requests` lists saved POs for logged-in staff.
- `PATCH /api/quote-requests/:id` updates a PO according to staff role permissions.
- `DELETE /api/quote-requests/:id` removes a cancelled/unreachable PO from the active list for CS/Admin.
- `GET /api/reports/summary` returns manager/boss/admin report totals.
- `GET /api/staff-users` lists staff dashboard accounts for Admin.
- `POST /api/staff-users` creates or updates staff dashboard accounts for Admin.
- `DELETE /api/staff-users/:id_number` deactivates a staff dashboard account for Admin.
- `GET /api/inventory-staff` lists active Inventory users for the CS assignment dropdown.

## Data

- Product seed data lives in `backend/seed_products.json`.
- SQLite is created at `backend/data/kpick_quote.sqlite3`, or inside `KPICK_DATA_DIR` when that environment variable is set.
- Google Sheet mirror template: `backend/google-sheet-inventory-template.csv`.
- On Mac deployment, install Node.js 24+, copy the project folder, and run `npm run start`.

## Temporary Node Deployment

This backend needs a persistent Node process and a writable SQLite data directory. Vercel and Netlify Functions can run Node code, but their function filesystems are not a good fit for this exact SQLite backend because writes are temporary/serverless. Use a small Node web service host instead, such as Render or Railway.

For Render/Railway-style deployment:

```text
Build command: npm install
Start command: npm start
```

Environment variables:

```text
KPICK_ADMIN_PASSWORD=choose-a-strong-admin-fallback-password
KPICK_AUTH_SECRET=generate-a-long-random-secret
KPICK_DATA_DIR=/opt/render/project/src/backend/data
```

On Render, attach a persistent disk at the same `KPICK_DATA_DIR` path. On Railway, attach a volume and set `KPICK_DATA_DIR` to the mounted path, such as `/data`. The app also honors the platform `PORT` variable automatically.

## Staff Login

Default local accounts are created automatically the first time the backend starts:

```text
admin  / kpick0324admin / Admin
cs001  / kpick0324admin / CS
inv001 / kpick0324admin / Inventory
mgr001 / kpick0324admin / Manager
boss001 / kpick0324admin / Boss
```

Manager code for CS order, price, and total revisions:

```text
kpick0324admin
```

Admin can alter everything. CS can update SI number, assigned inventory staff, customer details, and order revisions. CS status is automatic: no SI keeps `Generated`; once CS inputs an SI number, CS must also assign inventory staff before saving the workflow, which moves the PO to `Pending for Picking`. CS product, price, quantity, removed-product, or total revisions require the manager code while the PO is still unpaid/generated. Once a PO is paid or beyond `Generated`, CS can no longer delete the PO or change/remove products. CS/Admin can delete a cancelled or unreachable unpaid PO from the active list. Inventory can only update PO condition to `Picking Products`, `For Repacking`, `Ready for Shipment`, or `Released / Shipped`, and only for POs assigned to that logged-in inventory account. Manager and Boss are view/report roles.

Admin can add, edit, rename, change ID numbers, reset passwords/codes, and deactivate staff accounts in `request-admin.htm` after logging in as `admin`.

## SKU Pattern

K-Pick generated SKUs use:

```text
SUN-[CATEGORY]-[DETAILS]
```

Examples:

- `SUN-IS-BL-050-31G-08`: Sungshim insulin syringe, blister, 0.5 mL, 31G, 8 mm.
- `SUN-SU-003-23G-25-LL`: Sungshim single-use syringe, 3 mL, 23G, 25 mm, Luer Lock.
- `SUN-PN-31G-08`: Sungshim pen needle, 31G, 8 mm.
