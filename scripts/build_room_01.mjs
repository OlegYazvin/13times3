// Room 01 uses the same compressed export and asset-budget checks as every room.
process.argv[2] = "01";
await import("./build_gallery_room.mjs");
