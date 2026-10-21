import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { HALL_WIDTH, PLAYER_RADIUS } from "../client/explore/layout.mjs";

const base = process.env.GALLERY_TEST_BASE || "http://127.0.0.1:8080";
const leftWall = -HALL_WIDTH / 2;
const rightWall = HALL_WIDTH / 2;
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
  await page.waitForFunction(() => window.__galleryDebug().music.playing && window.__galleryDebug().music.level > .02);
  const fadeStart = await page.evaluate(() => window.__galleryDebug().music.level);
  await page.waitForTimeout(650);
  const fadeLater = await page.evaluate(() => window.__galleryDebug().music.level);
  assert.ok(fadeLater > fadeStart && fadeLater < .42, `${name}: music should fade in gradually`);
  await page.getByRole("button", { name: "Turn music off" }).click();
  await page.waitForFunction(() => !window.__galleryDebug().music.playing);
  await page.getByRole("button", { name: "Turn music on" }).click();
  await page.waitForFunction(() => window.__galleryDebug().music.playing && window.__galleryDebug().music.level > .02);
  assert.equal(await page.locator("#fallback").isVisible(), false);
  assert.equal(await page.locator("#scene canvas").isVisible(), true);
  const before = await page.evaluate(() => window.__galleryDebug());
  assert.equal(before.frame01Painting, true, `${name}: frame 01 painting should load on opening`);
  await page.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
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
    const origin = { x: 250, y: 340, id: 2 };
    const heldStart = await page.evaluate(() => window.__galleryDebug().yaw);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [origin] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...origin, x: 335 }] });
    await page.waitForFunction((start) => window.__galleryDebug().yaw > start + .15, heldStart, { timeout: 5000 });
    const turning = await page.evaluate(() => window.__galleryDebug().yaw);
    await page.waitForFunction((start) => window.__galleryDebug().yaw > start + .15, turning, { timeout: 5000 });
    const stillTurning = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(stillTurning > turning + .15, "mobile: holding a rightward drag should keep turning");
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...origin, x: 165 }] });
    await page.waitForFunction((start) => window.__galleryDebug().yaw < start - .15, stillTurning, { timeout: 5000 });
    const turningLeft = await page.evaluate(() => window.__galleryDebug().yaw);
    await page.waitForFunction((start) => window.__galleryDebug().yaw < start - .15, turningLeft, { timeout: 5000 });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(80);
    const released = await page.evaluate(() => window.__galleryDebug().yaw);
    await page.waitForTimeout(180);
    const stopped = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(Math.abs(stopped - released) < .04, "mobile: releasing the drag should stop turning");

    const left = { x: 70, y: 340, id: 3 };
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [left] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...left, x: 145 }] });
    await page.waitForFunction((start) => window.__galleryDebug().yaw > start + .15, stopped, { timeout: 5000 });
    const leftTouch = await page.evaluate(() => window.__galleryDebug().yaw);
    await page.waitForFunction((start) => window.__galleryDebug().yaw > start + .15, leftTouch, { timeout: 5000 });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    const reverse = { x: 225, y: 340, id: 4 };
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [reverse] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...reverse, x: 145 }] });
    await page.waitForFunction((start) => window.__galleryDebug().yaw < start - .15, leftTouch, { timeout: 5000 });
    const turnedLeft = await page.evaluate(() => window.__galleryDebug().yaw);
    assert.ok(turnedLeft < leftTouch - .15, "mobile: a leftward drag should turn from anywhere on the scene");
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
  assert.equal(await fallbackPage.locator(".fallback-previews img").count(), 3);
  assert.equal(await fallbackPage.locator(".frame-list li").first().textContent(), "Zephrine's first stage");
  await context.close();
  console.log("WebGL fallback: 41 frames listed with the completed painting caption");

  // The painting opens onto the same world; crossing never replaces the camera pose.
  const roomContext = await browser.newContext({ viewport: { width: 920, height: 700 } });
  const roomPage = await roomContext.newPage();
  const roomErrors = [];
  roomPage.on("pageerror", (error) => roomErrors.push(error.message));
  await roomPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await roomPage.getByRole("button", { name: /begin walking/i }).click();
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
  await roomPage.evaluate(() => window.__galleryTestPose(0, -1.1, -.67));
  await roomPage.waitForFunction(() => window.__galleryDebug().paintingOpacity === 1);
  await roomPage.screenshot({ path: ".cache/room01-painting-far.png" });
  await roomPage.evaluate(() => window.__galleryTestPose(0, -4.975, -Math.PI / 2));
  await roomPage.waitForFunction(() => window.__galleryDebug().paintingOpacity < 1);
  const midway = await roomPage.evaluate(() => window.__galleryDebug());
  assert.ok(midway.paintingOpacity > .45 && midway.paintingOpacity < 1);
  await roomPage.screenshot({ path: ".cache/room01-painting-reveal.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -4.975, -Math.PI / 2), leftWall + 1);
  await roomPage.waitForFunction(() => window.__galleryDebug().paintingOpacity <= .45);
  await roomPage.screenshot({ path: ".cache/room01-open-doorway.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -3.9, -Math.PI / 2), leftWall + 1);
  await roomPage.screenshot({ path: ".cache/room01-open-doorway-angled.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -4.975, -Math.PI / 2), leftWall + .55);
  const beforeEntry = await roomPage.evaluate(() => window.__galleryDebug());
  await roomPage.keyboard.down("w");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await roomPage.keyboard.up("w");
  const entered = await roomPage.evaluate(() => window.__galleryDebug());
  assert.ok(entered.x < leftWall && entered.x > leftWall - .2,
    "entry position should advance through the frame without a jump");
  assert.equal(entered.yaw, beforeEntry.yaw);
  assert.equal(entered.cameraFov, beforeEntry.cameraFov);
  assert.equal(entered.cameraFov, 75);
  assert.equal(await roomPage.locator("#room-title").textContent(), "You signed Zephrine up for dance and acting classes!");
  await roomPage.screenshot({ path: ".cache/room01-entered-continuous.png" });

  // Authored obstacles and the room shell remain solid.
  await roomPage.evaluate(() => window.__galleryTestRoomPose(0, -.35, -Math.PI / 2));
  await roomPage.keyboard.down("w");
  await roomPage.waitForTimeout(220);
  await roomPage.keyboard.up("w");
  assert.ok((await roomPage.evaluate(() => window.__galleryDebug().roomLocal.z)) > -.55, "stage should block movement");
  await roomPage.evaluate(() => window.__galleryTestRoomPose(-1.57, -.5, -Math.PI / 2));
  await roomPage.keyboard.down("s");
  await roomPage.waitForTimeout(520);
  await roomPage.keyboard.up("s");
  assert.ok((await roomPage.evaluate(() => window.__galleryDebug().roomLocal.z)) < -.28,
    "Jane's figure should block movement");

  await roomPage.evaluate(() => window.__galleryTestRoomPose(0, 2.1, Math.PI / 2));
  await roomPage.screenshot({ path: ".cache/room01-real-hallway-return.png" });
  const beforeExit = await roomPage.evaluate(() => window.__galleryDebug());
  await roomPage.keyboard.down("w");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await roomPage.keyboard.up("w");
  const exited = await roomPage.evaluate(() => window.__galleryDebug());
  assert.ok(exited.x > leftWall && exited.x < leftWall + .5,
    "exit should advance into the hall without a jump");
  assert.equal(exited.yaw, beforeExit.yaw, "exit must keep Jane facing into the hall");
  assert.equal(exited.cameraFov, beforeExit.cameraFov);
  assert.equal(exited.activeRoom, "01", "room stays visible nearby after exit");
  await roomPage.screenshot({ path: ".cache/room01-returned-continuous.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -9.0916666667, -Math.PI / 2), leftWall + .55);
  await roomPage.keyboard.down("w");
  await roomPage.waitForTimeout(400);
  await roomPage.keyboard.up("w");
  assert.ok((await roomPage.evaluate(() => window.__galleryDebug().x)) > leftWall + PLAYER_RADIUS - .02,
    "blank frame 03 must remain solid");
  await roomPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.equal((await roomPage.evaluate(() => window.__galleryDebug())).paintingOpacity, 1);
  assert.deepEqual(roomErrors, []);
  await roomContext.close();
  console.log("Room 01: painterly reveal, continuous entry and exit, obstacles, blank frame, and cleanup");

  const jobContext = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const jobPage = await jobContext.newPage();
  const jobErrors = [];
  jobPage.on("pageerror", error => jobErrors.push(error.message));
  await jobPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await jobPage.getByRole("button", { name: /begin walking/i }).click();
  await jobPage.evaluate(() => window.__galleryTestPose(.5, -1, .56));
  await jobPage.waitForFunction(() => window.__galleryDebug().activeRoom === "02", null, { timeout: 15000 });
  await jobPage.screenshot({ path: ".cache/room02-painting-far.png" });
  await jobPage.evaluate(() => window.__galleryTestPose(1.2, -5.275, Math.PI / 2));
  await jobPage.screenshot({ path: ".cache/room02-open-doorway.png" });
  const jobBefore = await jobPage.evaluate(() => window.__galleryDebug());
  await jobPage.keyboard.down("w");
  await jobPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await jobPage.keyboard.up("w");
  const jobEntered = await jobPage.evaluate(() => window.__galleryDebug());
  assert.equal(jobEntered.yaw, jobBefore.yaw);
  assert.equal(jobEntered.cameraFov, jobBefore.cameraFov);
  assert.ok(jobEntered.x > 3.2 && jobEntered.x < 3.4,
    "room 02 entry should not move the camera abruptly");
  assert.ok(jobEntered.modelColliderCount >= 20, "desk, figures, and street trees should collide");
  await jobPage.screenshot({ path: ".cache/room02-entered-continuous.png" });
  await jobPage.evaluate(() => window.__galleryTestRoomPose(0, 5.6, 0));
  await jobPage.keyboard.down("w");
  await jobPage.waitForTimeout(450);
  await jobPage.keyboard.up("w");
  assert.ok((await jobPage.evaluate(() => window.__galleryDebug().roomLocal.z)) > 5.1,
    "Jane's advising figure should be solid");
  await jobPage.evaluate(() => window.__galleryTestRoomPose(-4.4, 5.2, 0));
  await jobPage.keyboard.down("w");
  await jobPage.waitForTimeout(450);
  await jobPage.keyboard.up("w");
  assert.ok((await jobPage.evaluate(() => window.__galleryDebug().roomLocal.z)) > 4.65,
    "the curved desk should be solid");
  await jobPage.evaluate(() => window.__galleryTestRoomPose(0, 7.85, -Math.PI / 2));
  const jobBeforeExit = await jobPage.evaluate(() => window.__galleryDebug());
  await jobPage.keyboard.down("w");
  await jobPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await jobPage.keyboard.up("w");
  const jobExited = await jobPage.evaluate(() => window.__galleryDebug());
  assert.equal(jobExited.yaw, jobBeforeExit.yaw);
  assert.equal(jobExited.cameraFov, jobBeforeExit.cameraFov);
  assert.equal(jobExited.activeRoom, "02");
  await jobPage.screenshot({ path: ".cache/room02-returned-continuous.png" });
  await jobPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await jobPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(jobErrors, []);
  await jobContext.close();
  console.log("Room 02: painting, live doorway, desk and figure collision, exit, and cleanup");

  const orchardContext = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const orchardPage = await orchardContext.newPage();
  const orchardErrors = [];
  orchardPage.on("pageerror", error => orchardErrors.push(error.message));
  await orchardPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await orchardPage.getByRole("button", { name: /begin walking/i }).click();
  await orchardPage.evaluate(() => window.__galleryTestPose(5.275, -19.6, 0));
  await orchardPage.waitForFunction(() => window.__galleryDebug().activeRoom === "09", null, { timeout: 15000 });
  assert.equal(await orchardPage.locator("#fallback").isVisible(), false);
  await orchardPage.screenshot({ path: ".cache/room09-painting-far.png" });
  await orchardPage.evaluate(() => window.__galleryTestPose(5.275, -23.8, 0));
  await orchardPage.waitForTimeout(200);
  await orchardPage.screenshot({ path: ".cache/room09-open-doorway.png" });
  const orchardBefore = await orchardPage.evaluate(() => window.__galleryDebug());
  await orchardPage.keyboard.down("w");
  await orchardPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await orchardPage.keyboard.up("w");
  const orchardEntered = await orchardPage.evaluate(() => window.__galleryDebug());
  assert.equal(orchardEntered.yaw, orchardBefore.yaw);
  assert.equal(orchardEntered.cameraFov, orchardBefore.cameraFov);
  assert.ok(orchardEntered.z < orchardBefore.z && orchardEntered.z > orchardBefore.z - 2,
    "orchard entry should cross the doorway without a camera jump");
  assert.ok(orchardEntered.modelColliderCount >= 15, "orchard figures and trees need solid footprints");
  await orchardPage.screenshot({ path: ".cache/room09-entered-continuous.png" });
  await orchardPage.evaluate(() => window.__galleryTestRoomPose(0, 4.2, 0));
  await orchardPage.keyboard.down("w");
  await orchardPage.waitForTimeout(400);
  await orchardPage.keyboard.up("w");
  assert.ok((await orchardPage.evaluate(() => window.__galleryDebug().roomLocal.z)) > 3.7,
    "Zephrine's figure should block the orchard path");
  await orchardPage.evaluate(() => window.__galleryTestRoomPose(0, 6.3, Math.PI));
  const orchardBeforeExit = await orchardPage.evaluate(() => window.__galleryDebug());
  await orchardPage.keyboard.down("w");
  await orchardPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await orchardPage.keyboard.up("w");
  const orchardExited = await orchardPage.evaluate(() => window.__galleryDebug());
  assert.equal(orchardExited.yaw, orchardBeforeExit.yaw);
  assert.equal(orchardExited.cameraFov, orchardBeforeExit.cameraFov);
  assert.equal(orchardExited.activeRoom, "09");
  await orchardPage.screenshot({ path: ".cache/room09-returned-continuous.png" });
  await orchardPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await orchardPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(orchardErrors, []);
  await orchardContext.close();
  console.log("Room 09: far painting, live reveal, continuous doorway, figure collision, and cleanup");

  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const phonePage = await phoneContext.newPage();
  const phoneErrors = [];
  phonePage.on("pageerror", error => phoneErrors.push(error.message));
  await phonePage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await phonePage.getByRole("button", { name: /begin walking/i }).click();
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -4.975, -Math.PI / 2), leftWall + .55);
  await phonePage.screenshot({ path: ".cache/room01-mobile-doorway.png" });
  const ring = await phonePage.locator(".joystick-ring").boundingBox();
  const touch = await phoneContext.newCDPSession(phonePage);
  const point = { x: ring.x + ring.width / 2, y: ring.y + ring.height / 2, id: 5 };
  const phoneFov = (await phonePage.evaluate(() => window.__galleryDebug())).cameraFov;
  assert.equal(phoneFov, 100);
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room01-mobile-entered-continuous.png" });
  await phonePage.evaluate(() => window.__galleryTestRoomPose(0, 2.1, Math.PI / 2));
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.evaluate(() => window.__galleryTestPose(5.275, -23.8, 0));
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "09", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room09-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room09-mobile-entered-continuous.png" });
  await phonePage.evaluate(() => window.__galleryTestPose(1.2, -5.275, Math.PI / 2));
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "02", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room02-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room02-mobile-entered-continuous.png" });
  assert.deepEqual(phoneErrors, []);
  await phoneContext.close();
  console.log("Phone emulation: joystick crossed the same doorway both ways at a stable FOV");

  const failedContext = await browser.newContext({ viewport: { width: 920, height: 700 } });
  const failedPage = await failedContext.newPage();
  await failedPage.route("**/assets/explore/room01/room.glb*", (route) => route.abort());
  await failedPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await failedPage.getByRole("button", { name: /begin walking/i }).click();
  await failedPage.waitForFunction(() => document.querySelector("#announcement").textContent.includes("could not be loaded"),
    null, { timeout: 12000 });
  await failedPage.evaluate((x) => window.__galleryTestPose(x, -4.975, -Math.PI / 2), leftWall + .55);
  await failedPage.keyboard.down("w");
  await failedPage.waitForTimeout(450);
  await failedPage.keyboard.up("w");
  const failed = await failedPage.evaluate(() => window.__galleryDebug());
  assert.equal(failed.activeRoom, null);
  assert.equal(failed.paintingOpacity, 1);
  assert.ok(failed.x > leftWall + PLAYER_RADIUS - .02, "an unavailable room leaves the hallway wall solid");
  await failedContext.close();
  console.log("Room load failure: painting and wall remain solid");
} finally {
  await browser.close();
}
