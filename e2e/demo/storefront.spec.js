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
      for (const [slug, path] of [["home", "/"], ["catalog", "/products"], ["search", "/search?q=kit"], ["pdp", "/products/circuit-starter-kit"], ["cart", "/cart"], ["login", "/login"]]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await noHorizontalScroll(page);
        await page.screenshot({ path: `${SHOTS}/${slug}-${name}.png`, fullPage: slug !== "pdp" });
      }
    });
  }
});

test.describe("homepage: an editorial storefront, not a product list", () => {
  test("hero, featured product, categories, best sellers, learning, recently added, footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Turn Curiosity Into Creation.");
    await expect(page.getByText("Learn by building").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Explore Products/ }).first()).toHaveAttribute("href", "/products");
    await expect(page.getByRole("link", { name: "Discover Our Kits" })).toHaveAttribute("href", "/products?category=electronics-learning-kits");
    // the catalog layout is NOT the homepage
    await expect(page.getByText("Explore Our Products")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Product categories" })).toHaveCount(0);

    for (const name of ["Walker Robot Kit", "Everything that fits together", "Best Sellers", "Learning through hardware", "Recently Added"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Products", "Learning Resources", "About Us", "Contact"]) await expect(nav.getByRole("link", { name: label })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: "Search products" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("Privacy Policy");
    await page.waitForTimeout(1200); // let the entrance animation finish
    await page.screenshot({ path: `${SHOTS}/home-desktop-full.png`, fullPage: true });
  });

  for (const [name, width, height] of [["phone", 375, 812], ["laptop", 1280, 720]]) {
    test(`the hero is compact and shows products on a ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
      await expect(page.getByRole("link", { name: /Explore Products/ }).first()).toBeInViewport();
      await expect(page.getByRole("link", { name: "View Circuit Starter Kit" }).first()).toBeAttached();
      const hero = await page.locator("section[aria-labelledby=hero-h]").boundingBox();
      if (width >= 1024) expect(hero.height, "the hero must not be excessively tall").toBeLessThan(height * 0.85);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${SHOTS}/home-first-screen-${name}.png` });
    });
  }

  test("featured product: large image, details, features, price, Explore Product and Buy Now", async ({ page }) => {
    await page.goto("/");
    const spot = page.locator("section[aria-labelledby=featured-h]");
    await expect(spot.getByRole("heading", { name: "Walker Robot Kit" })).toBeVisible();
    await expect(spot.locator("img").first()).toBeVisible();
    await expect(spot.getByText("₹2,999")).toBeVisible();
    await expect(spot.getByText("In stock")).toBeVisible();
    await expect(spot.getByRole("listitem")).not.toHaveCount(0); // key features
    await expect(spot.getByRole("link", { name: "Explore product: Walker Robot Kit" })).toHaveAttribute("href", "/products/walker-robot-kit");
    await spot.getByRole("button", { name: "Buy now: Walker Robot Kit" }).click();
    await expect(page).toHaveURL(/\/(checkout|login)/); // login + OTP is required before paying
    await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
  });

  test("category cards link to the filtered catalog", async ({ page }) => {
    await page.goto("/");
    const eco = page.locator("section[aria-labelledby=eco-h]");
    for (const [name, slug] of [["Electronics Learning Kits", "electronics-learning-kits"], ["IoT Development Boards", "iot-development-boards"], ["Robotics", "robotics"], ["Accessories", "accessories"]]) {
      await expect(eco.getByRole("link", { name: new RegExp(name) })).toHaveAttribute("href", `/products?category=${slug}`);
    }
    await eco.getByRole("link", { name: /Robotics/ }).click();
    await expect(page).toHaveURL(/\/products\?category=robotics$/);
    await expect(page.locator("article:visible")).toHaveCount(1);
  });

  test("best sellers and recently added are product cards with stock and quick add; nothing is repeated", async ({ page }) => {
    await page.goto("/");
    const best = page.locator("section[aria-labelledby=best-h]");
    await expect(best.locator("article")).toHaveCount(3);
    for (const title of ["Circuit Starter Kit", "Sensor Explorer Pack", "IoT Development Board"]) {
      const card = best.locator("article", { hasText: title });
      await expect(card.locator("img")).toBeVisible();
      await expect(card.getByRole("link", { name: /Explore product/ })).toBeVisible();
      await expect(card.getByRole("button", { name: `Add to cart: ${title}` })).toBeEnabled();
    }
    await expect(best.locator("article", { hasText: "Sensor Explorer Pack" }).getByText("Only 3 left")).toBeVisible();
    await best.getByRole("button", { name: "Add to cart: Circuit Starter Kit" }).click();
    await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();

    const recent = page.locator("section[aria-labelledby=recent-h]");
    await expect(recent.locator("article")).toHaveCount(1);
    await expect(recent.locator("article")).toContainText("Prototyping Accessory Pack");
    // 3 best sellers + 1 new: the full catalog is not repeated on the homepage
    await expect(page.locator("article:visible")).toHaveCount(4);
  });

  test("Learning through hardware shows four subjects, and the nav link scrolls to it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const learning = page.locator("#learning");
    for (const name of ["Electronics", "Programming", "IoT", "Robotics"]) await expect(learning.getByRole("heading", { level: 3, name })).toBeVisible();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learning Resources" }).click();
    await expect(page.getByRole("heading", { name: "Learning through hardware" })).toBeInViewport();
  });

  test("the logo and Products link navigate between the homepage and the catalog", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole("heading", { level: 1, name: "Explore Our Products" })).toBeVisible();
    await page.getByRole("link", { name: /BeaverLab X Shop home/ }).first().click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Turn Curiosity Into Creation." })).toBeVisible();
  });

  test("Escape closes the search box and returns focus to the search button", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Search products" });
    await trigger.click();
    await expect(page.getByRole("searchbox", { name: "Search products" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("searchbox", { name: "Search products" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe("catalog at /products: discovery only", () => {
  test("status 200 (no redirect), heading, count, every product card", async ({ page, request }) => {
    const res = await request.get("/products", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    await page.goto("/products");
    await expect(page.getByRole("heading", { level: 1, name: "Explore Our Products" })).toBeVisible();
    await expect(page.getByText("Tools and kits designed to make electronics, robotics and IoT learning practical and fun.")).toBeVisible();
    await expect(page.locator("article:visible")).toHaveCount(6);
    await expect(page.getByText("6 products", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Turn Curiosity Into Creation." })).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/catalog-desktop.png`, fullPage: true });
  });

  test("every product card shows image, category, name, description, price, availability, Explore and Add to cart", async ({ page }) => {
    await page.goto("/products");
    const card = page.locator("article", { hasText: "Circuit Starter Kit" });
    await expect(card.locator("img")).toBeVisible();
    await expect(card.getByText("Electronics Learning Kits")).toBeVisible();
    await expect(card.getByRole("heading", { name: "Circuit Starter Kit" })).toBeVisible();
    await expect(card.getByText("Your first real circuits, step by step.")).toBeVisible();
    await expect(card.getByText("₹1,499")).toBeVisible();
    await expect(card.getByText("In stock")).toBeVisible();
    await expect(card.getByRole("link", { name: /Explore product/ })).toHaveAttribute("href", "/products/circuit-starter-kit");
    await expect(card.getByRole("button", { name: "Add to cart: Circuit Starter Kit" })).toBeEnabled();
    const sold = page.locator("article", { hasText: "Smart Home IoT Kit" });
    await expect(sold.getByText("Out of stock")).toBeVisible();
    await expect(sold.getByRole("button", { name: "Sold out" })).toBeDisabled();
  });

  test("category tabs filter the grid, are linkable, and 'All Products' restores everything", async ({ page }) => {
    await page.goto("/products");
    // Count VISIBLE cards: pages you navigated away from stay mounted (hidden) in this version of Next.js.
    const cards = page.locator("article:visible");
    await expect(cards).toHaveCount(6);
    const tabs = page.getByRole("navigation", { name: "Product categories" });
    for (const name of ["All Products", "Electronics Learning Kits", "IoT Development Boards", "Robotics", "Accessories"]) await expect(tabs.getByRole("button", { name })).toBeVisible();
    await expect(tabs.getByRole("button", { name: "All Products" })).toHaveAttribute("aria-pressed", "true");

    await tabs.getByRole("button", { name: "Robotics" }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Walker Robot Kit");
    await expect(page.getByText("1 product", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/products\?category=robotics$/);
    await expect(tabs.getByRole("button", { name: "Robotics" })).toHaveAttribute("aria-pressed", "true");

    await tabs.getByRole("button", { name: "Electronics Learning Kits" }).click();
    await expect(cards).toHaveCount(2);
    await tabs.getByRole("button", { name: "All Products" }).click();
    await expect(cards).toHaveCount(6);
    await expect(page).not.toHaveURL(/category=/);

    await page.goto("/products?category=iot-development-boards"); // a shared link opens already filtered
    await expect(cards).toHaveCount(2);
    await expect(tabs.getByRole("button", { name: "IoT Development Boards" })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/products?category=not-a-real-category"); // unknown values fall back to everything
    await expect(cards).toHaveCount(6);
  });

  test("sorting and the in-page search work together and can be cleared", async ({ page }) => {
    await page.goto("/products");
    const cards = page.locator("article:visible");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    await expect(cards.first()).toContainText("Prototyping Accessory Pack");
    await page.getByLabel("Sort by").selectOption("price-desc");
    await expect(cards.first()).toContainText("Smart Home IoT Kit");

    await page.getByRole("searchbox", { name: "Search these products" }).fill("robot");
    await expect(cards).toHaveCount(1);
    await expect(page).toHaveURL(/q=robot/);
    await page.getByRole("searchbox", { name: "Search these products" }).fill("zzzzqqq");
    await expect(page.getByText("No products match")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(cards).toHaveCount(6);
    await page.goto("/products?sort=name&q=kit"); // all of it from a link
    await expect(cards.first()).toContainText("Circuit Starter Kit");
  });

  test("Add to cart on a card updates the cart without leaving the page; Explore product opens the details page; the breadcrumb returns to the filtered catalog", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Add to cart: IoT Development Board" }).click();
    await expect(page.getByText("IoT Development Board added to your cart.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
    await expect(page).toHaveURL(/\/products$/);
    await page.getByRole("button", { name: "Add to cart: IoT Development Board" }).click();
    await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

    await page.locator("article", { hasText: "Walker Robot Kit" }).getByRole("link", { name: /Explore product/ }).click();
    await expect(page).toHaveURL(/\/products\/walker-robot-kit$/);
    await expect(page.getByRole("heading", { level: 1, name: "Walker Robot Kit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Now", exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Robotics" }).click();
    await expect(page).toHaveURL(/\/products\?category=robotics$/);
    await expect(page.locator("article:visible")).toHaveCount(1);
  });

  test("header search finds products by name, description and category, and explains an empty result", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Search products" }).click();
    const box = page.getByRole("searchbox", { name: "Search products" });
    await expect(box).toBeFocused();
    await box.fill("robot");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=robot$/);
    await expect(page.getByRole("heading", { level: 1, name: /Results for/ })).toBeVisible();
    await expect(page.locator("article:visible")).toHaveCount(1);
    await expect(page.locator("article:visible").first()).toContainText("Walker Robot Kit");

    await page.getByRole("button", { name: "Search products" }).click();
    await page.getByRole("searchbox", { name: "Search products" }).fill("electronics kit");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: /electronics kit/ })).toBeVisible();
    await expect(page.locator("article:visible").first()).toBeVisible();
    await page.getByRole("button", { name: "Search products" }).click();
    await page.getByRole("searchbox", { name: "Search products" }).fill("zzzzqqq");
    await page.keyboard.press("Enter");
    await expect(page.getByText("No products match your search")).toBeVisible();
    await page.getByRole("link", { name: "Browse all products" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.locator("article:visible")).toHaveCount(6);
  });
});

test("mobile menu opens, navigates and closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
  await page.locator("#mobile-menu").getByRole("link", { name: "About Us" }).click();
  await expect(page).toHaveURL(/\/about$/);
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
  await expect(page.getByRole("button", { name: "Add to Cart", exact: true })).toHaveCount(0);
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
  const pages = ["/", "/products", "/search?q=kit", "/products/circuit-starter-kit", "/products/smart-home-iot-kit", "/cart", "/login", "/contact", "/faq", "/about", "/legal/privacy-policy"];
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
