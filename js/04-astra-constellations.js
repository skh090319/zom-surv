// Real western constellation line figures, not the IAU boundary polygons.
// J2000 right ascension / declination from Olaf Frohn's d3-celestial catalog:
// https://github.com/ofrohn/d3-celestial/blob/d2e20e104b86429d90ac8227a5b021262b45d75a/data/constellations.lines.json
// The source's exact star connections are retained. North is up; east is left.
// The IAU does not prescribe a single official set of constellation stick figures.
/*
Derived constellation data: Copyright (c) 2015, Olaf Frohn. All rights reserved.
Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software without
   specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function astraBuildConstellation(id, name, latin, lines) {
  const stars = [], edges = [], starIds = new Map(), edgeIds = new Set();
  for (const line of lines) {
    let previous = -1;
    for (const star of line) {
      const key = star.join(',');
      let index = starIds.get(key);
      if (index === undefined) { index = stars.length; starIds.set(key, index); stars.push(star); }
      if (previous >= 0 && previous !== index) {
        const edgeKey = previous < index ? previous + ':' + index : index + ':' + previous;
        if (!edgeIds.has(edgeKey)) { edgeIds.add(edgeKey); edges.push(Object.freeze([previous, index])); }
      }
      previous = index;
    }
  }
  // A spherical center avoids a discontinuity for Pisces/Pegasus across RA 0h.
  // A conformal local sky projection preserves angles, unlike stretched RA/Dec.
  const radians = Math.PI / 180;
  let cx = 0, cy = 0, cz = 0;
  for (const [ra, dec] of stars) {
    const a = ra * radians, d = dec * radians, c = Math.cos(d);
    cx += c * Math.cos(a); cy += c * Math.sin(a); cz += Math.sin(d);
  }
  const centerRA = Math.atan2(cy, cx), centerDec = Math.atan2(cz, Math.hypot(cx, cy));
  const sin0 = Math.sin(centerDec), cos0 = Math.cos(centerDec);
  const projected = stars.map(([ra, dec]) => {
    const a = ra * radians - centerRA, d = dec * radians;
    const sinD = Math.sin(d), cosD = Math.cos(d), cosA = Math.cos(a);
    const k = 2 / (1 + sin0 * sinD + cos0 * cosD * cosA);
    return { x: -k * cosD * Math.sin(a), y: -k * (cos0 * sinD - sin0 * cosD * cosA) };
  });
  const minX = Math.min(...projected.map(p => p.x)), maxX = Math.max(...projected.map(p => p.x));
  const minY = Math.min(...projected.map(p => p.y)), maxY = Math.max(...projected.map(p => p.y));
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const radius = 220, extent = Math.max(...projected.map(p => Math.hypot(p.x - midX, p.y - midY)));
  const scale = radius / Math.max(extent, 1e-9);
  const points = projected.map(p => Object.freeze({ x: (p.x - midX) * scale, y: (p.y - midY) * scale }));
  let totalLength = 0;
  const edgeLengths = [], edgeEnds = [];
  for (const [a, b] of edges) {
    const length = Math.hypot(points[b].x - points[a].x, points[b].y - points[a].y);
    edgeLengths.push(length); totalLength += length; edgeEnds.push(totalLength);
  }
  return Object.freeze({ id, name, latin, radius, points: Object.freeze(points), edges: Object.freeze(edges),
    edgeLengths: Object.freeze(edgeLengths), edgeEnds: Object.freeze(edgeEnds), totalLength });
}

const ASTRA_CONSTELLATIONS = Object.freeze([
  astraBuildConstellation('pisces', '물고기자리', 'Pisces', [
    [[18.4373,24.5837],[17.9152,30.0896],[19.8666,27.2641],[18.4373,24.5837],[17.8634,21.0347],[22.8709,15.3458],[26.3485,9.1577],[30.5118,2.7638],[28.389,3.1875],[25.3579,5.4876],[22.5463,6.1438],[18.4329,7.5754],[15.7359,7.8901],[12.1706,7.5851],[-0.1721,6.8633],[-5.0123,5.6263],[-8.0079,6.379],[-9.9142,5.3813],[-10.7086,3.2823],[-8.2669,1.2556],[-4.4883,1.78],[-3.402,3.4868],[-5.0123,5.6263]],
    [[-10.7086,3.2823],[-14.0308,3.82]],
  ]),
  astraBuildConstellation('orion', '오리온자리', 'Orion', [
    [[91.893,14.7685],[88.5958,20.2762],[90.9799,20.1385],[92.985,14.2088],[90.5958,9.6473],[88.7929,7.4071],[81.2828,6.3497],[73.7239,10.1508]],
    [[74.6371,1.714],[73.5629,2.4407],[72.8015,5.6051],[72.46,6.9613],[72.653,8.9002],[73.7239,10.1508],[74.0928,13.5145],[76.1423,15.4041],[77.4248,15.5972]],
    [[78.6345,-8.2016],[81.1192,-2.3971],[83.0017,-0.2991],[81.2828,6.3497],[83.7845,9.9342],[88.7929,7.4071],[85.1897,-1.9426],[86.9391,-9.6696]],
    [[85.1897,-1.9426],[84.0534,-1.2019],[83.0017,-0.2991]],
  ]),
  astraBuildConstellation('cassiopeia', '카시오페이아자리', 'Cassiopeia', [
    [[28.5989,63.6701],[21.454,60.2353],[14.1772,60.7167],[10.1268,56.5373],[2.2945,59.1498]],
  ]),
  astraBuildConstellation('cygnus', '백조자리', 'Cygnus', [
    [[-41.7659,30.2269],[-48.4472,33.9703],[-54.4429,40.2567],[-63.7563,45.1308],[-67.5735,51.7298],[-70.7243,53.3685]],
    [[-49.642,45.2803],[-54.4429,40.2567],[-60.9235,35.0834],[-67.3197,27.9597]],
  ]),
  astraBuildConstellation('lyra', '거문고자리', 'Lyra', [
    [[-78.8068,37.6051],[-78.9051,39.6127],[-80.7653,38.7837],[-78.8068,37.6051],[-76.3738,36.8986],[-75.2641,32.6896],[-77.48,33.3627],[-78.8068,37.6051]],
  ]),
  astraBuildConstellation('leo', '사자자리', 'Leo', [
    [[152.093,11.9672],[151.8331,16.7627],[154.9931,19.8415],[168.5271,20.5237],[177.2649,14.5721],[168.56,15.4296],[152.093,11.9672]],
    [[154.9931,19.8415],[154.1726,23.4173],[148.1909,26.007],[146.4628,23.7743]],
  ]),
  astraBuildConstellation('scorpius', '전갈자리', 'Scorpius', [
    [[-120.287,-26.1141],[-119.9166,-22.6217],[-118.6407,-19.8055]],
    [[-119.9166,-22.6217],[-114.7028,-25.5928],[-112.6481,-26.432],[-111.0294,-28.216],[-107.4591,-34.2932],[-107.0324,-38.0474],[-106.3541,-42.3613],[-101.9617,-43.2392],[-95.6703,-42.9978],[-93.1038,-40.127],[-94.378,-39.03],[-96.5978,-37.1038]],
  ]),
  astraBuildConstellation('taurus', '황소자리', 'Taurus', [
    [[84.4112,21.1425],[68.9802,16.5093],[67.1656,15.8709],[64.9483,15.6276],[65.7337,17.5425],[67.1542,19.1804],[81.573,28.6075]],
    [[64.9483,15.6276],[60.1701,12.4903],[51.7923,9.7327],[60.7891,5.9893]],
    [[51.7923,9.7327],[51.2033,9.0289],[54.2183,0.4017]],
  ]),
  astraBuildConstellation('gemini', '쌍둥이자리', 'Gemini', [
    [[93.7194,22.5068],[95.7401,22.5136],[100.983,25.1311],[107.7849,30.2452],[113.6494,31.8883],[116.329,28.0262],[113.9806,26.8957],[110.0307,21.9823],[106.0272,20.5703],[99.4279,16.3993],[101.3224,12.8956]],
    [[110.0307,21.9823],[109.5232,16.5404]],
  ]),
  astraBuildConstellation('pegasus', '페가수스자리', 'Pegasus', [
    [[-27.5031,33.1782],[-19.2494,30.2212],[-14.0564,28.0828],[2.0969,29.0904],[3.309,15.1836],[-13.8098,15.2053],[-18.3267,12.1729],[-19.6345,10.8314],[-27.4501,6.1979],[-33.9535,9.875]],
    [[-13.8098,15.2053],[-14.0564,28.0828],[-17.4992,24.6016],[-18.3672,23.5657],[-28.2472,25.3451],[-33.8386,25.645]],
  ]),
]);
