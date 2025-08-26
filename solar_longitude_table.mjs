// https://aa.usno.navy.mil/faq/sun_approx
function longitude(date) {
  const d = (date - 946728000000) / 86400000;
  const g = (357.529 * Math.PI / 180) + (0.98560028 * Math.PI / 180) * d;
  return 280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
}

const year  = 2025;
const date  = new Date(year, 0, 1, 12);
const table = new Array(12 * 31).fill("    ");
while(date.getFullYear() === year) {
  const lon = Math.round(longitude(date.getTime())) % 360;
  table[(date.getDate() - 1) * 12 + date.getMonth()] = String.fromCharCode(
    48 + Math.floor(lon / 10) % 3,
    48 + lon % 10,
    9800 + Math.floor(lon / 30),
    65038,
  );
  date.setDate(date.getDate() + 1);
}

console.log("    Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec");
for(let i = 0; i < 31; i++) {
  console.log(
    "%s  %s",
    (i + 1).toString().padStart(2, "0"),
    table.slice(i * 12, i * 12 + 12).join(" "),
  );
}
