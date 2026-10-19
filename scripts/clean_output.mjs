import { rm } from "node:fs/promises";

// _site is generated and ignored; clearing it avoids publishing stale assets.
await rm(new URL("../_site/", import.meta.url), { recursive: true, force: true });
