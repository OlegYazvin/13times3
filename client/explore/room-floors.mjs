// Optional room-local walking surfaces. Other memories keep their flat floor.
export function surfaceHeight(surface, x, z) {
  return surface.y + (surface.slopeX || 0) * (x - (surface.originX || 0)) +
    (surface.slopeZ || 0) * (z - (surface.originZ || 0));
}

export function roomFloorHeight(room, x, z, current = 0, maxStep = .26) {
  if (!room.walkSurfaces) return 0;
  const heights = room.walkSurfaces.filter(s =>
    x >= s.minX - 1e-5 && x <= s.maxX + 1e-5 &&
    z >= s.minZ - 1e-5 && z <= s.maxZ + 1e-5)
    .map(s => surfaceHeight(s, x, z))
    .filter(y => Math.abs(y - current) <= maxStep + 1e-5)
    .sort((a, b) => Math.abs(a - current) - Math.abs(b - current));
  return heights[0] ?? null;
}
