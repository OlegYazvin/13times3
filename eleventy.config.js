const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");

module.exports = function (eleventyConfig) {
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
  eleventyConfig.addWatchTarget("src/assets/explore/app.js");
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
