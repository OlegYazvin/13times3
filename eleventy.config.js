const { createHash } = require("node:crypto");
const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

function roomAssetVersion(directory = "src/assets/explore") {
  const hash = createHash("sha256");
  function addFiles(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) addFiles(child);
      else if (/\.(?:glb|webp)$/i.test(entry.name)) {
        hash.update(child);
        hash.update(readFileSync(child));
      }
    }
  }
  addFiles(directory);
  return hash.digest("hex").slice(0, 12);
}

module.exports = function (eleventyConfig) {
  const achievementHeading = (achievement) => {
    const match = achievement?.contentHtml?.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    return match ? match[1].replace(/<[^>]*>/g, "").trim() : "Achievement";
  };
  eleventyConfig.addFilter("achievementHeading", achievementHeading);
  eleventyConfig.addFilter("achievementHeadingForPath", (path, achievements) =>
    achievementHeading(achievements.find((item) => item.path === path)),
  );
  eleventyConfig.addGlobalData(
    "isStaging",
    Boolean(process.env.SITE_BASE_PATH && process.env.SITE_BASE_PATH !== "/"),
  );
  eleventyConfig.addFilter("serializeJson", (value) =>
    JSON.stringify(value)
      .replace(/&/g, "\\u0026")
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e"),
  );
  eleventyConfig.addGlobalData(
    "exploreScriptVersion",
    createHash("sha256").update(readFileSync("src/assets/explore/app.js")).digest("hex").slice(0, 12),
  );
  eleventyConfig.addGlobalData("galleryRoomVersion", roomAssetVersion());
  eleventyConfig.addGlobalData(
    "exploreMusicVersion",
    createHash("sha256").update(readFileSync("src/assets/explore/resolutions-scott-buckley.mp3")).digest("hex").slice(0, 12),
  );
  eleventyConfig.addWatchTarget("src/assets/explore/app.js");
  eleventyConfig.addWatchTarget("src/assets/explore/resolutions-scott-buckley.mp3");
  for (const id of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"]) eleventyConfig.addWatchTarget(`src/assets/explore/room${id}`);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/archivo/files/archivo-latin-400-normal.woff2":
      "assets/fonts/archivo-latin-400-normal.woff2",
  });
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff2":
      "assets/fonts/archivo-latin-700-normal.woff2",
  });
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/ojuju/files/ojuju-latin-600-normal.woff2":
      "assets/fonts/ojuju-latin-600-normal.woff2",
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: process.env.SITE_BASE_PATH || "/",
  };
};
