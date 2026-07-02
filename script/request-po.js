document.addEventListener('DOMContentLoaded', () => {

    // ── State ──────────────────────────────────────────────────────────────
    let categories = (window.KPICK_PRODUCTS || []).map(c => ({ ...c }));
    let currentStage = 1;
    let rowSeq = 0;
    const rows = new Map(); // rowId → { id, familyId, path[], quantity }

    // ── DOM refs ───────────────────────────────────────────────────────────
    const customerForm  = document.querySelector('.quote-customer-form');
    const tableBody     = document.getElementById('qt-body');
    const pricingEl     = document.getElementById('qt-pricing');
    const reviewEl      = document.getElementById('qt-review');
    const copyStatus    = document.querySelector('.quote-copy-status');
    const quoteModal    = document.querySelector('.quote-modal');
    const quoteModalContent = document.querySelector('.quote-modal__content');

    // ── Utilities ──────────────────────────────────────────────────────────
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const safeUrl = (v) => {
        try {
            const u = new URL(String(v || '').trim(), location.href);
            return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
        } catch { return ''; }
    };

    const money = (v) => (Number(v) || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    const setCopyStatus = (msg) => { if (copyStatus) copyStatus.textContent = msg; };

    // ── Product data helpers ───────────────────────────────────────────────
    const getFamily = (id) => categories.find(c => c.id === id) || null;

    const getCascadeOptions = (family, path, levelIndex) => {
        const matching = family.items.filter(item =>
            path.slice(0, levelIndex).every((val, i) => item.path[i] === val)
        );
        return [...new Set(matching.map(item => item.path[levelIndex]).filter(Boolean))];
    };

    const resolveItem = (family, path) => {
        if (!family || path.length < family.levels.length) return null;
        return family.items.find(item => item.path.every((v, i) => path[i] === v)) || null;
    };

    const getItemDisplayName = (family, item) =>
        `${family.name} — ${item.path.join(' · ')}`;

    // ── Row management ─────────────────────────────────────────────────────
    const createRow = () => {
        const id = ++rowSeq;
        rows.set(id, { id, familyId: null, path: [], quantity: 1 });
        renderTable();
    };

    const deleteRow = (id) => {
        rows.delete(id);
        renderTable();
    };

    const updateRowFamily = (rowId, familyId) => {
        const row = rows.get(rowId);
        if (!row) return;
        row.familyId = familyId || null;
        row.path = [];
        renderTable();
    };

    const updateRowLevel = (rowId, levelIndex, value) => {
        const row = rows.get(rowId);
        if (!row) return;
        row.path = row.path.slice(0, levelIndex);
        if (value) row.path[levelIndex] = value;
        renderTable();
    };

    const updateRowQty = (rowId, qty) => {
        const row = rows.get(rowId);
        if (!row) return;
        row.quantity = Math.max(1, Number(qty) || 1);
        renderPricing();
    };

    const getRowResolvedItem = (row) => resolveItem(getFamily(row.familyId), row.path);

    // ── Row selectors HTML ─────────────────────────────────────────────────
    const renderSelectorsHTML = (row) => {
        const family = getFamily(row.familyId);

        const familyOptions = categories.map(c =>
            `<option value="${esc(c.id)}" ${row.familyId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`
        ).join('');

        let html = `<div class="qt-sel-group">
            <label class="qt-sel-label">Product</label>
            <select class="qt-sel" data-row="${row.id}" data-level="family">
                <option value="">— choose product —</option>
                ${familyOptions}
            </select>
        </div>`;

        if (!family) return html;

        family.levels.forEach((levelName, i) => {
            const options   = getCascadeOptions(family, row.path, i);
            const current   = row.path[i] || '';
            const enabled   = i === 0 || row.path.length >= i;

            const optHTML = options.map(opt => {
                const testPath   = [...row.path.slice(0, i), opt];
                const anyInStock = family.items
                    .filter(item => testPath.every((v, j) => item.path[j] === v))
                    .some(item => item.in_stock !== false);
                const suffix = anyInStock ? '' : ' — Out of Stock';
                return `<option value="${esc(opt)}" ${current === opt ? 'selected' : ''}>${esc(opt)}${suffix}</option>`;
            }).join('');

            html += `<div class="qt-sel-group">
                <label class="qt-sel-label">${esc(levelName)}</label>
                <select class="qt-sel" data-row="${row.id}" data-level="${i}" ${!enabled ? 'disabled' : ''}>
                    <option value="">— select —</option>
                    ${optHTML}
                </select>
            </div>`;
        });

        return html;
    };

    // ── Table render ───────────────────────────────────────────────────────
    const renderTable = () => {
        if (!tableBody) return;

        if (rows.size === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="qt-empty-cell">No products added yet. Click <strong>+ Add Product Row</strong> below.</td></tr>`;
            renderPricing();
            return;
        }

        tableBody.innerHTML = Array.from(rows.values()).map(row => {
            const family    = getFamily(row.familyId);
            const item      = getRowResolvedItem(row);
            const resolved  = !!item;
            const isOOS     = resolved && item.in_stock === false;
            const hasPrice  = resolved && item.unit_price !== null;

            const priceVal  = hasPrice
                ? `₱${money(item.unit_price)} / ${esc(item.stock_unit || 'box')}`
                : resolved ? 'Price on Request' : '';

            const stockBadge = resolved
                ? (isOOS
                    ? `<span class="qt-badge qt-badge--oos">Out of Stock</span>`
                    : `<span class="qt-badge qt-badge--in">In Stock</span>`)
                : '';

            const subtotalVal = (hasPrice && !isOOS)
                ? `₱${money(item.unit_price * row.quantity)}`
                : '';

            return `<tr class="qt-row${isOOS ? ' qt-row--oos' : ''}" data-row-id="${row.id}">
                <td class="qt-cell qt-cell--product">
                    <div class="qt-selectors">${renderSelectorsHTML(row)}</div>
                </td>
                <td class="qt-cell qt-cell--price">
                    <input class="qt-price-input" type="text" readonly
                        value="${esc(priceVal)}"
                        placeholder="—"
                        aria-label="Unit price">
                    ${stockBadge}
                </td>
                <td class="qt-cell qt-cell--qty">
                    <input class="qt-qty-input" type="number" min="1"
                        value="${row.quantity}"
                        data-row="${row.id}"
                        ${!resolved || isOOS ? 'disabled' : ''}
                        aria-label="Quantity">
                </td>
                <td class="qt-cell qt-cell--subtotal">
                    <span class="qt-subtotal">${subtotalVal}</span>
                </td>
                <td class="qt-cell qt-cell--remove">
                    <button class="qt-remove-btn" type="button"
                        data-remove-row="${row.id}"
                        aria-label="Remove row">&times;</button>
                </td>
            </tr>`;
        }).join('');

        renderPricing();
    };

    // ── Pricing calculation ────────────────────────────────────────────────
    const calculatePricing = () => {
        const pricedRows = [];
        for (const row of rows.values()) {
            const item = getRowResolvedItem(row);
            if (!item || item.in_stock === false || item.unit_price === null) continue;
            pricedRows.push({
                ...item,
                rowId:              row.id,
                familyId:           row.familyId,
                familyName:         getFamily(row.familyId)?.name || '',
                displayName:        getItemDisplayName(getFamily(row.familyId), item),
                quantity:           row.quantity,
                boxes_per_carton:   Number(item.boxes_per_carton) || 0,
                carton_discount_rate: Number.isFinite(Number(item.carton_discount_rate))
                    ? Number(item.carton_discount_rate) : 0.15,
            });
        }

        const groupTotals = new Map();
        pricedRows.forEach(item => {
            if (!item.boxes_per_carton) return;
            groupTotals.set(item.sku, (groupTotals.get(item.sku) || 0) + item.quantity);
        });

        let subtotal = 0, discount = 0;
        const items = pricedRows.map(item => {
            const lineSubtotal = item.unit_price * item.quantity;
            const groupQty = groupTotals.get(item.sku) || 0;
            const discountEligible = item.boxes_per_carton > 0 && groupQty >= item.boxes_per_carton;
            const hasFixed = discountEligible
                && Number.isFinite(item.discounted_unit_price)
                && item.discounted_unit_price >= 0
                && item.discounted_unit_price < item.unit_price;
            const lineDiscount = hasFixed
                ? (item.unit_price - item.discounted_unit_price) * item.quantity
                : (discountEligible ? lineSubtotal * item.carton_discount_rate : 0);

            subtotal += lineSubtotal;
            discount += lineDiscount;
            return { ...item, lineSubtotal, lineDiscount, lineTotal: lineSubtotal - lineDiscount, discountEligible, groupQty };
        });

        return { items, subtotal, discount, total: subtotal - discount };
    };

    const renderPricing = () => {
        if (!pricingEl) return;
        const p = calculatePricing();
        if (p.items.length === 0) { pricingEl.innerHTML = ''; return; }
        pricingEl.innerHTML = `<div class="qt-totals">
            <div><span>Subtotal</span><strong>₱${money(p.subtotal)}</strong></div>
            <div><span>Carton Discount</span><strong>&minus;₱${money(p.discount)}</strong></div>
            <div class="qt-totals__grand"><span>Total</span><strong>₱${money(p.total)}</strong></div>
        </div>`;
    };

    // ── Stage navigation ───────────────────────────────────────────────────
    const goToStage = (n) => {
        currentStage = n;
        document.querySelectorAll('.quote-stage').forEach((el, i) => {
            el.hidden = (i + 1) !== n;
        });
        document.querySelectorAll('.quote-step').forEach((el, i) => {
            el.classList.toggle('is-active', i + 1 === n);
            el.classList.toggle('is-done',   i + 1 < n);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (n === 3) renderReview();
    };

    // ── Review stage ───────────────────────────────────────────────────────
    const renderReview = () => {
        if (!reviewEl) return;
        const customer = getCustomer();
        const pricing  = calculatePricing();
        const mapsUrl  = safeUrl(customer.maps_url);

        const customerRows = [
            ['Company / Hospital', customer.company],
            ['Contact Person',     customer.contact],
            ['Email',              customer.email],
            ['Mobile',             customer.mobile],
            ['Delivery Address',   customer.address_after_payment ? 'To be added after payment' : customer.address],
            ['Google Maps',        mapsUrl ? `<a href="${esc(mapsUrl)}" target="_blank" rel="noopener">Open map</a>` : ''],
            ['Notes',              customer.notes],
        ].filter(([, v]) => String(v || '').trim());

        const customerHTML = customerRows.map(([k, v]) =>
            `<div class="qt-review-row">
                <span>${esc(k)}</span>
                <strong>${String(v).startsWith('<') ? v : esc(v)}</strong>
            </div>`
        ).join('');

        const productsHTML = pricing.items.length
            ? pricing.items.map(item => `
                <div class="qt-review-item">
                    <div class="qt-review-item__name">${esc(item.displayName)}</div>
                    <div class="qt-review-item__meta">SKU: ${esc(item.sku)}</div>
                    <div class="qt-review-item__nums">
                        <span>Qty: ${esc(String(item.quantity))} ${esc(item.stock_unit || 'box')}</span>
                        <span>Unit: ₱${money(item.unit_price)}</span>
                        ${item.discountEligible ? `<span class="qt-discount-note">Carton discount &minus;₱${money(item.lineDiscount)}</span>` : ''}
                        <span>Line: ₱${money(item.lineTotal)}</span>
                    </div>
                </div>`).join('')
            : '<p class="qt-empty-cell" style="padding:16px 0;">No priced products in this request.</p>';

        // Unpriced items (in-stock but no price yet — Sungshim pending pricing)
        const unpricedRows = [];
        for (const row of rows.values()) {
            const item   = getRowResolvedItem(row);
            const family = getFamily(row.familyId);
            if (!item || item.in_stock === false || item.unit_price !== null) continue;
            unpricedRows.push({ item, family, quantity: row.quantity });
        }
        const unpricedHTML = unpricedRows.length
            ? `<div class="qt-review-unpriced">
                <p class="qt-review-unpriced__label">Pending price confirmation</p>
                ${unpricedRows.map(r => `
                    <div class="qt-review-item">
                        <div class="qt-review-item__name">${esc(getItemDisplayName(r.family, r.item))}</div>
                        <div class="qt-review-item__meta">SKU: ${esc(r.item.sku)} &middot; Qty: ${r.quantity} ${esc(r.item.stock_unit || 'box')}</div>
                    </div>`).join('')}
                <p class="qt-review-unpriced__note">Prices for these products will be confirmed by K-Pick upon review.</p>
              </div>`
            : '';

        reviewEl.innerHTML = `
            <div class="qt-review-grid">
                <div class="qt-review-section">
                    <h3>Customer Details</h3>
                    ${customerHTML || '<p style="color:#aaa;font-size:14px;">No customer details entered.</p>'}
                </div>
                <div class="qt-review-section">
                    <h3>Selected Products</h3>
                    ${productsHTML}
                    ${unpricedHTML}
                    ${pricing.items.length ? `<div class="qt-totals qt-totals--review">
                        <div><span>Subtotal</span><strong>₱${money(pricing.subtotal)}</strong></div>
                        <div><span>Carton Discount</span><strong>&minus;₱${money(pricing.discount)}</strong></div>
                        <div class="qt-totals__grand"><span>Total</span><strong>₱${money(pricing.total)}</strong></div>
                    </div>` : ''}
                </div>
            </div>
            <div class="qt-review-contact">
                <div class="qt-review-contact__inner">
                    <p class="qt-review-contact__heading">Ready to proceed?</p>
                    <p>Contact our sales team to confirm availability, pricing, and payment terms.</p>
                    <div class="qt-review-contact__details">
                        <a href="mailto:sales@kpicktradingcorp.com">sales@kpicktradingcorp.com</a>
                        <span>&middot;</span>
                        <a href="tel:+639173158420">+63 917 315 8420</a>
                    </div>
                </div>
            </div>`;
    };

    // ── Customer data ──────────────────────────────────────────────────────
    const getCustomer = () => {
        if (!customerForm) return {};
        const fd = new FormData(customerForm);
        const addrAfter = Boolean(fd.get('address_after_payment'));
        return {
            company:               String(fd.get('company')  || '').trim(),
            contact:               String(fd.get('contact')  || '').trim(),
            email:                 String(fd.get('email')    || '').trim(),
            mobile:                String(fd.get('mobile')   || '').trim(),
            address:               addrAfter ? '' : String(fd.get('address')  || '').trim(),
            maps_url:              addrAfter ? '' : String(fd.get('maps_url') || '').trim(),
            address_after_payment: addrAfter,
            notes:                 String(fd.get('notes')    || '').trim(),
        };
    };

    const syncAddressToggle = () => {
        const addr   = customerForm?.querySelector('[name="address"]');
        const maps   = customerForm?.querySelector('[name="maps_url"]');
        const toggle = customerForm?.querySelector('[data-address-after-payment]');
        if (!addr || !toggle) return;
        addr.disabled = toggle.checked;
        if (maps) maps.disabled = toggle.checked;
        if (toggle.checked) { addr.value = ''; if (maps) maps.value = ''; }
    };

    // ── Copy summary ───────────────────────────────────────────────────────
    const buildSummary = () => {
        const c = getCustomer();
        const p = calculatePricing();

        const customerLines = [
            ['Company / Hospital', c.company],
            ['Contact Person',     c.contact],
            ['Email',              c.email],
            ['Mobile',             c.mobile],
            ['Delivery Address',   c.address_after_payment ? 'To be added after payment' : c.address],
            ['Google Maps Pin',    c.maps_url],
            ['Notes',              c.notes],
        ].filter(([, v]) => String(v || '').trim()).map(([k, v]) => `${k}: ${v}`);

        const productLines = p.items.map((item, i) => {
            const disc = item.lineDiscount
                ? ` | Discount: ₱${money(item.lineDiscount)} | Line: ₱${money(item.lineTotal)}`
                : '';
            return `${i + 1}. ${item.displayName} — Qty: ${item.quantity} ${item.stock_unit || 'box'} | Unit: ₱${money(item.unit_price)}${disc}`;
        });

        // Unpriced items
        const unpricedLines = [];
        for (const row of rows.values()) {
            const item   = getRowResolvedItem(row);
            const family = getFamily(row.familyId);
            if (!item || item.in_stock === false || item.unit_price !== null) continue;
            unpricedLines.push(`  - ${getItemDisplayName(family, item)} — Qty: ${row.quantity} ${item.stock_unit || 'box'} (price to be confirmed)`);
        }

        return [
            'K-PICK TRADING CORP — Quote / PO Request',
            '────────────────────────────────────────',
            '',
            'CUSTOMER DETAILS',
            customerLines.join('\n') || 'No customer details provided.',
            '',
            'PRODUCTS',
            productLines.join('\n') || 'No priced products.',
            unpricedLines.length ? '\nPENDING PRICE CONFIRMATION\n' + unpricedLines.join('\n') : '',
            '',
            `Subtotal:        ₱${money(p.subtotal)}`,
            `Carton Discount: ₱${money(p.discount)}`,
            `Total:           ₱${money(p.total)}`,
            '',
            '────────────────────────────────────────',
            'To proceed: contact sales@kpicktradingcorp.com | +63 917 315 8420',
        ].filter(l => l !== undefined).join('\n');
    };

    // ── Modal ──────────────────────────────────────────────────────────────
    const showQuoteModal = (quote) => {
        if (!quoteModal || !quoteModalContent) return;
        const totals   = quote.totals   || {};
        const items    = quote.items    || [];
        const customer = quote.customer || {};
        const mapsUrl  = safeUrl(customer.maps_url);
        const quoteId  = parseInt(quote.id, 10);
        const pdfUrl   = quote.pdf_url || `/api/quote-requests/${Number.isFinite(quoteId) ? quoteId : 0}/pdf`;

        quoteModalContent.innerHTML = `
            <span class="quote-modal__eyebrow">Generated PO</span>
            <h2 id="quote-modal-title">${esc(quote.request_number)}</h2>
            <p class="quote-modal__meta">Created ${esc(new Date(quote.created_at).toLocaleString())}</p>
            <section class="quote-modal__section">
                <h3>Customer Details</h3>
                <p><strong>Company:</strong> ${esc(customer.company || 'Not provided')}</p>
                <p><strong>Contact:</strong> ${esc(customer.contact || 'Not provided')}</p>
                <p><strong>Email:</strong> ${esc(customer.email || 'Not provided')}</p>
                <p><strong>Mobile:</strong> ${esc(customer.mobile || 'Not provided')}</p>
                <p><strong>Address:</strong> ${esc(customer.address_after_payment ? 'To be added after payment' : (customer.address || 'Not provided'))}</p>
                ${mapsUrl ? `<p><strong>Map:</strong> <a href="${esc(mapsUrl)}" target="_blank" rel="noopener">Open map</a></p>` : ''}
                ${customer.notes ? `<p><strong>Notes:</strong> ${esc(customer.notes)}</p>` : ''}
            </section>
            <section class="quote-modal__section">
                <h3>Selected Products</h3>
                <div class="quote-modal__items">
                    ${items.map(item => `
                        <article>
                            <strong>${esc(item.name)}</strong>
                            <span>Qty: ${esc(String(item.quantity))} ${esc(item.stock_unit || 'box')} | Unit: ₱${money(item.unit_price)} | Line: ₱${money(item.line_total)}</span>
                            ${item.line_discount ? `<span>Carton discount: ₱${money(item.line_discount)}</span>` : ''}
                        </article>`).join('')}
                </div>
            </section>
            <section class="quote-modal__totals">
                <p><span>Subtotal</span><strong>₱${money(totals.subtotal)}</strong></p>
                <p><span>Carton Discount</span><strong>₱${money(totals.carton_discount)}</strong></p>
                <p><span>Grand Total</span><strong>₱${money(totals.grand_total)}</strong></p>
            </section>
            <div class="quote-modal__actions">
                <a class="quote-button" href="${esc(pdfUrl)}" target="_blank" rel="noopener">Download PDF</a>
                <button class="quote-button quote-button--secondary" type="button" data-close-quote-modal>Close</button>
            </div>`;
        quoteModal.hidden = false;
    };

    const closeQuoteModal = () => { if (quoteModal) quoteModal.hidden = true; };

    // ── Submit request ─────────────────────────────────────────────────────
    const submitQuote = async () => {
        const submitBtn  = document.querySelector('[data-submit-quote]');
        const pricing    = calculatePricing();

        if (!customerForm?.checkValidity()) { customerForm?.reportValidity(); return; }

        const hasAnyProduct = rows.size > 0 && Array.from(rows.values()).some(r => getRowResolvedItem(r));
        if (!hasAnyProduct) { setCopyStatus('Add at least one product before submitting.'); return; }

        setCopyStatus('Submitting request...');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

        try {
            const response = await fetch('/api/quote-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    customer: getCustomer(),
                    items: pricing.items.map(i => ({ sku: i.sku, quantity: i.quantity })),
                }),
            });
            const result = response.headers.get('content-type')?.includes('application/json')
                ? await response.json() : {};
            if (!response.ok) throw new Error(result.error || 'Unable to submit request.');
            setCopyStatus(`Request saved: ${result.quote.request_number}`);
            showQuoteModal(result.quote);
        } catch (error) {
            setCopyStatus(error instanceof TypeError
                ? 'Backend not running yet. Copy the summary and send it to sales@kpicktradingcorp.com.'
                : error.message || 'Unable to submit request.');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Request'; }
        }
    };

    // ── Load products from API (overwrites local fallback if available) ─────
    const loadProducts = async () => {
        try {
            const response = await fetch('/api/products', { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('unavailable');
            const result = await response.json();
            // API must return new path-based format: { categories: [...] }
            if (Array.isArray(result.categories) && result.categories.length > 0) {
                categories = result.categories;
            }
        } catch { /* use local fallback silently */ }
    };

    // ── Event delegation ───────────────────────────────────────────────────
    document.addEventListener('change', (e) => {
        const sel = e.target.closest('.qt-sel');
        if (!sel) return;
        const rowId = Number(sel.dataset.row);
        const level = sel.dataset.level;
        if (level === 'family') updateRowFamily(rowId, sel.value);
        else updateRowLevel(rowId, Number(level), sel.value);
    });

    document.addEventListener('input', (e) => {
        const input = e.target.closest('.qt-qty-input');
        if (!input) return;
        updateRowQty(Number(input.dataset.row), input.value);
    });

    document.addEventListener('click', (e) => {
        // Remove row
        const removeBtn = e.target.closest('[data-remove-row]');
        if (removeBtn) { deleteRow(Number(removeBtn.dataset.removeRow)); return; }

        // Add row
        if (e.target.closest('[data-add-row]')) { createRow(); return; }

        // Next stage
        if (e.target.closest('[data-next-stage]')) {
            if (currentStage === 1 && !customerForm?.checkValidity()) {
                customerForm?.reportValidity(); return;
            }
            if (currentStage === 2) {
                const hasProduct = Array.from(rows.values()).some(r => getRowResolvedItem(r));
                if (!hasProduct) { setCopyStatus('Add and fully specify at least one product before continuing.'); return; }
                setCopyStatus('');
            }
            goToStage(currentStage + 1);
            return;
        }

        // Prev stage
        if (e.target.closest('[data-prev-stage]')) { goToStage(currentStage - 1); return; }

        // Copy summary
        if (e.target.closest('[data-copy-quote]')) {
            const summary = buildSummary();
            navigator.clipboard?.writeText(summary)
                .then(() => setCopyStatus('Summary copied to clipboard.'))
                .catch(() => setCopyStatus('Copy failed — select and copy the text manually.'));
            return;
        }

        // Submit
        if (e.target.closest('[data-submit-quote]')) { submitQuote(); return; }

        // Modal close
        if (e.target.closest('[data-close-quote-modal]') || e.target === quoteModal) {
            closeQuoteModal(); return;
        }
    });

    // Address toggle
    customerForm?.querySelector('[data-address-after-payment]')
        ?.addEventListener('change', syncAddressToggle);

    // Google Maps search
    customerForm?.querySelector('[data-search-gmaps]')?.addEventListener('click', () => {
        const addr    = customerForm.querySelector('[name="address"]')?.value || '';
        const company = customerForm.querySelector('[name="company"]')?.value || '';
        const q = [addr, company].filter(Boolean).join(' ');
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || 'delivery address')}`,
            '_blank', 'noopener'
        );
    });

    // ── Init ───────────────────────────────────────────────────────────────
    syncAddressToggle();
    loadProducts().then(() => createRow());
});
