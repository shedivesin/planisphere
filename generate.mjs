import fs from "node:fs/promises";


const w = 432;
const h = 432;
const r = 215.5;
const p = 18;

// https://aas.aanda.org/articles/aas/full/1998/01/ds1449/node3.html
const e = 23.435; // For equinox 2030.
const cos_e = Math.cos(e * Math.PI / 180);
const sin_e = Math.sin(e * Math.PI / 180);
function ecliptic_to_equatorial([lon, lat]) {
  const cos_lon = Math.cos(lon * Math.PI / 180);
  const sin_lon = Math.sin(lon * Math.PI / 180);
  const cos_lat = Math.cos(lat * Math.PI / 180);
  const sin_lat = Math.sin(lat * Math.PI / 180);
  return [
    Math.atan2(cos_lat * cos_e * sin_lon - sin_lat * sin_e, cos_lon * cos_lat) * 12 / Math.PI,
    Math.asin(cos_lat * sin_e * sin_lon + sin_lat * cos_e) * 180 / Math.PI,
  ];
}

const lat = 38.87;
const cos_lat = Math.cos(lat * Math.PI / 180);
const sin_lat = Math.sin(lat * Math.PI / 180);
// NB: Local sidereal time is arbitrary and controls the plate's rotation.
const lst = 18;
function horizontal_to_equatorial([azi, alt]) {
  const cos_azi = Math.cos(azi * Math.PI / 180);
  const sin_azi = Math.sin(azi * Math.PI / 180);
  const cos_alt = Math.cos(alt * Math.PI / 180);
  const sin_alt = Math.sin(alt * Math.PI / 180);
  const tan_alt = sin_alt / cos_alt;
  return [
    lst - Math.atan2(sin_azi, cos_azi * sin_lat + tan_alt * cos_lat) * 12 / Math.PI,
    Math.asin(sin_lat * sin_alt - cos_lat * cos_alt * cos_azi) * 180 / Math.PI,
  ];
}

function equatorial_to_cartesian([ra, dec]) {
  // Polar azimuthal.
  return [
    w / 2 + Math.cos(ra * Math.PI / 12) * (r - p * 2) * (90 - dec) / (180 - lat),
    h / 2 + Math.sin(ra * Math.PI / 12) * (r - p * 2) * (90 - dec) / (180 - lat),
  ];
}

// Extend the line from x1,y1 to x2,y2 until it intersects the edge of the
// plate, and then return the RA of the point it intersected at.
// FIXME: I use a derpy iterative method to approximate this. A real programmer
// would use a line-circle intersection algorithm.
function extend_to_edge(x1, y1, x2, y2) {
  let x = x2 - x1;
  let y = y2 - y1;

  let min_len = Math.hypot(x, y);
  x /= min_len;
  y /= min_len;

  let min_d = Math.hypot((x1 + x * min_len) - w / 2, (x1 + y * min_len) - h / 2);

  let max_len = (r - p * 2) * 2;
  let max_d = Math.hypot((x1 + x * max_len) - w / 2, (x1 + y * max_len) - h / 2);

  while(max_d - min_d >= 0.01) {
    const mid_len = (min_len + max_len) / 2;
    const mid_d = Math.hypot((x1 + x * mid_len) - w / 2, (x1 + y * mid_len) - h / 2);

    if(mid_d <= r - p * 2) {
      min_len = mid_len;
      min_d = mid_d;
    }
    if(mid_d >= r - p * 2) {
      max_len = mid_len;
      max_d = mid_d;
    }
  }

  return Math.atan2(
    y1 + y * (min_len + max_len) / 2 - h / 2,
    x1 + x * (min_len + max_len) / 2 - w / 2,
  ) * 12 / Math.PI;
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

// Return the point on the line through P1 and P2 that is closest to P3.
function nearest_point_on_line(x1, y1, x2, y2, x3, y3) {
  const t = ((x3 - x1) * (x2 - x1) + (y3 - y1) * (y2 - y1)) / ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
}


console.log("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\">", w, h);

// Outer circle.
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"white\" stroke=\"black\"/>", w / 2, h / 2, r);
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"white\" stroke=\"black\"/>", w / 2, h / 2, r - p);

// Lower plate pivot.
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"1\"/>", w / 2, h / 2);

// Celestial equator.
// console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", w / 2, h / 2, (r - p * 2) * (90 - 0) / (180 - lat));

// Path of the ecliptic.
{
  let d = "M";

  for(let lon = 0; lon < 360; lon++) {
    const [x, y] = equatorial_to_cartesian(ecliptic_to_equatorial([lon, 0]));
    d += " " + x + " " + y;
  }

  d += "Z";

  console.log("<path d=\"%s\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", d);
}

// Ecliptic markers.
const [x_p, y_p] = equatorial_to_cartesian(ecliptic_to_equatorial([0, 90]));

for(let lon = 0; lon < 360; lon++) {
  const len = (lon % 30 === 0)? 5/18: (lon % 10 === 0)? 1/2: (lon % 5 === 0)? 1/4: 1/8;

  const [x, y] = equatorial_to_cartesian(ecliptic_to_equatorial([lon, 0]));
  const ra_t = extend_to_edge(x_p, y_p, x, y);

  console.log(
    "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"black\" stroke-width=\"0.5\"/>",
    w / 2 + Math.cos(ra_t * Math.PI / 12) * (r - p),
    h / 2 + Math.sin(ra_t * Math.PI / 12) * (r - p),
    w / 2 + Math.cos(ra_t * Math.PI / 12) * (r - p * (1 - len)),
    h / 2 + Math.sin(ra_t * Math.PI / 12) * (r - p * (1 - len)),
  );

  if(lon % 30 === 0) {
    console.log(
      "<text transform=\"translate(%d, %d) rotate(%d) translate(0, -3)\" text-anchor=\"middle\" font-family=\"Helvetica Neue\" font-size=\"12\" font-weight=\"300\">%s</text>",
      w / 2 + Math.cos(ra_t * Math.PI / 12) * r,
      h / 2 + Math.sin(ra_t * Math.PI / 12) * r,
      ra_t * 180 / 12 - 90,
      String.fromCharCode(9800 + Math.floor(lon / 30), 65038),
    );
  }
}

// Stars
for(const line of (await fs.readFile("stars.csv", "utf8")).trim().split("\n")) {
  const [mag, ra, dec] = line.split(",").map(parseFloat);
  const [x, y] = equatorial_to_cartesian([ra, dec]);
  const d = Math.hypot(w / 2 - x, h / 2 - y);
  if(!(d >= p && d <= r - p * 2)) { continue; }

  // NB: -1.44 is our brightest star, Sirius.
  const s = 6 * Math.pow(100, (-1.44 - mag) / 10);
  console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\"/>", x, y, s);
}

// Labels
for(const [name, ra, dec, u, v] of [
  ["Pleiades",    3.7914,  24.1051, -18, 0],
  ["Aldebaran",   4.5987,  16.5093, 4.5, -6.5],
  ["Rigel",       5.2423,  -8.2016, -14, 1],
  ["Capella",     5.2782,  45.9980, -1.3, 6.5],
  ["Betelgeuse",  5.9195,   7.4071, 15, -7],
  ["Sirius",      6.7525, -16.7161, -6, -10],
  ["Dioscuri",    7.6659,  29.9573, 2, 9],
  ["Procyon",     7.6550,   5.2250, 1, -7],
  ["Regulus",    10.1395,  11.9672, -2, -7],
  ["Spica",      13.4199, -11.1613, 0, -7],
  ["Alkaid",     13.7923,  49.3133, 0, -6],
  ["Arcturus",   14.2610,  19.1824, -7, -8],
  ["Antares",    16.4901, -26.4320, -2, -7],
  ["Vega",       18.6156,  38.7837, 0, 8],
  ["Altair",     19.8464,   8.8683, 0, 8],
  ["Deneb",      20.6905,  45.2803, 8, 8],
  ["Fomalhaut",  22.9608, -29.6222, 0, -7],
]) {
  const [x, y] = equatorial_to_cartesian([ra, dec]);
  console.log(
    "<text transform=\"translate(%d, %d) rotate(%d) translate(%d, %d)\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-family=\"Helvetica Neue\" font-size=\"8\" font-weight=\"300\">%s</text>",
    x,
    y,
    ra * 15 + 90,
    u,
    v,
    name,
  );
}

// Upper plate edge.
console.log(
  "<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"none\" stroke=\"red\"/>",
  w / 2,
  h / 2,
  r - p,
);

// Upper plate pivot.
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"1\" fill=\"red\"/>", w / 2, h / 2);

// Upper plate markers.
for(let min = 0; min < 1440; min += 5) {
  const len = (min % 60 === 0)? 7/18: (min % 30 === 0)? 0.5: (min % 15 === 0)? 0.25: 0.125;
  console.log(
    "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"red\" stroke-width=\"0.5\"/>",
    w / 2 + Math.cos((lst * 60 + min) * Math.PI / 720) * (r - p * (1 + len)),
    h / 2 + Math.sin((lst * 60 + min) * Math.PI / 720) * (r - p * (1 + len)),
    w / 2 + Math.cos((lst * 60 + min) * Math.PI / 720) * (r - p),
    h / 2 + Math.sin((lst * 60 + min) * Math.PI / 720) * (r - p),
  );

  if(min % 60 === 0) {
    console.log(
      "<text transform=\"translate(%d, %d) rotate(%d) translate(0, 2)\" text-anchor=\"middle\" dominant-baseline=\"hanging\" font-family=\"Helvetica Neue\" font-size=\"9\" font-weight=\"300\" fill=\"red\">%s</text>",
      w / 2 + Math.cos((lst * 60 + min) * Math.PI / 720) * (r - p * 2),
      h / 2 + Math.sin((lst * 60 + min) * Math.PI / 720) * (r - p * 2),
      (lst * 60 + min) * 180 / 720 - 90,
      (36 - Math.floor(min / 60)) % 24,
    );
  }
}

// Upper plate window.
{
  // FIXME: Found manually for p=18. Use an iterative method so we can vary p.
  const max_azi = 156.55285;

  const [x1, y1] = nearest_point_on_line(
    ...equatorial_to_cartesian(horizontal_to_equatorial([-max_azi,  0])),
    ...equatorial_to_cartesian(horizontal_to_equatorial([-max_azi, 90])),
    w / 2,
    h / 2,
  );
  const [x2, y2] = nearest_point_on_line(
    ...equatorial_to_cartesian(horizontal_to_equatorial([+max_azi,  0])),
    ...equatorial_to_cartesian(horizontal_to_equatorial([+max_azi, 90])),
    w / 2,
    h / 2,
  );
  const tics = Math.round(max_azi * 2);

  {
    let d = "M" + x1 + " " + y1;

    for(let i = 0; i <= tics; i++) {
      const azi = lerp(-max_azi, max_azi, i / tics);
      const [x, y] = equatorial_to_cartesian(horizontal_to_equatorial([azi, 0]));
      d += " " + x + " " + y;
    }

    d += " " + x2 + " " + y2 + "A" + p + " " + p + " 0 0 1 " + x1 + " " + y1 + "Z";
    console.log("<path d=\"%s\" fill=\"none\" stroke=\"red\"/>", d);
  }

  {
    let d = "M";

    for(let i = 0; i <= 360 - tics; i++) {
      const azi = lerp(max_azi, 360 - max_azi, i / (360 - tics));
      const [x, y] = equatorial_to_cartesian(horizontal_to_equatorial([azi, 0]));
      d += " " + x + " " + y;
    }

    console.log("<path d=\"%s\" fill=\"none\" stroke=\"red\" stroke-width=\"0.5\"/>", d);
  }
}

// Upper plate meridian.
console.log(
  "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"red\" stroke-width=\"0.5\"/>",
  w / 2 + Math.cos(lst * Math.PI / 12) * p,
  h / 2 + Math.sin(lst * Math.PI / 12) * p, 
  w / 2 + Math.cos(lst * Math.PI / 12) * (r - p * 2),
  h / 2 + Math.sin(lst * Math.PI / 12) * (r - p * 2),
);

console.log("</svg>");
