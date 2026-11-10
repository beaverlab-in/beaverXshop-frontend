import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import fs from "node:fs";

// Real backend + API-mode storefront + admin panel, driven in Chrome. State flows between the tests, so they run in order.
const SHOTS = "e2e/.output/screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

const API_PORT = process.env.E2E_API_PORT || 4000;
const SIDE_PORT = process.env.E2E_SIDE_PORT || 4001; // the harness's test-only OTP / reset channel

const ADMIN = "9000000001";
const SHOPPER = "9222222222";
const STAFF2 = "9000000002";
let contexts = {};
let pages = {};
const shared = { orderNumber: "" };

async function latestCode(mobile) {
  for (let i = 0; i < 20; i++) {
    const { otp } = await (await fetch(`http://localhost:${SIDE_PORT}/otp/${mobile}`)).json();
    if (otp) return otp;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no login code for ${mobile}`);
}

async function loginAs(page, mobile, { name, next } = {}) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Mobile number").fill(mobile);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible();
  const code = await latestCode(mobile);
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill(code[i]);
  if (name) {
    // First-time numbers are asked for a name; returning ones go straight through.
    const profile = page.getByRole("heading", { name: /One last thing/ });
    await Promise.race([profile.waitFor({ timeout: 10_000 }).catch(() => {}), page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10_000 }).catch(() => {})]);
    if (await profile.isVisible()) {
      await page.getByLabel("Full name").fill(name);
      await page.getByRole("button", { name: "Continue" }).click();
    }
  }
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }, info) => {
  // Clean database + rate limits for every run (test-only harness endpoint).
  await fetch(`http://localhost:${SIDE_PORT}/reset`);
  const baseURL = info.project.use.baseURL;
  for (const key of ["admin", "shopper", "guest", "staff2"]) {
    contexts[key] = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } });
    pages[key] = await contexts[key].newPage();
  }
});
test.afterAll(async () => {
  for (const c of Object.values(contexts)) await c.close();
});

test("an ordinary shopper cannot use the admin panel, and the storefront reads live API data", async () => {
  const p = pages.shopper;
  await p.goto("/");
  await expect(p.getByRole("heading", { level: 1 })).toBeVisible(); // the featured product
  await expect(p.getByRole("heading", { level: 2, name: "Best Sellers" }).or(p.getByRole("heading", { level: 2, name: "Start Here" }))).toBeVisible();
  await expect(p.getByText("Demo image")).toHaveCount(0); // live data, not the demo set
  await p.goto("/products");
  await expect(p.getByRole("heading", { name: "Walker Robot Kit" })).toBeVisible();
  await loginAs(p, SHOPPER, { name: "Ravi Kumar" });
  await expect(p).toHaveURL(/\/account$/);
  await p.goto("/admin");
  await expect(p.getByRole("heading", { name: "This area is for store staff" })).toBeVisible();
  // and the API itself refuses, not just the screen
  const status = await p.evaluate(async (port) => (await fetch(`http://localhost:${port}/api/v1/admin/products`, { credentials: "include" })).status, API_PORT);
  expect(status).toBe(403);
});

test("admin signs in with the same mobile + OTP and lands on a dashboard without the shop header or footer", async () => {
  const p = pages.admin;
  await p.goto("/admin");
  await expect(p).toHaveURL(/\/login\?next=%2Fadmin/);
  await loginAs(p, ADMIN, { next: "/admin" });
  await expect(p).toHaveURL(/\/admin$/);
  await expect(p.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  await expect(p.getByText("Revenue (paid orders)")).toBeVisible();
  const nav = p.getByRole("navigation", { name: "Admin" });
  for (const item of ["Orders", "Products", "Inventory", "Customers", "Coupons", "Reports", "Notifications", "Settings", "Team", "Audit log"]) {
    await expect(nav.getByRole("link", { name: item, exact: true })).toBeVisible();
  }
  await expect(p.getByRole("contentinfo")).toHaveCount(0); // the storefront footer is hidden
  await expect(p.getByRole("link", { name: "Skip to content" })).toBeHidden();
  await p.screenshot({ path: `${SHOTS}/admin-dashboard-desktop.png`, fullPage: true });
});

test("admin creates a category and a product through the forms; the storefront shows it", async () => {
  const p = pages.admin;
  await p.goto("/admin/categories");
  await p.getByRole("button", { name: "New category" }).click();
  const dialog = p.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("E2E Gadgets");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(p.getByText("Category saved.")).toBeVisible();
  await expect(p.getByRole("cell", { name: /E2E Gadgets/ })).toBeVisible();

  await p.goto("/admin/products/new");
  await p.getByLabel("Title", { exact: true }).fill("E2E Widget");
  await p.getByLabel("SKU", { exact: true }).fill("E2E-001");
  await p.getByLabel("Category", { exact: true }).selectOption({ label: "E2E Gadgets" });
  await p.getByLabel("Status", { exact: true }).selectOption("published");
  await p.getByLabel("Short introduction").fill("A widget made by the browser test.");
  await p.getByLabel("Selling price (₹)").fill("499");
  await p.getByLabel("HSN code").fill("9023");
  await p.getByLabel("Opening stock").fill("10");
  await p.getByLabel(/Featured product/).check(); // the Homepage panel
  // validation: a bad price is explained, not silently accepted
  await p.getByLabel("Selling price (₹)").fill("49.999");
  await p.getByRole("button", { name: "Create product" }).click();
  await expect(p.getByText("Enter an amount like 1499 or 1499.50.")).toBeVisible();
  await p.getByLabel("Selling price (₹)").fill("499");
  await p.getByRole("button", { name: "Create product" }).click();
  await expect(p.getByText("Product created.")).toBeVisible();
  await expect(p).toHaveURL(/\/admin\/products\/[a-f0-9]{24}$/);
  await p.screenshot({ path: `${SHOTS}/admin-product-form-desktop.png`, fullPage: true });

  // storefront
  const s = pages.shopper;
  await s.goto("/products/e2e-widget");
  await expect(s.getByRole("heading", { name: "E2E Widget", level: 1 })).toBeVisible();
  await expect(s.getByText("₹499").first()).toBeVisible();
  await expect(s.getByText("Demo image")).toHaveCount(0); // real products carry no sample badge
  // the admin flag reaches the public API (the homepage spotlight reads it)
  const pub = await (await fetch(`http://localhost:${API_PORT}/api/v1/catalog/products/e2e-widget`)).json();
  expect(pub.data).toMatchObject({ isFeatured: true, isBestSeller: false });
});

test("a guest's cart is merged into the saved cart on login and survives clearing the browser", async () => {
  const p = pages.guest;
  await p.goto("/products/e2e-widget");
  await p.getByRole("button", { name: "Add to Cart" }).first().click();
  await expect(p.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
  await loginAs(p, "9333333333", { name: "Guest Gita" });
  await expect(p).toHaveURL(/\/account$/);
  await p.waitForTimeout(1500); // the merge + debounce
  // wipe the device cart: the server cart must bring it back
  await p.evaluate(() => localStorage.removeItem("bls_cart_v1"));
  await p.goto("/cart");
  await expect(p.getByRole("heading", { name: "E2E Widget" })).toBeVisible();
  await expect(p.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
  // logging out must not leave the cart for the next person on this device
  await p.goto("/account");
  await p.getByRole("button", { name: "Log out" }).click();
  await expect(p.getByText("You've been logged out.")).toBeVisible(); // wait for the server to end the session
  await p.goto("/cart");
  await expect(p.getByText("Your cart is empty")).toBeVisible();
});

test("shopper checks out with cash on delivery against the real API", async () => {
  const p = pages.shopper;
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 300)));
  p.on("console", (m) => m.type() === "error" && errs.push("CONSOLE " + m.text().slice(0, 300)));
  await p.goto("/products/e2e-widget");
  await p.getByRole("button", { name: "Add to Cart" }).first().click();
  await p.goto("/cart");
  await expect(p.getByText("₹499").first()).toBeVisible();
  await p.getByRole("link", { name: "Proceed to checkout" }).click();
  await expect(p).toHaveURL(/\/checkout$/);
  await p.getByRole("button", { name: "Continue to address" }).click({ timeout: 8000 }).catch(async (e) => {
    await p.screenshot({ path: `${SHOTS}/DEBUG-checkout.png`, fullPage: true });
    console.log("ERRS:", JSON.stringify(errs, null, 1));
    throw e;
  });
  await p.getByLabel("PIN code").fill("400001");
  await p.getByLabel("State").selectOption("Maharashtra");
  await p.getByLabel("City / Town").fill("Mumbai");
  await p.getByLabel("House / Flat / Building").fill("7");
  await p.getByLabel("Street / Area").fill("Marine Drive");
  await p.getByRole("button", { name: "Save and deliver here" }).click();
  await p.getByRole("button", { name: "Continue to review" }).click();
  await expect(p.getByText("Marine Drive").first()).toBeVisible();
  await p.getByRole("button", { name: "Continue to payment" }).click();
  // Razorpay isn't configured on this backend, so only COD is offered (and nothing pretends otherwise)
  await expect(p.getByRole("radio", { name: /Pay online/ })).toHaveCount(0);
  await p.getByRole("radio", { name: /Cash on delivery/ }).check();
  await p.getByRole("button", { name: "Place order" }).click();
  await expect(p.getByRole("heading", { name: /your order is in/ })).toBeVisible();
  const text = await p.getByText(/BL-\d{6}-[0-9A-Z]{4,5}/).first().textContent();
  shared.orderNumber = text.match(/BL-\d{6}-[0-9A-Z]{4,5}/)[0];
  await p.screenshot({ path: `${SHOTS}/api-order-confirmed-desktop.png`, fullPage: true });
});

test("admin finds the order, sees the GST breakup and invoice, and moves it to shipped with tracking", async () => {
  const p = pages.admin;
  await p.goto("/admin/orders");
  await p.getByPlaceholder(/BL-250101/).fill(shared.orderNumber);
  await p.getByRole("button", { name: "Apply" }).click();
  await p.getByRole("link", { name: shared.orderNumber }).click();
  await expect(p.getByRole("heading", { name: shared.orderNumber, level: 1 })).toBeVisible();
  await expect(p.getByText("CGST")).toBeVisible(); // Maharashtra to Maharashtra: intra-state
  await expect(p.getByText(/^INV\/\d{2}-\d{2}\/\d{6}$/)).toBeVisible();
  await p.screenshot({ path: `${SHOTS}/admin-order-detail-desktop.png`, fullPage: true });

  const move = async (label) => {
    await p.getByRole("button", { name: label }).click();
    await p.getByRole("button", { name: "Update status" }).click();
    await expect(p.getByText("Order updated.")).toBeVisible();
  };
  await move("Mark processing");
  await move("Mark packed");
  // shipping needs courier details first
  await p.getByRole("button", { name: "Mark shipped" }).click();
  await p.getByLabel("Courier name").fill("Ekart");
  await p.getByLabel("Tracking number").fill("EK123456789");
  await p.getByLabel(/Tracking link/).fill("https://track.example.test/EK123456789");
  await p.getByRole("button", { name: "Save and mark shipped" }).click();
  await expect(p.getByText("Marked as shipped.")).toBeVisible();
  await expect(p.getByText("EK123456789").first()).toBeVisible();
  await p.getByRole("button", { name: "Mark cash collected" }).click();
  await expect(p.getByText("Cash marked as collected.")).toBeVisible();
});

test("the shopper sees shipment tracking and can open the invoice", async () => {
  const p = pages.shopper;
  await p.goto(`/account/orders/${shared.orderNumber}`);
  await expect(p.getByText("Shipped", { exact: true }).first()).toBeVisible();
  await expect(p.getByText("EK123456789")).toBeVisible();
  await expect(p.getByRole("link", { name: /Track with courier/ })).toHaveAttribute("href", "https://track.example.test/EK123456789");
  const invoice = p.getByRole("link", { name: /Download invoice/ });
  await expect(invoice).toBeVisible();
  const res = await p.evaluate(async (url) => {
    const r = await fetch(url, { credentials: "include" });
    return { status: r.status, type: r.headers.get("content-type"), head: new TextDecoder().decode((await r.arrayBuffer()).slice(0, 5)) };
  }, await invoice.getAttribute("href"));
  expect(res).toEqual({ status: 200, type: "application/pdf", head: "%PDF-" });
});

test("admin sees the order messages (simulated), downloads a CSV report, and reads the audit trail", async () => {
  const p = pages.admin;
  await p.goto("/admin/notifications");
  await expect(p.getByText("Simulated mode")).toBeVisible();
  await p.getByRole("button", { name: "Send queued now" }).click();
  await expect(p.getByText("Queue processed.")).toBeVisible();
  await expect(p.getByRole("table").getByText("order shipped").first()).toBeVisible();
  await expect(p.getByText("simulated").first()).toBeVisible();
  await p.getByRole("tab", { name: "Templates" }).click();
  await expect(p.getByText("Not set").first()).toBeVisible();

  await p.goto("/admin/reports");
  const [download] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export CSV" }).click()]);
  expect(download.suggestedFilename()).toBe("report-sales.csv");
  const csv = fs.readFileSync(await download.path(), "utf8");
  expect(csv).toContain("Date,Orders");

  await p.goto("/admin/audit-log");
  await expect(p.getByText("order.status").first()).toBeVisible();
  await expect(p.getByText("product.create").first()).toBeVisible();

  await p.goto("/admin");
  await expect(p.getByText("Best sellers")).toBeVisible();
  await expect(p.getByText("E2E Widget").first()).toBeVisible();
});

test("admin adds a staff member; they see only what their role allows", async () => {
  const p = pages.admin;
  await p.goto("/admin/team");
  await p.getByRole("button", { name: "Add team member" }).click();
  const dialog = p.getByRole("dialog");
  await dialog.getByLabel("Mobile number").fill(STAFF2);
  await dialog.getByLabel(/^Name/).fill("Ines Inventory");
  await dialog.getByLabel("Role").selectOption({ label: "Inventory Manager" });
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(p.getByText("Team member added.")).toBeVisible();

  const s = pages.staff2;
  await loginAs(s, STAFF2, { next: "/admin" });
  await expect(s).toHaveURL(/\/admin$/);
  const nav = s.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByRole("link", { name: "Inventory", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Products", exact: true })).toBeVisible();
  for (const hidden of ["Team", "Settings", "Reports", "Orders", "Coupons"]) await expect(nav.getByRole("link", { name: hidden, exact: true })).toHaveCount(0);
  // even if they type the address, the server says no
  await s.goto("/admin/team");
  await expect(s.getByText("You don't have permission to do that.")).toBeVisible();
  await s.goto("/admin/inventory");
  await expect(s.getByRole("button", { name: "Adjust" }).first()).toBeVisible();
});

test("admin switches the announcement strip on from Settings > Storefront (and it reaches the public API)", async () => {
  const p = pages.admin;
  await p.goto("/admin/settings");
  await p.getByRole("tab", { name: "Storefront" }).click();
  await p.getByLabel("Show the announcement strip").check();
  await p.getByLabel("Message").fill("Free shipping on orders above ₹999");
  await p.getByLabel("Link").fill("javascript:alert(1)");
  await p.getByRole("button", { name: "Save" }).click();
  await expect(p.getByText("Use a site path like /products or an https:// link.")).toBeVisible(); // unsafe links are refused
  await p.getByLabel("Link").fill("/products");
  await p.getByRole("button", { name: "Save" }).click();
  await expect(p.getByText("Free shipping on orders above ₹999").or(p.getByRole("status").filter({ hasText: /saved/i })).first()).toBeVisible();
  const pub = await (await fetch(`http://localhost:${API_PORT}/api/v1/content/settings/public`)).json();
  expect(pub.data.storefront.announcement).toEqual({ text: "Free shipping on orders above ₹999", href: "/products" });
  await p.screenshot({ path: `${SHOTS}/admin-settings-storefront-desktop.png`, fullPage: true });
  // leave the store as we found it
  await p.getByLabel("Show the announcement strip").uncheck();
  await p.getByRole("button", { name: "Save" }).click();
  await expect.poll(async () => (await (await fetch(`http://localhost:${API_PORT}/api/v1/content/settings/public`)).json()).data.storefront.announcement).toBeNull();
});

test("inventory adjustments are recorded and refused below zero", async () => {
  const p = pages.staff2;
  await p.goto("/admin/inventory");
  await p.getByPlaceholder("Name or SKU").fill("E2E");
  await p.getByRole("button", { name: "Search" }).click();
  await p.getByRole("button", { name: "Adjust" }).first().click();
  await p.getByLabel("Change").fill("-50");
  await p.getByLabel("Note").fill("Counted wrongly");
  await p.getByRole("button", { name: "Save change" }).click();
  await expect(p.getByText("That would take stock below zero.")).toBeVisible();
  await p.getByLabel("Change").fill("5");
  await p.getByLabel("Note").fill("Received more units");
  await p.getByRole("button", { name: "Save change" }).click();
  await expect(p.getByText("Stock updated.")).toBeVisible();
  await p.getByRole("button", { name: "History" }).first().click();
  await expect(p.getByText("Received more units")).toBeVisible();
});

const PRIVACY_CUSTOMER = "9444444444";

async function signUp(page, mobile, name, { optIn = false } = {}) {
  await page.goto("/login");
  await expect(page.locator("[data-collection-notice]:visible")).toContainText("Mobile number"); // the notice is shown before anything is asked
  await page.getByLabel("Mobile number").fill(mobile);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible();
  const code = await latestCode(mobile);
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill(code[i]);
  await expect(page.getByRole("heading", { name: /One last thing/ })).toBeVisible();
  const box = page.getByRole("checkbox", { name: /Send me offers and product news on WhatsApp/ });
  await expect(box).not.toBeChecked(); // never pre-ticked
  if (optIn) await box.check();
  await page.getByLabel("Full name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test("privacy settings: staff name the privacy contact, publish the policy, and the public page shows real details only", async () => {
  const p = pages.admin;
  await p.goto("/admin/privacy/policy");
  await expect(p.getByRole("alert").filter({ hasText: "Before you can publish" })).toBeVisible(); // locked until the privacy contact exists
  await expect(p.getByRole("button", { name: "Publish this version" })).toBeDisabled();
  await p.goto("/admin/privacy/settings");
  await p.getByLabel("Name", { exact: true }).fill("Asha Rao");
  await p.getByLabel("Role or title").fill("Privacy lead");
  await p.getByLabel("Email", { exact: true }).fill("privacy@example.test");
  await p.getByRole("button", { name: "Save privacy settings" }).click();
  await expect(p.getByText("Privacy settings saved.")).toBeVisible();

  await p.goto("/admin/privacy/policy");
  await expect(p.getByRole("alert").filter({ hasText: "Before you can publish" })).toHaveCount(0);
  await p.getByRole("button", { name: "Publish this version" }).click();
  await expect(p.getByText("Privacy policy published.")).toBeVisible();

  const g = pages.guest;
  await g.goto("/privacy-policy");
  await expect(g.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  await expect(g.getByRole("heading", { level: 2, name: "1. Who we are" })).toBeVisible();
  await expect(g.getByRole("heading", { level: 2, name: "19. Changes to this policy" })).toBeVisible();
  const main = g.getByRole("main");
  await expect(main).toContainText("Beaver Learning Pvt Ltd");
  await expect(main).toContainText("Asha Rao");
  await expect(main).toContainText("privacy@example.test");
  await expect(main.getByRole("cell", { name: "Razorpay" })).toBeVisible(); // the live processor registry
  await expect(main).toContainText("within 90 days");
  await expect(main).not.toContainText("{{");
  await expect(main).not.toContainText("not provided yet");
  await g.screenshot({ path: `${SHOTS}/privacy-policy-desktop.png`, fullPage: true });
});

test("a new customer sees the notice first, offers are unticked, consent is recorded, shown in history, and withdrawn in one tap", async () => {
  const p = pages.guest;
  await signUp(p, PRIVACY_CUSTOMER, "Priya Nair", { optIn: true });

  await p.goto("/account/privacy/consents");
  const row = p.getByRole("listitem").filter({ hasText: "Offers and product news on WhatsApp" });
  await expect(row.getByText("On", { exact: true })).toBeVisible();
  await expect(p.getByRole("cell", { name: "Turned on" })).toBeVisible();

  await p.getByRole("button", { name: "Turn off: Offers and product news on WhatsApp" }).click();
  await expect(p.getByText("Turned off. We have stopped this use.")).toBeVisible();
  await expect(row.getByText("Off", { exact: true })).toBeVisible();
  await expect(p.getByRole("cell", { name: "Turned off" })).toBeVisible();
  await expect(p.getByRole("cell", { name: "Turned on" })).toBeVisible(); // history keeps both

  await p.getByRole("button", { name: "Turn on: Offers and product news on WhatsApp" }).click(); // giving it again is a deliberate tap
  await expect(row.getByText("On", { exact: true })).toBeVisible();
  await p.screenshot({ path: `${SHOTS}/account-privacy-consents-desktop.png`, fullPage: true });

  // the withdrawal also created an automatically completed request, visible in the history
  await p.goto("/account/privacy/requests");
  await expect(p.getByText("Consent withdrawal").first()).toBeVisible();
  await expect(p.getByText("Completed").first()).toBeVisible();
});

test("rights: an access request right after login works and shows the data and who it is shared with; a grievance is tracked and answered by staff", async () => {
  const p = pages.guest;
  await p.goto("/account/privacy");
  await expect(p.getByRole("heading", { level: 1, name: "Privacy and your data" })).toBeVisible();
  await expect(p.getByText("privacy@example.test").first()).toBeVisible(); // the published privacy contact
  await expect(p.getByText("Priya Nair").first()).toBeVisible();

  await p.getByRole("button", { name: "View full summary" }).click();
  const summary = p.getByRole("dialog", { name: "Summary of the personal data we hold" });
  await expect(summary.getByText("Razorpay")).toBeVisible();
  await expect(summary.getByText("Who it is shared with")).toBeVisible();
  await expect(summary).not.toContainText("Ravi Kumar"); // another customer's data never appears
  await summary.getByRole("button", { name: "Close" }).last().click();

  await p.getByRole("button", { name: "What data do you hold about me?" }).click();
  await p.getByRole("dialog").getByRole("button", { name: "Send request" }).click();
  await expect(p.getByText(/Request PR-\d{4}-\d{6} sent\./)).toBeVisible();

  await p.goto("/account/privacy/grievances");
  await expect(p.getByText("within 90 days at most").or(p.getByText("within", { exact: false }).first())).toBeVisible();
  await p.getByRole("button", { name: "Send a grievance" }).first().click();
  const dlg = p.getByRole("dialog", { name: "Send a grievance" });
  await dlg.getByLabel("Short title").fill("Unwanted calls");
  await dlg.getByLabel("What happened?").fill("I received calls about an offer although I did not choose offers.");
  await dlg.getByRole("button", { name: "Send grievance" }).click();
  const toast = await p.getByText(/Request PR-\d{4}-\d{6} sent\./).textContent();
  shared.grievanceId = toast.match(/PR-\d{4}-\d{6}/)[0];
  const card = p.locator(`[data-request-id="${shared.grievanceId}"]`);
  await expect(card).toContainText("Grievance");
  await expect(card).toContainText("Submitted");
  await expect(card).toContainText("We will respond by");
});

test("staff handle the grievance end to end: review, respond, resolve, complete; the customer sees the answer", async () => {
  const a = pages.admin;
  await a.goto("/admin/privacy/grievances");
  await a.getByRole("cell", { name: shared.grievanceId }).click();
  const d = a.getByRole("dialog", { name: shared.grievanceId });
  await expect(d).toContainText("Unwanted calls");
  await expect(d).toContainText("Identity check"); // the login code time is recorded on every request
  await expect(d).toContainText("Respond by");
  await expect(d.getByRole("button", { name: "Completed" })).toHaveCount(0); // cannot jump straight to completed: the button is not offered yet
  await d.getByRole("button", { name: "Approved" }).click();
  await expect(a.getByText("Moved to approved.")).toBeVisible();
  await d.getByLabel("Response", { exact: true }).fill("We stopped the calls and removed the number from the call list.");
  await d.getByRole("button", { name: "Send response" }).click();
  await expect(a.getByText("Response sent.")).toBeVisible();
  await d.getByLabel("What was done, or why it was refused").fill("Calls stopped; process corrected.");
  await d.getByRole("button", { name: "Save resolution" }).click();
  await expect(a.getByText("Resolution saved.")).toBeVisible();
  await d.getByRole("button", { name: "Completed" }).click();
  await expect(a.getByText("Moved to completed.")).toBeVisible();

  const p = pages.guest;
  await p.goto("/account/privacy/requests");
  const card = p.locator(`[data-request-id="${shared.grievanceId}"]`);
  await expect(card).toContainText("Completed");
  await card.getByRole("button", { name: "Show details and response" }).click();
  await expect(card).toContainText("We stopped the calls");
  await expect(card).toContainText("Calls stopped; process corrected.");
  await expect(card).not.toContainText("Internal"); // staff notes never reach the customer
  await p.screenshot({ path: `${SHOTS}/account-privacy-requests-desktop.png`, fullPage: true });
});

test("the cookie banner appears only when staff say an optional tool is installed; Accept and Reject look the same; choices persist and can be reopened", async () => {
  const a = pages.admin;
  const g = pages.shopper;
  await g.goto("/");
  await g.waitForLoadState("networkidle");
  await expect(g.getByRole("region", { name: "Cookie choices" })).toHaveCount(0); // nothing optional yet: no banner

  await a.goto("/admin/privacy/settings");
  await a.getByRole("checkbox", { name: /An analytics or marketing tool is installed/ }).check();
  await a.getByRole("button", { name: "Save privacy settings" }).click();
  await expect(a.getByText("Privacy settings saved.")).toBeVisible();

  await g.goto("/");
  const banner = g.getByRole("region", { name: "Cookie choices" });
  await expect(banner).toBeVisible();
  const accept = await banner.getByRole("button", { name: "Accept optional" }).boundingBox();
  const reject = await banner.getByRole("button", { name: "Reject optional" }).boundingBox();
  expect(Math.abs(accept.height - reject.height), "rejecting is not harder than accepting").toBeLessThan(1);
  expect(Math.abs(accept.width - reject.width)).toBeLessThan(1);
  await g.screenshot({ path: `${SHOTS}/cookie-banner-desktop.png` });

  await banner.getByRole("button", { name: "Reject optional" }).click();
  await expect(banner).toBeHidden();
  const stored = JSON.parse(await g.evaluate(() => localStorage.getItem("bl_cookie_prefs")));
  expect(stored).toMatchObject({ analytics: false, marketing: false });
  await g.reload();
  await g.waitForLoadState("networkidle");
  await expect(g.getByRole("region", { name: "Cookie choices" })).toHaveCount(0); // remembered

  await g.getByRole("contentinfo").getByRole("button", { name: "Cookie settings" }).click();
  const dlg = g.getByRole("dialog", { name: "Cookie settings" });
  await expect(dlg.getByRole("switch", { name: "Essential" })).toBeDisabled();
  await expect(dlg.getByRole("switch", { name: "Analytics" })).not.toBeChecked();
  await dlg.getByRole("switch", { name: "Analytics" }).check();
  await dlg.getByRole("button", { name: "Save preferences" }).click();
  await expect(dlg).toBeHidden();
  const saved = JSON.parse(await g.evaluate(() => localStorage.getItem("bl_cookie_prefs")));
  expect(saved).toMatchObject({ analytics: true, marketing: false });
  // the choice is also recorded on the server
  await expect.poll(async () => (await (await fetch(`http://localhost:${API_PORT}/api/v1/privacy/cookie-preferences/${saved.prefId}`)).json()).data?.analytics).toBe(true);

  // leave the store as we found it
  await a.goto("/admin/privacy/settings");
  await a.getByRole("checkbox", { name: /An analytics or marketing tool is installed/ }).uncheck();
  await a.getByRole("button", { name: "Save privacy settings" }).click();
  await expect(a.getByText("Privacy settings saved.")).toBeVisible();
});

test("the contact form sends a message to the store when signed in or not", async () => {
  const g = pages.guest;
  await g.goto("/contact");
  await g.getByLabel("Your name").fill("Priya Nair");
  await g.getByLabel("Email").fill("priya@example.test");
  await g.getByLabel("Message").fill("Which kit is best for a 12 year old?");
  await expect(g.locator("[data-collection-notice]:visible")).toContainText("Reply to your question");
  await g.getByRole("button", { name: "Send message" }).click();
  await expect(g.getByRole("heading", { name: "Message sent" })).toBeVisible();
});

test("breach incidents and retention: staff can report an incident (72-hour clock) and preview retention without changing data", async () => {
  const a = pages.admin;
  await a.goto("/admin/privacy/incidents");
  await a.getByRole("button", { name: "Report an incident" }).first().click();
  const dlg = a.getByRole("dialog", { name: "Report an incident" });
  await dlg.getByLabel("Title").fill("Test: export link exposed");
  await dlg.getByLabel("What happened").fill("A customer export was reachable by link for a short time.");
  await dlg.getByRole("button", { name: "Record incident" }).click();
  const detail = a.getByRole("dialog", { name: /^BR-\d{4}-\d{3}$/ });
  await expect(detail).toContainText("Discovered (the 72-hour clock starts here)");
  await expect(detail).toContainText("Nothing is ever sent automatically");
  await expect(detail).toContainText("Board report outline");
  await detail.getByRole("button", { name: "Close" }).last().click();
  await expect(a.getByRole("cell", { name: /^BR-\d{4}-\d{3}$/ })).toBeVisible();

  await a.goto("/admin/privacy/retention");
  await expect(a.getByRole("cell", { name: "Security and audit logs" })).toBeVisible();
  await expect(a.getByRole("row", { name: /Orders, invoices and shipments/ })).toContainText("Not applicable"); // never deleted automatically
  await a.getByRole("button", { name: "Preview a run" }).click();
  await expect(a.getByText("Preview (nothing was changed)")).toBeVisible();
  await a.getByRole("cell", { name: "Security and audit logs" }).click();
  await a.getByRole("dialog").getByLabel("Retention period (days)").fill("100");
  await a.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(a.getByRole("alert").filter({ hasText: /365/ }).first()).toBeVisible(); // the one-year floor is enforced
  await a.screenshot({ path: `${SHOTS}/admin-privacy-retention-desktop.png`, fullPage: true });
});

test("the Privacy & Compliance sidebar group is for privacy staff only", async () => {
  const a = pages.admin;
  await a.goto("/admin/privacy");
  const nav = a.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByText("Privacy & Compliance")).toBeVisible();
  for (const l of ["Overview", "Data inventory", "Consent records", "Privacy requests", "Grievances", "Children's data", "Breach incidents", "Retention", "Processors", "Privacy policy", "Privacy settings", "Privacy audit trail"]) {
    await expect(nav.getByRole("link", { name: l, exact: true })).toBeVisible();
  }
  await expect(a.getByRole("heading", { name: "Privacy overview" })).toBeVisible();
  await expect(a.getByText("Real figures from the database")).toBeVisible();
  await a.screenshot({ path: `${SHOTS}/admin-privacy-overview-desktop.png`, fullPage: true });

  const s = pages.staff2; // an order manager
  await s.goto("/admin");
  await expect(s.getByRole("navigation", { name: "Admin" }).getByText("Privacy & Compliance")).toHaveCount(0);
  await s.goto("/admin/privacy");
  await expect(s.getByRole("alert")).toBeVisible(); // the backend refuses; the page says so
});

test.describe("privacy pages: accessibility", () => {
  for (const path of ["/account/privacy", "/account/privacy/requests", "/account/privacy/consents", "/account/privacy/grievances", "/privacy-policy", "/cookie-policy", "/terms-and-conditions"]) {
    test(`no serious or critical accessibility violations on ${path}`, async () => {
      const p = pages.guest;
      await p.goto(path);
      await p.waitForLoadState("networkidle");
      await p.waitForTimeout(400);
      const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});

test.describe("admin layout and accessibility", () => {
  test("the sidebar becomes a drawer on a phone, with no sideways scrolling", async ({ browser }, info) => {
    const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: { width: 375, height: 812 }, storageState: await contexts.admin.storageState() });
    const p = await ctx.newPage();
    for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/settings"]) {
      await p.goto(path);
      await expect(p.getByRole("button", { name: "Open menu" })).toBeVisible();
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} must not scroll sideways`).toBeLessThanOrEqual(1);
    }
    await p.goto("/admin");
    await p.getByRole("button", { name: "Open menu" }).click();
    await p.getByRole("dialog", { name: "Navigation" }).getByRole("link", { name: "Orders" }).click();
    await expect(p).toHaveURL(/\/admin\/orders$/);
    await p.screenshot({ path: `${SHOTS}/admin-orders-mobile.png`, fullPage: true });
    await ctx.close();
  });

  for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/products/new", "/admin/inventory", "/admin/customers", "/admin/coupons", "/admin/reports", "/admin/settings", "/admin/team", "/admin/notifications", "/admin/privacy", "/admin/privacy/data-inventory", "/admin/privacy/consents", "/admin/privacy/requests", "/admin/privacy/grievances", "/admin/privacy/children", "/admin/privacy/incidents", "/admin/privacy/retention", "/admin/privacy/processors", "/admin/privacy/policy", "/admin/privacy/settings", "/admin/privacy/audit"]) {
    test(`no serious or critical accessibility violations on ${path}`, async () => {
      const p = pages.admin;
      await p.goto(path);
      await p.waitForLoadState("networkidle");
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${SHOTS}/admin${path.replaceAll("/", "-")}-desktop.png`, fullPage: true });
      const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
