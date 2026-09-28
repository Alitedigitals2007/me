/**
 * Geometry helpers for the portfolio globe / map.
 *
 * Works have no real location data, so each project is given a *stable*
 * pseudo-position derived from its slug. The same slug always yields the same
 * coordinates, and a short relaxation pass keeps pins from stacking on top of
 * each other. Positions are decorative, not geographic.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

const DEG = Math.PI / 180;

/** FNV-1a — small, fast, and stable across runs (unlike String hashCode). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Uniform point on the unit sphere, derived from `seed`. */
function seedToUnit(seed: number): [number, number, number] {
  // NB: parentheses matter — `%` and `/` share precedence and associate left,
  // so `a % 100000 / 100000` would parse as `a % 1` and always yield 0.
  const u = ((((seed % 100000) + 100000) % 100000)) / 100000;
  const v = ((((Math.floor(seed / 100000) % 100000) + 100000) % 100000)) / 100000;
  // acos keeps the distribution uniform in area; lat range stays off the poles
  const phi = Math.acos(1 - 2 * u);
  const theta = 2 * Math.PI * v;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ];
}

function toLatLon(x: number, y: number, z: number): LatLon {
  return {
    lat: Math.asin(Math.max(-1, Math.min(1, y))) / DEG,
    lon: Math.atan2(z, x) / DEG
  };
}

/**
 * Build a lat/lon for every slug, then gently repel near-coincident pins.
 *
 * Repulsion is intentionally weak and only kicks in for pins closer than
 * `minSep` degrees, so a project's position stays put as other projects are
 * added — it only shifts meaningfully off a pin it genuinely collided with.
 */
export function placeProjects(slugs: string[]): Map<string, LatLon> {
  const points = slugs.map((slug) => ({ slug, v: seedToUnit(hash(slug)) }));
  const minSep = 20 * DEG; // angular separation
  const minSep2 = minSep * minSep;

  for (let pass = 0; pass < 40; pass++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i].v;
        const b = points[j].v;
        let dx = b[0] - a[0];
        let dy = b[1] - a[1];
        let dz = b[2] - a[2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= minSep2 || d2 < 1e-9) continue;
        const d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        dz /= d;
        const push = (minSep - d) / 2;
        a[0] -= dx * push;
        a[1] -= dy * push;
        a[2] -= dz * push;
        b[0] += dx * push;
        b[1] += dy * push;
        b[2] += dz * push;
        // re-project back onto the sphere
        for (const p of points) {
          const len = Math.hypot(p.v[0], p.v[1], p.v[2]) || 1;
          p.v[0] /= len;
          p.v[1] /= len;
          p.v[2] /= len;
        }
      }
    }
  }

  const out = new Map<string, LatLon>();
  for (const p of points) out.set(p.slug, toLatLon(p.v[0], p.v[1], p.v[2]));
  return out;
}

/** lat/lon -> cartesian unit vector (y is up). */
export function toVector(lat: number, lon: number): [number, number, number] {
  const phi = lat * DEG;
  const lam = lon * DEG;
  const c = Math.cos(phi);
  return [c * Math.cos(lam), Math.sin(phi), c * Math.sin(lam)];
}

/**
 * Convert points to unit vectors once, so per-frame work is trig-free.
 * Accepts [lat, lon] tuples, LatLon objects, or a mix.
 */
export function toVectors(points: Array<[number, number]>): Array<[number, number, number]>;
export function toVectors(points: LatLon[]): Array<[number, number, number]>;
export function toVectors(points: Array<[number, number]> | LatLon[]): Array<[number, number, number]> {
  return points.map((p) => (Array.isArray(p) ? toVector(p[0], p[1]) : toVector(p.lat, p.lon)));
}

export interface Projected {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
}

/**
 * Builds a projection closure for a fixed rotation. The yaw/pitch trigonometry is
 * hoisted out of the per-point path, which matters: the globe re-projects its
 * graticule on every animation frame while it idles.
 */
export function createVectorProjector(
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
  r: number
): (v: [number, number, number]) => Projected {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return ([vx, vy, vz]) => {
    const x1 = vx * s - vz * c;
    const z1 = vx * c + vz * s;
    const y2 = vy * cp - z1 * sp;
    const z2 = vy * sp + z1 * cp;
    return { x: cx + r * x1, y: cy - r * y2, depth: z2, visible: z2 > 0 };
  };
}

/**
 * Orthographic projection with a yaw (spin) then pitch (tilt) applied.
 *
 * `yaw` is the longitude facing the viewer, so yaw = 0 centres on Greenwich and
 * content follows the cursor as you drag. Returns screen coordinates plus depth
 * (1 = facing the viewer, 0 = the limb).
 */
export function project(
  lat: number,
  lon: number,
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
  r: number
): Projected {
  return createVectorProjector(yaw, pitch, cx, cy, r)(toVector(lat, lon));
}

/** Equirectangular projection into a `w` x `h` box. */
export function projectFlat(
  lat: number,
  lon: number,
  w: number,
  h: number
): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

/** Shortest angular path between two points, sampled for drawing an arc. */
export function greatCircle(from: LatLon, to: LatLon, samples = 48): LatLon[] {
  const [ax, ay, az] = toVector(from.lat, from.lon);
  const [bx, by, bz] = toVector(to.lat, to.lon);
  const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
  const omega = Math.acos(dot);
  const out: LatLon[] = [];
  if (omega < 1e-6) {
    return [from, to];
  }
  const sinOmega = Math.sin(omega);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const k1 = Math.sin((1 - t) * omega) / sinOmega;
    const k2 = Math.sin(t * omega) / sinOmega;
    out.push(toLatLon(ax * k1 + bx * k2, ay * k1 + by * k2, az * k1 + bz * k2));
  }
  return out;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Turn a projected polyline into an SVG path, breaking it where points are hidden. */
export function polylineToPath(pts: Array<{ x: number; y: number; visible: boolean }>): string {
  let d = '';
  let pen = false;
  for (const p of pts) {
    if (!p.visible) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    pen = true;
  }
  return d;
}

/**
 * Graticule (lat/lon grid) for the globe, sampled at `step` degrees and
 * returned as arrays of points ready for orthographic projection.
 */
export function graticule(step = 30): Array<Array<[number, number]>> {
  const lines: Array<Array<[number, number]>> = [];
  for (let lat = -60; lat <= 60; lat += step) {
    const line: Array<[number, number]> = [];
    for (let lon = -180; lon <= 180; lon += 4) line.push([lat, lon]);
    lines.push(line);
  }
  for (let lon = -180; lon < 180; lon += step) {
    const line: Array<[number, number]> = [];
    for (let lat = -90; lat <= 90; lat += 4) line.push([lat, lon]);
    lines.push(line);
  }
  return lines;
}

/** Flat graticule for the map view. */
export function flatGraticule(step = 30): Array<Array<[number, number]>> {
  const lines: Array<Array<[number, number]>> = [];
  for (let lat = -60; lat <= 60; lat += step) {
    const line: Array<[number, number]> = [];
    for (let lon = -180; lon <= 180; lon += 10) line.push([lat, lon]);
    lines.push(line);
  }
  for (let lon = -180; lon < 180; lon += step) {
    const line: Array<[number, number]> = [];
    for (let lat = -90; lat <= 90; lat += 10) line.push([lat, lon]);
    lines.push(line);
  }
  return lines;
}

/** Wrap yaw so continuous spins never drift out of range, and clamp pitch. */
export function clampRotation(yaw: number, pitch: number) {
  const twoPi = Math.PI * 2;
  return {
    yaw: ((yaw % twoPi) + twoPi) % twoPi,
    pitch: Math.max(-70 * DEG, Math.min(70 * DEG, pitch))
  };
}

export { DEG };
