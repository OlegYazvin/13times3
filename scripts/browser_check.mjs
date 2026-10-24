import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import {enterExhibit} from "./gallery_browser.mjs";
import { HALL_WIDTH, PLAYER_RADIUS } from "../client/explore/layout.mjs";

const base = process.env.GALLERY_TEST_BASE || "http://127.0.0.1:8080";
const leftWall = -HALL_WIDTH / 2;
const rightWall = HALL_WIDTH / 2;
await mkdir(".cache", { recursive: true });
const browserOptions = {
  headless: true, executablePath: process.env.GALLERY_BROWSER_EXECUTABLE || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
};
let browser = await chromium.launch(browserOptions);
async function restartBrowser() {
  await browser.close();
  browser = await chromium.launch(browserOptions);
}

// Software WebGL screenshots can take longer than Playwright's 30-second
// default even when the room is interactive and responsive. Keep explicit
// movement waits short while allowing the visual capture to finish.
async function newTestContext(options) {
  const context = await browser.newContext(options);
  context.setDefaultTimeout(90_000);
  return context;
}


// Interactions were restaged during the art revision. Exercise movement against
// their current exported footprints rather than the previous staging coordinates.
async function assertWalkBlocked(page, point, label) {
  const boxes=(await page.evaluate(()=>window.__galleryDebug())).roomColliders;
  const [x,z]=point;
  const box=boxes.filter(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ)
    .sort((a,b)=>(a.maxX-a.minX)*(a.maxZ-a.minZ)-(b.maxX-b.minX)*(b.maxZ-b.minZ))[0];
  assert.ok(box, label+': expected a current exported solid at the story position');
  const cx=(box.minX+box.maxX)/2,cz=(box.minZ+box.maxZ)/2;
  let start;
  for(const gap of [.60,.85,1.15,1.65]){
    for(const candidate of [[cx,box.maxZ+gap],[cx,box.minZ-gap],[box.maxX+gap,cz],[box.minX-gap,cz]]){
      if(await page.evaluate(([x,z])=>window.__galleryTestRoomCanStand(x,z),candidate)){start=candidate;break;}
    }
    if(start)break;
  }
  assert.ok(start,label+': a clear walking approach must remain');
  await page.evaluate(([x,z])=>window.__galleryTestRoomPose(x,z,0),start);
  await page.evaluate(([x,z])=>window.__galleryTestRoomMove(x,z),[cx,cz]);
  const after=(await page.evaluate(()=>window.__galleryDebug()));
  assert.equal(after.mode,'room',label+': obstacle test stays in the room');
  assert.ok(Math.hypot(after.roomLocal.x-cx,after.roomLocal.z-cz)>PLAYER_RADIUS-.02,label+': walking into the solid must stop');
}

async function checkViewport(name, options) {
  const context = await newTestContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  if (name === "mobile") await page.screenshot({ path: ".cache/gallery-mobile-entrance.png" });
  await enterExhibit(page);
  await page.waitForFunction(() => Boolean(window.__galleryDebug));
  await page.waitForFunction(() => window.__galleryDebug().music.playing && window.__galleryDebug().music.level > .02);
  const fadeStart = await page.evaluate(() => window.__galleryDebug().music.level);
  await page.waitForTimeout(650);
  const fadeLater = await page.evaluate(() => window.__galleryDebug().music.level);
  assert.ok(fadeLater > fadeStart && fadeLater < .42, `${name}: music should fade in gradually`);
  await page.getByRole("button", { name: "Turn sound off" }).click();
  await page.waitForFunction(() => !window.__galleryDebug().music.playing);
  await page.getByRole("button", { name: "Turn sound on" }).click();
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
  assert.equal(after.frameCount, 13);

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
    for (const [section, x, z] of [[1, 2.4, -10], [2, 15, -23.6], [3, 30.4, -10]]) {
      await page.evaluate(([px, pz]) => window.__galleryTestPose(px, pz, 0), [x, z]);
      await page.waitForFunction((number) => document.querySelector("#section-status").textContent === `Gallery ${number} / 3`, section);
      assert.match(await statusText(page), new RegExp(`Gallery ${section} / 3`));
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
  if (process.env.GALLERY_TEST_NEW_ROOMS_ONLY !== "1") {
  const home = await browser.newPage();
  await home.goto(base, { waitUntil: "domcontentloaded" });
  assert.equal(await home.locator("a.explore-entry").getAttribute("href"), "/explore/");
  await home.close();
  await checkViewport("desktop", { viewport: { width: 1280, height: 800 } });
  await checkViewport("mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  const context = await newTestContext();
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === "webgl2" ? null : original.call(this, kind, ...args);
    };
  });
  const fallbackPage = await context.newPage();
  await fallbackPage.goto(`${base}/explore/`, { waitUntil: "domcontentloaded" });
  await fallbackPage.locator("#fallback").waitFor({ state: "visible" });
  assert.equal(await fallbackPage.locator(".frame-list li").count(), 13);
  assert.equal(await fallbackPage.locator(".fallback-previews img").count(), 12);
  assert.equal(await fallbackPage.locator(".frame-list li").first().textContent(), "Zephrine's first stage");
  await context.close();
  console.log("WebGL fallback: thirteen exhibited frames listed, including planned La Jolla");
  await restartBrowser();

  // The painting opens onto the same world; crossing never replaces the camera pose.
  const roomContext = await newTestContext({ viewport: { width: 920, height: 700 } });
  const roomPage = await roomContext.newPage();
  const roomErrors = [];
  roomPage.on("pageerror", (error) => roomErrors.push(error.message));
  await roomPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(roomPage);
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
  await roomPage.evaluate(() => window.__galleryTestPose(0, -1.1, -.67));
  await roomPage.waitForFunction(() => window.__galleryDebug().paintingOpacity === 1);
  await roomPage.screenshot({ path: ".cache/room01-painting-far.png" });
  await roomPage.evaluate(() => window.__galleryTestPose(-.2, -7.475, -Math.PI / 2));
  await roomPage.waitForFunction(() => window.__galleryDebug().paintingOpacity < 1);
  const midway = await roomPage.evaluate(() => window.__galleryDebug());
  assert.ok(midway.paintingOpacity > .45 && midway.paintingOpacity < 1);
  await roomPage.screenshot({ path: ".cache/room01-painting-reveal.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -7.475, -Math.PI / 2), leftWall + 1);
  await roomPage.waitForFunction(() => window.__galleryDebug().paintingOpacity <= .45);
  await roomPage.screenshot({ path: ".cache/room01-open-doorway.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -6.1, -Math.PI / 2), leftWall + 1);
  await roomPage.screenshot({ path: ".cache/room01-open-doorway-angled.png" });
  await roomPage.evaluate((x) => window.__galleryTestPose(x, -7.475, -Math.PI / 2), leftWall + .55);
  const beforeEntry = await roomPage.evaluate(() => window.__galleryDebug());
  await roomPage.keyboard.down("w");
  await roomPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await roomPage.keyboard.up("w");
  const entered = await roomPage.evaluate(() => window.__galleryDebug());
  assert.ok(entered.x < leftWall && entered.x > leftWall - 1.1,
    "entry position should remain within a single low-FPS walking step of the frame");
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
  await assertWalkBlocked(roomPage,[-0.47,0.05],"Jane and the signup chair");

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
  await roomPage.evaluate(() => window.__galleryTestPose(18.175, -31.15, Math.PI));
  await roomPage.keyboard.down("w");
  await roomPage.waitForTimeout(400);
  await roomPage.keyboard.up("w");
  assert.ok((await roomPage.evaluate(() => window.__galleryDebug().z)) < -23.8 - PLAYER_RADIUS + .02,
    "blank frame 12 must remain solid");
  await roomPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await roomPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.equal((await roomPage.evaluate(() => window.__galleryDebug())).paintingOpacity, 1);
  assert.deepEqual(roomErrors, []);
  await roomContext.close();
  console.log("Room 01: painterly reveal, continuous entry and exit, obstacles, blank frame, and cleanup");

  const jobContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const jobPage = await jobContext.newPage();
  const jobErrors = [];
  jobPage.on("pageerror", error => jobErrors.push(error.message));
  await jobPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(jobPage);
  await jobPage.evaluate(() => window.__galleryTestPose(.5, -1, .56));
  await jobPage.waitForFunction(() => window.__galleryDebug().activeRoom === "02", null, { timeout: 15000 });
  assert.equal((await jobPage.evaluate(() => window.__galleryDebug())).activeRoomIsolated, true,
    "room 02 must live behind a masked portal in its own render space");
  await jobPage.screenshot({ path: ".cache/room02-painting-far.png" });
  await jobPage.evaluate(() => window.__galleryTestPose(1.2, -7.475, Math.PI / 2));
  await jobPage.screenshot({ path: ".cache/room02-open-doorway.png" });
  const jobBefore = await jobPage.evaluate(() => window.__galleryDebug());
  await jobPage.evaluate(() => window.__galleryTestWorldMove(5.5, -7.475));
  const jobEntered = await jobPage.evaluate(() => window.__galleryDebug());
  assert.equal(jobEntered.mode, "room");
  assert.equal(jobEntered.yaw, jobBefore.yaw);
  assert.equal(jobEntered.cameraFov, jobBefore.cameraFov);
  assert.ok(Math.abs(jobEntered.x - 3.3) < .02,
    "room 02 entry should not move the camera abruptly");
  assert.ok(jobEntered.modelColliderCount >= 20, "desk, figures, and street trees should collide");
  await jobPage.screenshot({ path: ".cache/room02-entered-continuous.png" });
  await assertWalkBlocked(jobPage,[-1.08,4.67],"Jane advising at the desk");
  await assertWalkBlocked(jobPage,[-3,3],"the referenced curved desk");
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
  await restartBrowser();

  const friendshipContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const friendshipPage = await friendshipContext.newPage();
  const friendshipErrors = [];
  friendshipPage.on("pageerror", error => friendshipErrors.push(error.message));
  await friendshipPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(friendshipPage);
  await friendshipPage.evaluate(() => window.__galleryTestPose(0, -12.825, -Math.PI / 2));
  await friendshipPage.waitForFunction(() => window.__galleryDebug().activeRoom === "03", null, { timeout: 15000 });
  await friendshipPage.screenshot({ path: ".cache/room03-painting-far.png" });
  await friendshipPage.evaluate((x) => window.__galleryTestPose(x, -12.825, -Math.PI / 2), leftWall + .55);
  await friendshipPage.screenshot({ path: ".cache/room03-open-doorway.png" });
  const friendshipBefore = await friendshipPage.evaluate(() => window.__galleryDebug());
  await friendshipPage.keyboard.down("w");
  await friendshipPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await friendshipPage.keyboard.up("w");
  const friendshipEntered = await friendshipPage.evaluate(() => window.__galleryDebug());
  assert.equal(friendshipEntered.yaw, friendshipBefore.yaw);
  assert.equal(friendshipEntered.cameraFov, friendshipBefore.cameraFov);
  assert.ok(friendshipEntered.modelColliderCount >= 10, "friends, mothers, and park structures must collide");
  await friendshipPage.screenshot({ path: ".cache/room03-entered-continuous.png" });
  await assertWalkBlocked(friendshipPage,[-0.42,5.1],"Zephrine holding hands");
  await friendshipPage.evaluate(() => window.__galleryTestRoomPose(0, 6.4, Math.PI / 2));
  const friendshipBeforeExit = await friendshipPage.evaluate(() => window.__galleryDebug());
  await friendshipPage.keyboard.down("w");
  await friendshipPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await friendshipPage.keyboard.up("w");
  const friendshipExited = await friendshipPage.evaluate(() => window.__galleryDebug());
  assert.equal(friendshipExited.yaw, friendshipBeforeExit.yaw);
  assert.equal(friendshipExited.cameraFov, friendshipBeforeExit.cameraFov);
  assert.equal(friendshipExited.activeRoom, "03");
  await friendshipPage.screenshot({ path: ".cache/room03-returned-continuous.png" });
  await friendshipPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await friendshipPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(friendshipErrors, []);
  await friendshipContext.close();
  console.log("Room 03: friendship painting, doorway, figure collision, return, and cleanup");

  const carContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const carPage = await carContext.newPage();
  const carErrors = [];
  carPage.on("pageerror", error => carErrors.push(error.message));
  await carPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(carPage);
  await carPage.evaluate(() => window.__galleryTestPose(1.2, -12.825, Math.PI / 2));
  await carPage.waitForFunction(() => window.__galleryDebug().activeRoom === "04", null, { timeout: 15000 });
  await carPage.screenshot({ path: ".cache/room04-painting-far.png" });
  await carPage.evaluate((x) => window.__galleryTestPose(x, -12.825, Math.PI / 2), rightWall - .55);
  await carPage.screenshot({ path: ".cache/room04-open-doorway.png" });
  const carBefore = await carPage.evaluate(() => window.__galleryDebug());
  await carPage.keyboard.down("w");
  await carPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await carPage.keyboard.up("w");
  const carEntered = await carPage.evaluate(() => window.__galleryDebug());
  assert.equal(carEntered.yaw, carBefore.yaw);
  assert.equal(carEntered.cameraFov, carBefore.cameraFov);
  assert.ok(carEntered.modelColliderCount >= 20, "car, figures, trees and houses must collide");
  await carPage.screenshot({ path: ".cache/room04-entered-continuous.png" });
  await assertWalkBlocked(carPage,[0,5.38],"blue car and its seated child");
  await carPage.evaluate(() => window.__galleryTestRoomPose(0, 7.2, -Math.PI / 2));
  const carBeforeExit = await carPage.evaluate(() => window.__galleryDebug());
  await carPage.keyboard.down("w");
  await carPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await carPage.keyboard.up("w");
  const carExited = await carPage.evaluate(() => window.__galleryDebug());
  assert.equal(carExited.yaw, carBeforeExit.yaw);
  assert.equal(carExited.cameraFov, carBeforeExit.cameraFov);
  assert.equal(carExited.activeRoom, "04");
  await carPage.screenshot({ path: ".cache/room04-returned-continuous.png" });
  await carPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await carPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(carErrors, []);
  await carContext.close();
  console.log("Room 04: blue-car painting, doorway, car collision, return, and cleanup");
  await restartBrowser();

  const officeContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const officePage = await officeContext.newPage();
  const officeErrors = [];
  officePage.on("pageerror", error => officeErrors.push(error.message));
  await officePage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(officePage);
  await officePage.evaluate(() => window.__galleryTestPose(-1.2, -18.175, -Math.PI / 2));
  await officePage.waitForFunction(() => window.__galleryDebug().activeRoom === "05", null, { timeout: 15000 });
  await officePage.screenshot({ path: ".cache/room05-painting-far.png" });
  await officePage.evaluate((x) => window.__galleryTestPose(x, -18.175, -Math.PI / 2), leftWall + .55);
  await officePage.screenshot({ path: ".cache/room05-open-doorway.png" });
  const officeBefore = await officePage.evaluate(() => window.__galleryDebug());
  await officePage.keyboard.down("w");
  await officePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await officePage.keyboard.up("w");
  const officeEntered = await officePage.evaluate(() => window.__galleryDebug());
  assert.equal(officeEntered.yaw, officeBefore.yaw);
  assert.equal(officeEntered.cameraFov, officeBefore.cameraFov);
  assert.ok(officeEntered.modelColliderCount >= 20, "office architecture and figures must collide");
  await officePage.screenshot({ path: ".cache/room05-entered-continuous.png" });
  await assertWalkBlocked(officePage,[0,5.05],"Jane in the office");
  await officePage.evaluate(() => window.__galleryTestRoomPose(0, 7.9, Math.PI / 2));
  const officeBeforeExit = await officePage.evaluate(() => window.__galleryDebug());
  await officePage.keyboard.down("w");
  await officePage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await officePage.keyboard.up("w");
  const officeExited = await officePage.evaluate(() => window.__galleryDebug());
  assert.equal(officeExited.yaw, officeBeforeExit.yaw);
  assert.equal(officeExited.cameraFov, officeBeforeExit.cameraFov);
  assert.equal(officeExited.activeRoom, "05");
  await officePage.screenshot({ path: ".cache/room05-returned-continuous.png" });
  await officePage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await officePage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(officeErrors, []);
  await officeContext.close();
  console.log("Room 05: symbolic office painting, doorway, Jane collision, exit, and cleanup");

  const weaningContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const weaningPage = await weaningContext.newPage();
  const weaningErrors = [];
  weaningPage.on("pageerror", error => weaningErrors.push(error.message));
  await weaningPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(weaningPage);
  await weaningPage.evaluate(() => window.__galleryTestPose(1.2, -18.175, Math.PI / 2));
  await weaningPage.waitForFunction(() => window.__galleryDebug().activeRoom === "06", null, { timeout: 15000 });
  await weaningPage.screenshot({ path: ".cache/room06-painting-far.png" });
  await weaningPage.evaluate((x) => window.__galleryTestPose(x, -18.175, Math.PI / 2), rightWall - .55);
  await weaningPage.screenshot({ path: ".cache/room06-open-doorway.png" });
  const weaningBefore = await weaningPage.evaluate(() => window.__galleryDebug());
  await weaningPage.keyboard.down("w");
  await weaningPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await weaningPage.keyboard.up("w");
  const weaningEntered = await weaningPage.evaluate(() => window.__galleryDebug());
  assert.equal(weaningEntered.yaw, weaningBefore.yaw);
  assert.equal(weaningEntered.cameraFov, weaningBefore.cameraFov);
  assert.ok(weaningEntered.modelColliderCount >= 12, "chair, people and room details must collide");
  await weaningPage.screenshot({ path: ".cache/room06-entered-continuous.png" });
  await assertWalkBlocked(weaningPage,[0,3.15],"the occupied nursing chair");
  await weaningPage.evaluate(() => window.__galleryTestRoomPose(0, 5.0, -Math.PI / 2));
  const weaningBeforeExit = await weaningPage.evaluate(() => window.__galleryDebug());
  await weaningPage.keyboard.down("w");
  await weaningPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await weaningPage.keyboard.up("w");
  const weaningExited = await weaningPage.evaluate(() => window.__galleryDebug());
  assert.equal(weaningExited.yaw, weaningBeforeExit.yaw);
  assert.equal(weaningExited.cameraFov, weaningBeforeExit.cameraFov);
  assert.equal(weaningExited.activeRoom, "06");
  await weaningPage.screenshot({ path: ".cache/room06-returned-continuous.png" });
  await weaningPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await weaningPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(weaningErrors, []);
  await weaningContext.close();
  console.log("Room 06: tender painting, doorway, chair collision, return, and cleanup");
  await restartBrowser();

  const berryContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const berryPage = await berryContext.newPage();
  const berryErrors = [];
  berryPage.on("pageerror", error => berryErrors.push(error.message));
  await berryPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(berryPage);
  await berryPage.evaluate(() => window.__galleryTestPose(-1.2, -23.525, -Math.PI / 2));
  await berryPage.waitForFunction(() => window.__galleryDebug().activeRoom === "07", null, { timeout: 15000 });
  await berryPage.screenshot({ path: ".cache/room07-painting-far.png" });
  await berryPage.evaluate((x) => window.__galleryTestPose(x, -23.525, -Math.PI / 2), leftWall + .55);
  await berryPage.screenshot({ path: ".cache/room07-open-doorway.png" });
  const berryBefore = await berryPage.evaluate(() => window.__galleryDebug());
  await berryPage.keyboard.down("w");
  await berryPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await berryPage.keyboard.up("w");
  const berryEntered = await berryPage.evaluate(() => window.__galleryDebug());
  assert.equal(berryEntered.yaw, berryBefore.yaw);
  assert.equal(berryEntered.cameraFov, berryBefore.cameraFov);
  assert.ok(berryEntered.modelColliderCount >= 20, "berry bushes and figures should collide");
  await berryPage.screenshot({ path: ".cache/room07-entered-continuous.png" });
  await assertWalkBlocked(berryPage,[-0.58,5.32],"the coupled shoulder carry");
  await berryPage.evaluate(() => window.__galleryTestRoomPose(0, 7.0, Math.PI / 2));
  const berryBeforeExit = await berryPage.evaluate(() => window.__galleryDebug());
  await berryPage.keyboard.down("w");
  await berryPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await berryPage.keyboard.up("w");
  const berryExited = await berryPage.evaluate(() => window.__galleryDebug());
  assert.equal(berryExited.yaw, berryBeforeExit.yaw);
  assert.equal(berryExited.cameraFov, berryBeforeExit.cameraFov);
  assert.equal(berryExited.activeRoom, "07");
  await berryPage.screenshot({ path: ".cache/room07-returned-continuous.png" });
  await berryPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await berryPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(berryErrors, []);
  await berryContext.close();
  console.log("Room 07: berry painting, continuous doorway, figure collision, and cleanup");

  const routeContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const routePage = await routeContext.newPage();
  const routeErrors = [];
  routePage.on("pageerror", error => routeErrors.push(error.message));
  await routePage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(routePage);
  await routePage.evaluate(() => window.__galleryTestPose(1.2, -23.525, Math.PI / 2));
  await routePage.waitForFunction(() => window.__galleryDebug().activeRoom === "08", null, { timeout: 15000 });
  await routePage.screenshot({ path: ".cache/room08-painting-far.png" });
  await routePage.evaluate((x) => window.__galleryTestPose(x, -23.525, Math.PI / 2), rightWall - .55);
  await routePage.screenshot({ path: ".cache/room08-open-doorway.png" });
  const routeBefore = await routePage.evaluate(() => window.__galleryDebug());
  await routePage.keyboard.down("w");
  await routePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await routePage.keyboard.up("w");
  const routeEntered = await routePage.evaluate(() => window.__galleryDebug());
  assert.equal(routeEntered.yaw, routeBefore.yaw);
  assert.equal(routeEntered.cameraFov, routeBefore.cameraFov);
  assert.ok(routeEntered.modelColliderCount >= 16, "Chicago's architectural stops should collide");
  await routePage.screenshot({ path: ".cache/room08-entered-continuous.png" });
  await assertWalkBlocked(routePage,[-3.35,7.05],"Pullman architecture");
  await routePage.evaluate(() => window.__galleryTestRoomPose(0, 12.5, -Math.PI / 2));
  const routeBeforeExit = await routePage.evaluate(() => window.__galleryDebug());
  await routePage.keyboard.down("w");
  await routePage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await routePage.keyboard.up("w");
  const routeExited = await routePage.evaluate(() => window.__galleryDebug());
  assert.equal(routeExited.yaw, routeBeforeExit.yaw);
  assert.equal(routeExited.cameraFov, routeBeforeExit.cameraFov);
  assert.equal(routeExited.activeRoom, "08");
  await routePage.screenshot({ path: ".cache/room08-returned-continuous.png" });
  await routePage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await routePage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(routeErrors, []);
  await routeContext.close();
  console.log("Room 08: Chicago route, continuous doorway, architecture collision, and cleanup");
  await restartBrowser();
  }

  if (process.env.GALLERY_TEST_SHEDD_ONLY !== "1") {
  const orchardContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const orchardPage = await orchardContext.newPage();
  const orchardErrors = [];
  orchardPage.on("pageerror", error => orchardErrors.push(error.message));
  await orchardPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(orchardPage);
  await orchardPage.evaluate(() => window.__galleryTestPose(11, -39.2, 0));
  await orchardPage.waitForFunction(() => window.__galleryDebug().activeRoom === "09", null, { timeout: 15000 });
  assert.equal(await orchardPage.locator("#fallback").isVisible(), false);
  await orchardPage.screenshot({ path: ".cache/room09-painting-far.png" });
  await orchardPage.evaluate(() => window.__galleryTestPose(11, -40.0, 0));
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
  await assertWalkBlocked(orchardPage,[0,3.05],"Zephrine holding her apple");
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

  const playContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const playPage = await playContext.newPage();
  const playErrors = [];
  playPage.on("pageerror", error => playErrors.push(error.message));
  await playPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(playPage);
  // Frames 09 and 10 are opposite each other; their large outdoor sky domes
  // occupy overlapping world coordinates if treated as one physical building.
  // Moving between the paintings must replace the isolated world, never stack
  // the two scenes behind both openings.
  await playPage.evaluate(() => window.__galleryTestPose(11, -37.2, 0));
  await playPage.waitForFunction(() => window.__galleryDebug().activeRoom === "09", null, { timeout: 15000 });
  assert.equal((await playPage.evaluate(() => window.__galleryDebug())).loadedWorldCount, 1);
  await playPage.evaluate(() => window.__galleryTestPose(11, -32.6, Math.PI));
  await playPage.waitForFunction(() => window.__galleryDebug().activeRoom === "10", null, { timeout: 15000 });
  assert.equal((await playPage.evaluate(() => window.__galleryDebug())).loadedWorldCount, 1,
    "adjacent portal worlds must never occupy the same render scene");
  await playPage.screenshot({ path: ".cache/room10-painting-far.png" });
  await playPage.evaluate(() => window.__galleryTestPose(11, -31.15, Math.PI));
  await playPage.screenshot({ path: ".cache/room10-open-doorway.png" });
  const playBefore = await playPage.evaluate(() => window.__galleryDebug());
  await playPage.keyboard.down("w");
  await playPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await playPage.keyboard.up("w");
  const playEntered = await playPage.evaluate(() => window.__galleryDebug());
  assert.equal(playEntered.yaw, playBefore.yaw);
  assert.equal(playEntered.cameraFov, playBefore.cameraFov);
  assert.ok(playEntered.modelColliderCount >= 14, "Play Garden figures and sculptures must collide");
  await playPage.screenshot({ path: ".cache/room10-entered-continuous.png" });
  await assertWalkBlocked(playPage,[-0.23,4.37],"Zephrine in shared play");
  await playPage.evaluate(() => window.__galleryTestRoomPose(0, 8.1, 0));
  const playBeforeExit = await playPage.evaluate(() => window.__galleryDebug());
  await playPage.keyboard.down("w");
  await playPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  await playPage.keyboard.up("w");
  const playExited = await playPage.evaluate(() => window.__galleryDebug());
  assert.equal(playExited.yaw, playBeforeExit.yaw);
  assert.equal(playExited.cameraFov, playBeforeExit.cameraFov);
  assert.equal(playExited.activeRoom, "10");
  await playPage.screenshot({ path: ".cache/room10-returned-continuous.png" });
  await playPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await playPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(playErrors, []);
  await playContext.close();
  console.log("Room 10: Play Garden, shared play, figure collision, and cleanup");
  await restartBrowser();
  }

  const aquariumContext = await newTestContext({ viewport: { width: 960, height: 720 } });
  const aquariumPage = await aquariumContext.newPage();
  const aquariumErrors = [];
  aquariumPage.on("pageerror", error => aquariumErrors.push(error.message));
  await aquariumPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(aquariumPage);
  await aquariumPage.evaluate(() => window.__galleryTestPose(18.175, -36, 0));
  await aquariumPage.waitForFunction(() => window.__galleryDebug().activeRoom === "11", null, { timeout: 15000 });
  await aquariumPage.screenshot({ path: ".cache/room11-painting-far.png" });
  await aquariumPage.evaluate(() => window.__galleryTestPose(18.175, -40.0, 0));
  await aquariumPage.screenshot({ path: ".cache/room11-open-doorway.png" });
  const aquariumBefore = await aquariumPage.evaluate(() => window.__galleryDebug());
  await aquariumPage.keyboard.down("w");
  await aquariumPage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await aquariumPage.keyboard.up("w");
  const aquariumEntered = await aquariumPage.evaluate(() => window.__galleryDebug());
  assert.equal(aquariumEntered.yaw, aquariumBefore.yaw);
  assert.equal(aquariumEntered.cameraFov, aquariumBefore.cameraFov);
  assert.ok(aquariumEntered.modelColliderCount >= 20, "aquarium architecture and people should collide");
  assert.ok(aquariumEntered.driftingFishCount >= 24, "fish should drift gently");
  await aquariumPage.screenshot({ path: ".cache/room11-entered-continuous.png" });
  const fishPositions = [];
  for (let sample = 0; sample < 5; sample++) {
    fishPositions.push((await aquariumPage.evaluate(() => window.__galleryDebug())).fishProbeY);
    await aquariumPage.waitForTimeout(400);
  }
  assert.ok(fishPositions[0].some((_, index) => {
    const samples = fishPositions.map(row => row[index]);
    return Math.max(...samples) - Math.min(...samples) > .004;
  }), "sculpted fish should move slightly across the inhabited tanks");
  await assertWalkBlocked(aquariumPage,[-0.1,6.25],"G watching the fish");
  await assertWalkBlocked(aquariumPage,[1.6,6],"the curved fish habitat");
  await aquariumPage.evaluate(() => window.__galleryTestRoomPose(1.95, 9.2, Math.PI));
  await aquariumPage.evaluate(() => window.__galleryTestRoomMove(1.95, 11.2));
  assert.ok((await aquariumPage.evaluate(() => window.__galleryDebug().roomLocal.z)) < 10.0,
    "the actual portal's marble post must be solid");
  await aquariumPage.evaluate(() => window.__galleryTestRoomPose(3.2, 9.2, Math.PI));
  await aquariumPage.evaluate(() => window.__galleryTestRoomMove(3.2, 11.6));
  const aroundArch = await aquariumPage.evaluate(() => window.__galleryDebug());
  assert.equal(aroundArch.mode, "room", "walking around the actual aperture must stay in the aquarium");
  assert.ok(aroundArch.roomLocal.z > 11.15 && aroundArch.roomLocal.z < 13.2,
    "the walkable loop must extend behind the physical gallery portal");
  await aquariumPage.screenshot({ path: ".cache/room11-behind-freestanding-arch.png" });
  await aquariumPage.evaluate(() => window.__galleryTestRoomPose(0, 13.4, Math.PI));
  await aquariumPage.evaluate(() => window.__galleryTestRoomMove(0, 16.2));
  const rearHabitat = await aquariumPage.evaluate(() => window.__galleryDebug());
  assert.equal(rearHabitat.mode, "room", "the rear exhibit stays in the aquarium world");
  assert.ok(rearHabitat.roomLocal.z > 15.9,
    "the space behind the portal should be walkable, not a shallow painted alcove");
  await aquariumPage.screenshot({ path: ".cache/room11-rear-aquarium.png" });
  await aquariumPage.evaluate(() => window.__galleryTestRoomMove(0, 18.1));
  assert.ok((await aquariumPage.evaluate(() => window.__galleryDebug().roomLocal.z)) < 17.2,
    "the rear aquarium glass must stop the player");
  await aquariumPage.evaluate(() => window.__galleryTestRoomPose(0, 9.2, Math.PI));
  const aquariumBeforeExit = await aquariumPage.evaluate(() => window.__galleryDebug());
  await aquariumPage.evaluate(() => window.__galleryTestRoomMove(0, 11.6));
  await aquariumPage.waitForFunction(() => window.__galleryDebug().mode === "hall", null, { timeout: 12000 });
  const aquariumExited = await aquariumPage.evaluate(() => window.__galleryDebug());
  assert.equal(aquariumExited.yaw, aquariumBeforeExit.yaw);
  assert.equal(aquariumExited.cameraFov, aquariumBeforeExit.cameraFov);
  assert.equal(aquariumExited.activeRoom, "11");
  await aquariumPage.screenshot({ path: ".cache/room11-returned-continuous.png" });
  await aquariumPage.evaluate(() => window.__galleryTestPose(22, 0, 0));
  await aquariumPage.waitForFunction(() => window.__galleryDebug().activeRoom === null, null, { timeout: 12000 });
  assert.deepEqual(aquariumErrors, []);
  await aquariumContext.close();
  console.log("Room 11: fish inside habitats, actual freestanding portal, post collision, exit, and cleanup");

  // A fresh browser prevents SwiftShader from retaining all earlier test
  // contexts' GPU allocations before portrait-phone emulation starts.
  await restartBrowser();

  if (process.env.GALLERY_TEST_PHONE_FINAL_ONLY !== "1") {
  const phoneContext = await newTestContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const phonePage = await phoneContext.newPage();
  // Capture at CSS size: WebGL still renders with the phone's pixel ratio,
  // while SwiftShader need not read back a 1170×2532 image for every pose.
  const capturePhone = phonePage.screenshot.bind(phonePage);
  phonePage.screenshot = options => capturePhone({ scale: "css", timeout: 60000, ...options });
  const phoneErrors = [];
  phonePage.on("pageerror", error => phoneErrors.push(error.message));
  await phonePage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(phonePage);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "01", null, { timeout: 12000 });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -7.475, -Math.PI / 2), leftWall + .55);
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
  await phonePage.evaluate(() => window.__galleryTestPose(11, -40.0, 0));
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "09", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room09-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room09-mobile-entered-continuous.png" });
  await phonePage.evaluate(() => window.__galleryTestPose(1.2, -7.475, Math.PI / 2));
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "02", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room02-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room02-mobile-entered-continuous.png" });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -12.825, -Math.PI / 2), leftWall + .55);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "03", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room03-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room03-mobile-entered-continuous.png" });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -12.825, Math.PI / 2), rightWall - .55);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "04", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room04-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room04-mobile-entered-continuous.png" });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -18.175, -Math.PI / 2), leftWall + .55);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "05", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room05-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room05-mobile-entered-continuous.png" });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -18.175, Math.PI / 2), rightWall - .55);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "06", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room06-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room06-mobile-entered-continuous.png" });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -23.525, -Math.PI / 2), leftWall + .55);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "07", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room07-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room07-mobile-entered-continuous.png" });
  await phonePage.evaluate((x) => window.__galleryTestPose(x, -23.525, Math.PI / 2), rightWall - .55);
  await phonePage.waitForFunction(() => window.__galleryDebug().activeRoom === "08", null, { timeout: 15000 });
  await phonePage.screenshot({ path: ".cache/room08-mobile-doorway.png" });
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y - 38 }] });
  await phonePage.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal((await phonePage.evaluate(() => window.__galleryDebug())).cameraFov, phoneFov);
  await phonePage.screenshot({ path: ".cache/room08-mobile-entered-continuous.png" });
  assert.deepEqual(phoneErrors, []);
  await phoneContext.close();
  console.log("Phone emulation: rooms 01–09 passed at a stable FOV");
  await restartBrowser();
  }

  for (const [id, x, z, yaw] of [["10", 11, -31.15, Math.PI],
    ["11", 18.175, -40.0, 0]]) {
    const context = await newTestContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const captureFinalPhone = page.screenshot.bind(page);
    page.screenshot = options => captureFinalPhone({ scale: "css", timeout: 60000, ...options });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/explore/`, { waitUntil: "networkidle" });
    await enterExhibit(page);
    await page.evaluate(([px,pz,direction]) => window.__galleryTestPose(px,pz,direction), [x,z,yaw]);
    await page.waitForFunction(frameId => window.__galleryDebug().activeRoom === frameId,
      id, { timeout: 20000 });
    await page.screenshot({ path: `.cache/room${id}-mobile-doorway.png` });
    const ring = await page.locator(".joystick-ring").boundingBox();
    const point = { x: ring.x + ring.width/2, y: ring.y + ring.height/2, id: 5 };
    const touch = await context.newCDPSession(page);
    assert.equal((await page.evaluate(() => window.__galleryDebug())).cameraFov, 100);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove",
      touchPoints: [{ ...point, y: point.y - 38 }] });
    await page.waitForFunction(() => window.__galleryDebug().mode === "room", null, { timeout: 12000 });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    assert.equal((await page.evaluate(() => window.__galleryDebug())).cameraFov, 100);
    await page.screenshot({ path: `.cache/room${id}-mobile-entered-continuous.png` });
    assert.deepEqual(errors, [], `phone room ${id}: page errors`);
    await context.close();
    console.log(`Phone emulation: room ${id} entered at a stable FOV`);
  }

  const failedContext = await newTestContext({ viewport: { width: 920, height: 700 } });
  const failedPage = await failedContext.newPage();
  await failedPage.route("**/assets/explore/room01/room.glb*", (route) => route.abort());
  await failedPage.goto(`${base}/explore/`, { waitUntil: "networkidle" });
  await enterExhibit(failedPage);
  await failedPage.waitForFunction(() => document.querySelector("#announcement").textContent.includes("could not be loaded"),
    null, { timeout: 12000 });
  await failedPage.evaluate((x) => window.__galleryTestPose(x, -7.475, -Math.PI / 2), leftWall + .55);
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
