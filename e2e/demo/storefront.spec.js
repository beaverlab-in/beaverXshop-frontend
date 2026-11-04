import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import fs from "node:fs";

const SHOTS = "e2e/.output/screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [
  ["mobile", 375, 812],
  ["mobile-large", 430, 932],
  ["tablet", 768, 1024],
  ["laptop", 1280, 800],
  ["desktop", 1440, 900],
];

async function noHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 5).map((e) => e.tagName + "." + String(e.className).slice(0, 80))) : [];
  expect(overflow, `page must not scroll sideways (${page.url()}) ${JSON.stringify(offenders)}`).toBeLessThanOrEqual(1);
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

test.describe("homepage: a real electronics store", () => {
  test("utility bar, search bar, category bar, hero banner with promo tiles, shop sections, footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1); // the page title is for screen readers; the banner carries the visible headline
    // tier 1: utility bar
    await expect(page.locator("[data-announcement]")).toContainText("Free shipping on orders above ₹999");
    await expect(page.locator("[data-announcement]").getByRole("link", { name: "Track order" })).toBeVisible();
    // tier 2: logo, one wide search bar with a category picker, account, cart
    const header = page.getByRole("banner");
    await expect(header.getByRole("searchbox", { name: "Search products" })).toBeVisible();
    await expect(header.getByLabel("Search category")).toBeVisible();
    await expect(header.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Cart" })).toBeVisible();
    // tier 3: category bar
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "All Categories" })).toBeVisible();
    for (const label of ["Electronics Learning Kits", "IoT Development Boards", "Robotics", "Accessories", "Learning Resources", "About Us", "Contact"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    // hero: slider + two promo tiles; the catalog layout is NOT the homepage
    const banner = page.getByRole("region", { name: "Featured products" });
    await expect(banner.getByRole("heading", { level: 2, name: "Walker Robot Kit" })).toBeVisible();
    await expect(page.getByText("Explore Our Products")).toHaveCount(0);
    for (const name of ["Shop by category", "Deals", "Best Sellers", "New Arrivals", "Made for hands-on learning"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.getByText("Sample product")).toHaveCount(0);
    await expect(page.getByText("Demo image").first()).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("Customer service");
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/home-desktop-full.png`, fullPage: true });
  });

  for (const [name, width, height] of [["phone", 375, 812], ["laptop", 1280, 720]]) {
    test(`header and hero banner fit the first screen on a ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(page.getByRole("banner").getByRole("searchbox", { name: "Search products" })).toBeInViewport(); // search is always on screen
      await expect(page.getByRole("region", { name: "Featured products" }).getByRole("heading", { level: 2 }).first()).toBeInViewport();
      if (width >= 1024) {
        await expect(page.getByRole("button", { name: "Add to cart: Walker Robot Kit" })).toBeInViewport();
        const hero = await page.getByRole("region", { name: "Featured products" }).boundingBox();
        expect(hero.height, "the banner must not take over the whole screen").toBeLessThan(height * 0.75);
      }
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${SHOTS}/home-first-screen-${name}.png` });
    });
  }

  test("hero slider: arrows and dots switch slides; each slide sells a real product", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Featured products" });
    await expect(banner.getByRole("group", { name: "1 of 3" })).toBeVisible();
    await expect(banner.getByText("₹2,999")).toBeVisible();
    await expect(banner.getByRole("button", { name: "Add to cart: Walker Robot Kit" })).toBeVisible();
    await banner.getByRole("button", { name: "Next slide" }).click();
    await expect(banner.getByRole("group", { name: "2 of 3" })).toBeVisible();
    await expect(banner.getByRole("heading", { level: 2, name: "Circuit Starter Kit" })).toBeVisible();
    await expect(banner.getByRole("heading", { name: "Walker Robot Kit" })).toBeHidden();
    await banner.getByRole("button", { name: "Go to slide 3" }).click();
    await expect(banner.getByRole("group", { name: "3 of 3" })).toBeVisible();
    await banner.getByRole("button", { name: "Next slide" }).click(); // wraps around
    await expect(banner.getByRole("group", { name: "1 of 3" })).toBeVisible();
    await banner.getByRole("button", { name: "Add to cart: Walker Robot Kit" }).click();
    await expect(page.getByText("Walker Robot Kit added to your cart.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
    await banner.getByRole("link", { name: "View details: Walker Robot Kit" }).click();
    await expect(page).toHaveURL(/\/products\/walker-robot-kit$/);
  });

  test("promo tiles beside the banner link to products that are not already in the banner", async ({ page }) => {
    await page.goto("/");
    const tiles = page.locator("section[aria-label=Featured]").getByRole("link", { name: /Shop now/ });
    await expect(tiles).toHaveCount(2);
    await expect(tiles.first()).toContainText("New arrival");
    await expect(tiles.first()).toContainText("Prototyping Accessory Pack");
    await tiles.first().click();
    await expect(page).toHaveURL(/\/products\/prototyping-accessory-pack$/);
  });

  test("category cards link to the filtered catalog", async ({ page }) => {
    await page.goto("/");
    const cats = page.locator("section[aria-labelledby=cat-h]");
    for (const [name, slug] of [["Electronics Learning Kits", "electronics-learning-kits"], ["IoT Development Boards", "iot-development-boards"], ["Robotics", "robotics"], ["Accessories", "accessories"]]) {
      await expect(cats.getByRole("link", { name: new RegExp(name) })).toHaveAttribute("href", `/products?category=${slug}`);
    }
    await cats.getByRole("link", { name: /Robotics/ }).click();
    await expect(page).toHaveURL(/\/products\?category=robotics$/);
    await expect(page.locator("article:visible")).toHaveCount(1);
  });

  test("deals, best sellers and new arrivals are product cards with price, stock and Add to Cart", async ({ page }) => {
    await page.goto("/");
    const deals = page.locator("section[aria-labelledby=deals-h]");
    await expect(deals.locator("article")).toHaveCount(1); // only products with a real discount
    await expect(deals.locator("article")).toContainText("Sensor Explorer Pack");
    await expect(deals.getByText("₹2,199")).toBeVisible(); // original price, struck through
    await expect(deals.getByText("-14%")).toBeVisible();

    const best = page.locator("section[aria-labelledby=best-h]");
    await expect(best.locator("article")).toHaveCount(3);
    for (const title of ["Circuit Starter Kit", "Sensor Explorer Pack", "IoT Development Board"]) {
      const card = best.locator("article", { hasText: title });
      await expect(card.locator("img")).toBeVisible();
      await expect(card.getByRole("link", { name: /View details/ })).toBeVisible();
      await expect(card.getByRole("button", { name: `Add to cart: ${title}` })).toBeEnabled();
    }
    await expect(best.locator("article", { hasText: "Sensor Explorer Pack" }).getByText("Only 3 left")).toBeVisible();
    await best.getByRole("button", { name: "Add to cart: Circuit Starter Kit" }).click();
    await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();

    const fresh = page.locator("section[aria-labelledby=recent-h]");
    await expect(fresh.locator("article")).toHaveCount(1);
    await expect(fresh.locator("article")).toContainText("Prototyping Accessory Pack");
  });

  test("use cases link to categories and the nav's Learning Resources scrolls to them", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const learning = page.locator("#learning");
    for (const name of ["Classroom STEM lessons", "Coding with real hardware", "Connected projects", "Robotics clubs and workshops"]) {
      await expect(learning.getByRole("heading", { level: 3, name })).toBeVisible();
    }
    await expect(learning.getByRole("link", { name: /Robotics clubs/ })).toHaveAttribute("href", "/products?category=robotics");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learning Resources" }).click();
    await expect(page.getByRole("heading", { name: "Made for hands-on learning" })).toBeInViewport();
  });

  test("the All Categories mega menu lists categories and popular products (mouse and keyboard)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "All products" })).toBeHidden(); // closed
    await nav.getByRole("link", { name: "All Categories" }).hover();
    await expect(nav.getByRole("link", { name: "All products" })).toBeVisible();
    await expect(nav.getByText("Popular products")).toBeVisible();
    await nav.getByRole("link", { name: /Walker Robot Kit/ }).click();
    await expect(page).toHaveURL(/\/products\/walker-robot-kit$/);
    // keyboard: focusing the trigger opens the same menu
    await page.goto("/");
    await nav.getByRole("link", { name: "All Categories" }).focus();
    await expect(nav.getByRole("link", { name: "All products" })).toBeVisible();
  });

  test("the logo and All Categories navigate between the homepage and the catalog", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "All Categories" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole("heading", { level: 1, name: "Explore Our Products" })).toBeVisible();
    await page.getByRole("link", { name: /BeaverLab X Shop home/ }).first().click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByRole("region", { name: "Featured products" })).toBeVisible();
  });

  test("the search bar suggests products as you type, Escape closes them, Enter shows results, and the category picker narrows them", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const box = page.getByRole("banner").getByRole("searchbox", { name: "Search products" });
    await box.fill("robot");
    const hit = page.getByRole("banner").getByRole("link", { name: /Walker Robot Kit/ });
    await expect(hit).toBeVisible();
    await expect(hit).toContainText("₹2,999");
    await page.keyboard.press("Escape");
    await expect(hit).toBeHidden();
    await box.fill("kit");
    await page.getByLabel("Search category").selectOption("robotics");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=kit&category=robotics$/);
    await expect(page.getByText("1 product found in Robotics")).toBeVisible();
    await expect(page.locator("article:visible")).toHaveCount(1);
  });

  test("on a phone the search bar sits under the logo row and the menu holds categories and help links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const search = page.getByRole("banner").getByRole("searchbox", { name: "Search products" });
    await search.fill("sensor");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=sensor$/);
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.locator("#mobile-menu");
    await expect(menu.getByRole("link", { name: "Robotics" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Track an order" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Help and FAQ" })).toBeVisible();
  });
});

test.describe("footer", () => {
  test("service highlights, shop and customer-service columns, contact, payment methods and legal links", async ({ page }) => {
    await page.goto("/");
    const band = page.getByRole("region", { name: "Shopping with us" });
    await expect(band).toContainText("Free shipping above ₹999");
    await expect(band).toContainText("Cash on delivery");
    await expect(band).toContainText("GST invoice with every order");
    const foot = page.getByRole("contentinfo");
    for (const h of ["Shop", "Customer service", "Company", "Get in touch"]) await expect(foot.getByRole("heading", { level: 2, name: h })).toBeVisible();
    for (const l of ["Track an order", "Shipping and delivery", "Returns and refunds", "Cancellation", "Warranty", "FAQ", "About Us", "Contact", "Robotics"]) {
      await expect(foot.getByRole("link", { name: l, exact: true }).first()).toBeVisible();
    }
    await expect(foot).toContainText("We accept");
    await expect(foot).toContainText("Cash on delivery");
    for (const l of ["Privacy Policy", "Terms and Conditions", "Cookie Policy", "Back to top"]) await expect(foot.getByRole("link", { name: l })).toBeVisible();
    await expect(foot).toContainText("inclusive of GST");
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
    await expect(card.getByRole("link", { name: /View details/ })).toHaveAttribute("href", "/products/circuit-starter-kit");
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
    await page.waitForLoadState("networkidle"); // hydrated before we touch the controls
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

  test("Add to cart on a card updates the cart without leaving the page; View Details opens the details page; the breadcrumb returns to the filtered catalog", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Add to cart: IoT Development Board" }).click();
    await expect(page.getByText("IoT Development Board added to your cart.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
    await expect(page).toHaveURL(/\/products$/);
    await page.getByRole("button", { name: "Add to cart: IoT Development Board" }).click();
    await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

    await page.locator("article", { hasText: "Walker Robot Kit" }).getByRole("link", { name: /View details/ }).click();
    await expect(page).toHaveURL(/\/products\/walker-robot-kit$/);
    await expect(page.getByRole("heading", { level: 1, name: "Walker Robot Kit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Now", exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Robotics" }).click();
    await expect(page).toHaveURL(/\/products\?category=robotics$/);
    await expect(page.locator("article:visible")).toHaveCount(1);
  });

  test("header search finds products by name, description and category, and explains an empty result", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    const box = page.getByRole("banner").getByRole("searchbox", { name: "Search products" });
    await box.fill("robot");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=robot$/);
    await expect(page.getByRole("heading", { level: 1, name: /Results for/ })).toBeVisible();
    await expect(page.locator("article:visible")).toHaveCount(1);
    await expect(page.locator("article:visible").first()).toContainText("Walker Robot Kit");

    await box.fill("electronics kit");
    await box.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: /electronics kit/ })).toBeVisible();
    await expect(page.locator("article:visible").first()).toBeVisible();
    await box.fill("zzzzqqq");
    await box.press("Enter");
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
  await expect(page.getByRole("main").getByText("₹1,499").first()).toBeVisible();
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
  await page.goto("/legal/warranty-policy");
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
  const pages = ["/", "/products", "/search?q=kit", "/products/circuit-starter-kit", "/products/smart-home-iot-kit", "/cart", "/login", "/contact", "/faq", "/about", "/privacy-policy", "/terms-and-conditions", "/cookie-policy", "/legal/warranty-policy"];
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

test.describe("images and console", () => {
  test("every product photo loads, product cards use different photos, and key pages log no errors", async ({ page }) => {
    const problems = [];
    page.on("console", (m) => m.type() === "error" && problems.push("console: " + m.text()));
    page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
    page.on("response", (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`));

    for (const path of ["/", "/products", "/products/walker-robot-kit", "/search?q=sensor", "/cart", "/about", "/contact", "/faq", "/login"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // scroll through so lazy images load, then look for broken ones
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      await page.waitForTimeout(300);
      const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
      expect(broken, `broken images on ${path}`).toEqual([]);
    }

    await page.goto("/products");
    const srcs = await page.locator("article img").evaluateAll((imgs) => imgs.map((i) => { const u = new URL(i.currentSrc || i.src); return u.searchParams.get("url") ?? u.pathname; })); // optimised URLs carry the original in ?url=
    expect(srcs).toHaveLength(6);
    expect(new Set(srcs).size, "each product has its own photo").toBe(6);
    expect(srcs.every((p) => p.startsWith("/images/placeholders/") && p.endsWith(".jpg"))).toBe(true); // real photographs, not illustrations
    expect(problems).toEqual([]);
  });
});

test.describe("links", () => {
  test("every internal link on the main public pages resolves (no 404s)", async ({ page, request }) => {
    const hrefs = new Set();
    for (const path of ["/", "/products", "/products/walker-robot-kit", "/cart", "/about", "/contact", "/faq", "/login"]) {
      await page.goto(path);
      for (const h of await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) hrefs.add(h.split("#")[0] || "/");
    }
    expect(hrefs.size).toBeGreaterThan(15);
    const bad = [];
    for (const h of hrefs) {
      const res = await request.get(h, { maxRedirects: 3 });
      if (res.status() >= 400) bad.push(`${res.status()} ${h}`);
    }
    expect(bad).toEqual([]);
  });
});

test.describe("privacy and legal pages", () => {
  test("the old /legal/ addresses of the privacy policy, terms and cookie policy redirect permanently", async ({ request }) => {
    for (const slug of ["privacy-policy", "terms-and-conditions", "cookie-policy"]) {
      const res = await request.get(`/legal/${slug}`, { maxRedirects: 0 });
      expect(res.status(), slug).toBe(308);
      expect(res.headers().location).toMatch(new RegExp(`/${slug}$`));
    }
    expect((await request.get("/legal/warranty-policy", { maxRedirects: 0 })).status()).toBe(200); // other legal pages stay put
  });

  test("the privacy policy and terms say so when staff have not published them (no invented text)", async ({ page }) => {
    for (const [path, title] of [["/privacy-policy", "Privacy Policy"], ["/terms-and-conditions", "Terms and Conditions"]]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.getByText(/hasn.t been published yet/)).toBeVisible();
    }
  });

  test("the cookie policy lists exactly what the site sets and says no optional cookies are used", async ({ page }) => {
    await page.goto("/cookie-policy");
    await expect(page.getByRole("heading", { level: 1, name: "Cookie Policy" })).toBeVisible();
    await expect(page.getByText("No optional (analytics or marketing) cookies are in use")).toBeVisible();
    for (const h of ["Essential", "Analytics", "Marketing and advertising"]) await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    await expect(page.getByRole("cell", { name: /bls_sid/ })).toBeVisible();
    await expect(page.getByRole("cell", { name: /bls_cart_v1/ })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Razorpay Checkout (checkout.razorpay.com)" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Analytics none installed/ })).toBeVisible();
    await page.getByRole("button", { name: "Open cookie settings" }).click();
    await expect(page.getByRole("dialog", { name: "Cookie settings" })).toBeVisible();
  });

  test("the footer links to the policies, reopens cookie settings, and the dialog closes with Escape", async ({ page }) => {
    await page.goto("/");
    const foot = page.getByRole("contentinfo");
    await expect(foot.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
    await expect(foot.getByRole("link", { name: "Terms and Conditions" })).toHaveAttribute("href", "/terms-and-conditions");
    await expect(foot.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookie-policy");
    await expect(foot.getByRole("link", { name: "Privacy requests" })).toHaveAttribute("href", "/account/privacy");
    await foot.getByRole("button", { name: "Cookie settings" }).click();
    const dialog = page.getByRole("dialog", { name: "Cookie settings" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("only essential cookies")).toBeVisible(); // nothing optional to switch on
    await expect(dialog.getByRole("switch", { name: "Analytics" })).toHaveCount(0);
    await expect(dialog.getByRole("switch", { name: "Essential" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("there is no cookie banner while only essential cookies are used", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("region", { name: "Cookie choices" })).toHaveCount(0);
  });

  test("the login page shows a standalone collection notice with data, purpose, rights and the Board, and asks for no blanket agreement", async ({ page }) => {
    await page.goto("/login");
    const notice = page.locator("[data-collection-notice]");
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("heading", { name: "Why we ask for this" })).toBeVisible();
    await expect(notice).toContainText("Mobile number");
    await expect(notice).toContainText("Enables:");
    await notice.getByText("Your choices, rights and how to complain").click();
    await expect(notice).toContainText("withdraw an optional consent at any time");
    await expect(notice).toContainText("Data Protection Board of India");
    await expect(page.getByText(/you agree to our/i)).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "Privacy Policy" }).first()).toHaveAttribute("href", "/privacy-policy");
  });

  test("the notice appears at the other collection points: contact form, checkout details and the address form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("[data-collection-notice]")).toContainText("Reply to your question");
    await page.goto("/products/circuit-starter-kit");
    await page.getByRole("button", { name: "Buy Now" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByRole("button", { name: "Send code" }).click();
    for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill("123456"[i]);
    await page.getByLabel("Full name").fill("Asha Rao");
    // optional marketing consent is an API-mode feature; in demo mode there is nothing to opt into
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.locator("[data-collection-notice]:visible")).toContainText("Process the order");
    await page.getByRole("button", { name: "Continue to address" }).click();
    await expect(page.locator("[data-collection-notice]:visible")).toContainText("Deliver your orders");
  });

  test("the privacy area needs the live store: demo mode says so instead of pretending", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByRole("button", { name: "Send code" }).click();
    for (let i = 0; i < 6; i++) await page.getByLabel(`Digit ${i + 1} of 6`).fill("123456"[i]);
    await page.getByLabel("Full name").fill("Asha Rao");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.goto("/account/privacy");
    await expect(page.getByText("Available when the store is connected")).toBeVisible();
    for (const t of ["Overview", "My requests", "Consents", "Grievances"]) await expect(page.getByRole("navigation", { name: "Privacy sections" }).getByRole("link", { name: t })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Privacy" })).toBeVisible();
  });
});
