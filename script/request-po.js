document.addEventListener('DOMContentLoaded', () => {
    let categories = window.KPICK_PRODUCTS || [];
    const tabs = document.querySelector('.quote-category-tabs');
    const list = document.querySelector('.quote-product-list');
    const search = document.querySelector('.quote-search');
    const selectedList = document.querySelector('.quote-selected-list');
    const summaryCount = document.querySelector('.quote-summary-count');
    const clearButton = document.querySelector('[data-clear-quote]');
    const copyButton = document.querySelector('[data-copy-quote]');
    const submitButton = document.querySelector('[data-submit-quote]');
    const copyStatus = document.querySelector('.quote-copy-status');
    const customerForm = document.querySelector('.quote-customer-form');
    const quoteModal = document.querySelector('.quote-modal');
    const quoteModalContent = document.querySelector('.quote-modal__content');
    const quoteModalClose = document.querySelector('[data-close-quote-modal]');
    const addressInput = customerForm?.querySelector('[name="address"]');
    const mapsUrlInput = customerForm?.querySelector('[name="maps_url"]');
    const addressAfterPaymentInput = customerForm?.querySelector('[data-address-after-payment]');
    const searchMapsButton = document.querySelector('[data-search-gmaps]');
    const selected = new Map();
    let activeCategory = categories[0]?.id || '';

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));

    const escapeAttr = escapeHtml;

    const safeExternalUrl = (value) => {
        try {
            const url = new URL(String(value || '').trim(), window.location.href);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch {
            return '';
        }
    };

    const allItems = () => categories.flatMap((category) => category.items.map((item) => ({ ...item, category: category.name })));

    const getActiveItems = () => {
        const query = (search?.value || '').trim().toLowerCase();
        const source = activeCategory === 'all'
            ? allItems()
            : (categories.find((category) => category.id === activeCategory)?.items || []).map((item) => ({
                ...item,
                category: categories.find((category) => category.id === activeCategory)?.name || ''
            }));

        if (!query) {
            return source;
        }

        return source.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query));
    };

    const renderTabs = () => {
        if (!tabs) {
            return;
        }

        const categoryButtons = categories.map((category) => {
            const count = category.items.length;
            return `<button class="${category.id === activeCategory ? 'is-active' : ''}" type="button" data-category="${escapeAttr(category.id)}">${escapeHtml(category.name)} <span>${count}</span></button>`;
        }).join('');

        tabs.innerHTML = `<button class="${activeCategory === 'all' ? 'is-active' : ''}" type="button" data-category="all">All <span>${allItems().length}</span></button>${categoryButtons}`;
    };

    const renderProducts = () => {
        if (!list) {
            return;
        }

        const items = getActiveItems();

        if (items.length === 0) {
            list.innerHTML = '<p class="quote-empty">No products in this category yet.</p>';
            return;
        }

        list.innerHTML = items.map((item) => {
            const detail = item.carton || item.packaging || 'Sungshim';
            const stock = item.stock_quantity ?? null;
            const price = item.unit_price ?? null;
            const discountPrice = item.discounted_unit_price ?? null;
            const inventoryDetails = [
                stock !== null ? `Stock: ${stock} ${item.stock_unit || 'box'}` : null,
                price !== null ? `Price: ${price}` : null,
                discountPrice !== null ? `Carton price: ${discountPrice}` : null
            ].filter(Boolean).join(' | ');

            return `
                <article class="quote-product-card">
                    <div>
                        <span>${escapeHtml(item.category)}</span>
                        <h3>${escapeHtml(item.name)}</h3>
                        <p>${escapeHtml(detail)}</p>
                        ${inventoryDetails ? `<p class="quote-product-card__inventory">${escapeHtml(inventoryDetails)}</p>` : ''}
                    </div>
                    <button type="button" data-add-product="${escapeAttr(item.sku)}">Add</button>
                </article>
            `;
        }).join('');
    };

    const renderSelected = () => {
        if (!selectedList || !summaryCount) {
            return;
        }

        const pricing = calculatePricing();
        const items = pricing.items;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        summaryCount.textContent = items.length === 0
            ? 'No products selected.'
            : `${items.length} product${items.length === 1 ? '' : 's'}, ${totalQuantity} total unit${totalQuantity === 1 ? '' : 's'}.`;

        if (items.length === 0) {
            selectedList.innerHTML = '<p class="quote-empty">Selected products will appear here.</p>';
            return;
        }

        selectedList.innerHTML = `${items.map((item) => `
            <article class="quote-selected-item">
                <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${escapeHtml(item.category)}${item.unit_price !== null && item.unit_price !== undefined ? ` | ${escapeHtml(item.unit_price)} per ${escapeHtml(item.stock_unit || 'box')}` : ''}</span>
                    ${item.discountEligible ? `<span class="quote-discount-note">Carton discount applied (${item.groupQuantity}/${item.boxes_per_carton} boxes group)${item.effectiveUnitPrice !== item.unit_price ? `: ${escapeHtml(item.effectiveUnitPrice)} per ${escapeHtml(item.stock_unit || 'box')}` : ''}</span>` : ''}
                </div>
                <div class="quote-quantity">
                    <button type="button" data-step-product="${escapeAttr(item.sku)}" data-step="-1">-</button>
                    <input type="number" min="1" value="${escapeAttr(item.quantity)}" data-quantity-product="${escapeAttr(item.sku)}" aria-label="${escapeAttr(item.name)} quantity">
                    <button type="button" data-step-product="${escapeAttr(item.sku)}" data-step="1">+</button>
                </div>
                ${item.unit_price ? `<p class="quote-line-total">Line total: ${money(item.lineTotal)}${item.lineDiscount ? ` | Discount: ${money(item.lineDiscount)}` : ''}</p>` : ''}
                <button class="quote-remove" type="button" data-remove-product="${escapeAttr(item.sku)}" aria-label="Remove ${escapeAttr(item.name)}">Remove</button>
            </article>
        `).join('')}
            <div class="quote-pricing-summary">
                <p><span>Subtotal</span><strong>${money(pricing.subtotal)}</strong></p>
                <p><span>Carton Discount</span><strong>${money(pricing.discount)}</strong></p>
                <p><span>Total</span><strong>${money(pricing.total)}</strong></p>
            </div>
        `;
    };

    const setCopyStatus = (message) => {
        if (!copyStatus) {
            return;
        }

        copyStatus.textContent = message;
    };

    const showCopyFallback = (summary) => {
        if (!copyStatus) {
            return;
        }

        let fallback = document.querySelector('[data-copy-fallback]');
        if (!fallback) {
            fallback = document.createElement('textarea');
            fallback.dataset.copyFallback = 'true';
            fallback.readOnly = true;
            fallback.rows = 8;
            fallback.className = 'quote-copy-fallback';
            copyStatus.insertAdjacentElement('afterend', fallback);
        }

        fallback.value = summary;
        fallback.hidden = false;
        fallback.focus();
        fallback.select();
    };

    const syncAddressRequirement = () => {
        if (!addressInput || !addressAfterPaymentInput) {
            return;
        }

        addressInput.required = false;
        addressInput.disabled = addressAfterPaymentInput.checked;
        if (mapsUrlInput) {
            mapsUrlInput.disabled = addressAfterPaymentInput.checked;
        }
        if (addressAfterPaymentInput.checked) {
            addressInput.value = '';
            if (mapsUrlInput) {
                mapsUrlInput.value = '';
            }
        }
    };

    const getCustomer = () => {
        const formData = new FormData(customerForm);
        const addressAfterPayment = Boolean(formData.get('address_after_payment'));

        return {
            company: String(formData.get('company') || '').trim(),
            contact: String(formData.get('contact') || '').trim(),
            email: String(formData.get('email') || '').trim(),
            mobile: String(formData.get('mobile') || '').trim(),
            address: addressAfterPayment ? '' : String(formData.get('address') || '').trim(),
            maps_url: addressAfterPayment ? '' : String(formData.get('maps_url') || '').trim(),
            address_after_payment: addressAfterPayment,
            notes: String(formData.get('notes') || '').trim()
        };
    };

    const showQuoteModal = (quote) => {
        if (!quoteModal || !quoteModalContent) {
            return;
        }

        const totals = quote.totals || {};
        const items = quote.items || [];
        const customer = quote.customer || {};
        const mapsUrl = safeExternalUrl(customer.maps_url);
        const quoteId = Number.parseInt(quote.id, 10);
        const pdfUrl = quote.pdf_url || `/api/quote-requests/${Number.isFinite(quoteId) ? quoteId : 0}/pdf`;

        quoteModalContent.innerHTML = `
            <span class="quote-modal__eyebrow">Generated PO</span>
            <h2 id="quote-modal-title">${escapeHtml(quote.request_number)}</h2>
            <p class="quote-modal__meta">Created ${escapeHtml(new Date(quote.created_at).toLocaleString())}</p>

            <section class="quote-modal__section">
                <h3>Customer Details</h3>
                <p><strong>Company / Hospital:</strong> ${escapeHtml(customer.company || 'Not provided')}</p>
                <p><strong>Contact Person:</strong> ${escapeHtml(customer.contact || 'Not provided')}</p>
                <p><strong>Email:</strong> ${escapeHtml(customer.email || 'Not provided')}</p>
                <p><strong>Mobile:</strong> ${escapeHtml(customer.mobile || 'Not provided')}</p>
                <p><strong>Delivery Address:</strong> ${escapeHtml(customer.address_after_payment ? 'To be added after payment' : (customer.address || 'Not provided'))}</p>
                ${mapsUrl ? `<p><strong>Google Maps Pin:</strong> <a href="${escapeAttr(mapsUrl)}" target="_blank" rel="noopener">Open map</a></p>` : ''}
                ${customer.notes ? `<p><strong>Notes:</strong> ${escapeHtml(customer.notes)}</p>` : ''}
            </section>

            <section class="quote-modal__section">
                <h3>Selected Products</h3>
                <div class="quote-modal__items">
                    ${items.map((item) => `
                        <article>
                            <strong>${escapeHtml(item.name)}</strong>
                            <span>Qty: ${escapeHtml(item.quantity)} ${escapeHtml(item.stock_unit || 'box')} | Unit: ${money(item.unit_price)} | Line: ${money(item.line_total)}</span>
                            ${item.line_discount ? `<span>Carton discount: ${money(item.line_discount)}</span>` : ''}
                        </article>
                    `).join('')}
                </div>
            </section>

            <section class="quote-modal__totals">
                <p><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></p>
                <p><span>Carton Discount</span><strong>${money(totals.carton_discount)}</strong></p>
                <p><span>Grand Total</span><strong>${money(totals.grand_total)}</strong></p>
            </section>

            <div class="quote-modal__actions">
                <a class="quote-button" href="${escapeAttr(pdfUrl)}" target="_blank" rel="noopener">Download PDF</a>
                <button class="quote-button quote-button--secondary" type="button" data-close-quote-modal>Close</button>
            </div>
        `;
        quoteModal.hidden = false;
    };

    const closeQuoteModal = () => {
        if (quoteModal) {
            quoteModal.hidden = true;
        }
    };

    const findItem = (sku) => allItems().find((item) => item.sku === sku);

    const addProduct = (sku) => {
        const item = findItem(sku);

        if (!item) {
            return;
        }

        const current = selected.get(sku);
        selected.set(sku, {
            ...item,
            quantity: current ? current.quantity + 1 : 1
        });
        setCopyStatus('');
        renderSelected();
    };

    const updateQuantity = (sku, quantity) => {
        const item = selected.get(sku);

        if (!item) {
            return;
        }

        const nextQuantity = Math.max(1, Number(quantity) || 1);
        selected.set(sku, { ...item, quantity: nextQuantity });
        setCopyStatus('');
        renderSelected();
    };

    const money = (value) => {
        const number = Number(value) || 0;
        return number.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const cartonDiscountGroupKey = (item) => String(item.sku || item.name || '').trim().toLowerCase();

    const calculatePricing = () => {
        const items = Array.from(selected.values()).map((item) => ({
            ...item,
            unit_price: Number(item.unit_price) || 0,
            discounted_unit_price: item.discounted_unit_price === null || item.discounted_unit_price === undefined ? null : Number(item.discounted_unit_price),
            quantity: Number(item.quantity) || 0,
            boxes_per_carton: Number(item.boxes_per_carton) || 0,
            carton_discount_rate: Number.isFinite(Number(item.carton_discount_rate)) ? Number(item.carton_discount_rate) : 0.15
        }));
        const groupTotals = new Map();

        items.forEach((item) => {
            if (!item.boxes_per_carton) {
                return;
            }

            const groupKey = cartonDiscountGroupKey(item);
            groupTotals.set(groupKey, (groupTotals.get(groupKey) || 0) + item.quantity);
        });

        let subtotal = 0;
        let discount = 0;
        const pricedItems = items.map((item) => {
            const lineSubtotal = item.unit_price * item.quantity;
            const groupQuantity = groupTotals.get(cartonDiscountGroupKey(item)) || 0;
            const discountEligible = item.boxes_per_carton > 0 && groupQuantity >= item.boxes_per_carton;
            const hasFixedDiscountPrice = discountEligible
                && Number.isFinite(item.discounted_unit_price)
                && item.discounted_unit_price >= 0
                && item.discounted_unit_price < item.unit_price;
            const lineDiscount = hasFixedDiscountPrice
                ? (item.unit_price - item.discounted_unit_price) * item.quantity
                : (discountEligible ? lineSubtotal * item.carton_discount_rate : 0);

            subtotal += lineSubtotal;
            discount += lineDiscount;

            return {
                ...item,
                lineSubtotal,
                lineDiscount,
                lineTotal: lineSubtotal - lineDiscount,
                effectiveUnitPrice: hasFixedDiscountPrice ? item.discounted_unit_price : item.unit_price,
                discountEligible,
                groupQuantity
            };
        });

        return {
            items: pricedItems,
            subtotal,
            discount,
            total: subtotal - discount
        };
    };

    const buildSummary = () => {
        const customer = getCustomer();
        const customerLines = [
            ['Company / Hospital', customer.company],
            ['Contact Person', customer.contact],
            ['Email', customer.email],
            ['Mobile', customer.mobile],
            ['Delivery Address', customer.address_after_payment ? 'To be added after payment' : customer.address],
            ['Google Maps Pin', customer.maps_url],
            ['Notes', customer.notes]
        ]
            .filter(([, value]) => String(value || '').trim())
            .map(([label, value]) => `${label}: ${value}`);

        const pricing = calculatePricing();
        const productLines = pricing.items.map((item, index) => {
            const detail = item.carton || item.packaging || '';
            const price = item.unit_price !== null && item.unit_price !== undefined
                ? ` | Price: ${item.unit_price}/${item.stock_unit || 'box'}`
                : '';
            const discount = item.lineDiscount ? ` | Carton Discount: ${money(item.lineDiscount)} | Line Total: ${money(item.lineTotal)}` : '';
            return `${index + 1}. ${item.name} - Qty: ${item.quantity}${detail ? ` (${detail})` : ''}${price}${discount}`;
        });

        return [
            'K-Pick Quote / PO Request',
            '',
            'Customer Details',
            customerLines.length ? customerLines.join('\n') : 'No customer details entered.',
            '',
            'Selected Products',
            productLines.length ? productLines.join('\n') : 'No products selected.',
            '',
            `Subtotal: ${money(pricing.subtotal)}`,
            `Carton Discount: ${money(pricing.discount)}`,
            `Total: ${money(pricing.total)}`
        ].join('\n');
    };

    const submitQuote = async () => {
        const items = Array.from(selected.values()).map((item) => ({
            sku: item.sku,
            quantity: item.quantity
        }));

        if (!customerForm.checkValidity()) {
            customerForm.reportValidity();
            setCopyStatus('Complete the customer details before submitting.');
            return;
        }

        if (items.length === 0) {
            setCopyStatus('Select at least one product before submitting.');
            return;
        }

        setCopyStatus('Submitting request...');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }

        try {
            const response = await fetch('/api/quote-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    customer: getCustomer(),
                    items
                })
            });
            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : {};

            if (!response.ok) {
                throw new Error(result.error || 'Unable to submit request.');
            }

            setCopyStatus(`Request saved: ${result.quote.request_number}`);
            showQuoteModal(result.quote);
        } catch (error) {
            const message = error instanceof TypeError
                ? 'Backend is not running yet. You can still copy the summary for now.'
                : error.message || 'Unable to submit request.';
            setCopyStatus(message);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Request';
            }
        }
    };

    const loadProducts = async () => {
        try {
            const response = await fetch('/api/products', {
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Product API unavailable.');
            }

            const result = await response.json();

            if (Array.isArray(result.categories) && result.categories.length > 0) {
                categories = result.categories;
                activeCategory = categories[0].id;
            }
        } catch (error) {
            setCopyStatus('Using local draft product list.');
        }

        renderTabs();
        renderProducts();
        renderSelected();
    };

    tabs?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-category]');

        if (!button) {
            return;
        }

        activeCategory = button.dataset.category;
        renderTabs();
        renderProducts();
    });

    list?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-add-product]');

        if (!button) {
            return;
        }

        addProduct(button.dataset.addProduct);
    });

    selectedList?.addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-remove-product]');
        const stepButton = event.target.closest('[data-step-product]');

        if (removeButton) {
            selected.delete(removeButton.dataset.removeProduct);
            setCopyStatus('');
            renderSelected();
            return;
        }

        if (stepButton) {
            const item = selected.get(stepButton.dataset.stepProduct);
            updateQuantity(stepButton.dataset.stepProduct, (item?.quantity || 1) + Number(stepButton.dataset.step));
        }
    });

    selectedList?.addEventListener('change', (event) => {
        const input = event.target.closest('[data-quantity-product]');

        if (!input) {
            return;
        }

        updateQuantity(input.dataset.quantityProduct, input.value);
    });

    search?.addEventListener('input', renderProducts);
    addressAfterPaymentInput?.addEventListener('change', syncAddressRequirement);
    searchMapsButton?.addEventListener('click', () => {
        const query = [
            addressInput?.value || '',
            customerForm?.querySelector('[name="company"]')?.value || ''
        ].filter(Boolean).join(' ');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'K-Pick customer delivery address')}`;
        window.open(mapsUrl, '_blank', 'noopener');
    });

    clearButton?.addEventListener('click', () => {
        selected.clear();
        setCopyStatus('');
        renderSelected();
    });

    copyButton?.addEventListener('click', async () => {
        const summary = buildSummary();

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard API unavailable.');
            }

            await navigator.clipboard.writeText(summary);
            setCopyStatus('Summary copied.');
        } catch (error) {
            setCopyStatus('Copy failed. Select the summary below manually.');
            showCopyFallback(summary);
        }
    });

    submitButton?.addEventListener('click', submitQuote);
    quoteModalClose?.addEventListener('click', closeQuoteModal);
    quoteModal?.addEventListener('click', (event) => {
        if (event.target === quoteModal || event.target.closest('[data-close-quote-modal]')) {
            closeQuoteModal();
        }
    });

    syncAddressRequirement();
    loadProducts();
});
