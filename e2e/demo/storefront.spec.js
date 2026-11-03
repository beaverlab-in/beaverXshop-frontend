import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import fs from "node:fs";

const SHOTS = "e2e/.output/screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [
  ["mobile", 375, 812],
  ["tablet", 768, 1024],
  ["desktop", 1280, 800],
];

async function noHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page must not scroll sideways").toBeLessThanOrEqual(1);
}

test.describe("responsive layout", () => {
  for (const [name, width, height] of WIDTHS) {
    test(`home, products and a product page at ${name} (${width}px) have no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const [slug, path] of [["home", "/"], ["products", "/products"], ["pdp", "/products/circuit-starter-kit"], ["cart", "/cart"], ["login", "/login"]]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await noHorizontalScroll(page);
        await page.screenshot({ path: `${SHOTS}/${slug}-${name}.png`, fullPage: slug !== "pdp" });
      }
    });
  }
});

test("home page: one H1, hero actions, nav and footer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build. Explore. Learn. Create.");
  await expect(page.getByRole("link", { name: "Explore Products" }).first()).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["Home", "Products", "Learning", "About", "Contact"]) await expect(nav.getByRole("link", { name: label })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Privacy Policy");
  await expect(page.locator("h1")).toHaveCount(1);
});

test("mobile menu opens, navigates and closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
  await page.locator("#mobile-menu").getByRole("link", { name: "Products" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0); // closed after navigating
});

test("keyboard users get a skip link as the first stop", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test("cart: add from a product page, change quantity, remove", async ({ page }) => {
  await page.goto("/products/circuit-starter-kit");
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await expect(page.getByText("added to your cart")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Circuit Starter Kit" })).toBeVisible();
  await expect(page.getByText("₹1,499").first()).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();
  await expect(page.getByText("₹2,998").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/cart-filled-desktop.png`, fullPage: true });

  await page.getByRole("button", { name: /Remove Circuit Starter Kit/ }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("cart survives a reload (saved on this device)", async ({ page }) => {
  await page.goto("/products/iot-dev-board");
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.reload();
  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
});

test("a sold-out product cannot be bought", async ({ page }) => {
  await page.goto("/products/smart-home-iot-kit");
  await expect(page.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add to Cart" })).toHaveCount(0);
});

test("coupon: demo code applies, an invalid one is explained", async ({ page }) => {
  await page.goto("/products/circuit-starter-kit");
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.goto("/cart");
  await page.getByLabel(/Coupon code/).fill("NOPE");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("This coupon code is not valid.")).toBeVisible();
  await page.getByLabel(/Coupon code/).fill("DEMO10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Demo coupon applied")).toBeVisible();
  await expect(page.getByText("−₹149.90")).toBeVisible();
});

test("full demo checkout: login with OTP, address, COD order, then tracking page", async ({ page }) => {
  await page.goto("/products/circuit-starter-kit");
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.goto("/cart");
  await page.getByRole("link", { name: "Proceed to checkout" }).click();

  // Guests are sent to log in first, then returned to checkout.
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible();

  // Wrong code first
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill("0");
  await expect(page.getByText("That code is not correct")).toBeVisible();
  for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill("123456"[i]);
  await expect(page.getByRole("heading", { name: /One last thing/ })).toBeVisible();
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to address" }).click();

  // New address with validation
  await page.getByLabel("PIN code").fill("012345");
  await page.getByRole("button", { name: "Save and deliver here" }).click();
  await expect(page.getByText("Enter a valid 6-digit PIN code.")).toBeVisible();
  await page.getByLabel("PIN code").fill("400001");
  await page.getByLabel("State").selectOption("Maharashtra");
  await page.getByLabel("City / Town").fill("Mumbai");
  await page.getByLabel("House / Flat / Building").fill("12");
  await page.getByLabel("Street / Area").fill("MG Road");
  await page.getByRole("button", { name: "Save and deliver here" }).click();
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByText("MG Road").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/checkout-review-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Continue to payment" }).click();

  await page.getByRole("radio", { name: /Cash on delivery/ }).check();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByRole("heading", { name: /your order is in/ })).toBeVisible();
  const orderNumber = (await page.getByText(/BL-\d{6}-[0-9A-Z]{4}/).first().textContent()).match(/BL-\d{6}-[0-9A-Z]{4}/)[0];
  await page.screenshot({ path: `${SHOTS}/order-confirmed-desktop.png`, fullPage: true });

  // Cart was emptied; the order appears in the account with its own address copy
  await expect(page.getByRole("banner").getByRole("link", { name: "Cart", exact: true })).toBeVisible(); // no item count: the cart was emptied
  await page.getByRole("link", { name: "Track your order" }).click();
  await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
  await expect(page.getByText("Demo order")).toBeVisible();
  await expect(page.getByText("MG Road").first()).toBeVisible();
  await page.goto("/account/orders");
  await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
});

test("account pages ask guests to log in and remember where they were going", async ({ page }) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Forders/);
});

test("unknown URLs show a helpful 404 and unpublished legal pages say so", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /couldn.t find that page/ })).toBeVisible();
  await page.goto("/legal/privacy-policy");
  await expect(page.getByText(/hasn.t been published yet/)).toBeVisible();
});

test("contact form validates and (in demo mode) says nothing was sent", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Please tell us your name.")).toBeVisible();
  await page.getByLabel("Your name").fill("Asha");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Message").fill("Which kit is best for a 12 year old?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/not sent/)).toBeVisible();
});

test.describe("accessibility (axe, including colour contrast)", () => {
  const pages = ["/", "/products", "/products/circuit-starter-kit", "/products/smart-home-iot-kit", "/cart", "/login", "/contact", "/faq", "/about", "/legal/privacy-policy"];
  for (const path of pages) {
    test(`no serious or critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
