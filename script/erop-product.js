const eropProducts = [
    {
        id: "eroptix",
        page: "erop-eroptix.html",
        name: "EROPTIX",
        label: "Eroptix",
        description: "Surgery-assisted cooperative robot.",
        image: "img/eroptix1.png",
        featureImage: "img/eroptixBottom.png",
        imageClass: "erop-showcase__image--eroptix",
        specSections: [
            {
                title: "SPECIFICATION",
                rows: [
                    ["ERT-012", "Cooperative Robot", "1", "img/ert012.png"],
                    ["ERT-011", "End-Effector", "1", "img/ert011.png"],
                    ["ERT-005", "Joystick", "1", "img/ert005.png"],
                    ["ERT-009", "Electronic Cart", "1", "img/ert009.png"],
                ],
            },
            {
                title: "SUPPLIES",
                rows: [
                    ["RO-01", "Drape", "4EA", "img/RO01.png"],
                    ["RO-02", "Scope Holder", "1EA", ""],
                    ["RO-03", "Trocar Holder", "1EA", ""],
                    ["TS-11R", "Robot Trocar", "3EA", "img/ts11r.png"],
                ],
            },
        ],
    },
    {
        id: "trocar",
        page: "erop-trocar.html",
        name: "TROCAR",
        label: "Trocar",
        description: "Disposable trocar for laparoscopy.",
        image: "img/trocar_ts-11.png",
        showcaseName: "TS-TROCAR",
        activeVariationIndex: 2,
        imageClass: "erop-showcase__image--trocar",
        variations: [
            {
                code: "TS-3",
                image: "img/trocar_ts-3.png",
                description: "Laparoscopic 3mm Trocar<br>Minimally Invasive Surgery System",
            },
            {
                code: "TS-5",
                image: "img/trocar_ts-5.png",
                description: "Laparoscopic 5mm Trocar<br>Minimally Invasive Surgery System",
            },
            {
                code: "TS-11",
                image: "img/trocar_ts-11.png",
                description: "Laparoscopic 11mm Trocar<br>Minimally Invasive Surgery System",
            },
            {
                code: "TS-12",
                image: "img/trocar_ts-12.png",
                description: "Laparoscopic 12mm Trocar<br>Minimally Invasive Surgery System",
            },
        ],
        specs: [
            ["TS-3", "3mm", "70mm", "img/trocar_ts-3.png"],
            ["TS-5", "5mm", "80mm", "img/trocar_ts-5.png"],
            ["TS-11", "11mm", "95mm", "img/trocar_ts-11.png"],
            ["TS-12", "12mm", "100mm", "img/trocar_ts-12.png"],
        ],
        specLayout: "trocar",
    },
    {
        id: "forcep",
        page: "erop-forcep.html",
        name: "FORCEP",
        label: "Forcep",
        description: "Laparoscopic surgical aid.",
        image: "img/forcep-fc-5.png",
        showcaseName: "FORCEP",
        activeVariationIndex: 1,
        imageClass: "erop-showcase__image--forcep",
        variations: [
            {
                code: "FC-3",
                image: "img/forcep-fc-5.png",
                description: "Laparoscopic 3mm Forcep<br>Precision surgical aid",
            },
            {
                code: "FC-5",
                image: "img/forcep-fc-5.png",
                description: "Laparoscopic 5mm Forcep<br>Precision surgical aid",
            },
        ],
        specs: [
            ["FC-3", "Laparoscopic 3mm Forcep", "1", "img/forcep-fc-5.png"],
            ["FC-5", "Laparoscopic 5mm Forcep", "1", "img/forcep-fc-5.png"],
        ],
        specLayout: "forcep",
    },
    {
        id: "dual-guard",
        page: "erop-dual-guard.html",
        name: "DUAL GUARD",
        label: "Dual Guard",
        description: "Dual port type wound protector.",
        image: "img/DualGuardDGS.png",
        showcaseName: "DUAL GUARD",
        imageClass: "erop-showcase__image--dual-guard",
        variations: [
            {
                code: "DGS",
                image: "img/DualGuardDGS.png",
                description: "DGS-2 / DGS-2X",
            },
            {
                code: "DGM",
                image: "img/DGM.png",
                description: "DGM-2 / DGM-2X<br>DGM-2L / DGM-2LX",
            },
        ],
        specs: [
            ["DGS-2", "5mm x1 / 12mm x1", "135"],
            ["DGS-2X", "12mm x1 / 12mm x1", "135"],
            ["DGM-2", "5mm x1 / 12mm x1", "135"],
            ["DGM-2X", "12mm x1 / 12mm x1", "135"],
            ["DGM-2L", "5mm x1 / 12mm x1", "145"],
            ["DGM-2LX", "12mm x1 / 12mm x1", "145"],
        ],
        specLayout: "dualGuard",
    },
    {
        id: "new-port",
        page: "erop-new-port.html",
        name: "NEW PORT",
        label: "New Port",
        description: "Disposable manual medical opening device.",
        image: "img/2port.png",
        showcaseName: "NEW PORT",
        imageClass: "erop-showcase__image--new-port",
        variations: [
            {
                code: "2PORT",
                image: "img/2port.png",
                description: "Surgical instruments used during<br>laparoscopic procedures to minimize scars",
            },
            {
                code: "3PORT",
                image: "img/3port.png",
                description: "Surgical instruments used during<br>laparoscopic procedures to minimize scars",
            },
        ],
        specs: [
            {
                title: "NEW PORT 2PORT TYPE",
                image: "img/2portBP.png",
                rows: [
                    ["KSILS-2PA", "5mm x1 / 5mm x1", "135"],
                    ["KSILS-2PB", "5mm x1 / 12mm x1", "135"],
                    ["KSILS-2PC", "12mm x1 / 12mm x1", "135"],
                ],
            },
            {
                title: "NEW PORT 3PORT TYPE",
                image: "img/3portBP.png",
                rows: [
                    ["KSILS-3PA", "5mm x1 / 5mm x1 / 5mm x1", "135"],
                    ["KSILS-3PB", "5mm x1 / 5mm x1 / 12mm x1", "135"],
                    ["KSILS-3PC", "5mm x1 / 12mm x1 / 12mm x1", "135"],
                    ["KSILS-4PC", "12mm x1 / 12mm x1 / 12mm x1", "135"],
                ],
            },
        ],
        specLayout: "newPort",
    },
    {
        id: "chito-block",
        page: "erop-chito-block.html",
        name: "CHITO BLOCK",
        label: "Chito Block",
        description: "Pain buster management device kit.",
        image: "img/ChitoBlockPlenty.png",
        imageClass: "erop-showcase__image--chito-block",
        variations: [
            {
                code: "Chito-Block",
                image: "img/ChitoBlockPlenty.png",
                description: "Catheter with natural imitation bio-adhesive material coating technology",
            },
            {
                code: "Pain Catheter",
                image: "img/pain-catheter.png",
                description: "Catheter with natural imitation bio-adhesive material coating technology",
            },
        ],
        specs: [
            ["CB-K", "Chito Block Kit", "1"],
            ["CB-P", "Pain Buster Pump", "1"],
            ["CB-C", "Catheter Set", "1"],
            ["CB-S", "Syringe Set", "1"],
        ],
    },
    {
        id: "t-closure",
        page: "erop-t-closure.html",
        name: "T CLOSURE",
        label: "T Closure",
        description: "Thyroid surgical instrument.",
        image: "img/T-closure.png",
        imageClass: "erop-showcase__image--t-closure",
        specs: [
            ["TC-1", "T Closure Device", "1"],
            ["TC-R", "Retraction Ring", "1"],
            ["TC-L", "Locking Part", "1"],
            ["TC-S", "Support Component", "1"],
        ],
    },
    {
        id: "s-sustener",
        page: "erop-s-sustener.html",
        name: "S-SUSTENER",
        label: "S-Sustener",
        description: "Surgical skin closure.",
        image: "img/S-sustener.png",
        imageClass: "erop-showcase__image--s-sustener",
        specs: [
            ["SS-1", "S-Sustener Closure", "1"],
            ["SS-B", "Closure Bridge", "1"],
            ["SS-P", "Skin Patch", "2"],
            ["SS-A", "Adjusting Clip", "1"],
        ],
    },
    {
        id: "new-port-pack",
        page: "erop-new-port-pack.html",
        name: "NEW PORT PACK",
        label: "New Port Pack",
        description: "Single port kit.",
        image: "img/NewPortPack.png",
        imageClass: "erop-showcase__image--new-port-pack",
        specs: [
            ["NPP", "New Port Pack", "1"],
            ["NPP-T", "Tray Set", "1"],
            ["NPP-P", "Port Device", "1"],
            ["NPP-A", "Accessory Set", "1"],
        ],
    },
];

const productsWithoutSpecs = new Set(["chito-block", "t-closure", "s-sustener", "new-port-pack"]);
const currentProductId = document.body.dataset.eropProduct;
const currentIndex = Math.max(0, eropProducts.findIndex((product) => product.id === currentProductId));
const currentProduct = eropProducts[currentIndex] || eropProducts[0];
const previousProduct = eropProducts[(currentIndex - 1 + eropProducts.length) % eropProducts.length];
const nextProduct = eropProducts[(currentIndex + 1) % eropProducts.length];
const root = document.querySelector("#erop-product-root");

function renderSpecRows(rows, fallbackImage) {
    return rows.map(([code, name, qty, image]) => {
        const rowImage = image === undefined ? fallbackImage : image;
        const imageMarkup = rowImage ? `<img src="${rowImage}" alt="${name}" class="erop-spec__thumb">` : "";

        return `
        <tr>
            <td class="erop-spec__image-cell">${imageMarkup}</td>
            <td>${code}</td>
            <td>${name}</td>
            <td>${qty}</td>
        </tr>
    `;
    }).join("");
}

function renderSpecSections(product) {
    if (productsWithoutSpecs.has(product.id)) {
        return "";
    }

    if (product.specLayout === "forcep") {
        return `
            <section class="erop-spec__group forcep-spec">
                <h2>SPECIFICATION</h2>
                <div class="forcep-spec__table-wrap">
                    <table class="forcep-spec__table">
                        <tbody>
                            <tr>
                                <th>Locking</th>
                                <td>10-stage</td>
                                <th>Pain</th>
                                <td>Fine</td>
                            </tr>
                            <tr>
                                <th>Incision length</th>
                                <td>2cm</td>
                                <th>Hospitalization Period</th>
                                <td>2-3 days</td>
                            </tr>
                            <tr>
                                <th>Scars</th>
                                <td>1 scar almost invisible</td>
                                <th>Recovery date</th>
                                <td>3-4 days</td>
                            </tr>
                            <tr>
                                <th>Functions<br>and<br>Benefits</th>
                                <td colspan="3">
                                    <ul>
                                        <li>Maximize the convenience of the user by embedding an extra 3mm port.</li>
                                        <li>Minimize postoperative scars</li>
                                        <li>Reduces risk of complications by incorporating minimal wounds</li>
                                        <li>Strengthen producing capacities in the field of external medical procedure through the advancement of the cutting edge surgical system.</li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="forcep-spec__competitiveness">
                    <h3>Main competitiveness</h3>
                    <p>Laparoscopic medical procedure aids are utilized to hold and drag interior organs and tissues after inclusion into the human body through trocar. The claw-shaped end effector mounted toward the end of the instrument is used by the handle, and the end effector and needle part are inserted into the body with a trocar where it holds the tissue through maneuvering the handle afterwards.</p>
                </div>
            </section>
        `;
    }

    if (product.specLayout === "dualGuard") {
        return `
            <section class="erop-spec__group dual-guard-spec">
                <h2>SPECIFICATION</h2>
                <div class="dual-guard-spec__table-wrap">
                    <table class="dual-guard-spec__table">
                        <thead>
                            <tr>
                                <th>MODEL</th>
                                <th>Port SPEC</th>
                                <th>Retractor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${product.specs.map(([model, portSpec, retractor]) => `
                                <tr>
                                    <td>${model}</td>
                                    <td>${portSpec}</td>
                                    <td>${retractor}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    if (product.specLayout === "newPort") {
        return `
            <section class="erop-spec__group new-port-spec">
                <h2>SPECIFICATION</h2>
                <div class="new-port-spec__table-wrap">
                    <table class="new-port-spec__table">
                        <tbody>
                            ${product.specs.map((section) => `
                                <tr class="new-port-spec__section-title">
                                    <th colspan="4">${section.title}</th>
                                </tr>
                                <tr>
                                    <td class="new-port-spec__image-cell" rowspan="${section.rows.length + 1}">
                                        <img src="${section.image}" alt="${section.title}" class="new-port-spec__image">
                                    </td>
                                    <th>MODEL</th>
                                    <th>Port SPEC</th>
                                    <th>Retractor</th>
                                </tr>
                                ${section.rows.map(([model, portSpec, retractor]) => `
                                    <tr>
                                        <td>${model}</td>
                                        <td>${portSpec}</td>
                                        <td>${retractor}</td>
                                    </tr>
                                `).join("")}
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    if (product.specLayout === "trocar") {
        return `
            <section class="erop-spec__group">
                <h2>SPECIFICATION</h2>
                <div class="trocar-spec">
                    <table class="trocar-spec__table">
                        <tbody>
                            <tr>
                                <th></th>
                                ${product.specs.map(([code, diameter, length, image]) => `
                                    <td>
                                        <img src="${image}" alt="${code} trocar" class="trocar-spec__image">
                                    </td>
                                `).join("")}
                            </tr>
                            <tr>
                                <th>TROCAR</th>
                                ${product.specs.map(([code]) => `<td>${code}</td>`).join("")}
                            </tr>
                            <tr>
                                <th>DIAMETER</th>
                                ${product.specs.map(([, diameter]) => `<td>${diameter}</td>`).join("")}
                            </tr>
                            <tr>
                                <th>LENGTH</th>
                                ${product.specs.map(([, , length]) => `<td>${length}</td>`).join("")}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    const sections = product.specSections || [
        {
            title: "SPECIFICATION",
            rows: product.specs,
        },
    ];

    return sections.map((section) => `
        <section class="erop-spec__group">
            <h2>${section.title}</h2>
            <div class="erop-spec__table-wrap">
                <table class="erop-spec__table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Qty (EA)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderSpecRows(section.rows, product.image)}
                    </tbody>
                </table>
            </div>
        </section>
    `).join("");
}

function renderFeaturePanel(product) {
    if (!product.featureImage) {
        return "";
    }

    return `
        <section class="erop-feature-panel" aria-label="${product.label} feature overview">
            <img src="${product.featureImage}" alt="${product.label} feature overview" class="erop-feature-panel__image">
        </section>
    `;
}

function renderAfterSpecPanel(product) {
    if (product.id === "eroptix") {
        const capabilities = [
            {
                image: "img/ert011.png",
                title: "End-effector built for minimally invasive surgery",
                description: "Attaches and detaches quickly during a procedure, and accepts endoscope cameras across a range of sizes rather than a single proprietary scope.",
            },
            {
                image: "img/ert012.png",
                title: "7-axis force / torque sensing",
                description: "Force and torque are measured on all seven axes, giving the arm the precision and compliant movement required to work alongside the surgical team.",
            },
            {
                image: "img/ert005.png",
                title: "One-handed joystick control",
                description: "The surgeon directs the arm with a single hand, so the other stays on the instrument. A Normal / Reverse switch flips the control orientation to match how the surgeon is standing.",
            },
            {
                image: "img/ert009.png",
                title: "Height-adjustable electric cart",
                description: "A powered table lift sets working height for the case, and an integrated teaching pendant holder keeps the control unit within reach.",
            },
        ];

        return `
            <section class="eroptix-intro" aria-label="What EROPTIX is">
                <div class="eroptix-intro__inner">
                    <span class="eroptix-intro__eyebrow">Surgery-assisted cooperative robot</span>
                    <h3>A robotic arm that holds the endoscope, directed by the surgeon.</h3>
                    <p>In laparoscopic surgery the endoscope has to be held steady, at the right angle, for the length of the operation. EROPTIX is a cooperative robot &mdash; a cobot &mdash; that takes on that task. The arm carries the scope through a trocar, and the surgeon repositions it with a one-handed joystick as the procedure moves.</p>
                    <p>Because it is cooperative rather than autonomous, the surgeon stays in control of every movement. The system is delivered as a mobile unit: robot arm, end-effector, joystick and powered cart, with a scope holder, trocar holder and dedicated robot trocar among the supplies.</p>
                </div>
            </section>

            <section class="eroptix-rcm" aria-label="Remote centre of motion">
                <div class="eroptix-rcm__copy">
                    <h3>Remote centre of motion</h3>
                    <p>The arm's control algorithm pivots every movement around one fixed point &mdash; the incision itself. However the scope is angled or advanced, that entry point stays still.</p>
                    <p>This is what makes a robotic arm safe to use through a keyhole incision: the instrument can sweep through a wide arc inside the body while the abdominal wall at the port is not levered or stretched.</p>
                </div>
                <figure class="eroptix-rcm__figure">
                    <svg viewBox="0 0 420 300" role="img" aria-label="Diagram showing the arm pivoting about a fixed point at the incision">
                        <rect x="30" y="150" width="360" height="18" rx="9" fill="#dfe7f3"/>
                        <text x="42" y="188" class="erx-lbl-s">Abdominal wall</text>
                        <g stroke="#0b1f4b" stroke-width="7" stroke-linecap="round" opacity=".22">
                            <line x1="120" y1="28" x2="210" y2="159"/>
                            <line x1="300" y1="28" x2="210" y2="159"/>
                        </g>
                        <line x1="210" y1="20" x2="210" y2="159" stroke="#0b1f4b" stroke-width="8" stroke-linecap="round"/>
                        <line x1="210" y1="159" x2="210" y2="250" stroke="#4d7ec8" stroke-width="5" stroke-linecap="round"/>
                        <path d="M120,60 A 110 110 0 0 1 300,60" fill="none" stroke="#4d7ec8" stroke-width="2" stroke-dasharray="5 5"/>
                        <circle cx="210" cy="159" r="11" fill="#fff" stroke="#0b1f4b" stroke-width="3"/>
                        <circle cx="210" cy="159" r="4" fill="#0b1f4b"/>
                        <text x="232" y="150" class="erx-lbl">Pivot point stays fixed</text>
                        <text x="232" y="168" class="erx-lbl-s">at the incision</text>
                        <text x="150" y="272" class="erx-lbl-s">Scope sweeps inside the cavity</text>
                    </svg>
                </figure>
            </section>

            <section class="eroptix-capabilities" aria-label="EROPTIX capabilities">
                <h3>System capabilities</h3>
                <div class="eroptix-capabilities__grid">
                    ${capabilities.map((item) => `
                        <article class="eroptix-capability">
                            <div class="eroptix-capability__media">
                                <img src="${item.image}" alt="" aria-hidden="true">
                            </div>
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                        </article>
                    `).join("")}
                </div>
            </section>
        `;
    }

    if (product.id === "chito-block") {
        const features = [
            {
                icon: "img/chitoIcon1.png",
                title: "Chitosan adhesion",
                description: "Improves convenience for the practitioner and helps prevent medication backflow.",
            },
            {
                icon: "img/chitoicon2.png",
                title: "Built-in internal coil",
                description: "Improves practitioner convenience and reduces patient pain by distributing medication evenly.",
            },
            {
                icon: "img/chitoicon3.png",
                title: "Minimized side effects",
                description: "A compact 1mm diameter, micro-hole processing, and special materials help minimize side effects.",
            },
            {
                icon: "img/chitoicon4.png",
                title: "Pump",
                description: "Provides continuous medication injection through the pump.",
            },
            {
                icon: "img/chitoicon5.png",
                title: "Components",
                description: "Configured with the practitioner's convenience in mind.",
            },
        ];

        return `
            <section class="chito-function-strip">
                <div class="chito-function-strip__inner">
                    <h3>Function</h3>
                    <ul>
                        <li>Device for injecting pain-relief medication into the surgical site after various outpatient procedures.</li>
                        <li>Used by placing the catheter under the skin near the incision area before suturing after surgery.</li>
                    </ul>
                </div>
            </section>

            <section class="chito-feature-panel" aria-label="Chito Block feature overview">
                <div class="chito-feature-panel__inner">
                    <div class="chito-feature-panel__features">
                        ${features.map((feature, index) => `
                            <article class="chito-feature chito-feature--${index + 1}">
                                <img src="${feature.icon}" alt="" class="chito-feature__icon" aria-hidden="true">
                                <h3>${feature.title}</h3>
                                <p>${feature.description}</p>
                            </article>
                        `).join("")}
                    </div>
                    <div class="chito-feature-panel__visual" aria-hidden="true">
                        <img src="img/chitoblockbottom draft.png" alt="" class="chito-feature-panel__image">
                    </div>
                </div>
            </section>
        `;
    }

    if (product.id === "dual-guard") {
        return `
            <section class="erop-product-competitiveness">
                <h3>Main competitiveness</h3>
                <p>It can be compatible with existing products to reduce medical costs and secure the user's high degree of surgical freedom. It prevents secondary infections that can be potentially caused by CO2 gas reflux, and localizes the product accordingly through its own factory production.</p>
            </section>

            <section class="dual-guard-static-panel" aria-label="Dual Guard feature overview">
                <img src="img/dualguardbottom.jpg" alt="Dual Guard feature overview" class="dual-guard-static-panel__image">
            </section>
        `;
    }

    if (product.id === "new-port") {
        return `
            <section class="erop-product-competitiveness">
                <h3>Main competitiveness</h3>
                <p>It gives 1-2 autonomous ports to limit collisions between instruments during a medical procedure, which is an issue with existing single-opening ports, and shows high price competitiveness in the homegrown and worldwide business sectors with a single-hole package including a disposable endoscopic tube needle (Laparoscopic surgical instruments.).</p>
            </section>

            <section class="new-port-static-panel" aria-label="New Port feature overview">
                <img src="img/newportBottom.jpg" alt="New Port feature overview" class="new-port-static-panel__image">
            </section>
        `;
    }

    if (product.id === "forcep") {
        return `
            <section class="forcep-scroll-story" aria-label="Forcep feature story">
                <div class="forcep-scroll-story__stage" aria-hidden="true">
                    <div class="forcep-scroll-story__focus">
                        <span class="forcep-scroll-story__halo"></span>
                        <img src="img/forcep-fc-5.png" alt="" class="forcep-scroll-story__image">
                    </div>
                </div>
                <div class="forcep-scroll-story__steps">
                    <article class="forcep-scroll-step forcep-scroll-step--unlock is-active" data-forcep-step="0">
                        <img src="img/onehand-icon.png" alt="" class="trocar-feature__icon">
                        <h2>One-hand type unlocking function</h2>
                        <p>When using frequent pincers, the locking function increases hand fatigue, so the gear can be switched to unlocking mode.</p>
                    </article>
                    <article class="forcep-scroll-step forcep-scroll-step--grip" data-forcep-step="1">
                        <div>
                            <img src="img/comfortgrip-icon.png" alt="" class="trocar-feature__icon">
                            <h2>Comfortable grip</h2>
                            <p>Locking key is added to those ergonomically easy to use locations when compared to other products from different companies.</p>
                        </div>
                        <div>
                            <img src="img/10stagegear-icon.png" alt="" class="trocar-feature__icon">
                            <h2>10-stage gear<br>locking function</h2>
                            <p>When operating by attaching 10 gears to the handle and trigger, the locking function is applied to each section automatically from 1 to 10 stages (trigger operation when unloading)</p>
                        </div>
                    </article>
                </div>
            </section>
        `;
    }

    if (product.id !== "trocar") {
        return "";
    }

    return `
        <section class="trocar-info-strip">
            <div class="trocar-info-strip__inner">
                <h2>Minimally invasive surgery</h2>
                <p>Laparoscopic surgical instruments and endoscopic cameras provide space to move in and out of the patient's body. In contrast to open a medical procedure, cameras and instruments are embedded into the midsection with little openings of 0.5 to 1.5cm, which have the advantage of minimizing skin incision, fast recuperation, generally safe of infection, and limiting scars.</p>
            </div>
        </section>

        <section class="trocar-scroll-story" aria-label="Trocar feature story">
            <div class="trocar-scroll-story__stage" aria-hidden="true">
                <div class="trocar-scroll-story__focus">
                    <span class="trocar-scroll-story__halo"></span>
                    <img src="img/trocar_ts-11.png" alt="" class="trocar-scroll-story__image">
                </div>
            </div>
            <div class="trocar-scroll-story__steps">
                <article class="trocar-scroll-step trocar-scroll-step--valve" data-trocar-step="0">
                    <img src="img/gas-leakage icon.png" alt="" class="trocar-feature__icon">
                    <h2>Gas leakage prevention valve</h2>
                    <p>The aperture type valve is applied to prevent CO2 gas leakage by restoring the shape even if the surgical instrument is inserted repeatedly.</p>
                </article>
                <article class="trocar-scroll-step trocar-scroll-step--fixation" data-trocar-step="1">
                    <div>
                        <img src="img/fixation-icon.png" alt="" class="trocar-feature__icon">
                        <h2>Increased fixation<br>of the cannula</h2>
                        <p>The fixed edge is erected to prevent trocar deviation during surgery to enhance the stability and convenience of the practitioner.</p>
                    </div>
                    <div>
                        <img src="img/dualpath-icon.png" alt="" class="trocar-feature__icon">
                        <h2>DUAL Path</h2>
                        <p>Optimized the surgical vision through a double discharge system that allows fluid and exudate of the subcutaneous fat layer or fascia to escape through the drainage window.</p>
                    </div>
                </article>
                <article class="trocar-scroll-step trocar-scroll-step--tip" data-trocar-step="2">
                    <div>
                        <img src="img/headsize-icon.png" alt="" class="trocar-feature__icon">
                        <h2>Minimal head size</h2>
                        <p>25% to 30% more modest head size than other companies to forestall impact between instruments during laparoscopic or robotic medical procedure to limit the burden on medical professionals.</p>
                    </div>
                    <div>
                        <img src="img/vshape-icon.png" alt="" class="trocar-feature__icon">
                        <h2>V-shaped tip</h2>
                        <p>Precise and sharp V-shaped tip for easy use of cannula.</p>
                    </div>
                </article>
            </div>
        </section>
    `;
}

function renderShowcaseArrow(product, direction) {
    if (!product.variations || product.variations.length < 2) {
        return "";
    }

    const label = direction === "prev" ? "Previous variation" : "Next variation";
    const arrow = direction === "prev" ? "&lt;" : "&gt;";

    return `<button class="erop-showcase__arrow erop-showcase__arrow--${direction}" type="button" aria-label="${label}">${arrow}</button>`;
}

function getInitialVariation(product) {
    if (!product.variations || product.variations.length === 0) {
        return null;
    }

    return product.variations[product.activeVariationIndex || 0] || product.variations[0];
}

function renderShowcaseIndicators(product) {
    if (!product.variations || product.variations.length < 2) {
        return "";
    }

    const activeIndex = product.activeVariationIndex || 0;

    return `
        <div class="erop-showcase__indicators" aria-label="${product.label} product variations">
            ${product.variations.map((variation, index) => `
                <button class="erop-showcase__indicator${index === activeIndex ? " is-active" : ""}" type="button" data-variation-index="${index}" aria-label="View ${variation.code}">
                    ${variation.code}
                </button>
            `).join("")}
        </div>
    `;
}

function hydrateVariationShowcase(product) {
    if (!product.variations || product.variations.length < 2) {
        return;
    }

    const showcase = document.querySelector(".erop-showcase");
    const image = document.querySelector(".erop-showcase__image");
    const title = document.querySelector(".erop-showcase__caption h1");
    const description = document.querySelector(".erop-showcase__caption p");
    const indicators = Array.from(document.querySelectorAll(".erop-showcase__indicator"));
    const prevButton = document.querySelector(".erop-showcase__arrow--prev");
    const nextButton = document.querySelector(".erop-showcase__arrow--next");
    let activeIndex = product.activeVariationIndex || 0;
    let autoTimer;
    let isAnimating = false;

    function renderVariation(nextIndex, direction) {
        if (isAnimating || nextIndex === activeIndex) {
            return;
        }

        isAnimating = true;
        const variation = product.variations[nextIndex];
        const exitClass = direction === "prev" ? "is-slide-prev" : "is-slide-next";
        const enterClass = direction === "prev" ? "is-enter-prev" : "is-enter-next";

        showcase.classList.remove("is-slide-next", "is-slide-prev", "is-enter-next", "is-enter-prev");
        showcase.classList.add(exitClass);

        window.setTimeout(() => {
            image.src = variation.image;
            image.alt = variation.code;
            title.textContent = variation.code;
            description.innerHTML = variation.description;
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle("is-active", index === nextIndex);
            });

            showcase.classList.remove(exitClass);
            showcase.classList.add(enterClass);

            window.setTimeout(() => {
                showcase.classList.remove(enterClass);
                isAnimating = false;
            }, 540);
        }, 380);

        activeIndex = nextIndex;
    }

    function goToPrevious() {
        const nextIndex = (activeIndex - 1 + product.variations.length) % product.variations.length;
        renderVariation(nextIndex, "prev");
    }

    function goToNext() {
        const nextIndex = (activeIndex + 1) % product.variations.length;
        renderVariation(nextIndex, "next");
    }

    function restartAutoTimer() {
        window.clearInterval(autoTimer);
        autoTimer = window.setInterval(goToNext, 3000);
    }

    prevButton.addEventListener("click", () => {
        goToPrevious();
        restartAutoTimer();
    });

    nextButton.addEventListener("click", () => {
        goToNext();
        restartAutoTimer();
    });

    indicators.forEach((indicator) => {
        indicator.addEventListener("click", () => {
            const nextIndex = Number(indicator.dataset.variationIndex);
            const direction = nextIndex > activeIndex ? "next" : "prev";

            renderVariation(nextIndex, direction);
            restartAutoTimer();
        });
    });

    restartAutoTimer();
}

function hydrateTrocarScrollStory() {
    const story = document.querySelector(".trocar-scroll-story");

    if (!story) {
        return;
    }

    const steps = Array.from(story.querySelectorAll(".trocar-scroll-step"));

    function setActiveStep(activeIndex) {
        story.classList.toggle("is-step-1", activeIndex === 1);
        story.classList.toggle("is-step-2", activeIndex === 2);
        steps.forEach((step, index) => {
            step.classList.toggle("is-active", index === activeIndex);
        });
    }

    const observer = new IntersectionObserver((entries) => {
        const activeEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!activeEntry) {
            return;
        }

        setActiveStep(Number(activeEntry.target.dataset.trocarStep));
    }, {
        rootMargin: "-18% 0px -18% 0px",
        threshold: [0.25, 0.45, 0.6],
    });

    steps.forEach((step) => observer.observe(step));
    setActiveStep(0);
}

function hydrateForcepScrollStory() {
    const story = document.querySelector(".forcep-scroll-story");

    if (!story) {
        return;
    }

    const steps = Array.from(story.querySelectorAll(".forcep-scroll-step"));

    function setActiveStep(activeIndex) {
        story.classList.toggle("is-step-1", activeIndex === 1);
        steps.forEach((step, index) => {
            step.classList.toggle("is-active", index === activeIndex);
        });
    }

    const observer = new IntersectionObserver((entries) => {
        const activeEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!activeEntry) {
            return;
        }

        setActiveStep(Number(activeEntry.target.dataset.forcepStep));
    }, {
        rootMargin: "-18% 0px -18% 0px",
        threshold: [0.25, 0.45, 0.6],
    });

    steps.forEach((step) => observer.observe(step));
    setActiveStep(0);
}

if (root) {
    const initialVariation = getInitialVariation(currentProduct);
    const showcaseLabel = currentProduct.showcaseName || currentProduct.name;
    const showcaseImage = initialVariation ? initialVariation.image : currentProduct.image;
    const showcaseTitle = initialVariation ? initialVariation.code : currentProduct.label;
    const showcaseDescription = initialVariation ? initialVariation.description : currentProduct.description;

    root.innerHTML = `
        <section class="heading">
            <div class="header">
                <div class="header-container">
                    <div class="logo"><img src="img/KpickLogo.png" alt="K-Pick Trading Corp logo"></div>
                    <div class="email"><p class="mail">E-MAIL: sales@kpicktradingcorp.com</p></div>
                </div>
            </div>

            <div class="navbar">
                <a class="navlogo" href="index.html" aria-label="K-Pick Trading Corp home">
                    <img src="img/KpickLogoDark.png" alt="K-Pick Trading Corp" class="nav-logo">
                </a>
                <button class="nav-toggle" type="button" aria-label="Open navigation menu" aria-controls="primary-navigation" aria-expanded="false"><span></span><span></span><span></span></button>
                <div class="navigations">
                    <ul class="navigation" id="primary-navigation">
                        <li class="nav home"><a href="index.html">Home</a></li>
                        <li class="nav aboutus"><a href="index.html#about">About Us</a></li>
                        <li class="nav brands"><a href="index.html#TieUps">Brands</a></li>
                        <li class="nav learn"><a href="learn.html">Learn</a></li>
                        <li class="nav generatePO"><a href="request.htm">Generate Quote / PO</a></li>
                        <li class="nav contactus"><a href="contact.htm">Contact Us</a></li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="erop-product-hero">
            <div class="erop-product-hero__overlay"></div>
            <img src="img/eroplogo.png" alt="EROP" class="erop-product-hero__logo">
        </section>

        <main class="erop-product-main">
            <section class="erop-showcase${currentProduct.variations ? " erop-showcase--variations" : ""}" aria-label="${currentProduct.label} product showcase">
                ${renderShowcaseArrow(currentProduct, "prev")}
                <div class="erop-showcase__stage">
                    <div class="erop-showcase__orb"></div>
                    <p class="erop-showcase__word" aria-hidden="true">${showcaseLabel}</p>
                    <img src="${showcaseImage}" alt="${showcaseTitle}" class="erop-showcase__image ${currentProduct.imageClass}">
                    <div class="erop-showcase__caption">
                        <h1>${showcaseTitle}</h1>
                        <p>${showcaseDescription}</p>
                    </div>
                </div>
                ${renderShowcaseArrow(currentProduct, "next")}
                ${renderShowcaseIndicators(currentProduct)}
            </section>

            <section class="erop-spec">
                ${renderSpecSections(currentProduct)}
            </section>

            ${renderAfterSpecPanel(currentProduct)}

            ${renderFeaturePanel(currentProduct)}

            <nav class="brand-product-nav" aria-label="EROP product navigation">
                <a class="brand-product-nav__link" href="${previousProduct.page}">
                    <span>Previous</span>
                    ${previousProduct.label}
                </a>
                <a class="brand-product-nav__link" href="erop.html">
                    <span>Back</span>
                    EROP Products
                </a>
                <a class="brand-product-nav__link" href="${nextProduct.page}">
                    <span>Next</span>
                    ${nextProduct.label}
                </a>
            </nav>
        </main>

        <footer class="site-footer" id="contact">
            <div class="site-footer__top">
                <div class="site-footer__brand">
                    <img src="img/KpickLogo.png" alt="K-Pick Trading Corp." class="site-footer__logo">
                </div>
                <div class="site-footer__contact">
                    <p>Dakota Building, 555 Gen Malvar St. cor</p>
                    <p>Adriatico St. Brgy. 698 Zone 076 Malate, Manila</p>
                    <p>Mobile: +639173158420</p>
                </div>
            </div>
            <p class="site-footer__bottom">K-Pick Trading Corp. &copy; 2026 All Rights Reserved. &nbsp;&middot;&nbsp; <a href="privacy.htm" class="site-footer__policy-link">Privacy Policy</a></p>
        </footer>
        <a href="#top" class="back-to-top" aria-label="Back to top">&#8593;</a>
    `;

    window.requestAnimationFrame(() => {
        document.body.classList.add("erop-product-ready");
    });

    hydrateVariationShowcase(currentProduct);
    hydrateTrocarScrollStory();
    hydrateForcepScrollStory();
}
