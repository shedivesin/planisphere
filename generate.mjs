const LATITUDE = 38.87;

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

const e = 23.435;
const cos_e = Math.cos(e * Math.PI / 180);
const sin_e = Math.sin(e * Math.PI / 180);

const w = 432;
const h = 432;
const r = 215.5;
console.log("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 %d %d\">", w, h);

// Outer circle.
console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"white\" stroke=\"black\"/>", w / 2, h / 2, r);

// Celestial latitude markers.
for(let l = 60; l >= LATITUDE - 90; l -= 30) {
  console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"none\" stroke=\"black\" stroke-width=\"0.5\"/>", w / 2, h / 2, r * (90 - l) / (180 - LATITUDE));
}

// Ecliptic markers.
for(let l = 0; l < 360; l++) {
  const cos_l = Math.cos(l * Math.PI / 180);
  const sin_l = Math.sin(l * Math.PI / 180);
  const ra = Math.atan2(cos_e * sin_l, cos_l) * 12 / Math.PI;

  if(l % 30 === 0) {
    console.log(
      "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"black\" stroke-width=\"0.5\"/>",
      w / 2,
      h / 2,
      w / 2 + Math.cos(ra * Math.PI / 12) * r,
      h / 2 + Math.sin(ra * Math.PI / 12) * r,
    );
  }

  else {
    const dec = Math.asin(sin_e * sin_l) * 180 / Math.PI;
    const d = r * (90 - dec) / (180 - LATITUDE);
    const len = d * Math.PI / 180;
    const k = (l % 10 === 0)? 10/2: (l % 5 === 0)? 5/2: 1/2;
    console.log(
      "<line x1=\"%d\" y1=\"%d\" x2=\"%d\" y2=\"%d\" stroke=\"black\" stroke-width=\"0.5\"/>",
      w / 2 + Math.cos(ra * Math.PI / 12) * (d - len * k),
      h / 2 + Math.sin(ra * Math.PI / 12) * (d - len * k),
      w / 2 + Math.cos(ra * Math.PI / 12) * (d + len * k),
      h / 2 + Math.sin(ra * Math.PI / 12) * (d + len * k),
    );
  }
}

for(const [mag, ra, dec] of STARS) {
  if(dec < LATITUDE - 90) { continue; }

  const x = w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - LATITUDE);
  const y = h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - LATITUDE);
  const s = 6 * Math.pow(100, (STARS[0][0] - mag) / 10);

  console.log("<circle cx=\"%d\" cy=\"%d\" r=\"%d\"/>", x, y, s);
}

for(const [name, ra, dec, u, v] of LABELS) {
  console.log(
    "<text transform=\"translate(%d, %d) rotate(%d) translate(%d, %d)\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-family=\"Helvetica Neue\" font-size=\"8\" font-weight=\"300\">%s</text>",
    w / 2 + Math.cos(ra * Math.PI / 12) * r * (90 - dec) / (180 - LATITUDE),
    h / 2 + Math.sin(ra * Math.PI / 12) * r * (90 - dec) / (180 - LATITUDE),
    ra * 15 - 90,
    u,
    v,
    name,
  );
}

console.log("</svg>");
