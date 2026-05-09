import { createServer } from 'node:http';
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import PDFDocument from 'pdfkit';

const backendDir = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(backendDir, '..');
const dataDir = process.env.KPICK_DATA_DIR ? resolve(process.env.KPICK_DATA_DIR) : join(backendDir, 'data');
const dbPath = join(dataDir, 'kpick_quote.sqlite3');
const seedPath = join(backendDir, 'seed_products.json');
const logPath = join(dataDir, 'server.log');
const pdfLogoPath = join(rootDir, 'img', 'KpickLogoDark.png');
const host = process.env.KPICK_HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const port = getPort(process.env.KPICK_PORT || process.env.PORT);
const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(host);
const adminPassword = process.env.KPICK_ADMIN_PASSWORD || (isLocalHost ? 'kpick0324admin' : '');
const authSecret = process.env.KPICK_AUTH_SECRET || (isLocalHost ? `${adminPassword}:${dbPath}` : '');
const googleSheetCsvUrl = process.env.KPICK_INVENTORY_CSV_URL
    || 'https://docs.google.com/spreadsheets/d/1lyGPgs3edGO7EV-Q1mnpzjvsbghojdQ6ocCp4Dxcsak/gviz/tq?tqx=out:csv&sheet=Backend%20Mirror';
const autoSyncInventory = process.env.KPICK_AUTO_SYNC_INVENTORY !== '0';
const inventorySyncIntervalMs = getPositiveInteger(process.env.KPICK_INVENTORY_SYNC_INTERVAL_MS, 30 * 60 * 1000);
const inventorySyncTimeoutMs = getPositiveInteger(process.env.KPICK_INVENTORY_SYNC_TIMEOUT_MS, 15 * 1000);

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.htm': 'text/html; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function getPort(value) {
    const rawPort = value || '8000';
    const parsed = Number(rawPort);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error(`KPICK_PORT must be an integer between 1 and 65535. Received: ${rawPort}`);
    }

    return parsed;
}

function getPositiveInteger(value, fallback) {
    if (value === undefined || value === '') {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function validateRuntimeConfig() {
    if (!isLocalHost && (!process.env.KPICK_ADMIN_PASSWORD || !process.env.KPICK_AUTH_SECRET)) {
        throw new Error('Set KPICK_ADMIN_PASSWORD and KPICK_AUTH_SECRET before binding KPICK_HOST outside localhost.');
    }

    if (!adminPassword) {
        throw new Error('KPICK_ADMIN_PASSWORD is required.');
    }

    if (!authSecret) {
        throw new Error('KPICK_AUTH_SECRET is required.');
    }
}

validateRuntimeConfig();

await mkdir(dataDir, { recursive: true });
const db = new DatabaseSync(dbPath);

function nowIso() {
    return new Date().toISOString();
}

function mondayStart(date = new Date()) {
    const start = new Date(date);
    const day = start.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + offset);
    return start;
}

function monthRange(monthValue) {
    const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/);
    const now = new Date();
    const year = match ? Number(match[1]) : now.getFullYear();
    const monthIndex = match ? Number(match[2]) - 1 : now.getMonth();
    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

    return {
        label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        start,
        end
    };
}

function parseJsonSafe(value, fallback) {
    try {
        return JSON.parse(value || '');
    } catch {
        return fallback;
    }
}

function base64UrlEncode(value) {
    return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value) {
    return createHmac('sha256', authSecret).update(value).digest('base64url');
}

function hashSecret(secret, salt = randomBytes(16).toString('hex')) {
    const hash = pbkdf2Sync(String(secret), salt, 120000, 32, 'sha256').toString('hex');
    return `pbkdf2$${salt}$${hash}`;
}

function verifySecret(secret, storedHash) {
    const parts = String(storedHash || '').split('$');
    if (parts.length !== 3 || parts[0] !== 'pbkdf2') {
        return false;
    }

    const expected = hashSecret(secret, parts[1]).split('$')[2];
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(parts[2], 'hex');

    return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

async function writeLog(message) {
    const timestamp = new Date().toLocaleString();
    await appendFile(logPath, `[${timestamp}] ${message}\n`, 'utf8');
}

function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            sku TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            packaging TEXT,
            carton TEXT,
            gauge TEXT,
            stock_quantity INTEGER,
            stock_unit TEXT,
            unit_price REAL,
            boxes_per_carton INTEGER,
            carton_discount_rate REAL,
            last_synced_at TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS quote_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_number TEXT NOT NULL UNIQUE,
            company TEXT,
            contact TEXT,
            email TEXT,
            mobile TEXT,
            address TEXT,
            maps_url TEXT,
            address_after_payment INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            items_json TEXT NOT NULL,
            totals_json TEXT,
            si_number TEXT,
            assigned_inventory_staff TEXT,
            workflow_status TEXT,
            shipment_ready INTEGER NOT NULL DEFAULT 0,
            workflow_updated_by TEXT,
            workflow_updated_at TEXT,
            deleted_at TEXT,
            deleted_by TEXT,
            deleted_reason TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_users (
            id_number TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            manager_code_hash TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quote_audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id INTEGER,
            action TEXT NOT NULL,
            actor_id TEXT,
            actor_name TEXT,
            actor_role TEXT,
            details_json TEXT,
            created_at TEXT NOT NULL
        );
    `);

    const productColumns = db.prepare('PRAGMA table_info(products)').all().map((column) => column.name);
    const migrations = [
        ['stock_quantity', 'ALTER TABLE products ADD COLUMN stock_quantity INTEGER'],
        ['stock_unit', 'ALTER TABLE products ADD COLUMN stock_unit TEXT'],
        ['unit_price', 'ALTER TABLE products ADD COLUMN unit_price REAL'],
        ['boxes_per_carton', 'ALTER TABLE products ADD COLUMN boxes_per_carton INTEGER'],
        ['carton_discount_rate', 'ALTER TABLE products ADD COLUMN carton_discount_rate REAL'],
        ['last_synced_at', 'ALTER TABLE products ADD COLUMN last_synced_at TEXT'],
        ['totals_json', 'ALTER TABLE quote_requests ADD COLUMN totals_json TEXT'],
        ['address', 'ALTER TABLE quote_requests ADD COLUMN address TEXT'],
        ['maps_url', 'ALTER TABLE quote_requests ADD COLUMN maps_url TEXT'],
        ['address_after_payment', 'ALTER TABLE quote_requests ADD COLUMN address_after_payment INTEGER NOT NULL DEFAULT 0'],
        ['si_number', 'ALTER TABLE quote_requests ADD COLUMN si_number TEXT'],
        ['assigned_inventory_staff', 'ALTER TABLE quote_requests ADD COLUMN assigned_inventory_staff TEXT'],
        ['workflow_status', 'ALTER TABLE quote_requests ADD COLUMN workflow_status TEXT'],
        ['shipment_ready', 'ALTER TABLE quote_requests ADD COLUMN shipment_ready INTEGER NOT NULL DEFAULT 0'],
        ['workflow_updated_by', 'ALTER TABLE quote_requests ADD COLUMN workflow_updated_by TEXT'],
        ['workflow_updated_at', 'ALTER TABLE quote_requests ADD COLUMN workflow_updated_at TEXT'],
        ['deleted_at', 'ALTER TABLE quote_requests ADD COLUMN deleted_at TEXT'],
        ['deleted_by', 'ALTER TABLE quote_requests ADD COLUMN deleted_by TEXT'],
        ['deleted_reason', 'ALTER TABLE quote_requests ADD COLUMN deleted_reason TEXT']
    ];

    const quoteColumns = db.prepare('PRAGMA table_info(quote_requests)').all().map((column) => column.name);

    for (const [columnName, statement] of migrations) {
        const existingColumns = statement.includes('quote_requests') ? quoteColumns : productColumns;
        if (!existingColumns.includes(columnName)) {
            db.exec(statement);
        }
    }

    db.prepare(`
        UPDATE quote_requests
        SET workflow_status = 'Pending for Picking'
        WHERE workflow_status IN ('Assigned to Inventory', 'Pending for Segregation')
    `).run();
    db.prepare(`
        UPDATE quote_requests
        SET workflow_status = 'Picking Products'
        WHERE workflow_status = 'Segregating Products'
    `).run();
}

function seedStaffUsers() {
    const existingUserCount = db.prepare('SELECT COUNT(*) AS count FROM staff_users').get().count;
    if (existingUserCount > 0) {
        return;
    }

    const defaults = [
        { id: 'admin', name: 'K-Pick Admin', role: 'Admin', password: 'kpick0324admin', managerCode: 'kpick0324admin' },
        { id: 'cs001', name: 'CS Staff', role: 'CS', password: 'kpick0324admin' },
        { id: 'inv001', name: 'Inventory Staff', role: 'Inventory', password: 'kpick0324admin' },
        { id: 'mgr001', name: 'Manager', role: 'Manager', password: 'kpick0324admin', managerCode: 'kpick0324admin' },
        { id: 'boss001', name: 'Boss', role: 'Boss', password: 'kpick0324admin' }
    ];
    const existing = db.prepare('SELECT id_number FROM staff_users WHERE id_number = ?');
    const insert = db.prepare(`
        INSERT INTO staff_users (id_number, name, role, password_hash, manager_code_hash, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);

    for (const user of defaults) {
        const timestamp = nowIso();
        if (existing.get(user.id)) {
            continue;
        }

        insert.run(
            user.id,
            user.name,
            user.role,
            hashSecret(user.password),
            user.managerCode ? hashSecret(user.managerCode) : null,
            timestamp,
            timestamp
        );
    }
}

async function seedProducts() {
    if (!existsSync(seedPath)) {
        return;
    }

    let categories;
    try {
        const seedText = (await readFile(seedPath, 'utf8')).replace(/^\uFEFF/, '');
        categories = JSON.parse(seedText);
    } catch (error) {
        throw new Error(`Unable to parse product seed file at ${seedPath}: ${error.message}`);
    }

    if (!Array.isArray(categories)) {
        throw new Error(`Product seed file must contain an array of categories: ${seedPath}`);
    }

    const updatedAt = nowIso();
    db.prepare('UPDATE products SET active = 0, updated_at = ?').run(updatedAt);
    const statement = db.prepare(`
        INSERT INTO products (sku, category, name, packaging, carton, gauge, stock_unit, unit_price, boxes_per_carton, carton_discount_rate, active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(sku) DO UPDATE SET
            category = excluded.category,
            name = excluded.name,
            packaging = excluded.packaging,
            carton = excluded.carton,
            gauge = excluded.gauge,
            stock_unit = excluded.stock_unit,
            unit_price = excluded.unit_price,
            boxes_per_carton = excluded.boxes_per_carton,
            carton_discount_rate = excluded.carton_discount_rate,
            active = 1,
            updated_at = excluded.updated_at
    `);

    for (const category of categories) {
        if (!category || typeof category !== 'object' || !category.category || !Array.isArray(category.items)) {
            throw new Error(`Invalid product seed category in ${seedPath}. Each category needs category and items fields.`);
        }

        for (const item of category.items) {
            if (!item || typeof item !== 'object' || !item.sku || !item.name) {
                throw new Error(`Invalid product seed item in ${category.category}. Each item needs sku and name fields.`);
            }

            statement.run(
                item.sku,
                category.category,
                item.name,
                item.packaging || null,
                item.carton || null,
                item.gauge || null,
                item.stock_unit || null,
                Number.isFinite(Number(item.unit_price)) ? Number(item.unit_price) : null,
                item.boxes_per_carton || null,
                Number.isFinite(Number(item.carton_discount_rate)) ? Number(item.carton_discount_rate) : 0.15,
                updatedAt
            );
        }
    }
}

function slugify(value) {
    return value.toLowerCase().replaceAll(' ', '-');
}

function getProductCategories() {
    const rows = db.prepare(`
        SELECT sku, category, name, packaging, carton, gauge, stock_quantity, stock_unit, unit_price, boxes_per_carton, carton_discount_rate, last_synced_at
        FROM products
        WHERE active = 1
        ORDER BY
            CASE category
                WHEN 'Insulin Syringe' THEN 1
                WHEN 'Single-Use Syringe' THEN 2
                WHEN 'LDS Syringe' THEN 3
                WHEN 'Pen Needles' THEN 4
                ELSE 99
            END,
            name
    `).all();

    const grouped = new Map();
    for (const row of rows) {
        if (!grouped.has(row.category)) {
            grouped.set(row.category, []);
        }
        grouped.get(row.category).push({
            sku: row.sku,
            name: row.name,
            packaging: row.packaging,
            carton: row.carton,
            gauge: row.gauge,
            stock_quantity: row.stock_quantity,
            stock_unit: row.stock_unit,
            unit_price: row.unit_price,
            boxes_per_carton: row.boxes_per_carton,
            carton_discount_rate: row.carton_discount_rate,
            last_synced_at: row.last_synced_at
        });
    }

    return Array.from(grouped.entries()).map(([name, items]) => ({
        id: slugify(name),
        name,
        items
    }));
}

function parseCsv(text) {
    if (typeof text !== 'string') {
        throw new Error('CSV input must be text.');
    }

    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];

        if (char === '"' && inQuotes && next === '"') {
            cell += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(cell);
            cell = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') {
                index += 1;
            }
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
            continue;
        }

        cell += char;
    }

    if (inQuotes) {
        throw new Error('CSV input has an unterminated quoted field.');
    }

    if (cell || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }

    return rows.filter((entry) => entry.some((value) => String(value).trim()));
}

function normalizeHeader(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseNumber(value) {
    const cleaned = String(value || '').replace(/,/g, '').trim();
    if (!cleaned) {
        return null;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
}

async function syncInventoryFromGoogleSheet() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), inventorySyncTimeoutMs);
    let response;

    try {
        response = await fetch(googleSheetCsvUrl, { signal: controller.signal });
    } catch (error) {
        throw new Error(error.name === 'AbortError'
            ? `Google Sheet CSV sync timed out after ${inventorySyncTimeoutMs}ms.`
            : error.message);
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error(`Google Sheet CSV returned ${response.status}`);
    }

    const text = await response.text();
    const rows = parseCsv(text.replace(/^\uFEFF/, ''));

    if (rows.length < 2) {
        throw new Error('Google Sheet CSV must include a header row and at least one product row.');
    }

    const headers = (rows.shift() || []).map(normalizeHeader);

    if (!headers.includes('sku')) {
        throw new Error('Google Sheet CSV is missing a SKU column.');
    }

    const syncedAt = nowIso();
    let updated = 0;
    const missingSkus = [];

    const update = db.prepare(`
        UPDATE products
        SET
            name = COALESCE(NULLIF(?, ''), name),
            category = COALESCE(NULLIF(?, ''), category),
            stock_quantity = COALESCE(?, stock_quantity),
            stock_unit = COALESCE(NULLIF(?, ''), stock_unit),
            unit_price = COALESCE(?, unit_price),
            last_synced_at = ?,
            active = 1,
            updated_at = ?
        WHERE sku = ?
    `);

    for (const values of rows) {
        const record = {};
        headers.forEach((header, index) => {
            record[header] = String(values[index] || '').trim();
        });

        const sku = record.sku;
        if (!sku) {
            continue;
        }

        const result = update.run(
            record.product_name || record.product || record.name || '',
            record.category || '',
            parseNumber(record.stock),
            record.unit || '',
            parseNumber(record.price),
            syncedAt,
            syncedAt,
            sku
        );

        if (result.changes > 0) {
            updated += result.changes;
        } else {
            missingSkus.push(sku);
        }
    }

    return {
        updated,
        missing_skus: missingSkus,
        synced_at: syncedAt,
        source: googleSheetCsvUrl
    };
}

let inventorySyncInProgress = null;

async function syncInventorySafely(reason) {
    if (inventorySyncInProgress) {
        return inventorySyncInProgress;
    }

    inventorySyncInProgress = syncInventoryFromGoogleSheet()
        .then(async (result) => {
            await writeLog(`Inventory ${reason} sync completed: ${result.updated} products updated.`);
            return result;
        })
        .catch(async (error) => {
            await writeLog(`Inventory ${reason} sync failed: ${error.stack || error.message}`);
            return null;
        })
        .finally(() => {
            inventorySyncInProgress = null;
        });

    return inventorySyncInProgress;
}

function getRequestBody(request) {
    return new Promise((resolveBody, rejectBody) => {
        let body = '';
        request.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1_000_000) {
                request.destroy();
                rejectBody(new Error('Request body too large.'));
            }
        });
        request.on('end', () => resolveBody(body));
        request.on('error', rejectBody);
    });
}

async function getJsonBody(request, options = {}) {
    const bodyText = await getRequestBody(request);
    if (!bodyText.trim()) {
        if (options.allowEmpty) {
            return {};
        }

        throw new Error('Request body must be valid JSON.');
    }

    try {
        return JSON.parse(bodyText);
    } catch {
        throw new Error('Request body must be valid JSON.');
    }
}

function cleanCustomer(customer = {}) {
    const addressAfterPayment = Boolean(customer.address_after_payment);

    return {
        company: String(customer.company || '').trim(),
        contact: String(customer.contact || '').trim(),
        email: String(customer.email || '').trim(),
        mobile: String(customer.mobile || '').trim(),
        address: addressAfterPayment ? '' : String(customer.address || '').trim(),
        maps_url: addressAfterPayment ? '' : String(customer.maps_url || '').trim(),
        address_after_payment: addressAfterPayment,
        notes: String(customer.notes || '').trim()
    };
}

function getProductBySku(sku) {
    return db.prepare(`
        SELECT sku, category, name, packaging, carton, gauge, stock_quantity, stock_unit, unit_price, boxes_per_carton, carton_discount_rate
        FROM products
        WHERE active = 1 AND sku = ?
    `).get(sku);
}

function normalizeQuoteItems(rawItems, options = {}) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new Error('Select at least one product.');
    }

    return rawItems.map((rawItem) => {
        const sku = String(rawItem.sku || '').trim();
        const product = getProductBySku(sku);

        if (!product) {
            throw new Error(`Unknown product SKU: ${sku}`);
        }

        const quantity = Math.max(1, Number.parseInt(rawItem.quantity, 10) || 1);
        const priceOverride = Number(rawItem.unit_price);

        return {
            ...product,
            quantity,
            unit_price: options.allowPriceOverride && Number.isFinite(priceOverride) && priceOverride >= 0
                ? priceOverride
                : product.unit_price
        };
    });
}

function validateQuote(payload) {
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    const items = normalizeQuoteItems(rawItems);

    const customer = cleanCustomer(payload.customer || {});
    const requiredFields = [
        ['company', 'Company / Clinic / Hospital / Buyer Name'],
        ['contact', 'Contact Person'],
        ['email', 'Email'],
        ['mobile', 'Mobile'],
        ...(customer.address_after_payment ? [] : [['address', 'Delivery Address']])
    ];
    const missingField = requiredFields.find(([field]) => !customer[field]);

    if (missingField) {
        throw new Error(`${missingField[1]} is required.`);
    }

    return { customer, items };
}

function money(value) {
    return `PHP ${Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function calculateQuotePricing(items) {
    const groupTotals = new Map();

    for (const item of items) {
        const boxesPerCarton = Number(item.boxes_per_carton) || 0;
        if (!boxesPerCarton) {
            continue;
        }

        groupTotals.set(String(boxesPerCarton), (groupTotals.get(String(boxesPerCarton)) || 0) + Number(item.quantity || 0));
    }

    let subtotal = 0;
    let cartonDiscount = 0;
    const pricedItems = items.map((item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const boxesPerCarton = Number(item.boxes_per_carton) || 0;
        const discountRate = Number.isFinite(Number(item.carton_discount_rate)) ? Number(item.carton_discount_rate) : 0.15;
        const groupQuantity = groupTotals.get(String(boxesPerCarton)) || 0;
        const discountEligible = boxesPerCarton > 0 && groupQuantity >= boxesPerCarton;
        const lineSubtotal = unitPrice * quantity;
        const lineDiscount = discountEligible ? lineSubtotal * discountRate : 0;
        const lineTotal = lineSubtotal - lineDiscount;

        subtotal += lineSubtotal;
        cartonDiscount += lineDiscount;

        return {
            ...item,
            quantity,
            unit_price: unitPrice,
            boxes_per_carton: boxesPerCarton,
            carton_discount_rate: discountRate,
            discount_eligible: discountEligible,
            discount_group_quantity: groupQuantity,
            line_subtotal: lineSubtotal,
            line_discount: lineDiscount,
            line_total: lineTotal
        };
    });

    return {
        items: pricedItems,
        totals: {
            subtotal,
            carton_discount: cartonDiscount,
            grand_total: subtotal - cartonDiscount
        }
    };
}

function createQuote(payload) {
    const { customer, items } = validateQuote(payload);
    const pricing = calculateQuotePricing(items);
    const createdAt = nowIso();
    const insert = db.prepare(`
        INSERT INTO quote_requests (request_number, company, contact, email, mobile, address, maps_url, address_after_payment, notes, items_json, totals_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
        'pending',
        customer.company,
        customer.contact,
        customer.email,
        customer.mobile,
        customer.address,
        customer.maps_url,
        customer.address_after_payment ? 1 : 0,
        customer.notes,
        JSON.stringify(pricing.items),
        JSON.stringify(pricing.totals),
        createdAt
    );
    const id = Number(result.lastInsertRowid);
    const requestNumber = `KPQ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(id).padStart(4, '0')}`;

    db.prepare('UPDATE quote_requests SET request_number = ? WHERE id = ?').run(requestNumber, id);

    const quote = {
        id,
        request_number: requestNumber,
        created_at: createdAt,
        customer,
        items: pricing.items,
        totals: pricing.totals
    };

    return {
        ...quote,
        pdf_url: quotePdfUrl(quote)
    };
}

function queueMetaFromRow(row) {
    const weekStart = mondayStart();
    const createdAt = new Date(row.created_at);
    const status = row.workflow_status || 'Generated';
    const isCompleted = status === 'Released / Shipped';
    const isCurrentWeek = !Number.isNaN(createdAt.getTime()) && createdAt >= weekStart;
    const isCarryover = !isCurrentWeek && !isCompleted;
    const ageDays = Number.isNaN(createdAt.getTime())
        ? 0
        : Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
    let warning = '';

    if (isCarryover) {
        if (status === 'Generated') {
            warning = 'Carryover: no SI yet from a previous week.';
        } else if (status === 'Paid / SI Issued' || status === 'Pending for Picking') {
            warning = 'Carryover: pending for picking from a previous week.';
        } else if (status === 'Ready for Shipment') {
            warning = 'Carryover: ready but not released/shipped yet.';
        } else {
            warning = `Carryover: still ${status.toLowerCase()} from a previous week.`;
        }
    }

    return {
        is_current_week: isCurrentWeek,
        is_carryover: isCarryover,
        age_days: ageDays,
        week_start: weekStart.toISOString(),
        warning
    };
}

function quoteFromRow(row) {
    const items = parseJsonSafe(row.items_json, []);
    const totals = row.totals_json ? parseJsonSafe(row.totals_json, {}) : calculateQuotePricing(items).totals;

    const quote = {
        id: row.id,
        request_number: row.request_number,
        created_at: row.created_at,
        customer: {
            company: row.company || '',
            contact: row.contact || '',
            email: row.email || '',
            mobile: row.mobile || '',
            address: row.address || '',
            maps_url: row.maps_url || '',
            address_after_payment: Boolean(row.address_after_payment),
            notes: row.notes || ''
        },
        items,
        totals,
        workflow: quoteWorkflowFromRow(row),
        queue: queueMetaFromRow(row)
    };

    return {
        ...quote,
        pdf_url: quotePdfUrl(quote)
    };
}

function listQuotes(options = {}) {
    const rows = db.prepare(`
        SELECT id, request_number, company, contact, email, mobile, address, maps_url, address_after_payment, notes, items_json, totals_json,
               si_number, assigned_inventory_staff, workflow_status, shipment_ready, workflow_updated_by, workflow_updated_at,
               created_at
        FROM quote_requests
        WHERE deleted_at IS NULL
        ORDER BY id DESC
    `).all();
    const quotes = rows.map(quoteFromRow);

    if (options.mode === 'all') {
        return quotes;
    }

    return quotes.filter((quote) => quote.queue.is_current_week || quote.queue.is_carryover);
}

function getQuote(id) {
    const row = db.prepare(`
        SELECT id, request_number, company, contact, email, mobile, address, maps_url, address_after_payment, notes, items_json, totals_json,
               si_number, assigned_inventory_staff, workflow_status, shipment_ready, workflow_updated_by, workflow_updated_at,
               created_at
        FROM quote_requests
        WHERE id = ? AND deleted_at IS NULL
    `).get(id);

    if (!row) {
        return null;
    }

    return quoteFromRow(row);
}

function quoteWorkflowFromRow(row) {
    return {
        si_number: row.si_number || '',
        assigned_inventory_staff: row.assigned_inventory_staff || '',
        workflow_status: row.workflow_status || 'Generated',
        shipment_ready: Boolean(row.shipment_ready),
        workflow_updated_by: row.workflow_updated_by || '',
        workflow_updated_at: row.workflow_updated_at || ''
    };
}

function isQuotePaidOrBeyond(quote) {
    const workflow = quote.workflow || {};
    return Boolean(workflow.si_number)
        || Boolean(workflow.assigned_inventory_staff)
        || (workflow.workflow_status && workflow.workflow_status !== 'Generated');
}

function createToken(user) {
    const payload = base64UrlEncode(JSON.stringify({
        version: 1,
        id_number: user.id_number,
        name: user.name,
        role: user.role,
        exp: Date.now() + 1000 * 60 * 60 * 12
    }));

    return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature || sign(payload) !== signature) {
        return null;
    }

    let data;
    try {
        data = JSON.parse(base64UrlDecode(payload));
    } catch {
        return null;
    }

    if (data.version && data.version !== 1) {
        return null;
    }

    if (!data.exp || data.exp < Date.now()) {
        return null;
    }

    return db.prepare(`
        SELECT id_number, name, role, active
        FROM staff_users
        WHERE id_number = ? AND active = 1
    `).get(data.id_number) || null;
}

function createQuotePdfToken(quote) {
    const payload = base64UrlEncode(JSON.stringify({
        version: 1,
        purpose: 'quote-pdf',
        id: quote.id,
        request_number: quote.request_number,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 14
    }));

    return `${payload}.${sign(payload)}`;
}

function verifyQuotePdfToken(token, quote) {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature || sign(payload) !== signature) {
        return false;
    }

    let data;
    try {
        data = JSON.parse(base64UrlDecode(payload));
    } catch {
        return false;
    }

    return data.version === 1
        && data.purpose === 'quote-pdf'
        && data.id === quote.id
        && data.request_number === quote.request_number
        && data.exp
        && data.exp >= Date.now();
}

function quotePdfUrl(quote) {
    return `/api/quote-requests/${quote.id}/pdf?token=${encodeURIComponent(createQuotePdfToken(quote))}`;
}

function userFromRequest(request) {
    const authorization = request.headers.authorization || '';
    const bearer = authorization.match(/^Bearer\s+(.+)$/i);

    if (bearer) {
        return verifyToken(bearer[1]);
    }

    if (adminPassword && request.headers['x-admin-password'] === adminPassword) {
        return { id_number: 'admin', name: 'K-Pick Admin', role: 'Admin', active: 1 };
    }

    return null;
}

function canReadQuotePdf(request, quote, url) {
    if (verifyQuotePdfToken(url.searchParams.get('token'), quote)) {
        return true;
    }

    const user = userFromRequest(request);
    return Boolean(user && ['Admin', 'CS', 'Inventory', 'Manager', 'Boss'].includes(user.role));
}

function requireUser(request, response, roles = []) {
    const user = userFromRequest(request);
    if (!user) {
        sendJson(response, 401, { error: 'Login is required.' });
        return null;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        sendJson(response, 403, { error: 'Your account is not allowed to do this action.' });
        return null;
    }

    return user;
}

function logAudit(quoteId, action, actor, details = {}) {
    db.prepare(`
        INSERT INTO quote_audit_log (quote_id, action, actor_id, actor_name, actor_role, details_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        quoteId,
        action,
        actor?.id_number || '',
        actor?.name || '',
        actor?.role || '',
        JSON.stringify(details),
        nowIso()
    );
}

function validateManagerCode(code) {
    const rows = db.prepare(`
        SELECT manager_code_hash
        FROM staff_users
        WHERE active = 1
          AND role IN ('Manager', 'Admin')
          AND manager_code_hash IS NOT NULL
    `).all();

    return rows.some((row) => verifySecret(code, row.manager_code_hash));
}

function loginStaff(payload) {
    const idNumber = String(payload.id_number || '').trim();
    const password = String(payload.password || '');
    const user = db.prepare(`
        SELECT id_number, name, role, password_hash
        FROM staff_users
        WHERE id_number = ? AND active = 1
    `).get(idNumber);

    if (!user || !verifySecret(password, user.password_hash)) {
        throw new Error('Invalid ID number or password.');
    }

    return {
        token: createToken(user),
        user: {
            id_number: user.id_number,
            name: user.name,
            role: user.role
        }
    };
}

function listStaffUsers() {
    return db.prepare(`
        SELECT id_number, name, role, active, created_at, updated_at
        FROM staff_users
        ORDER BY role, name
    `).all();
}

function listInventoryStaff() {
    return db.prepare(`
        SELECT id_number, name
        FROM staff_users
        WHERE role = 'Inventory' AND active = 1
        ORDER BY name
    `).all();
}

function isAssignedInventoryActor(assignedInventoryStaff, actor) {
    const assigned = String(assignedInventoryStaff || '').trim().toLowerCase();
    return Boolean(assigned)
        && [actor.id_number, actor.name]
            .map((value) => String(value || '').trim().toLowerCase())
            .includes(assigned);
}

function saveStaffUser(payload) {
    const idNumber = String(payload.id_number || '').trim();
    const originalIdNumber = String(payload.original_id_number || idNumber).trim();
    const name = String(payload.name || '').trim();
    const role = String(payload.role || '').trim();
    const password = String(payload.password || '');
    const managerCode = String(payload.manager_code || '');
    const active = payload.active === false ? 0 : 1;
    const allowedRoles = ['Admin', 'CS', 'Inventory', 'Manager', 'Boss'];

    if (!idNumber || !name || !allowedRoles.includes(role)) {
        throw new Error('ID number, name, and valid role are required.');
    }

    const existing = db.prepare('SELECT password_hash, manager_code_hash, created_at FROM staff_users WHERE id_number = ?').get(originalIdNumber);
    const idConflict = originalIdNumber !== idNumber
        ? db.prepare('SELECT id_number FROM staff_users WHERE id_number = ?').get(idNumber)
        : null;

    if (idConflict) {
        throw new Error('That ID number is already used by another account.');
    }

    if (!existing && !password) {
        throw new Error('Password is required for a new staff account.');
    }

    const timestamp = nowIso();
    const passwordHash = password ? hashSecret(password) : existing.password_hash;
    const managerCodeHash = managerCode
        ? hashSecret(managerCode)
        : (role === 'Manager' || role === 'Admin' ? existing?.manager_code_hash || null : null);

    if (existing) {
        db.prepare(`
            UPDATE staff_users
            SET
                id_number = ?,
                name = ?,
                role = ?,
                password_hash = ?,
                manager_code_hash = ?,
                active = ?,
                updated_at = ?
            WHERE id_number = ?
        `).run(idNumber, name, role, passwordHash, managerCodeHash, active, timestamp, originalIdNumber);
    } else {
        db.prepare(`
            INSERT INTO staff_users (id_number, name, role, password_hash, manager_code_hash, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(idNumber, name, role, passwordHash, managerCodeHash, active, timestamp, timestamp);
    }

    return db.prepare(`
        SELECT id_number, name, role, active, created_at, updated_at
        FROM staff_users
        WHERE id_number = ?
    `).get(idNumber);
}

function deactivateStaffUser(idNumber, actor) {
    const targetId = String(idNumber || '').trim();
    const user = db.prepare('SELECT id_number, name, role, active FROM staff_users WHERE id_number = ?').get(targetId);

    if (!user) {
        return null;
    }

    if (targetId === actor.id_number) {
        throw new Error('You cannot delete your own active login account.');
    }

    if (user.role === 'Admin' && user.active) {
        const activeAdmins = db.prepare(`
            SELECT COUNT(*) AS count
            FROM staff_users
            WHERE role = 'Admin' AND active = 1
        `).get().count;

        if (activeAdmins <= 1) {
            throw new Error('At least one active Admin account is required.');
        }
    }

    const timestamp = nowIso();
    db.prepare('UPDATE staff_users SET active = 0, updated_at = ? WHERE id_number = ?').run(timestamp, targetId);

    return db.prepare(`
        SELECT id_number, name, role, active, created_at, updated_at
        FROM staff_users
        WHERE id_number = ?
    `).get(targetId);
}

function getReportSummary(options = {}) {
    const activeRows = db.prepare(`
        SELECT id, request_number, items_json, totals_json, workflow_status, created_at, deleted_at, deleted_by, deleted_reason
        FROM quote_requests
        WHERE deleted_at IS NULL
    `).all();
    const deletedRows = db.prepare(`
        SELECT id, request_number, company, contact, items_json, totals_json, workflow_status, created_at, deleted_at, deleted_by, deleted_reason
        FROM quote_requests
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
    `).all();
    const rowsByStatus = db.prepare(`
        SELECT workflow_status, COUNT(*) AS count
        FROM quote_requests
        WHERE deleted_at IS NULL
        GROUP BY workflow_status
    `).all();
    const month = monthRange(options.month);
    const soldStatuses = new Set(['Paid / SI Issued', 'Pending for Picking', 'Picking Products', 'For Repacking', 'Ready for Shipment', 'Released / Shipped']);
    const queueRows = activeRows.map((row) => ({ row, queue: queueMetaFromRow(row) }));
    const totals = activeRows.reduce((sum, row) => sum + Number(parseJsonSafe(row.totals_json, {}).grand_total || 0), 0);
    const monthRows = activeRows.filter((row) => {
        const createdAt = new Date(row.created_at);
        return createdAt >= month.start && createdAt < month.end;
    });
    const soldRows = monthRows.filter((row) => soldStatuses.has(row.workflow_status || 'Generated'));
    const cancelledRows = deletedRows.filter((row) => {
        const deletedAt = new Date(row.deleted_at);
        return deletedAt >= month.start && deletedAt < month.end;
    });

    const productMap = new Map();
    for (const row of soldRows) {
        for (const item of parseJsonSafe(row.items_json, [])) {
            const key = item.sku || item.name;
            const current = productMap.get(key) || {
                sku: item.sku || '',
                name: item.name || 'Unknown product',
                category: item.category || '',
                quantity: 0,
                total: 0
            };

            current.quantity += Number(item.quantity || 0);
            current.total += Number(item.line_total || 0);
            productMap.set(key, current);
        }
    }

    const monthlyProducts = Array.from(productMap.values())
        .sort((first, second) => second.quantity - first.quantity || second.total - first.total)
        .slice(0, 12);

    return {
        report_month: month.label,
        total_requests: activeRows.length,
        grand_total: totals,
        weekly_queue: {
            current_week: queueRows.filter((entry) => entry.queue.is_current_week).length,
            carryover: queueRows.filter((entry) => entry.queue.is_carryover).length,
            hidden_completed_old: activeRows.length - queueRows.filter((entry) => entry.queue.is_current_week || entry.queue.is_carryover).length
        },
        monthly: {
            po_count: monthRows.length,
            sold_po_count: soldRows.length,
            sold_total: soldRows.reduce((sum, row) => sum + Number(parseJsonSafe(row.totals_json, {}).grand_total || 0), 0),
            cancelled_count: cancelledRows.length,
            cancelled_total: cancelledRows.reduce((sum, row) => sum + Number(parseJsonSafe(row.totals_json, {}).grand_total || 0), 0)
        },
        monthly_products: monthlyProducts,
        cancelled_pos: cancelledRows.slice(0, 12).map((row) => ({
            request_number: row.request_number,
            company: row.company || '',
            contact: row.contact || '',
            grand_total: Number(parseJsonSafe(row.totals_json, {}).grand_total || 0),
            workflow_status: row.workflow_status || 'Generated',
            deleted_at: row.deleted_at,
            deleted_by: row.deleted_by || '',
            deleted_reason: row.deleted_reason || ''
        })),
        by_status: rowsByStatus.map((row) => ({
            status: row.workflow_status || 'Generated',
            count: row.count
        }))
    };
}

function updateQuote(id, payload, actor) {
    const existing = getQuote(id);
    if (!existing) {
        return null;
    }

    const current = existing.workflow;
    const inventoryStatuses = ['Picking Products', 'For Repacking', 'Ready for Shipment', 'Released / Shipped'];
    const salesStatuses = ['Generated', 'Pending for Picking', ...inventoryStatuses];
    const isAdmin = actor.role === 'Admin';
    const isCs = actor.role === 'CS';
    const isInventory = actor.role === 'Inventory';

    if (!isAdmin && !isCs && !isInventory) {
        throw new Error('This role is view-only for PO records.');
    }

    if (isInventory) {
        if (!isAssignedInventoryActor(current.assigned_inventory_staff, actor)) {
            throw new Error('Only the inventory staff assigned to this PO can update its inventory status.');
        }

        const requestedStatus = String(payload.workflow_status || current.workflow_status || '').trim();
        if (!inventoryStatuses.includes(requestedStatus)) {
            throw new Error('Inventory can only update picking, repacking, ready, or released status.');
        }

        const shipmentReady = requestedStatus === 'Ready for Shipment'
            || requestedStatus === 'Released / Shipped'
            || Boolean(payload.shipment_ready);
        const updatedAt = nowIso();
        db.prepare(`
            UPDATE quote_requests
            SET workflow_status = ?, shipment_ready = ?, workflow_updated_by = ?, workflow_updated_at = ?
            WHERE id = ?
        `).run(requestedStatus, shipmentReady ? 1 : 0, actor.name, updatedAt, id);
        logAudit(id, 'inventory_status_update', actor, { workflow_status: requestedStatus, shipment_ready: shipmentReady });
        return getQuote(id);
    }

    let customer = existing.customer;
    if (payload.customer && (isAdmin || isCs)) {
        customer = cleanCustomer({ ...customer, ...payload.customer });
    }

    let items = existing.items;
    let totals = existing.totals;
    if (Array.isArray(payload.items)) {
        if (isCs && isQuotePaidOrBeyond(existing)) {
            throw new Error('CS cannot change or remove products after the PO is paid.');
        }

        const hasApproval = isAdmin || validateManagerCode(payload.manager_code);
        if (!hasApproval) {
            throw new Error('Manager code is required before changing products, quantities, prices, or totals.');
        }

        const pricing = calculateQuotePricing(normalizeQuoteItems(payload.items, { allowPriceOverride: true }));
        items = pricing.items;
        totals = pricing.totals;
    }

    const siNumber = String(payload.si_number ?? current.si_number ?? '').trim();
    const assignedInventoryStaff = String(payload.assigned_inventory_staff ?? current.assigned_inventory_staff ?? '').trim();
    const shipmentReady = isAdmin ? Boolean(payload.shipment_ready) : Boolean(current.shipment_ready);
    let status = current.workflow_status || 'Generated';

    if (isCs && siNumber && !assignedInventoryStaff) {
        throw new Error('Assign inventory staff before saving an SI workflow update.');
    }

    if (isAdmin && payload.workflow_status) {
        status = String(payload.workflow_status || status).trim();
        if (!salesStatuses.includes(status)) {
            status = current.workflow_status || 'Generated';
        }
    } else if (isCs) {
        if (inventoryStatuses.includes(current.workflow_status)) {
            status = current.workflow_status;
        } else if (siNumber && assignedInventoryStaff) {
            status = 'Pending for Picking';
        } else {
            status = 'Generated';
        }
    }

    const updatedAt = nowIso();
    db.prepare(`
        UPDATE quote_requests
        SET
            company = ?,
            contact = ?,
            email = ?,
            mobile = ?,
            address = ?,
            maps_url = ?,
            address_after_payment = ?,
            notes = ?,
            items_json = ?,
            totals_json = ?,
            si_number = ?,
            assigned_inventory_staff = ?,
            workflow_status = ?,
            shipment_ready = ?,
            workflow_updated_by = ?,
            workflow_updated_at = ?
        WHERE id = ?
    `).run(
        customer.company,
        customer.contact,
        customer.email,
        customer.mobile,
        customer.address,
        customer.maps_url,
        customer.address_after_payment ? 1 : 0,
        customer.notes,
        JSON.stringify(items),
        JSON.stringify(totals),
        siNumber,
        assignedInventoryStaff,
        status,
        shipmentReady ? 1 : 0,
        actor.name,
        updatedAt,
        id
    );

    logAudit(id, 'po_update', actor, {
        changed_customer: Boolean(payload.customer),
        changed_items: Array.isArray(payload.items),
        workflow_status: status
    });
    return getQuote(id);
}

function deleteQuote(id, payload, actor) {
    const existing = getQuote(id);
    if (!existing) {
        return null;
    }

    if (!['Admin', 'CS'].includes(actor.role)) {
        throw new Error('Only CS or Admin can delete a PO.');
    }

    if (actor.role === 'CS' && isQuotePaidOrBeyond(existing)) {
        throw new Error('CS cannot delete a PO after it is paid.');
    }

    const deletedAt = nowIso();
    const reason = String(payload.reason || '').trim();
    db.prepare(`
        UPDATE quote_requests
        SET deleted_at = ?, deleted_by = ?, deleted_reason = ?, workflow_updated_by = ?, workflow_updated_at = ?
        WHERE id = ?
    `).run(deletedAt, actor.name, reason, actor.name, deletedAt, id);

    logAudit(id, 'po_deleted', actor, { reason });
    return {
        ...existing,
        deleted_at: deletedAt,
        deleted_by: actor.name,
        deleted_reason: reason
    };
}

function sendQuotePdf(response, quote) {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
        const pdf = Buffer.concat(chunks);
        response.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${quote.request_number}.pdf"`,
            'Content-Length': pdf.length
        });
        response.end(pdf);
    });

    if (existsSync(pdfLogoPath)) {
        doc.image(pdfLogoPath, 48, 42, { width: 170 });
        doc.moveDown(3.2);
    } else {
        doc.fontSize(20).text('K-Pick Trading Corp.', { align: 'left' });
        doc.moveDown(0.35);
    }

    doc.moveDown(0.35);
    doc.fontSize(14).text('Quote / Purchase Order Request');
    doc.moveDown(0.8);
    doc.fontSize(11).text(`PO Number: ${quote.request_number}`);
    doc.text(`Created: ${new Date(quote.created_at).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(13).text('Customer Details', { underline: true });
    doc.fontSize(10);
    doc.text(`Company / Clinic / Hospital / Buyer Name: ${quote.customer.company || 'Not provided'}`);
    doc.text(`Contact Person: ${quote.customer.contact || 'Not provided'}`);
    doc.text(`Email: ${quote.customer.email || 'Not provided'}`);
    doc.text(`Mobile: ${quote.customer.mobile || 'Not provided'}`);
    doc.text(`Delivery Address: ${quote.customer.address_after_payment ? 'To be added after payment' : (quote.customer.address || 'Not provided')}`);
    if (quote.customer.maps_url) {
        doc.text(`Google Maps Pin: ${quote.customer.maps_url}`);
    }
    if (quote.customer.notes) {
        doc.text(`Notes: ${quote.customer.notes}`);
    }
    doc.moveDown();

    doc.fontSize(13).text('Selected Products', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(9);

    quote.items.forEach((item, index) => {
        const discountText = item.line_discount ? ` | Discount: ${money(item.line_discount)}` : '';
        doc.text(`${index + 1}. ${item.name}`);
        doc.text(`   SKU: ${item.sku} | Qty: ${item.quantity} ${item.stock_unit || 'box'} | Unit: ${money(item.unit_price)} | Line: ${money(item.line_total)}${discountText}`);
        if (item.discount_eligible) {
            doc.text(`   15% carton discount applied (${item.discount_group_quantity}/${item.boxes_per_carton} boxes group)`);
        }
        doc.moveDown(0.35);
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ${money(quote.totals.subtotal)}`, { align: 'right' });
    doc.text(`Carton Discount: ${money(quote.totals.carton_discount)}`, { align: 'right' });
    doc.fontSize(15).text(`Grand Total: ${money(quote.totals.grand_total)}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(9).fillColor('#555555').text('Generated by the K-Pick local quote backend. Final approval and stock confirmation may still be required.', { align: 'center' });
    doc.end();
}

function sendJson(response, status, data) {
    const body = JSON.stringify(data);
    response.writeHead(status, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
    });
    response.end(body);
}

function sendText(response, status, text) {
    response.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(text)
    });
    response.end(text);
}

function isPathInsideRoot(filePath) {
    return filePath === rootDir || filePath.startsWith(`${rootDir}${sep}`);
}

function isPublicStaticPath(pathname) {
    const publicPrefixes = ['/css/', '/img/', '/script/'];
    const publicRootFiles = new Set([
        '/',
        '/index.html',
        '/contact.htm',
        '/request.htm',
        '/request-admin.htm',
        '/robots.txt',
        '/sitemap.xml'
    ]);

    if (publicRootFiles.has(pathname)) {
        return true;
    }

    if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }

    return /^\/[a-z0-9-]+\.html?$/i.test(pathname)
        && !pathname.toLowerCase().startsWith('/backend/')
        && !pathname.toLowerCase().startsWith('/node_modules/');
}

async function serveStatic(request, response, pathname) {
    let requestedPath;
    try {
        requestedPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
    } catch {
        sendText(response, 400, 'Bad request');
        return;
    }

    if (!isPublicStaticPath(requestedPath)) {
        sendText(response, 404, 'Not found');
        return;
    }

    const relativePath = requestedPath.replace(/^\/+/, '');
    const filePath = resolve(rootDir, relativePath);

    if (!isPathInsideRoot(filePath)) {
        sendText(response, 403, 'Forbidden');
        return;
    }

    try {
        const body = await readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
        });
        response.end(body);
    } catch (error) {
        sendText(response, 404, 'Not found');
    }
}

async function handleRequest(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, Authorization'
        });
        response.end();
        return;
    }

    if (request.method === 'GET' && pathname === '/api/health') {
        sendJson(response, 200, { ok: true, database: dbPath });
        return;
    }

    if (request.method === 'GET' && pathname === '/api/products') {
        sendJson(response, 200, { categories: getProductCategories() });
        return;
    }

    if (request.method === 'POST' && pathname === '/api/login') {
        try {
            const payload = await getJsonBody(request);
            sendJson(response, 200, loginStaff(payload));
        } catch (error) {
            sendJson(response, 401, { error: error.message || 'Unable to login.' });
        }
        return;
    }

    if (request.method === 'GET' && pathname === '/api/quote-requests') {
        if (!requireUser(request, response, ['Admin', 'CS', 'Inventory', 'Manager', 'Boss'])) {
            return;
        }
        sendJson(response, 200, { quotes: listQuotes({ mode: url.searchParams.get('mode') || 'workqueue' }) });
        return;
    }

    if (request.method === 'GET' && pathname === '/api/reports/summary') {
        if (!requireUser(request, response, ['Admin', 'Manager', 'Boss'])) {
            return;
        }
        sendJson(response, 200, { summary: getReportSummary({ month: url.searchParams.get('month') }) });
        return;
    }

    if (request.method === 'GET' && pathname === '/api/staff-users') {
        if (!requireUser(request, response, ['Admin'])) {
            return;
        }
        sendJson(response, 200, { users: listStaffUsers() });
        return;
    }

    if (request.method === 'GET' && pathname === '/api/inventory-staff') {
        if (!requireUser(request, response, ['Admin', 'CS', 'Manager', 'Boss'])) {
            return;
        }
        sendJson(response, 200, { users: listInventoryStaff() });
        return;
    }

    if (request.method === 'POST' && pathname === '/api/staff-users') {
        const actor = requireUser(request, response, ['Admin']);
        if (!actor) {
            return;
        }

        try {
            const payload = await getJsonBody(request);
            const user = saveStaffUser(payload);
            logAudit(null, 'staff_user_saved', actor, { id_number: user.id_number, role: user.role });
            sendJson(response, 200, { user });
        } catch (error) {
            sendJson(response, 400, { error: error.message || 'Unable to save staff user.' });
        }
        return;
    }

    const staffUserMatch = pathname.match(/^\/api\/staff-users\/([^/]+)$/);
    if (request.method === 'DELETE' && staffUserMatch) {
        const actor = requireUser(request, response, ['Admin']);
        if (!actor) {
            return;
        }

        try {
            const user = deactivateStaffUser(decodeURIComponent(staffUserMatch[1]), actor);

            if (!user) {
                sendJson(response, 404, { error: 'Staff account not found.' });
                return;
            }

            logAudit(null, 'staff_user_deactivated', actor, { id_number: user.id_number, role: user.role });
            sendJson(response, 200, { user });
        } catch (error) {
            sendJson(response, 400, { error: error.message || 'Unable to delete staff account.' });
        }
        return;
    }

    const quotePdfMatch = pathname.match(/^\/api\/quote-requests\/(\d+)\/pdf$/);
    if (request.method === 'GET' && quotePdfMatch) {
        const quote = getQuote(Number(quotePdfMatch[1]));
        if (!quote) {
            sendJson(response, 404, { error: 'Quote request not found.' });
            return;
        }

        if (!canReadQuotePdf(request, quote, url)) {
            sendJson(response, 401, { error: 'Login or a valid PDF link is required.' });
            return;
        }

        sendQuotePdf(response, quote);
        return;
    }

    if (request.method === 'POST' && pathname === '/api/quote-requests') {
        try {
            const payload = await getJsonBody(request);
            const quote = createQuote(payload);
            sendJson(response, 201, { quote });
        } catch (error) {
            sendJson(response, 400, { error: error.message || 'Invalid request.' });
        }
        return;
    }

    if (request.method === 'POST' && pathname === '/api/inventory/sync') {
        if (!requireUser(request, response, ['Admin'])) {
            return;
        }
        try {
            const result = await syncInventoryFromGoogleSheet();
            sendJson(response, 200, result);
        } catch (error) {
            await writeLog(error.stack || error.message);
            sendJson(response, 500, { error: error.message || 'Unable to sync inventory.' });
        }
        return;
    }

    const quoteWorkflowMatch = pathname.match(/^\/api\/quote-requests\/(\d+)$/);
    if (request.method === 'DELETE' && quoteWorkflowMatch) {
        const actor = requireUser(request, response, ['Admin', 'CS']);
        if (!actor) {
            return;
        }

        try {
            const payload = await getJsonBody(request, { allowEmpty: true });
            const quote = deleteQuote(Number(quoteWorkflowMatch[1]), payload, actor);

            if (!quote) {
                sendJson(response, 404, { error: 'Quote request not found.' });
                return;
            }

            sendJson(response, 200, { quote });
        } catch (error) {
            sendJson(response, 400, { error: error.message || 'Unable to delete PO.' });
        }
        return;
    }

    if (request.method === 'PATCH' && quoteWorkflowMatch) {
        const actor = requireUser(request, response, ['Admin', 'CS', 'Inventory']);
        if (!actor) {
            return;
        }

        try {
            const payload = await getJsonBody(request);
            const quote = updateQuote(Number(quoteWorkflowMatch[1]), payload, actor);

            if (!quote) {
                sendJson(response, 404, { error: 'Quote request not found.' });
                return;
            }

            sendJson(response, 200, { quote });
        } catch (error) {
            sendJson(response, 400, { error: error.message || 'Unable to update PO workflow.' });
        }
        return;
    }

    if (request.method === 'GET') {
        await serveStatic(request, response, pathname);
        return;
    }

    sendJson(response, 404, { error: 'Not found.' });
}

initDb();
seedStaffUsers();
await seedProducts();

if (autoSyncInventory) {
    await syncInventorySafely('startup');
}

const server = createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
        writeLog(error.stack || error.message).catch(() => {});
        sendJson(response, 500, { error: 'Server error.' });
    });
});

server.listen(port, host, async () => {
    await writeLog(`K-Pick Node backend running at http://${host}:${port}/request.htm`);
    await writeLog(`SQLite DB: ${dbPath}`);
    if (autoSyncInventory && inventorySyncIntervalMs > 0) {
        setInterval(() => {
            syncInventorySafely('scheduled').catch(() => {});
        }, inventorySyncIntervalMs).unref();
        await writeLog(`Inventory auto-sync enabled every ${inventorySyncIntervalMs}ms.`);
    }
    console.log(`K-Pick backend running at http://${host}:${port}/request.htm`);
});
