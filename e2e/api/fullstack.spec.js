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
    await expect(nav.getByRole("link", { name: item })).toBeVisible();
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
  await expect(nav.getByRole("link", { name: "Inventory" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Products" })).toBeVisible();
  for (const hidden of ["Team", "Settings", "Reports", "Orders", "Coupons"]) await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
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

  for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/products/new", "/admin/inventory", "/admin/customers", "/admin/coupons", "/admin/reports", "/admin/settings", "/admin/team", "/admin/notifications"]) {
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
