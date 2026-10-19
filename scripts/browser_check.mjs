import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.GALLERY_TEST_BASE || "http://127.0.0.1:8080";
await mkdir(".cache", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
});

async function checkViewport(name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  if (name === "mobile") await page.screenshot({ path: ".cache/gallery-mobile-welcome.png" });
  await page.getByRole("button", { name: /begin walking/i }).click();
  await page.waitForFunction(() => Boolean(window.__galleryDebug));
  assert.equal(await page.locator("#fallback").isVisible(), false);
  assert.equal(await page.locator("#scene canvas").isVisible(), true);
  const before = await page.evaluate(() => window.__galleryDebug());
  await page.keyboard.down("w");
  await page.waitForFunction((startZ) => window.__galleryDebug().z < startZ - .1, before.z, { timeout: 8000 });
  await page.keyboard.up("w");
  const after = await page.evaluate(() => window.__galleryDebug());
  assert.ok(after.z < before.z - .1, `${name}: forward movement failed`);
  assert.equal(after.section, 1);
  assert.equal(after.frameCount, 41);

  await page.setViewportSize({ width: options.viewport.width - 30, height: options.viewport.height - 50 });
  const canvasSize = await page.locator("#scene canvas").boundingBox();
  assert.ok(canvasSize.width > 250 && canvasSize.height > 400);
  await page.screenshot({ path: `.cache/gallery-${name}.png` });

  if (options.hasTouch) {
    assert.equal(await page.locator("#joystick").isVisible(), true);
    const ring = await page.locator(".joystick-ring").boundingBox();
    const center = { x: ring.x + ring.width / 2, y: ring.y + ring.height / 2 };
    const touch = await context.newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: center.x, y: center.y, id: 1 }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: center.x, y: center.y - 27, id: 1 }] });
    const transform = await page.locator("#joystick-knob").evaluate((node) => node.style.transform);
    assert.match(transform, /-27px/);
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }

  const yawBefore = await page.evaluate(() => window.__galleryDebug().yaw);
  await page.mouse.move(options.viewport.width * .72, options.viewport.height * .48);
  await page.mouse.down();
  await page.mouse.move(options.viewport.width * .82, options.viewport.height * .48);
  await page.mouse.up();
  const yawAfter = await page.evaluate(() => window.__galleryDebug().yaw);
  assert.ok(yawAfter > yawBefore, `${name}: drag-to-look failed`);

  if (name === "desktop") {
    for (const [section, x, z] of [[1, 0, -9], [2, 9, -18], [3, 18, -8], [4, 29, 2], [5, 40, -9]]) {
      await page.evaluate(([px, pz]) => window.__galleryTestPose(px, pz, 0), [x, z]);
      await page.waitForFunction((number) => document.querySelector("#section-status").textContent === `Gallery ${number} / 5`, section);
      assert.match(await statusText(page), new RegExp(`Gallery ${section} / 5`));
    }
    await page.evaluate(() => document.querySelector("#scene canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
    await page.locator("#fallback").waitFor({ state: "visible" });
  }

  assert.deepEqual(errors, [], `${name}: page errors`);
  await context.close();
  console.log(`${name}: rendered, moved, resized; screenshot saved`);
}

async function statusText(page) {
  return page.locator("#section-status").textContent();
}

try {
  const home = await browser.newPage();
  await home.goto(base, { waitUntil: "domcontentloaded" });
  assert.equal(await home.locator("a.explore-entry").getAttribute("href"), "/explore/");
  await home.close();
  await checkViewport("desktop", { viewport: { width: 1280, height: 800 } });
  await checkViewport("mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  const context = await browser.newContext();
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === "webgl2" ? null : original.call(this, kind, ...args);
    };
  });
  const fallbackPage = await context.newPage();
  await fallbackPage.goto(`${base}/explore/`, { waitUntil: "domcontentloaded" });
  await fallbackPage.locator("#fallback").waitFor({ state: "visible" });
  assert.equal(await fallbackPage.locator(".frame-list li").count(), 41);
  await context.close();
  console.log("WebGL fallback: 41 numbered frames visible");

  // Local-only fixture: the published manifest still has 41 solid frames.
  const roomContext = await browser.newContext({ viewport: { width: 920, height: 700 } });
  await roomContext.route("**/explore/", async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const marker = '"previewImage":null,"modelUrl":null';
    assert.ok(original.includes(marker));
    await route.fulfill({ response, body: original.replace(marker, '"previewImage":"/fixtures/painting.png","modelUrl":"/fixtures/empty-room.glb"') });
  });
  await roomContext.route("**/fixtures/painting.png", (route) => route.fulfill({ contentType: "image/png", body: readFileSync("tests/fixtures/painting.png") }));
  await roomContext.route("**/fixtures/empty-room.glb", (route) => route.fulfill({ contentType: "model/gltf-binary", body: readFileSync("tests/fixtures/empty-room.glb") }));
  const roomPage = await roomContext.newPage();
  const roomErrors = [];
  roomPage.on("pageerror", (error) => roomErrors.push(error.message));
  await roomPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await roomPage.getByRole("button", { name: /begin walking/i }).click();
  await roomPage.evaluate(() => window.__galleryTestPose(-1.75, -2.8, -Math.PI / 2));
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
  await roomPage.keyboard.down("w");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await roomPage.keyboard.up("w");
  await roomPage.waitForTimeout(450);
  await roomPage.keyboard.down("s");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await roomPage.keyboard.up("s");
  await roomPage.evaluate(() => window.__galleryTestPose(40, -18, 0));
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(roomErrors, []);
  await roomContext.close();
  console.log("Portal fixture: near peek loaded, crossing entered, exit returned and released the room");
} finally {
  await browser.close();
}
