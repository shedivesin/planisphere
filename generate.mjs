const w = 432;
const h = 432;
const r = 215.5;
const p = 18;

const e = 23.435;
const cos_e = Math.cos(e * Math.PI / 180);
const sin_e = Math.sin(e * Math.PI / 180);
function ecliptic_to_equatorial(lon, lat) {
  const cos_lon = Math.cos(lon * Math.PI / 180);
  const sin_lon = Math.sin(lon * Math.PI / 180);
  const cos_lat = Math.cos(lat * Math.PI / 180);
  const sin_lat = Math.sin(lat * Math.PI / 180);
  const tan_lat = sin_lat / cos_lat;
  return [
    Math.atan2(sin_lon * cos_e - tan_lat * sin_e, cos_lon) * 12 / Math.PI,
    Math.asin(sin_lat * cos_e + cos_lat * sin_e * sin_lon) * 180 / Math.PI,
  ];
}

const lat = 38.87;
const cos_lat = Math.cos(lat * Math.PI / 180);
const sin_lat = Math.sin(lat * Math.PI / 180);
// NB: Local sidereal time is arbitrary and controls the plate's rotation.
const lst = 7.65;
function horizontal_to_equatorial(azi, alt) {
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

function equatorial_to_cartesian(ra, dec) {
  // Polar azimuthal.
  // FIXME: Try stereographic?
  return [
    w / 2 + Math.cos(ra * Math.PI / 12) * (r - p) * (90 - dec) / (180 - lat),
    h / 2 + Math.sin(ra * Math.PI / 12) * (r - p) * (90 - dec) / (180 - lat),
  ];
}


import fs from "node:fs/promises";
const STARS = (await fs.readFile("stars.csv", "utf8")).
  trim().
  split("\n").
  map(x => {
    x = x.split(",");
    x[0] = +x[0];
    x[1] = +x[1];
    x[2] = +x[2];
    return x;
  });
const LABELS = (await fs.readFile("labels.csv", "utf8")).
  trim().
  split("\n").
  map(x => {
    x = x.split(",");
    x[1] = +x[1];
    x[2] = +x[2];
    x[3] = +x[3];
    x[4] = +x[4];
    return x;
  });


console.log("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\">", w, h);

// Outer circle.
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"white\" stroke=\"black\"/>", w / 2, h / 2, r);
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"white\" stroke=\"black\"/>", w / 2, h / 2, r - p);

// Celestial equator.
// console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", w / 2, h / 2, (r - p) * (90 - 0) / (180 - lat));

// Path of the ecliptic.
{
  let d = "M";

  for(let lon = 0; lon < 360; lon++) {
    const [ra, dec] = ecliptic_to_equatorial(lon, 0);
    const [x, y] = equatorial_to_cartesian(ra, dec);
    d += " " + x + " " + y;
  }

  d += "Z";

  console.log("<path d=\"%s\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", d);
}

// Ecliptic markers.
for(let lon = 0; lon < 360; lon++) {
  const [ra, dec] = ecliptic_to_equatorial(lon, 0);
  const len = (lon % 30 === 0)? 1: (lon % 10 === 0)? 0.5: (lon % 5 === 0)? 0.25: 0.125;
  console.log(
    "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"black\" stroke-width=\"0.5\"/>",
    w / 2 + Math.cos(ra * Math.PI / 12) * (r - p * len),
    h / 2 + Math.sin(ra * Math.PI / 12) * (r - p * len),
    w / 2 + Math.cos(ra * Math.PI / 12) * r,
    h / 2 + Math.sin(ra * Math.PI / 12) * r,
  );
}

// Stars
for(const [mag, ra, dec] of STARS) {
  if(dec < lat - 90) { continue; }

  const [x, y] = equatorial_to_cartesian(ra, dec);
  const s = 6 * Math.pow(100, (STARS[0][0] - mag) / 10);

  console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\"/>", x, y, s);
}

for(const [name, ra, dec, u, v] of LABELS) {
  const [x, y] = equatorial_to_cartesian(ra, dec);
  console.log(
    "<text transform=\"translate(%d, %d) rotate(%d) translate(%d, %d)\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-family=\"Helvetica Neue\" font-size=\"8\" font-weight=\"300\">%s</text>",
    x,
    y,
    ra * 15 - 90,
    u,
    v,
    name,
  );
}

{
  let d = "M";

  for(let az = 0; az < 360; az++) {
    const cos_al = Math.cos(0);
    const sin_al = Math.sin(0);
    const tan_al = sin_al / cos_al;
    const cos_az = Math.cos(az * Math.PI / 180);
    const sin_az = Math.sin(az * Math.PI / 180);
    const ra = lst - Math.atan2(sin_az, cos_az * sin_lat + tan_al * cos_lat) * 12 / Math.PI;
    const dec = Math.asin(sin_lat * sin_al - cos_lat * cos_al * cos_az) * 180 / Math.PI;
    const x = w / 2 + Math.cos(ra * Math.PI / 12) * (r - p) * (90 - dec) / (180 - lat);
    const y = h / 2 + Math.sin(ra * Math.PI / 12) * (r - p) * (90 - dec) / (180 - lat);
    d += " " + x + " " + y;
  }

  d += "Z";
  console.log("<path d=\"%s\" fill=\"none\" stroke=\"red\"/>", d);
}

for(let azi = 90; azi < 360; azi += 180) {
  let d = "M";

  for(let alt = 0; alt <= 90; alt++) {
    const [ra, dec] = horizontal_to_equatorial(azi, alt);
    const [x, y] = equatorial_to_cartesian(ra, dec);
    d += " " + x + " " + y;
  }

  console.log("<path d=\"%s\" fill=\"none\" stroke=\"red\" stroke-width=\"0.5\"/>", d);
}

console.log(
  "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"red\" stroke-width=\"0.5\"/>",
  w / 2 + Math.cos((lst * 15) * Math.PI / 180) * r,
  h / 2 + Math.sin((lst * 15) * Math.PI / 180) * r,
  w / 2 + Math.cos((lst * 15 + 180) * Math.PI / 180) * r,
  h / 2 + Math.sin((lst * 15 + 180) * Math.PI / 180) * r,
);

console.log("</svg>");
