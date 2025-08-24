const lat = 38.87;
const cos_lat = Math.cos(lat * Math.PI / 180);
const sin_lat = Math.sin(lat * Math.PI / 180);

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
const CONSTELLATIONS = JSON.parse(await fs.readFile("constellations.lines.min.geojson", "utf8"));

const e = 23.435;
const cos_e = Math.cos(e * Math.PI / 180);
const sin_e = Math.sin(e * Math.PI / 180);

const w = 432;
const h = 432;
const r = 215.5;
console.log("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\">", w, h);

// Outer circle.
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"white\" stroke=\"black\"/>", w / 2, h / 2, r);

// Celestial equator.
// console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", w / 2, h / 2, r * (90 - 0) / (180 - lat));

// Ecliptic markers.
{
  let d = "M";

  for(let l = 0; l < 360; l++) {
    const cos_l = Math.cos(l * Math.PI / 180);
    const sin_l = Math.sin(l * Math.PI / 180);
    const ra = Math.atan2(cos_e * sin_l, cos_l) * 12 / Math.PI;
    const dec = Math.asin(sin_e * sin_l) * 180 / Math.PI;
    const x = w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
    const y = h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
    d += " " + x + " " + y;
  }

  console.log("<path d=\"%s\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", d);
}

for(const [mag, ra, dec] of STARS) {
  if(dec < lat - 90) { continue; }

  const x = w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
  const y = h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
  const s = 6 * Math.pow(100, (STARS[0][0] - mag) / 10);

  console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\"/>", x, y, s);
}

for(const [name, ra, dec, u, v] of LABELS) {
  console.log(
    "<text transform=\"translate(%d, %d) rotate(%d) translate(%d, %d)\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-family=\"Helvetica Neue\" font-size=\"8\" font-weight=\"300\">%s</text>",
    w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat),
    h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat),
    ra * 15 - 90,
    u,
    v,
    name,
  );
}

/*
for(const {geometry: {coordinates: lines}} of CONSTELLATIONS.features) {
  let d = "";

  for(const line of lines) {
    d += "M";
    for(const [ra, dec] of line) {
      const x = w / 2 + Math.cos(ra * Math.PI / 180) * r * (90 - dec) / (180 - lat);
      const y = h / 2 + Math.sin(ra * Math.PI / 180) * r * (90 - dec) / (180 - lat);

      d += " " + x + " " + y;
    }
  }

  console.log("<path d=\"%s\" fill=\"none\" stroke=\"black\" stroke-width=\"0.25\"/>", d);
}
*/

// NB: Local sidereal time is arbitrary and controls the plate's rotation.
const lst = 7.65;

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
    const x = w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
    const y = h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
    d += " " + x + " " + y;
  }

  d += "Z";
  console.log("<path d=\"%s\" fill=\"none\" stroke=\"red\"/>", d);
}

for(let az = 90; az < 360; az += 180) {
  const cos_az = Math.cos(az * Math.PI / 180);
  const sin_az = Math.sin(az * Math.PI / 180);
  let d = "M";

  for(let al = 0; al <= 90; al++) {
    const cos_al = Math.cos(al * Math.PI / 180);
    const sin_al = Math.sin(al * Math.PI / 180);
    const tan_al = sin_al / cos_al;
    const ra = lst - Math.atan2(sin_az, cos_az * sin_lat + tan_al * cos_lat) * 12 / Math.PI;
    const dec = Math.asin(sin_lat * sin_al - cos_lat * cos_al * cos_az) * 180 / Math.PI;

    const x = w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
    const y = h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - lat);
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
