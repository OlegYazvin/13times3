import assert from "node:assert/strict";
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
  assert.equal(before.frame01Painting, true, `${name}: frame 01 painting should load on opening`);
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

  if (options.hasTouch) {
    const touch = await context.newCDPSession(page);
    const origin = { x: 290, y: 340, id: 2 };
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [origin] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...origin, x: origin.x + 65 }] });
    await page.waitForTimeout(140);
    const turning = await page.evaluate(() => window.__galleryDebug().yaw);
    await page.waitForTimeout(260);
    const stillTurning = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(stillTurning > turning + .15, "mobile: holding the right drag should keep turning");
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(80);
    const released = await page.evaluate(() => window.__galleryDebug().yaw);
    await page.waitForTimeout(180);
    const stopped = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(Math.abs(stopped - released) < .04, "mobile: releasing the right drag should stop turning");

    const left = { x: 70, y: 340, id: 3 };
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [left] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...left, x: left.x + 70 }] });
    await page.waitForTimeout(180);
    const leftTouch = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(Math.abs(leftTouch - stopped) < .04, "mobile: the left half should not turn the view");
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    const reverse = { x: 290, y: 340, id: 4 };
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [reverse] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...reverse, x: reverse.x - 65 }] });
    await page.waitForTimeout(240);
    const turnedLeft = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(turnedLeft < leftTouch - .15, "mobile: holding a left drag should keep turning left");
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }

  if (name === "desktop") {
    await page.evaluate(() => window.__galleryTestPose(0, -18, 0));
    await page.waitForTimeout(150);
    await page.screenshot({path:".cache/gallery-first-turn.png"});
    for (const [section, x, z] of [[1, 0, -11], [2, 11, -22], [3, 22, -11], [4, 33, 0], [5, 44, -13]]) {
      await page.evaluate(([px, pz]) => window.__galleryTestPose(px, pz, 0), [x, z]);
      await page.waitForFunction((number) => document.querySelector("#section-status").textContent === `Gallery ${number} / 5`, section);
      assert.match(await statusText(page), new RegExp(`Gallery ${section} / 5`));
    }
    assert.equal((await page.evaluate(() => window.__galleryDebug())).frame01Painting, true,
      "desktop: frame 01 painting must remain visible from the far hall");
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

  // Test the actual published room, its threshold, obstacle, exit, and cleanup.
  const roomContext = await browser.newContext({ viewport: { width: 920, height: 700 } });
  const roomPage = await roomContext.newPage();
  const roomErrors = [];
  roomPage.on("pageerror", (error) => roomErrors.push(error.message));
  await roomPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await roomPage.getByRole("button", { name: /begin walking/i }).click();
  await roomPage.evaluate(() => window.__galleryTestPose(-1, -4.775, -Math.PI / 2));
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
  await roomPage.waitForTimeout(120);
  await roomPage.screenshot({path:".cache/room01-framed.png"});
  await roomPage.evaluate(() => window.__galleryTestPose(-2.45, -4.775, -Math.PI / 2));
  await roomPage.keyboard.down("w");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await roomPage.keyboard.up("w");
  await roomPage.waitForTimeout(500);
  assert.equal(await roomPage.locator("#room-title").textContent(),"You signed Zephrine up for dance and acting classes!");
  assert.equal(await roomPage.locator("#room-title").isVisible(),true);
  await roomPage.screenshot({path:".cache/room01-entered.png"});
  await roomPage.evaluate(() => window.__galleryTestPose(.1, -.35, 0));
  await roomPage.keyboard.down("w");
  await roomPage.waitForTimeout(220);
  await roomPage.keyboard.up("w");
  assert.ok((await roomPage.evaluate(() => window.__galleryDebug().z)) > -.47, "stage should block forward movement");
  await roomPage.evaluate(() => window.__galleryTestPose(0, 2.20, 0));
  await roomPage.keyboard.down("s");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await roomPage.keyboard.up("s");
  assert.equal(await roomPage.locator("#room-title").isVisible(),false);
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.equal((await roomPage.evaluate(() => window.__galleryDebug())).frame01Painting, true,
    "room: painting must remain after unloading the 3D scene");
  await roomPage.evaluate(() => window.__galleryTestPose(40, -18, 0));
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(roomErrors, []);
  await roomContext.close();
  console.log("Room 01: near peek loaded, threshold entered, stage blocked, exit returned and resources released");

  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const phonePage = await phoneContext.newPage();
  const phoneErrors = [];
  phonePage.on("pageerror", error => phoneErrors.push(error.message));
  await phonePage.goto(`${base}/explore/`, {waitUntil:"networkidle"});
  await phonePage.getByRole("button", {name:/begin walking/i}).click();
  await phonePage.evaluate(() => window.__galleryTestPose(-2.45,-4.775,-Math.PI/2));
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "01",null,{timeout:12000});
  const ring = await phonePage.locator(".joystick-ring").boundingBox();
  const phoneTouch = await phoneContext.newCDPSession(phonePage);
  const point = {x:ring.x+ring.width/2,y:ring.y+ring.height/2,id:5};
  await phoneTouch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[point]});
  await phoneTouch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{...point,y:point.y-38}]});
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room",null,{timeout:12000});
  await phoneTouch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await phonePage.waitForTimeout(500);
  await phonePage.screenshot({path:".cache/room01-mobile-entered.png"});
  assert.deepEqual(phoneErrors,[]);
  await phoneContext.close();
  console.log("Phone emulation: left-thumb movement crossed frame 01 and entered the room");
} finally {
  await browser.close();
}
