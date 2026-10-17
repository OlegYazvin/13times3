module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData(
    "isStaging",
    Boolean(process.env.SITE_BASE_PATH && process.env.SITE_BASE_PATH !== "/"),
  );
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
