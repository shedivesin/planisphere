// https://aa.usno.navy.mil/faq/sun_approx
function longitude(date) {
  const d = (date - 946728000000) / 86400000;
  const g = (357.529 * Math.PI / 180) + (0.98560028 * Math.PI / 180) * d;
  return 280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
}

function zodiac(longitude) {
  const t = Math.round(longitude * 60) % 21600;
  const minute = t % 60;
  const degree = Math.floor(t / 60) % 30;
  const zodiac = Math.floor(t / 1800);
  return degree.toString().padStart(2, "0") +
    String.fromCharCode(9800 + zodiac, 65038) +
    minute.toString().padStart(2, "0");
}

function print(date) {
  console.log("%s\t%s", new Date(date).toISOString(), zodiac(longitude(date)));
}

for(let i = 0, date = Date.now(); i < 20; i++, date += 86400000) {
  print(date);
}
