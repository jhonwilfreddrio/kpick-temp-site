document.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelector('.quote-admin__list');
    const status = document.querySelector('.quote-admin__status');
    const refreshButton = document.querySelector('[data-refresh-quotes]');
    const syncButton = document.querySelector('[data-sync-inventory]');
    const statusFilter = document.querySelector('[data-status-filter]');
    const poSearchInput = document.querySelector('[data-po-search]');
    const loginIdInput = document.querySelector('[data-login-id]');
    const loginPasswordInput = document.querySelector('[data-login-password]');
    const loginButton = document.querySelector('[data-login-button]');
    const logoutButton = document.querySelector('[data-logout-button]');
    const sessionLabel = document.querySelector('[data-login-session]');
    const reportPanel = document.querySelector('.quote-admin-report');
    const reportSummary = document.querySelector('[data-report-summary]');
    const reportStatus = document.querySelector('[data-report-status]');
    const reportMonthInput = document.querySelector('[data-report-month]');
    const usersPanel = document.querySelector('.quote-admin-users');
    const userStatus = document.querySelector('[data-user-status]');
    const userList = document.querySelector('[data-user-list]');
    const saveUserButton = document.querySelector('[data-save-user]');
    const clearUserButton = document.querySelector('[data-clear-user]');
    const userFields = {
        originalId: document.querySelector('[data-user-original-id]'),
        id: document.querySelector('[data-user-id]'),
        name: document.querySelector('[data-user-name]'),
        role: document.querySelector('[data-user-role]'),
        password: document.querySelector('[data-user-password]'),
        managerCode: document.querySelector('[data-user-manager-code]')
    };
    const state = {
        token: localStorage.getItem('kpickStaffToken') || '',
        user: JSON.parse(localStorage.getItem('kpickStaffUser') || 'null'),
        inventoryStaff: [],
        quotes: [],
        statusFilter: localStorage.getItem('kpickStatusFilter') || 'all',
        poSearch: localStorage.getItem('kpickPoSearch') || '',
        reportMonth: localStorage.getItem('kpickReportMonth') || new Date().toISOString().slice(0, 7),
        queueFilters: JSON.parse(localStorage.getItem('kpickQueueFilters') || '[]'),
        expandedQuotes: new Set()
    };
    const workflowOrder = ['Generated', 'Pending for Picking', 'Picking Products', 'For Repacking', 'Ready for Shipment', 'Released / Shipped'];

    if (statusFilter) {
        statusFilter.value = state.statusFilter;
    }
    if (poSearchInput) {
        poSearchInput.value = state.poSearch;
    }
    if (reportMonthInput) {
        reportMonthInput.value = state.reportMonth;
    }

    const money = (value) => Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const formatDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    };

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    const setStatus = (message) => {
        if (status) {
            status.textContent = message;
        }
    };

    const headers = () => ({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`
    });

    const readApiJson = async (response) => {
        const contentType = response.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            throw new Error('Backend API did not return JSON. Open this page through the Node backend, for example http://127.0.0.1:8000/request-admin.htm.');
        }

        return response.json();
    };

    const role = () => state.user?.role || '';
    const canEditSales = () => ['Admin', 'CS'].includes(role());
    const canEditInventory = () => ['Admin', 'Inventory'].includes(role());
    const canSeeReports = () => ['Admin', 'Manager', 'Boss'].includes(role());
    const isAssignedInventory = (workflow = {}) => {
        const assigned = String(workflow.assigned_inventory_staff || '').trim().toLowerCase();
        return role() === 'Inventory'
            && Boolean(assigned)
            && [state.user?.id_number, state.user?.name]
                .map((value) => String(value || '').trim().toLowerCase())
                .includes(assigned);
    };

    const updateSession = () => {
        if (!state.user) {
            sessionLabel.textContent = 'Not logged in.';
            syncButton.hidden = true;
            reportPanel.hidden = true;
            usersPanel.hidden = true;
            return;
        }

        sessionLabel.textContent = `Logged in as ${state.user.name} (${state.user.role})`;
        syncButton.hidden = role() !== 'Admin';
        reportPanel.hidden = !canSeeReports();
        usersPanel.hidden = role() !== 'Admin';
    };

    const statusOptionsForRole = (current) => {
        const all = workflowOrder;
        const inventory = ['Picking Products', 'For Repacking', 'Ready for Shipment', 'Released / Shipped'];
        const options = role() === 'Inventory' ? inventory : all;
        return options.map((option) => `
            <option value="${escapeHtml(option)}" ${current === option ? 'selected' : ''}>${escapeHtml(option)}</option>
        `).join('');
    };

    const inventoryStaffOptions = (current) => {
        const currentValue = String(current || '').trim();
        const knownCurrent = state.inventoryStaff.some((user) => user.name === currentValue || user.id_number === currentValue);
        const options = [
            '<option value="">Select inventory staff</option>',
            ...state.inventoryStaff.map((user) => {
                const selected = currentValue === user.name || currentValue === user.id_number ? 'selected' : '';
                return `<option value="${escapeHtml(user.id_number)}" ${selected}>${escapeHtml(user.name)} (${escapeHtml(user.id_number)})</option>`;
            })
        ];

        if (currentValue && !knownCurrent) {
            options.push(`<option value="${escapeHtml(currentValue)}" selected>${escapeHtml(currentValue)} (saved)</option>`);
        }

        return options.join('');
    };

    const workflowControl = (workflow) => {
        if (role() === 'CS') {
            return `
                <label>
                    PO Condition
                    <span class="quote-admin-status-display">${escapeHtml(workflow.workflow_status || 'Generated')}</span>
                </label>
            `;
        }

        if (role() === 'Inventory' || role() === 'Admin') {
            const disabled = role() === 'Inventory' && !isAssignedInventory(workflow) ? 'disabled' : '';
            return `
                <label>
                    PO Condition
                    <select data-workflow-status ${disabled}>${statusOptionsForRole(workflow.workflow_status)}</select>
                </label>
            `;
        }

        return `
            <label>
                PO Condition
                <span class="quote-admin-status-display">${escapeHtml(workflow.workflow_status || 'Generated')}</span>
            </label>
        `;
    };

    const isPaidOrBeyond = (workflow = {}) => Boolean(workflow.si_number)
        || Boolean(workflow.assigned_inventory_staff)
        || Boolean(workflow.workflow_status && workflow.workflow_status !== 'Generated');

    const renderReport = (summary) => {
        if (!reportSummary) {
            return;
        }

        const monthly = summary.monthly || {};
        const weekly = summary.weekly_queue || {};
        const products = summary.monthly_products || [];
        const cancelled = summary.cancelled_pos || [];
        const statusCards = (summary.by_status || []).map((entry) => `
            <div class="quote-admin-report-card">
                <span>${escapeHtml(entry.status)}</span>
                <strong>${entry.count}</strong>
            </div>
        `).join('');

        reportSummary.innerHTML = `
            <div class="quote-admin-report-card">
                <span>Total POs</span>
                <strong>${summary.total_requests || 0}</strong>
            </div>
            <div class="quote-admin-report-card">
                <span>Grand Total</span>
                <strong>PHP ${money(summary.grand_total)}</strong>
            </div>
            <div class="quote-admin-report-card quote-admin-report-card--attention">
                <span>Carryover</span>
                <strong>${weekly.carryover || 0}</strong>
            </div>
            <div class="quote-admin-report-card">
                <span>This Week</span>
                <strong>${weekly.current_week || 0}</strong>
            </div>
            <div class="quote-admin-report-card">
                <span>Hidden Completed Old</span>
                <strong>${weekly.hidden_completed_old || 0}</strong>
            </div>
            <div class="quote-admin-report-card">
                <span>${escapeHtml(summary.report_month || state.reportMonth)} POs</span>
                <strong>${monthly.po_count || 0}</strong>
            </div>
            <div class="quote-admin-report-card">
                <span>Monthly Sold</span>
                <strong>PHP ${money(monthly.sold_total)}</strong>
            </div>
            <div class="quote-admin-report-card">
                <span>Cancelled This Month</span>
                <strong>${monthly.cancelled_count || 0}</strong>
            </div>
            ${statusCards}
            <div class="quote-admin-report-table quote-admin-report-table--wide">
                <h3>Monthly Sold Products</h3>
                ${products.length ? `
                    <div class="product-table-wrap">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Qty Sold</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.map((product) => `
                                    <tr>
                                        <td>${escapeHtml(product.name)}</td>
                                        <td>${escapeHtml(product.sku)}</td>
                                        <td>${escapeHtml(product.category)}</td>
                                        <td>${Number(product.quantity || 0).toLocaleString('en-PH')}</td>
                                        <td>PHP ${money(product.total)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="quote-empty">No sold products for this month yet.</p>'}
            </div>
            <div class="quote-admin-report-table quote-admin-report-table--wide">
                <h3>Cancelled POs This Month</h3>
                ${cancelled.length ? `
                    <div class="product-table-wrap">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th>PO</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Cancelled</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cancelled.map((quote) => `
                                    <tr>
                                        <td>${escapeHtml(quote.request_number)}</td>
                                        <td>${escapeHtml(quote.company || quote.contact || '-')}</td>
                                        <td>PHP ${money(quote.grand_total)}</td>
                                        <td>${formatDate(quote.deleted_at)}<br><small>${escapeHtml(quote.deleted_by || '')}</small></td>
                                        <td>${escapeHtml(quote.deleted_reason || '-')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="quote-empty">No cancelled POs for this month.</p>'}
            </div>
        `;
    };

    const loadReport = async () => {
        if (!canSeeReports()) {
            return;
        }

        const response = await fetch(`/api/reports/summary?month=${encodeURIComponent(state.reportMonth)}`, { headers: headers() });
        const result = await readApiJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Unable to load reports.');
        }

        renderReport(result.summary || {});
        if (reportStatus) {
            reportStatus.textContent = 'Weekly queue and monthly report from the local PO database.';
        }
    };

    const renderUsers = (users) => {
        if (!userList) {
            return;
        }

        userList.innerHTML = `
            <div class="product-table-wrap">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>ID Number</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map((user) => `
                            <tr data-user-row
                                data-id-number="${escapeHtml(user.id_number)}"
                                data-name="${escapeHtml(user.name)}"
                                data-role="${escapeHtml(user.role)}"
                                data-active="${user.active ? '1' : '0'}">
                                <td>${escapeHtml(user.id_number)}</td>
                                <td>${escapeHtml(user.name)}</td>
                                <td>${escapeHtml(user.role)}</td>
                                <td>${user.active ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <button class="quote-button quote-button--compact" type="button" data-edit-user>Edit</button>
                                    <button class="quote-button quote-button--danger quote-button--compact" type="button" data-delete-user ${user.active ? '' : 'disabled'}>Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const loadUsers = async () => {
        if (role() !== 'Admin') {
            return;
        }

        const response = await fetch('/api/staff-users', { headers: headers() });
        const result = await readApiJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Unable to load staff users.');
        }

        renderUsers(result.users || []);
        if (userStatus) {
            userStatus.textContent = `${(result.users || []).length} staff account${(result.users || []).length === 1 ? '' : 's'} found.`;
        }
    };

    const clearUserForm = () => {
        userFields.originalId.value = '';
        userFields.id.value = '';
        userFields.name.value = '';
        userFields.role.value = 'CS';
        userFields.password.value = '';
        userFields.managerCode.value = '';
        if (userStatus) {
            userStatus.textContent = 'Creating a new staff account.';
        }
    };

    const editUser = (row) => {
        userFields.originalId.value = row.dataset.idNumber || '';
        userFields.id.value = row.dataset.idNumber || '';
        userFields.name.value = row.dataset.name || '';
        userFields.role.value = row.dataset.role || 'CS';
        userFields.password.value = '';
        userFields.managerCode.value = '';
        if (userStatus) {
            userStatus.textContent = `Editing ${row.dataset.name || row.dataset.idNumber}. Leave password blank to keep it.`;
        }
    };

    const loadInventoryStaff = async () => {
        if (!['Admin', 'CS', 'Manager', 'Boss'].includes(role())) {
            state.inventoryStaff = [];
            return;
        }

        const response = await fetch('/api/inventory-staff', { headers: headers() });
        const result = await readApiJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Unable to load inventory staff.');
        }

        state.inventoryStaff = result.users || [];
    };

    const renderQuotes = (quotes) => {
        if (!list) {
            return;
        }

        if (!state.token) {
            list.innerHTML = '<p class="quote-empty">Log in with your staff ID to view generated PO requests.</p>';
            return;
        }

        const searchQuery = state.poSearch.trim().toLowerCase();
        const preparedQuotes = quotes
            .filter((quote) => {
                if (state.statusFilter === 'all') {
                    return true;
                }

                return (quote.workflow?.workflow_status || 'Generated') === state.statusFilter;
            })
            .filter((quote) => {
                if (!searchQuery) {
                    return true;
                }

                const customer = quote.customer || {};
                const workflow = quote.workflow || {};
                return [
                    quote.request_number,
                    customer.company,
                    customer.contact,
                    customer.email,
                    customer.mobile,
                    customer.address,
                    workflow.workflow_status
                ].some((value) => String(value || '').toLowerCase().includes(searchQuery));
            })
            .sort((first, second) => {
                const firstStatus = first.workflow?.workflow_status || 'Generated';
                const secondStatus = second.workflow?.workflow_status || 'Generated';
                const firstOrder = workflowOrder.indexOf(firstStatus);
                const secondOrder = workflowOrder.indexOf(secondStatus);
                const statusDifference = (firstOrder === -1 ? 999 : firstOrder) - (secondOrder === -1 ? 999 : secondOrder);

                if (statusDifference !== 0) {
                    return statusDifference;
                }

                return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
            });

        if (preparedQuotes.length === 0) {
            list.innerHTML = `<p class="quote-empty">No PO requests found for ${escapeHtml(state.statusFilter === 'all' ? 'the selected view' : state.statusFilter)}.</p>`;
            return;
        }

        const currentWeekQuotes = preparedQuotes.filter((quote) => quote.queue?.is_current_week);
        const carryoverQuotes = preparedQuotes.filter((quote) => quote.queue?.is_carryover);
        const otherQuotes = preparedQuotes.filter((quote) => !quote.queue?.is_current_week && !quote.queue?.is_carryover);
        const selectedQueueFilters = new Set(state.queueFilters);
        const showAllQueueGroups = selectedQueueFilters.size === 0;
        const filteredQueueQuotes = [
            ...(showAllQueueGroups || selectedQueueFilters.has('carryover') ? carryoverQuotes : []),
            ...(showAllQueueGroups || selectedQueueFilters.has('current') ? currentWeekQuotes : [])
        ];
        const orderedQuotes = state.statusFilter === 'all' && !searchQuery
            ? filteredQueueQuotes
            : [...carryoverQuotes, ...currentWeekQuotes, ...otherQuotes];
        const queueSummary = state.statusFilter === 'all' && !searchQuery
            ? `
                <div class="quote-admin-queue-summary">
                    <button class="${selectedQueueFilters.has('carryover') ? 'is-active' : ''}" type="button" data-queue-filter="carryover" aria-pressed="${selectedQueueFilters.has('carryover') ? 'true' : 'false'}">
                        <span>Carryover / Needs Attention</span>
                        <strong>${carryoverQuotes.length}</strong>
                    </button>
                    <button class="${selectedQueueFilters.has('current') ? 'is-active' : ''}" type="button" data-queue-filter="current" aria-pressed="${selectedQueueFilters.has('current') ? 'true' : 'false'}">
                        <span>This Week</span>
                        <strong>${currentWeekQuotes.length}</strong>
                    </button>
                </div>
            `
            : '';

        if (orderedQuotes.length === 0) {
            const label = showAllQueueGroups ? 'weekly queue' : 'selected queue';
            list.innerHTML = `${queueSummary}<p class="quote-empty">No ${label} POs found for the current filters.</p>`;
            return;
        }

        list.innerHTML = `${queueSummary}${orderedQuotes.map((quote) => {
            const customer = quote.customer || {};
            const workflow = quote.workflow || {};
            const items = quote.items || [];
            const totals = quote.totals || {};
            const queue = quote.queue || {};
            const editableCustomer = canEditSales();
            const csLockedAfterPayment = role() === 'CS' && isPaidOrBeyond(workflow);
            const editableSales = canEditSales();
            const assignedInventoryCanEdit = isAssignedInventory(workflow);
            const editableItems = role() === 'Admin' || (role() === 'CS' && !csLockedAfterPayment);
            const canDeletePo = role() === 'Admin' || (role() === 'CS' && !csLockedAfterPayment);
            const canSaveWorkflow = canEditSales() || role() === 'Admin' || assignedInventoryCanEdit;
            const expanded = state.expandedQuotes.has(String(quote.id));
            const itemRows = items.map((item, index) => `
                <tr data-item-row data-sku="${escapeHtml(item.sku)}" data-original-quantity="${item.quantity}" data-original-price="${Number(item.unit_price || 0)}">
                    <td>${escapeHtml(item.name)}<br><small>${escapeHtml(item.sku)}</small></td>
                    <td>${escapeHtml(item.category)}</td>
                    <td><input type="number" min="1" data-item-quantity value="${item.quantity}" ${editableItems ? '' : 'disabled'}></td>
                    <td><input type="number" min="0" step="0.01" data-item-price value="${Number(item.unit_price || 0)}" ${editableItems ? '' : 'disabled'}></td>
                    <td>PHP ${money(item.line_total)}</td>
                    <td>${item.line_discount ? `PHP ${money(item.line_discount)}` : '-'}</td>
                    ${editableSales ? `<td>${editableItems ? '<button class="quote-button quote-button--danger quote-button--compact" type="button" data-remove-item>Remove</button>' : '-'}</td>` : ''}
                </tr>
            `).join('');

            return `
                <article class="quote-admin-card ${expanded ? 'is-expanded' : ''} ${queue.is_carryover ? 'quote-admin-card--carryover' : ''}" data-quote-id="${quote.id}" data-original-item-count="${items.length}">
                    <div class="quote-admin-card__header">
                        <div>
                            ${queue.is_carryover ? `<span class="quote-admin-card__warning">${escapeHtml(queue.warning || 'Carryover from previous week.')}</span>` : ''}
                            ${queue.is_current_week ? '<span class="quote-admin-card__fresh">This week</span>' : ''}
                            <h2>${escapeHtml(quote.request_number)}</h2>
                        </div>
                        <strong>${escapeHtml(workflow.workflow_status || 'Generated')}</strong>
                        <button class="quote-admin-card__toggle" type="button" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="${expanded ? 'Hide' : 'Show'} PO details" data-toggle-po-details></button>
                    </div>
                    <div class="quote-admin-card__body" ${expanded ? '' : 'hidden'}>
                        <p class="quote-admin-card__meta">${formatDate(quote.created_at)}</p>
                        <div class="quote-admin-card__customer quote-admin-card__customer--edit">
                            <label>Company / Buyer<input type="text" data-customer-company value="${escapeHtml(customer.company)}" ${editableCustomer ? '' : 'disabled'}></label>
                            <label>Contact<input type="text" data-customer-contact value="${escapeHtml(customer.contact)}" ${editableCustomer ? '' : 'disabled'}></label>
                            <label>Email<input type="email" data-customer-email value="${escapeHtml(customer.email)}" ${editableCustomer ? '' : 'disabled'}></label>
                            <label>Mobile<input type="text" data-customer-mobile value="${escapeHtml(customer.mobile)}" ${editableCustomer ? '' : 'disabled'}></label>
                            <label class="quote-admin-card__wide quote-admin-address-after-payment">
                                <input type="checkbox" data-customer-address-after-payment ${customer.address_after_payment ? 'checked' : ''} ${editableCustomer ? '' : 'disabled'}>
                                Add address after payment
                            </label>
                            <label class="quote-admin-card__wide">Delivery Address<textarea rows="3" data-customer-address ${customer.address_after_payment || !editableCustomer ? 'disabled' : ''}>${escapeHtml(customer.address)}</textarea></label>
                            <label class="quote-admin-card__wide">Google Maps Link<input type="url" data-customer-maps-url value="${escapeHtml(customer.maps_url)}" ${customer.address_after_payment || !editableCustomer ? 'disabled' : ''}></label>
                            <label class="quote-admin-card__wide">Notes<input type="text" data-customer-notes value="${escapeHtml(customer.notes)}" ${editableCustomer ? '' : 'disabled'}></label>
                        </div>
                        <div class="quote-admin-workflow">
                            <label>
                                SI Number
                                <input type="text" data-si-number value="${escapeHtml(workflow.si_number)}" placeholder="Sales invoice number" ${canEditSales() ? '' : 'disabled'}>
                            </label>
                            <label>
                                Inventory Staff <small>Required after SI</small>
                                <select data-inventory-staff ${canEditSales() ? '' : 'disabled'}>
                                    ${inventoryStaffOptions(workflow.assigned_inventory_staff)}
                                </select>
                            </label>
                            ${workflowControl(workflow)}
                            <label class="quote-admin-check">
                                <input type="checkbox" data-shipment-ready ${workflow.shipment_ready ? 'checked' : ''} ${(role() === 'Admin' || assignedInventoryCanEdit) ? '' : 'disabled'}>
                                Ready for shipment
                            </label>
                            ${role() === 'Inventory' && !assignedInventoryCanEdit ? '<p class="quote-admin-assignment-note">Only the assigned inventory staff can update this PO.</p>' : ''}
                            ${canSaveWorkflow ? '<button class="quote-button" type="button" data-save-workflow>Save Workflow</button>' : ''}
                            <a class="quote-button quote-button--secondary" href="${escapeHtml(quote.pdf_url || `/api/quote-requests/${quote.id}/pdf`)}" target="_blank" rel="noopener">PDF</a>
                        </div>
                        ${workflow.workflow_updated_at ? `<p class="quote-admin-updated">Last updated by ${escapeHtml(workflow.workflow_updated_by || 'staff')} on ${formatDate(workflow.workflow_updated_at)}</p>` : ''}
                        <div class="product-table-wrap">
                            <table class="product-table quote-admin-items">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Line Total</th>
                                        <th>Discount</th>
                                        ${editableSales ? '<th>Action</th>' : ''}
                                    </tr>
                                </thead>
                                <tbody>${itemRows}</tbody>
                            </table>
                        </div>
                        <div class="quote-admin-totals">
                            <span>Subtotal: <strong>PHP ${money(totals.subtotal)}</strong></span>
                            <span>Carton Discount: <strong>PHP ${money(totals.carton_discount)}</strong></span>
                            <span>Grand Total: <strong>PHP ${money(totals.grand_total)}</strong></span>
                        </div>
                        ${editableSales ? `
                            <div class="quote-admin-revision">
                                ${role() === 'CS' && !csLockedAfterPayment ? '<input type="password" data-manager-code placeholder="Manager code for product, price, or total changes">' : ''}
                                <button class="quote-button quote-button--secondary" type="button" data-save-revision>Save Customer / Order Revision</button>
                                ${canDeletePo ? '<button class="quote-button quote-button--danger" type="button" data-delete-po>Delete PO</button>' : ''}
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('')}`;
    };

    const loadQuotes = async () => {
        if (!state.token) {
            setStatus('Log in to load requests.');
            renderQuotes([]);
            return;
        }

        setStatus('Loading requests...');

        await loadInventoryStaff().catch((error) => {
            setStatus(error.message);
        });

        const response = await fetch('/api/quote-requests', { headers: headers() });
        const result = await readApiJson(response);

        if (!response.ok) {
            throw new Error(result.error || 'Unable to load requests.');
        }

        state.quotes = result.quotes || [];
        renderQuotes(state.quotes);
        const visibleCount = list.querySelectorAll('[data-quote-id]').length;
        setStatus(`${visibleCount} shown in the weekly work queue. Old completed POs stay in reports/history.`);
        await loadReport().catch((error) => {
            if (reportStatus) reportStatus.textContent = error.message;
        });
        await loadUsers().catch((error) => {
            if (userStatus) userStatus.textContent = error.message;
        });
    };

    const login = async () => {
        setStatus('Logging in...');
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_number: loginIdInput.value,
                password: loginPasswordInput.value
            })
        });
        const result = await readApiJson(response);

        if (!response.ok) {
            throw new Error(result.error || 'Unable to login.');
        }

        state.token = result.token;
        state.user = result.user;
        localStorage.setItem('kpickStaffToken', state.token);
        localStorage.setItem('kpickStaffUser', JSON.stringify(state.user));
        loginPasswordInput.value = '';
        updateSession();
        await loadQuotes();
    };

    const logout = () => {
        state.token = '';
        state.user = null;
        localStorage.removeItem('kpickStaffToken');
        localStorage.removeItem('kpickStaffUser');
        updateSession();
        setStatus('Logged out.');
        state.quotes = [];
        renderQuotes([]);
    };

    const saveWorkflow = async (card) => {
        const id = card.dataset.quoteId;
        const siNumber = card.querySelector('[data-si-number]')?.value || '';
        const assignedInventoryStaff = card.querySelector('[data-inventory-staff]')?.value || '';
        if (role() === 'CS' && siNumber && !assignedInventoryStaff) {
            throw new Error('Assign inventory staff before saving an SI workflow update.');
        }

        const payload = {
            si_number: siNumber,
            assigned_inventory_staff: assignedInventoryStaff,
            shipment_ready: Boolean(card.querySelector('[data-shipment-ready]')?.checked)
        };
        const workflowStatus = card.querySelector('[data-workflow-status]')?.value;
        if (workflowStatus) {
            payload.workflow_status = workflowStatus;
        }

        setStatus('Saving workflow...');
        const response = await fetch(`/api/quote-requests/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify(payload)
        });
        const result = await readApiJson(response);

        if (!response.ok) {
            throw new Error(result.error || 'Unable to save workflow.');
        }

        setStatus(`${result.quote.request_number} workflow updated.`);
        await loadQuotes();
    };

    const saveRevision = async (card) => {
        const id = card.dataset.quoteId;
        const itemRows = Array.from(card.querySelectorAll('[data-item-row]'));
        const items = itemRows.map((row) => ({
            sku: row.dataset.sku,
            quantity: row.querySelector('[data-item-quantity]')?.value || 1,
            unit_price: row.querySelector('[data-item-price]')?.value || 0
        }));
        const managerCode = card.querySelector('[data-manager-code]')?.value || '';
        if (items.length === 0) {
            throw new Error('A revised PO must keep at least one product.');
        }
        const changedItems = itemRows.some((row) => {
            const quantity = row.querySelector('[data-item-quantity]')?.value || '1';
            const price = row.querySelector('[data-item-price]')?.value || '0';
            return Number(quantity) !== Number(row.dataset.originalQuantity)
                || Number(price) !== Number(row.dataset.originalPrice);
        }) || itemRows.length !== Number(card.dataset.originalItemCount || itemRows.length);

        if (role() === 'CS' && changedItems && !managerCode) {
            throw new Error('Manager code is required before changing products, quantities, prices, or totals.');
        }

        const payload = {
            customer: {
                company: card.querySelector('[data-customer-company]')?.value || '',
                contact: card.querySelector('[data-customer-contact]')?.value || '',
                email: card.querySelector('[data-customer-email]')?.value || '',
                mobile: card.querySelector('[data-customer-mobile]')?.value || '',
                address: card.querySelector('[data-customer-address-after-payment]')?.checked ? '' : (card.querySelector('[data-customer-address]')?.value || ''),
                maps_url: card.querySelector('[data-customer-address-after-payment]')?.checked ? '' : (card.querySelector('[data-customer-maps-url]')?.value || ''),
                address_after_payment: Boolean(card.querySelector('[data-customer-address-after-payment]')?.checked),
                notes: card.querySelector('[data-customer-notes]')?.value || ''
            }
        };

        if (role() === 'Admin' || changedItems || managerCode) {
            payload.items = items;
            payload.manager_code = managerCode;
        }

        setStatus('Saving revision...');
        const response = await fetch(`/api/quote-requests/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify(payload)
        });
        const result = await readApiJson(response);

        if (!response.ok) {
            throw new Error(result.error || 'Unable to save revision.');
        }

        setStatus(`${result.quote.request_number} revision saved.`);
        await loadQuotes();
    };

    const deletePo = async (card) => {
        const id = card.dataset.quoteId;
        const poNumber = card.querySelector('h2')?.textContent || 'this PO';

        if (!window.confirm(`Delete ${poNumber}? Use this only if the customer cancelled or is unreachable.`)) {
            return;
        }

        const reason = window.prompt('Reason for deleting this PO:', 'Customer cancelled / unreachable') || '';
        setStatus('Deleting PO...');
        const response = await fetch(`/api/quote-requests/${id}`, {
            method: 'DELETE',
            headers: headers(),
            body: JSON.stringify({ reason })
        });
        const result = await readApiJson(response);

        if (!response.ok) {
            throw new Error(result.error || 'Unable to delete PO.');
        }

        setStatus(`${result.quote.request_number} deleted from active PO list.`);
        await loadQuotes();
    };

    const syncInventory = async () => {
        setStatus('Syncing Google Sheet...');
        const response = await fetch('/api/inventory/sync', {
            method: 'POST',
            headers: headers()
        });
        const result = await readApiJson(response);

        if (!response.ok) {
            throw new Error(result.error || 'Unable to sync inventory.');
        }

        setStatus(`Inventory synced. ${result.updated} products updated.`);
    };

    const saveUser = async () => {
        const payload = {
            original_id_number: userFields.originalId.value,
            id_number: userFields.id.value,
            name: userFields.name.value,
            role: userFields.role.value,
            password: userFields.password.value,
            manager_code: userFields.managerCode.value
        };

        if (userStatus) {
            userStatus.textContent = 'Saving staff account...';
        }

        const response = await fetch('/api/staff-users', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(payload)
        });
        const result = await readApiJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Unable to save staff account.');
        }

        userFields.password.value = '';
        userFields.managerCode.value = '';
        if (userStatus) {
            userStatus.textContent = `${result.user.name} saved.`;
        }
        userFields.originalId.value = result.user.id_number;
        userFields.id.value = result.user.id_number;
        await loadUsers();
    };

    const deleteUser = async (row) => {
        const idNumber = row.dataset.idNumber || '';
        const name = row.dataset.name || idNumber;

        if (!window.confirm(`Delete/deactivate account for ${name}?`)) {
            return;
        }

        if (userStatus) {
            userStatus.textContent = `Deleting ${name}...`;
        }

        const response = await fetch(`/api/staff-users/${encodeURIComponent(idNumber)}`, {
            method: 'DELETE',
            headers: headers()
        });
        const result = await readApiJson(response);
        if (!response.ok) {
            throw new Error(result.error || 'Unable to delete staff account.');
        }

        if (userStatus) {
            userStatus.textContent = `${result.user.name} deactivated.`;
        }
        clearUserForm();
        await loadUsers();
    };

    loginButton?.addEventListener('click', () => login().catch((error) => setStatus(error.message)));
    loginPasswordInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            login().catch((error) => setStatus(error.message));
        }
    });
    logoutButton?.addEventListener('click', logout);
    refreshButton?.addEventListener('click', () => loadQuotes().catch((error) => setStatus(error.message)));
    statusFilter?.addEventListener('change', () => {
        state.statusFilter = statusFilter.value;
        localStorage.setItem('kpickStatusFilter', state.statusFilter);
        renderQuotes(state.quotes);
        const visibleCount = list.querySelectorAll('[data-quote-id]').length;
        setStatus(`${visibleCount} shown in the weekly work queue.`);
    });
    poSearchInput?.addEventListener('input', () => {
        state.poSearch = poSearchInput.value;
        localStorage.setItem('kpickPoSearch', state.poSearch);
        renderQuotes(state.quotes);
        const visibleCount = list.querySelectorAll('[data-quote-id]').length;
        setStatus(`${visibleCount} shown in the weekly work queue.`);
    });
    reportMonthInput?.addEventListener('change', () => {
        state.reportMonth = reportMonthInput.value || new Date().toISOString().slice(0, 7);
        localStorage.setItem('kpickReportMonth', state.reportMonth);
        loadReport().catch((error) => {
            if (reportStatus) reportStatus.textContent = error.message;
        });
    });
    syncButton?.addEventListener('click', () => syncInventory().catch((error) => setStatus(error.message)));
    saveUserButton?.addEventListener('click', () => saveUser().catch((error) => {
        if (userStatus) userStatus.textContent = error.message;
    }));
    clearUserButton?.addEventListener('click', clearUserForm);
    userList?.addEventListener('click', (event) => {
        const row = event.target.closest('[data-user-row]');
        if (!row) {
            return;
        }

        if (event.target.closest('[data-edit-user]')) {
            editUser(row);
        }

        if (event.target.closest('[data-delete-user]')) {
            deleteUser(row).catch((error) => {
                if (userStatus) userStatus.textContent = error.message;
            });
        }
    });
    list?.addEventListener('click', (event) => {
        const queueButton = event.target.closest('[data-queue-filter]');
        if (queueButton) {
            const filter = queueButton.dataset.queueFilter || '';
            state.queueFilters = state.queueFilters.includes(filter)
                ? state.queueFilters.filter((item) => item !== filter)
                : [...state.queueFilters, filter];
            localStorage.setItem('kpickQueueFilters', JSON.stringify(state.queueFilters));
            renderQuotes(state.quotes);
            const visibleCount = list.querySelectorAll('[data-quote-id]').length;
            setStatus(state.queueFilters.length
                ? `${visibleCount} shown for selected queue groups.`
                : `${visibleCount} shown from all queue groups.`);
            return;
        }

        const card = event.target.closest('[data-quote-id]');
        if (!card) {
            return;
        }

        if (event.target.closest('[data-save-workflow]')) {
            saveWorkflow(card).catch((error) => setStatus(error.message));
        }

        if (event.target.closest('[data-toggle-po-details]')) {
            const quoteId = String(card.dataset.quoteId || '');
            if (state.expandedQuotes.has(quoteId)) {
                state.expandedQuotes.delete(quoteId);
            } else {
                state.expandedQuotes.add(quoteId);
            }
            renderQuotes(state.quotes);
            return;
        }

        if (event.target.closest('[data-customer-address-after-payment]')) {
            const checked = event.target.checked;
            const address = card.querySelector('[data-customer-address]');
            const mapsUrl = card.querySelector('[data-customer-maps-url]');
            if (address) {
                address.disabled = checked || !canEditSales();
                if (checked) address.value = '';
            }
            if (mapsUrl) {
                mapsUrl.disabled = checked || !canEditSales();
                if (checked) mapsUrl.value = '';
            }
        }

        if (event.target.closest('[data-save-revision]')) {
            saveRevision(card).catch((error) => setStatus(error.message));
        }

        if (event.target.closest('[data-remove-item]')) {
            event.target.closest('[data-item-row]')?.remove();
            setStatus('Product removed from this draft revision. Save the revision to update the PO.');
        }

        if (event.target.closest('[data-delete-po]')) {
            deletePo(card).catch((error) => setStatus(error.message));
        }
    });

    updateSession();
    loadQuotes().catch((error) => setStatus(error.message));
});
