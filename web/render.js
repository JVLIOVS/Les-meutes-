import {
  SIZE,
  road,
  EQUIPMENT,
  CROWD,
  GATES,
  clamp,
  dist,
  SERVICES,
  EDGE_MIN,
  EDGE_MAX,
  SPAN,
} from './data.js';
const mix = (hex, f) => {
  const n = parseInt(hex.slice(1), 16),
    v = [n >> 16, (n >> 8) & 255, n & 255].map(x => clamp(Math.round(x * f), 0, 255));
  return `rgb(${v.join(',')})`;
};
export class CityRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.menu = true;
    this.hover = null;
    this.tool = null;
    this.selected = null;
    this.t = 0;
    this.shake = 0;
    this.drawables = [];
    this.width = 0;
    this.height = 0;
    this.onResize = () => this.resize();
    addEventListener('resize', this.onResize);
    this.resize();
  }
  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    const d = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * d);
    this.canvas.height = Math.round(this.height * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  layout() {
    const w = this.width,
      h = this.height,
      portrait = h > w,
      compact = !portrait && h < 600,
      top = this.menu ? 0 : portrait ? 112 : compact ? 52 : 72,
      bottom = this.menu ? 0 : portrait ? 198 : compact ? 96 : 135;
    const area = this.menu && w > 800 ? w * 0.68 : w;
    this.tile = Math.min((area - 32) / (SPAN * 2), (h - top - bottom) / (SPAN + 2)) * this.zoom;
    this.tile = Math.max(4.5, this.tile);
    this.cx = (this.menu && w > 800 ? w * 0.73 : w * 0.5) + this.pan.x;
    this.cy = top + (h - top - bottom) * 0.52 + this.tile * 0.5 + this.pan.y;
  }
  point(x, y, z = 0) {
    return {
      x: this.cx + (x - y) * this.tile,
      y: this.cy + (x + y - 18) * this.tile * 0.5 - z * this.tile * 0.8,
    };
  }
  unproject(sx, sy) {
    const a = (sx - this.cx) / this.tile,
      b = (sy - this.cy) / (0.5 * this.tile) + 18;
    return { x: (a + b) / 2, y: (b - a) / 2 };
  }
  poly(points, fill, stroke, width = 1) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  }
  tileShape(x, y, w, d, z = 0, fill, stroke) {
    this.poly(
      [
        this.point(x - w / 2, y - d / 2, z),
        this.point(x + w / 2, y - d / 2, z),
        this.point(x + w / 2, y + d / 2, z),
        this.point(x - w / 2, y + d / 2, z),
      ],
      fill,
      stroke
    );
  }
  prism(x, y, w, d, h, color, roof = color, base = 0) {
    const a = this.point(x - w / 2, y - d / 2, base),
      b = this.point(x + w / 2, y - d / 2, base),
      cc = this.point(x + w / 2, y + d / 2, base),
      dd = this.point(x - w / 2, y + d / 2, base),
      A = this.point(x - w / 2, y - d / 2, h + base),
      B = this.point(x + w / 2, y - d / 2, h + base),
      C = this.point(x + w / 2, y + d / 2, h + base),
      D = this.point(x - w / 2, y + d / 2, h + base);
    this.poly([dd, cc, C, D], mix(color, 0.73));
    this.poly([b, cc, C, B], mix(color, 0.53));
    this.poly([A, B, C, D], roof, '#d9e3de23', 0.7);
  }
  ellipse(x, y, rx, ry, fill, stroke) {
    const c = this.ctx;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.stroke();
    }
  }
  line(a, b, color, width = 1) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.stroke();
  }
  text(text, x, y, size, color, weight = '600', align = 'center') {
    const c = this.ctx;
    c.font = `${weight} ${size}px system-ui,sans-serif`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  ring(x, y, r, color, alpha = 1) {
    const p = this.point(x, y),
      c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    this.ellipse(p.x, p.y, r * this.tile, r * this.tile * 0.5, null, color);
    c.restore();
  }
  background() {
    const c = this.ctx,
      w = this.width,
      h = this.height,
      g = c.createRadialGradient(w * 0.65, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.8);
    g.addColorStop(0, '#1b3544');
    g.addColorStop(0.55, '#101f2c');
    g.addColorStop(1, '#09141f');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.save();
    c.globalAlpha = 0.1;
    c.strokeStyle = '#91bec6';
    c.lineWidth = 0.6;
    for (let x = -h; x < w + h; x += 58) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x - h, h);
      c.stroke();
    }
    c.restore();
    for (let i = 0; i < 30; i++) {
      const x = (i * 173.7) % w,
        y = (i * 79.3 + Math.sin(this.t * 0.08 + i) * 5) % h;
      this.ellipse(x, y, 1, 1, '#bbded120');
    }
  }
  cachedGround(game) {
    const key = [this.canvas.width, this.canvas.height, this.tile, this.cx, this.cy].join(':');
    if (this.terrain?.key !== key) {
      const cache = document.createElement('canvas');
      cache.width = this.canvas.width;
      cache.height = this.canvas.height;
      const ctx = cache.getContext('2d'),
        prev = this.ctx,
        d = this.canvas.width / this.width;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      this.ctx = ctx;
      this.ground(game);
      this.ctx = prev;
      this.terrain = { key, cache };
    }
    this.ctx.drawImage(this.terrain.cache, 0, 0, this.width, this.height);
  }
  ground(game) {
    const c = this.ctx;
    this.prism(9, 9, 33.6, 33.6, 0.15, '#294d48', '#638572', -0.2);
    for (let x = EDGE_MIN; x <= EDGE_MAX; x++)
      for (let y = EDGE_MIN; y <= EDGE_MAX; y++) {
        if (x >= 0 && y >= 0 && x < 19 && y < 19) continue;
        const isRoad = road(x, y);
        this.tileShape(x, y, 0.99, 0.99, -0.04, isRoad ? '#55666c' : (x + y) % 3 ? '#688874' : '#6e9078');
        if (!isRoad && (x * 13 + y * 7) % 29 === 0) this.tree(x, y, 0.7);
      }
    const bottom = [
      this.point(-0.8, -0.8, -0.6),
      this.point(18.8, -0.8, -0.6),
      this.point(18.8, 18.8, -0.6),
      this.point(-0.8, 18.8, -0.6),
    ];
    this.poly(bottom, '#07131c', '#355461', 1);
    this.prism(9, 9, 19.6, 19.6, 0.35, '#345462', '#37525c', -0.35);
    for (let x = 0; x < SIZE; x++)
      for (let y = 0; y < SIZE; y++) {
        const r = road(x, y),
          color = r
            ? (x + y) % 2
              ? '#586672'
              : '#54636f'
            : (x * 7 + y * 11) % 4 === 0
              ? '#839c90'
              : '#7d958a';
        this.tileShape(x, y, 0.99, 0.99, 0, color);
        if (r) {
          if ((x === 3 || x === 9 || x === 15) && y % 3 === 1) {
            const a = this.point(x, y - 0.2, 0.01),
              b = this.point(x, y + 0.2, 0.01);
            this.line(a, b, '#c9d2c255', Math.max(1, this.tile * 0.035));
          }
          if ((y === 3 || y === 9 || y === 15) && x % 3 === 1)
            this.line(
              this.point(x - 0.2, y, 0.01),
              this.point(x + 0.2, y, 0.01),
              '#c9d2c255',
              Math.max(1, this.tile * 0.035)
            );
        }
      }
    // Junction markings and raised pedestrian edges.
    for (const x of [3, 9, 15])
      for (const y of [3, 9, 15])
        for (let i = 0; i < 4; i++) {
          this.tileShape(x - 0.38 + i * 0.25, y + 0.72, 0.12, 0.4, 0.03, '#d5ddcd99');
          this.tileShape(x + 0.72, y - 0.38 + i * 0.25, 0.4, 0.12, 0.03, '#d5ddcd99');
        }
    for (const g of GATES) {
      const p = this.point(g.x, g.y);
      this.ring(g.x, g.y, 0.7, '#d6af84', 0.45);
      for (let k = 0; k < 3; k++) {
        const yy = p.y + 5 + k * 4;
        this.line({ x: p.x - 4, y: yy }, { x: p.x, y: yy + 2 }, '#e9c49b88', 1.5);
        this.line({ x: p.x, y: yy + 2 }, { x: p.x + 4, y: yy }, '#e9c49b88', 1.5);
      }
    }
    // Small plazas preserve room for the gathering animations.
    for (const [x, y] of [
      [6, 16.7],
      [16.7, 6],
      [1, 6],
      [11, 1],
    ]) {
      this.tileShape(x, y, 1.5, 1.5, 0.01, '#adc0af');
      this.ring(x, y, 0.45, '#647f7d', 0.4);
    }
  }
  building(b, level, game) {
    if (b.primary && game?.phase === 'breach') {
      this.palaceInterior(b, game);
      return;
    }
    const c = this.ctx,
      damaged = b.hp / b.maxHp,
      active = b.hp > 0,
      main = b.primary,
      fp = main ? 3.7 : 3.25,
      h = active ? b.h : 0.35,
      p = this.point(b.x, b.y);
    this.tileShape(b.x + 0.35, b.y + 0.35, fp + 0.6, fp + 0.6, 0.01, '#172b3550');
    this.prism(b.x, b.y, fp + 0.3, fp + 0.3, 0.13, '#a9b8ae', '#c1cdbd');
    if (!active) {
      if (main) {
        this.prism(b.x, b.y, fp, fp, 1.7, '#69777b', '#90988a');
        for (const x of [-1.2, 1.2])
          this.prism(b.x + x, b.y + fp * 0.51, 0.25, 0.3, 1.8, '#bdc7c2', '#d2d4bd');
        this.prism(b.x, b.y + fp * 0.51, 0.65, 0.1, 1.3, '#253946', '#42525a');
        this.text('PALAIS ENVAHI', p.x, p.y - this.tile * 1.9, Math.max(9, this.tile * 0.25), '#efb497');
        return;
      }
      for (let i = 0; i < 9; i++) {
        const x = b.x + Math.sin(i * 4) * 1.3,
          y = b.y + Math.cos(i * 2) * 1.3;
        this.prism(x, y, 0.6, 0.5, 0.2 + (i % 3) * 0.2, '#657079', '#6e7b7e', 0.15);
      }
      this.text('PÉRIMÈTRE PERDU', p.x, p.y - 12, Math.max(7, this.tile * 0.25), '#eeb5a2');
      return;
    }
    this.prism(b.x, b.y, fp, fp, h, b.flash > 0 ? '#e6cfb3' : b.color, mix(b.color, 1.18), 0.14);
    // Cornices, roof inset and the service box.
    this.prism(b.x, b.y, fp + 0.14, fp + 0.14, 0.13, mix(b.color, 0.95), '#d4dccc', h + 0.14);
    this.tileShape(b.x, b.y, fp - 0.35, fp - 0.35, h + 0.28, mix(b.color, 0.76));
    this.prism(b.x - 0.45, b.y - 0.3, 0.75, 0.7, 0.25, '#748b92', '#b4c5c6', h + 0.29);
    for (let i = 0; i < 3; i++)
      this.line(
        this.point(b.x - 0.7, b.y - 0.54 + i * 0.18, h + 0.55),
        this.point(b.x - 0.2, b.y - 0.54 + i * 0.18, h + 0.55),
        '#526a70',
        1
      );
    if (main && b.kind === 'civic') {
      this.prism(b.x, b.y + fp * 0.51, 0.8, 0.1, 1.65, '#294d60', '#b8c6bb', 0.14);
      const doorTop = this.point(b.x, b.y + fp * 0.55, 3.2);
      this.poly(
        [
          this.point(b.x - 1.45, b.y + fp * 0.55, 2.65),
          doorTop,
          this.point(b.x + 1.45, b.y + fp * 0.55, 2.65),
        ],
        '#dedfca',
        '#b4bcae'
      );
      const dome = this.point(b.x - 1, b.y - 1, h + 0.5);
      this.ellipse(dome.x, dome.y, this.tile * 0.62, this.tile * 0.43, '#789a9a', '#bacdc3');
      const pennant = this.point(b.x + 1.1, b.y - 1.2, h + 0.8);
      this.line(pennant, this.point(b.x + 1.1, b.y - 1.2, h + 0.2), '#c2d5ca', 1.5);
      this.poly(
        [
          pennant,
          { x: pennant.x + 16, y: pennant.y + 2 },
          { x: pennant.x + 16, y: pennant.y + 10 },
          { x: pennant.x, y: pennant.y + 8 },
        ],
        '#81c7b4'
      );
      for (let i = 0; i < 4; i++)
        this.prism(
          b.x - fp * 0.36 + i * fp * 0.24,
          b.y + fp * 0.51,
          0.18,
          0.28,
          h * 0.72,
          '#dce0d2',
          '#e3e4d5',
          0.18
        );
      this.prism(b.x, b.y, fp * 0.6, fp * 0.55, 0.35, '#b8c7c7', '#e4dfbd', h + 0.3);
      const flag = this.point(b.x, b.y, h + 1.15),
        foot = this.point(b.x, b.y, h + 0.55);
      this.line(foot, flag, '#c3d7dd', 1.2);
      this.poly(
        [
          flag,
          { x: flag.x + this.tile * 0.55, y: flag.y + 2 },
          { x: flag.x + this.tile * 0.55, y: flag.y + this.tile * 0.2 },
          { x: flag.x, y: flag.y + this.tile * 0.17 },
        ],
        b.hp <= 0 ? '#da997d' : '#73bdb9'
      );
    }
    const floors = Math.max(1, Math.floor(h)),
      size = Math.max(1.8, this.tile * 0.12);
    for (let f = 0; f < floors; f++)
      for (let i = 0; i < 4; i++) {
        const w = this.point(b.x - fp * 0.37 + i * fp * 0.24, b.y + fp * 0.505, 0.65 + f * 0.78);
        c.save();
        c.translate(w.x, w.y);
        c.transform(1, 0.5, 0, 1, 0, 0);
        c.fillStyle = (i + f) % 3 === 0 ? '#f5dc9f' : '#7da8b4';
        c.fillRect(-size, -size * 1.3, size * 1.6, size * 2.1);
        c.restore();
        const q = this.point(b.x + fp * 0.505, b.y - fp * 0.36 + i * fp * 0.24, 0.65 + f * 0.78);
        c.save();
        c.translate(q.x, q.y);
        c.transform(1, -0.5, 0, 1, 0, 0);
        c.fillStyle = '#365c72';
        c.fillRect(-size, -size * 1.3, size * 1.5, size * 2.1);
        c.restore();
      }
    if (b.kind === 'shop' || b.kind === 'market') {
      for (let i = 0; i < 7; i++) {
        const x = b.x - fp / 2 + (i * fp) / 7 + 0.15;
        this.prism(
          x,
          b.y + fp * 0.56,
          fp / 7,
          0.6,
          0.12,
          i % 2 ? '#d6d3be' : '#be7778',
          i % 2 ? '#e4d9c4' : '#d38b89',
          0.72
        );
      }
    }
    if (false && b.protection) {
      for (let i = 0; i < 4; i++)
        this.prism(b.x - fp * 0.35 + i * 0.7, b.y + fp * 0.56, 0.55, 0.15, 0.65, '#728b91', '#adc3bc', 0.12);
      const q = this.point(b.x, b.y + fp * 0.55, 0.9);
      this.text('▥'.repeat(b.protection), q.x, q.y, Math.max(9, this.tile * 0.38), '#f3d69e', '800');
    }
    if (damaged < 0.65) {
      const a = this.point(b.x + 0.5, b.y + fp * 0.51, 0.6),
        z = this.point(b.x + 0.75, b.y + fp * 0.51, h * 0.8);
      this.line(a, z, '#334751', 2);
      if (damaged < 0.35) this.line(z, this.point(b.x - 0.15, b.y + fp * 0.51, h * 0.6), '#334751', 2);
    }
    this.facadeProtection(b, fp);
    const label = this.point(b.x, b.y, h + 0.72),
      bw = Math.max(46, Math.min(155, this.tile * 4.5)),
      font = clamp(this.tile * 0.25, 6.5, 10);
    c.fillStyle = main ? '#102d3bef' : '#19313cd9';
    this.round(label.x - bw / 2, label.y - 10, bw, 20, 5);
    c.fill();
    this.text(b.name, label.x, label.y, font, main ? '#f4d99b' : '#e0e7df', '750');
    const bar = this.point(b.x, b.y + fp * 0.57, 0.02);
    c.fillStyle = '#0c1d28a8';
    this.round(bar.x - bw * 0.28, bar.y + 4, bw * 0.56, 4, 2);
    c.fill();
    c.fillStyle = damaged < 0.4 ? '#ed9b88' : '#a7d6be';
    this.round(bar.x - bw * 0.28, bar.y + 4, bw * 0.56 * damaged, 4, 2);
    c.fill();
    if (this.selected?.type === 'building' && this.selected.id === b.id)
      this.ring(b.x, b.y, 2.55, '#c3e6d3', 0.9);
  }
  round(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, Math.max(0.1, w), h, r);
  }
  tree(x, y, s = 1) {
    const p = this.point(x, y);
    this.ellipse(p.x + 3, p.y + 2, this.tile * 0.38 * s, this.tile * 0.15 * s, '#223e3e55');
    this.prism(x, y, 0.1, 0.1, 0.8 * s, '#5b6557', '#7c8067');
    const a = this.point(x, y, 0.95 * s),
      r = this.tile * 0.32 * s;
    this.ellipse(a.x, a.y, r, r * 1.1, '#4e8173');
    this.ellipse(a.x - r * 0.2, a.y - r * 0.2, r * 0.75, r * 0.85, '#76a28a');
    this.ellipse(a.x - r * 0.34, a.y - r * 0.45, r * 0.25, r * 0.32, '#9abe9a');
  }
  streetProps(game) {
    for (const [x, y] of [
      [1.3, 1.3],
      [5, 1],
      [11, 1],
      [17, 1.5],
      [1, 5.5],
      [17.5, 5],
      [1, 11.5],
      [17.5, 11.5],
      [1.5, 17.3],
      [5.5, 17.4],
      [12, 17.5],
      [17.5, 17.5],
    ]) {
      if (!game.services.some(s => s.state !== 'empty' && dist(s, { x, y }) < 1.8))
        this.drawables.push({ depth: x + y, draw: () => this.tree(x, y, 0.8) });
    }
    for (const [x, y] of [
      [4, 7],
      [10, 7],
      [4, 13],
      [16, 13],
      [7, 16],
    ])
      this.drawables.push({
        depth: x + y,
        draw: () => {
          const a = this.point(x, y, 1.3),
            b = this.point(x, y);
          this.line(a, b, '#344d5b', Math.max(1, this.tile * 0.035));
          this.ellipse(a.x, a.y, this.tile * 0.075, this.tile * 0.05, '#f4d8a0');
          const c = this.ctx;
          c.save();
          c.globalAlpha = 0.07;
          this.ellipse(b.x, b.y, this.tile * 0.55, this.tile * 0.3, '#f4d8a0');
          c.restore();
        },
      });
    for (const [x, y] of [
      [6.6, 1.6],
      [17, 7],
      [1, 12],
    ]) {
      if (game.services.some(s => s.state !== 'empty' && dist(s, { x, y }) < 1.8)) continue;
      this.drawables.push({
        depth: x + y,
        draw: () => {
          this.prism(x, y, 1.2, 0.55, 0.4, '#a4b4b2', '#d1d8c9');
          this.prism(x, y, 1, 0.4, 0.25, '#5e7d8c', '#9ab8bd', 0.4);
        },
      });
    }
  }
  person(p, police = false, offset = { x: 0, y: 0 }, accent) {
    const q = this.point(p.x + offset.x, p.y + offset.y),
      c = this.ctx,
      scale = Math.max(this.tile * 0.46, police ? 6.4 : 5.3),
      seed = p.seed ?? 0.4,
      attacking = (p.attackUntil ?? 0) > this.simTime,
      active = !!p.moving || p.state === 'leave',
      phase = this.t * (p.type === 'runner' ? 13 : 9) + seed * 12,
      bob = active
        ? Math.abs(Math.sin(phase)) * 0.1 * scale
        : Math.sin(this.t * 2 + seed * 8) * 0.015 * scale;
    c.save();
    if (p.state === 'leave') c.globalAlpha = 0.4;
    this.ellipse(q.x, q.y, scale * 0.38, scale * 0.17, '#102a3b66');
    const dir = p.attackTarget
        ? this.point(p.attackTarget.x, p.attackTarget.y)
        : { x: q.x + Math.cos(p.heading ?? seed * 6), y: q.y + Math.sin(p.heading ?? seed * 6) },
      facing = dir.x >= q.x ? 1 : -1,
      stride = active ? Math.sin(phase) * scale * 0.22 : 0,
      lean = attacking
        ? Math.sin(Math.max(0, (p.attackUntil - this.simTime) / 0.48) * Math.PI) * scale * 0.14 * facing
        : 0;
    c.strokeStyle = police ? '#172d45' : '#35414c';
    c.lineWidth = Math.max(1.2, scale * 0.14);
    for (const side of [-1, 1])
      this.line(
        { x: q.x + side * scale * 0.13, y: q.y - scale * 0.34 },
        { x: q.x + side * scale * 0.13 + side * stride, y: q.y },
        c.strokeStyle,
        c.lineWidth
      );
    const col = police
      ? accent === 'mediation'
        ? '#4a947e'
        : '#376d9f'
      : (CROWD[p.type]?.color ?? '#d4a17c');
    c.fillStyle = p.flash > 0 ? '#fff2d7' : col;
    this.round(q.x - scale * 0.29 + lean, q.y - scale * 0.96 - bob, scale * 0.58, scale * 0.68, scale * 0.12);
    c.fill();
    c.fillStyle = ['#e0b38f', '#9a6c53', '#c58c6a', '#e7c8a6'][Math.floor(seed * 4) % 4];
    c.beginPath();
    c.arc(q.x + lean, q.y - scale * 1.18 - bob, scale * 0.23, 0, Math.PI * 2);
    c.fill();
    if (police || (p.tier ?? 1) > 1) {
      c.fillStyle = police ? '#162c44' : '#66515f';
      c.beginPath();
      c.arc(q.x + lean, q.y - scale * 1.22 - bob, scale * 0.27, Math.PI, Math.PI * 2);
      c.fill();
    }
    const swing = attacking ? Math.sin((1 - (p.attackUntil - this.simTime) / 0.48) * Math.PI) : 0,
      hand = {
        x: q.x + facing * scale * (0.3 + swing * 0.55) + lean,
        y: q.y - scale * (attacking ? 1.2 - swing * 0.6 : 0.6) - bob,
      };
    this.line(
      { x: q.x + lean, y: q.y - scale * 0.82 - bob },
      hand,
      p.flash > 0 ? '#fff4df' : col,
      Math.max(2, scale * 0.14)
    );
    if (attacking && accent !== 'mediation')
      this.line(
        hand,
        { x: hand.x + facing * scale * 0.35, y: hand.y - scale * 0.35 },
        police ? '#99b5bf' : '#806b5c',
        Math.max(1.3, scale * 0.09)
      );
    if (police && accent === 'shield') {
      c.fillStyle = '#a4c8d4cc';
      this.round(
        q.x + facing * scale * 0.16 - scale * 0.18 + lean,
        q.y - scale * 0.91 - bob,
        scale * 0.42,
        scale * 0.75,
        scale * 0.07
      );
      c.fill();
      this.line(
        { x: q.x + facing * scale * 0.16 - scale * 0.13 + lean, y: q.y - scale * 0.73 - bob },
        { x: q.x + facing * scale * 0.16 + scale * 0.17 + lean, y: q.y - scale * 0.73 - bob },
        '#edf3e7',
        1
      );
    }
    if (p.state === 'rally' && seed > 0.58) {
      const x = q.x + scale * 0.48;
      this.line({ x, y: q.y - scale * 0.4 }, { x, y: q.y - scale * 1.9 }, '#c8c7b4', 1);
      c.fillStyle = seed > 0.8 ? '#ddb8a3' : '#d5d3ae';
      c.fillRect(x - 1, q.y - scale * 1.9, scale * 0.8, scale * 0.5);
    }
    c.restore();
  }

  unit(u, game) {
    const d = EQUIPMENT[u.type],
      p = this.point(u.x, u.y),
      c = this.ctx,
      selected = this.selected?.type === 'unit' && this.selected.id === u.id;
    this.ellipse(
      p.x,
      p.y,
      this.tile * 0.7,
      this.tile * 0.35,
      selected ? '#83c9ee48' : '#8bd2e219',
      selected ? '#a3deed' : '#75b3ce55'
    );
    if (selected) this.ring(u.x, u.y, d.range * (1 + (u.tier - 1) * 0.08), d.color, 0.28);
    if (u.type === 'helicopter') {
      this.helicopter(u, game);
    } else if (u.type === 'water') {
      this.tileShape(u.x + 0.2, u.y + 0.2, 1.4, 0.8, 0.01, '#132b3b66');
      this.prism(u.x, u.y, 1.4, 0.7, 0.55, '#547e99', '#98b9c6');
      this.prism(u.x + 0.4, u.y, 0.55, 0.68, 0.32, '#688fa3', '#c0d1d1', 0.55);
      this.prism(u.x - 0.1, u.y, 0.6, 0.45, 0.12, '#31617b', '#9ce0e8', 0.57);
      for (const x of [-0.44, 0.44])
        for (const y of [-0.4, 0.4]) {
          const w = this.point(u.x + x, u.y + y, 0.16);
          this.ellipse(w.x, w.y, this.tile * 0.12, this.tile * 0.13, '#1a3445');
        }
    } else if (u.type === 'drone') {
      const q = this.point(u.x, u.y, 1.8 + Math.sin(this.t * 3 + u.id) * 0.08),
        s = this.tile * 0.4;
      this.ellipse(p.x, p.y, s, s * 0.4, '#0b233c33');
      this.line({ x: q.x - s, y: q.y - s * 0.5 }, { x: q.x + s, y: q.y + s * 0.5 }, '#c5c2e9', 2);
      this.line({ x: q.x + s, y: q.y - s * 0.5 }, { x: q.x - s, y: q.y + s * 0.5 }, '#c5c2e9', 2);
      for (const a of [-1, 1])
        for (const b of [-1, 1])
          this.ellipse(q.x + a * s, q.y + b * s * 0.5, s * 0.42, s * 0.16, null, '#d8d2f299');
      this.ellipse(q.x, q.y, s * 0.4, s * 0.3, '#8c91b5');
      this.ellipse(q.x, q.y + 1, 2, 1, '#a8f5e0');
    } else {
      const n = u.type === 'shield' ? 5 : 4,
        h = u.heading ?? 0;
      for (let i = 0; i < n; i++) {
        const lateral = (i - (n - 1) / 2) * 0.3,
          depth = u.type === 'shield' ? 0.05 : (i % 2) * 0.3;
        this.person(
          { ...u, seed: (u.id * 0.17 + i * 0.13) % 1, attackUntil: u.actionUntil, attackTarget: u.target },
          true,
          { x: -Math.sin(h) * lateral + Math.cos(h) * depth, y: Math.cos(h) * lateral + Math.sin(h) * depth },
          u.type
        );
      }
    }
    if (u.target && u.target.until > game.time) {
      const target = this.point(u.target.x, u.target.y, 0.3),
        source = this.point(u.x, u.y, u.type === 'drone' ? 1.8 : 0.7);
      if (u.type === 'water') {
        this.line(source, target, '#a4e5f933', Math.max(5, this.tile * 0.25));
        this.line(source, target, '#c5f5ffcc', Math.max(1, this.tile * 0.08));
        for (let i = 0; i < 5; i++) {
          const t = (this.t * 3 + i * 0.17) % 1;
          this.ellipse(
            source.x + (target.x - source.x) * t,
            source.y + (target.y - source.y) * t,
            1.4,
            1,
            '#ecffff'
          );
        }
      } else if (u.type === 'drone') this.line(source, target, '#cebdeba8', 1);
      else if (u.type === 'helicopter')
        this.line(this.point(u.x, u.y, 3.2), target, '#f4e6b633', this.tile * 0.5);
    }
    if (selected || u.hp / u.maxHp < 0.7) {
      const w = clamp(this.tile * 1.1, 18, 34);
      c.fillStyle = '#173447';
      c.fillRect(p.x - w / 2, p.y + 6, w, 3);
      c.fillStyle = u.hp / u.maxHp < 0.35 ? '#edaa97' : d.color;
      c.fillRect(p.x - w / 2, p.y + 6, (w * u.hp) / u.maxHp, 3);
    }
    if (u.healUntil > game.time) this.text('✚', p.x, p.y - this.tile * 1.3, 12, '#a6efba');
    if (u.tier > 1) this.text('•'.repeat(u.tier), p.x, p.y - this.tile * 1.05, 8, '#f2d79f', '900');
  }
  barrier(b, enemy = false) {
    const tier = b.tier ?? 1;
    if (tier > 1)
      this.prism(
        b.x,
        b.y,
        0.95,
        0.62,
        0.35 + tier * 0.13,
        enemy ? '#875e77' : '#668697',
        enemy ? '#c78ca0' : '#a2bec1'
      );
    for (let i = 0; i < 3; i++) {
      this.prism(
        b.x - 0.32 + i * 0.32,
        b.y,
        0.28,
        0.52,
        0.4,
        enemy ? '#9d7183' : '#b99565',
        enemy ? '#c88c9f' : '#dfc28f'
      );
    }
    const p = this.point(b.x, b.y, 0.2);
    this.line(
      { x: p.x - this.tile * 0.4, y: p.y },
      { x: p.x + this.tile * 0.4, y: p.y + this.tile * 0.3 },
      enemy ? '#d896ac' : '#edd5a0',
      Math.max(1, this.tile * 0.06)
    );
  }
  effects(game) {
    const c = this.ctx;
    for (const f of game.fields) {
      const p = this.point(f.x, f.y);
      c.save();
      c.globalAlpha = Math.min(1, (f.until - game.time) / 2) * 0.55;
      this.ring(f.x, f.y, f.radius, '#a4e9d2', 0.7);
      for (let i = -3; i <= 3; i++) {
        this.line(this.point(f.x + i * 0.4, f.y - 1.3), this.point(f.x + i * 0.4, f.y + 1.3), '#a3e4d455', 1);
        this.line(this.point(f.x - 1.3, f.y + i * 0.4), this.point(f.x + 1.3, f.y + i * 0.4), '#a3e4d455', 1);
      }
      c.restore();
    }
    for (const e of game.effects) {
      const age = game.time - e.born,
        t = clamp(age / 1.1, 0, 1),
        p = this.point(e.x, e.y, ['smash', 'shatter'].includes(e.kind) ? 0.9 : 0.35);
      c.save();
      c.globalAlpha = 1 - t;
      if (e.kind === 'stone') {
        const f = clamp(age / 0.65, 0, 1),
          q = this.point(e.tx, e.ty, 0.5);
        this.ellipse(
          p.x + (q.x - p.x) * f,
          p.y + (q.y - p.y) * f - Math.sin(f * Math.PI) * this.tile * 0.9,
          2.3,
          2.3,
          e.color
        );
      } else if (['smash', 'shatter', 'collapse'].includes(e.kind)) {
        for (let i = 0; i < 10; i++) {
          const a = i * 2.399 + e.id,
            r = t * this.tile * e.size,
            x = p.x + Math.cos(a) * r,
            y = p.y + Math.sin(a) * r * 0.4 - this.tile * Math.sin(t * Math.PI) * 0.5;
          c.fillStyle = i % 3 === 0 ? '#e1ded0' : e.color;
          c.save();
          c.translate(x, y);
          c.rotate(a + t * 3);
          c.fillRect(-2, -1, 3 + t * 2, 2);
          c.restore();
        }
        this.ring(e.x, e.y, e.size * t, e.color, 0.4 * (1 - t));
      } else if (e.kind === 'shield' || e.kind === 'baton') {
        c.strokeStyle = e.color;
        c.lineWidth = Math.max(1, this.tile * 0.07);
        c.beginPath();
        c.arc(p.x, p.y, this.tile * (0.15 + t * 0.4), -0.9, 1.1);
        c.stroke();
        this.ring(e.x, e.y, 0.7 * t, e.color, 0.6 * (1 - t));
      } else if (e.kind === 'airnet') {
        this.ring(e.x, e.y, e.size * (0.8 + t * 0.2), e.color, 1 - t);
        for (let i = -2; i <= 2; i++)
          this.line(
            this.point(e.x + i * 0.5, e.y - 1.6),
            this.point(e.x + i * 0.5, e.y + 1.6),
            e.color + '66',
            1
          );
      } else if (['shock', 'deploy', 'disperse', 'order', 'heal', 'net'].includes(e.kind)) {
        this.ring(e.x, e.y, e.size * (0.3 + t), e.color, 1 - t);
        if (e.kind === 'shock') this.ring(e.x, e.y, e.size * (0.1 + t * 0.7), e.color, 1 - t);
      } else {
        for (let i = 0; i < 7; i++) {
          const a = i * 2.399 + e.id * 0.3,
            r = t * this.tile * e.size;
          const x = p.x + Math.cos(a) * r,
            y = p.y + Math.sin(a) * r * 0.65 - this.tile * 0.25 * t;
          this.line(
            { x, y },
            { x: x + Math.cos(a) * 3, y: y + Math.sin(a) * 3 },
            e.color,
            e.kind === 'splash' ? 2 : 1.5
          );
        }
      }
      c.restore();
    }
  }
  render(game, dt = 1 / 60) {
    this.simTime = game.time;
    this.t += Math.min(dt, 0.05);
    this.layout();
    if (game.phase === 'breach' && game.breach) {
      const f = Math.min(1, game.breach.elapsed / 1.3);
      this.tile *= 1 + f * 1.15;
      this.cy -= 3 * this.tile * f;
    }
    this.background();
    const c = this.ctx;
    c.save();
    if (this.shake > 0) {
      c.translate(Math.sin(this.t * 61) * this.shake, Math.cos(this.t * 53) * this.shake * 0.5);
      this.shake *= 0.85;
    }
    this.cachedGround(game);
    this.drawables = [];
    this.streetProps(game);
    for (const service of game.services ?? [])
      this.drawables.push({
        depth: service.x + service.y + 1,
        draw: () => {
          c.save();
          if (service.shakeUntil > game.time) c.translate(Math.sin(this.t * 90) * 2, 0);
          this.serviceBuilding(service, game);
          c.restore();
        },
      });
    for (const b of game.buildings)
      this.drawables.push({
        depth: b.x + b.y + 2,
        draw: () => {
          c.save();
          if (b.shakeUntil > game.time) c.translate(Math.sin(this.t * 90) * 2, 0);
          this.building(b, game.level, game);
          c.restore();
        },
      });
    for (const b of game.barriers) this.drawables.push({ depth: b.x + b.y, draw: () => this.barrier(b) });
    for (const b of game.hostile)
      this.drawables.push({ depth: b.x + b.y, draw: () => this.barrier(b, true) });
    for (const p of game.phase === 'breach' ? game.breach.actors : game.crowd)
      this.drawables.push({
        depth: p.x + p.y + (game.phase === 'breach' ? 100 : 0),
        draw: () => this.person(p),
      });
    for (const u of game.units)
      this.drawables.push({
        depth: u.x + u.y + (u.type === 'helicopter' ? 80 : 0.2),
        draw: () => this.unit(u, game),
      });
    this.drawables.sort((a, b) => a.depth - b.depth);
    for (const item of this.drawables) item.draw();
    for (const r of game.rallies) {
      if (r.spawned >= r.count && game.time > r.release) continue;
      const g = GATES[r.gate],
        p = this.point(g.x, g.y, 1);
      this.ring(g.x, g.y, 1.2 + Math.sin(this.t * 3) * 0.08, '#efb395', 0.7);
      this.text(
        `${r.count} · RASSEMBLEMENT`,
        p.x,
        p.y - 15,
        clamp(this.tile * 0.27, 7, 10),
        '#f1c5a8',
        '800'
      );
    }
    this.effects(game);
    this.builders(game);
    if (game.phase === 'breach') this.cinematic(game);
    if (!this.menu && this.hover && this.tool) {
      const d = EQUIPMENT[this.tool] ?? SERVICES[this.tool?.slice(6)] ?? {},
        x = Math.round(this.hover.x),
        y = Math.round(this.hover.y),
        valid = !game.canPlace(this.tool, x, y);
      if (x >= EDGE_MIN && y >= EDGE_MIN && x <= EDGE_MAX && y <= EDGE_MAX) {
        const color = valid ? '#a9e4c3' : '#ec9e98';
        this.tileShape(x, y, 0.95, 0.95, 0.06, valid ? '#a9e4c333' : '#ec9e9833', color);
        if (d.range) this.ring(x, y, d.range, color, 0.35);
      }
    }
    c.restore();
  }
  serviceBuilding(s, game) {
    const p = this.point(s.x, s.y),
      c = this.ctx,
      d = SERVICES[s.type];
    if (s.state === 'empty' || s.state === 'ruin') {
      this.tileShape(s.x, s.y, 2.25, 2.25, 0.03, s.state === 'ruin' ? '#806d65' : '#a4c5b42a', '#b8d2be88');
      this.ring(s.x, s.y, 0.6, '#bbd6bd', 0.6);
      this.text(
        s.state === 'ruin' ? '↻' : '+ BÂTIR',
        p.x,
        p.y - 2,
        Math.max(7, this.tile * 0.34),
        '#dce8ca',
        '400'
      );
      return;
    }
    if (s.state === 'building') {
      this.prism(s.x, s.y, 2.1, 2.1, 0.25, '#9da68a', '#d4ceb0');
      for (const a of [-1, 1])
        for (const b of [-1, 1]) this.prism(s.x + a, s.y + b, 0.09, 0.09, 1.5, '#d4b479', '#f0d4a0');
      this.line(this.point(s.x - 1, s.y - 1, 1.4), this.point(s.x + 1, s.y + 1, 1.4), '#e4c691', 2);
      this.text(
        'CHANTIER ' + Math.round((s.progress / s.duration) * 100) + '%',
        p.x,
        p.y - this.tile * 1.8,
        Math.max(7, this.tile * 0.35),
        '#e7d7a7'
      );
    } else {
      this.prism(s.x, s.y, 2.1, 2.1, 1.15 + s.tier * 0.18, d.color, mix(d.color, 1.12));
      this.prism(s.x, s.y, 0.8, 0.8, 0.3, '#526c79', '#d3d9c9', 1.15 + s.tier * 0.18);
      if (s.type === 'command') {
        this.prism(s.x, s.y, 0.08, 0.08, 1, '#c1ccd0', '#f4d9a4', 1.6);
        this.ring(s.x, s.y, 1.4, '#a4d1d8', 0.35);
      }
      if (s.type === 'workshop') {
        this.prism(s.x + 0.8, s.y, 0.12, 0.12, 2.2, '#d5ac71', '#efd5a0');
        this.line(this.point(s.x + 0.8, s.y, 2.2), this.point(s.x - 1, s.y, 2.2), '#dfbb82', 3);
      }
      if (s.type === 'lab') {
        const a = this.point(s.x, s.y, 1.6),
          r = this.tile * 0.55;
        this.ellipse(a.x, a.y, r, r * 0.5, '#667b9255', '#d8d9bd');
        this.text('H', a.x, a.y, Math.max(11, this.tile * 0.5), '#e4e3bb');
      }
      if (s.type === 'housing') {
        this.prism(s.x, s.y, 0.9, 0.9, 0.65, '#b78d7d', '#d4c7b1', 1.3);
        for (const dx of [-0.6, 0.2])
          this.prism(s.x + dx, s.y + 1.06, 0.26, 0.04, 0.35, '#efdaaa', '#f4e1b5', 0.55);
      }
      if (s.type === 'market')
        for (let i = 0; i < 6; i++)
          this.prism(
            s.x - 0.9 + i * 0.36,
            s.y + 1.2,
            0.35,
            0.6,
            0.14,
            i % 2 ? '#c68881' : '#d7d0b6',
            i % 2 ? '#d58e86' : '#efe4cc',
            0.75
          );
      if (s.type === 'clinic')
        this.text('✚', p.x, p.y - this.tile * 0.75, Math.max(15, this.tile * 0.8), '#e3f0d7');
      if (s.type === 'civic')
        this.text('◉', p.x, p.y - this.tile * 0.75, Math.max(10, this.tile * 0.6), '#e7f2d5');
      this.text(
        d.short.toUpperCase() + ' · ' + s.tier,
        p.x,
        p.y - this.tile * 2.15,
        Math.max(7, this.tile * 0.32),
        '#e5e9d8'
      );
      if (s.upgrading)
        this.text('AMÉLIORATION ' + Math.ceil(s.upgrading) + 's', p.x, p.y + this.tile * 0.7, 7, '#f1d49b');
    }
    if (s.state === 'built') {
      this.facadeProtection(s, 2.1);
      if (s.hp < s.maxHp * 0.5) {
        const q = this.point(s.x, s.y, 1.6);
        this.ellipse(q.x + Math.sin(this.t) * 3, q.y - (this.t % 1) * 12, 5, 8, '#b8afa855');
      }
    }
    const w = this.tile * 1.7;
    c.fillStyle = '#183044';
    c.fillRect(p.x - w / 2, p.y + this.tile * 0.5, w, 3);
    c.fillStyle = d.color;
    c.fillRect(
      p.x - w / 2,
      p.y + this.tile * 0.5,
      w * (s.state === 'building' ? s.progress / s.duration : s.hp / s.maxHp),
      3
    );
    if (this.selected?.type === 'service' && this.selected.id === s.id) this.ring(s.x, s.y, 1.6, '#edddb0');
  }
  builders(game) {
    const workshop = game.service('workshop');
    if (!workshop || game.builderTarget == null) return;
    const b =
      game.targets.find(b => b.id === game.builderTarget) ??
      game.buildings.find(b => b.id === game.builderTarget);
    if (!b) return;
    for (let i = 0; i < 2; i++) {
      const t = (this.t * 0.15 + i * 0.45) % 1,
        x = workshop.x + (b.x - workshop.x) * t,
        y = workshop.y + (b.y - workshop.y) * t;
      const p = { x, y, seed: 0.6, type: 'runner', moving: true };
      this.person(p);
      const q = this.point(x, y, 0.65);
      this.text('⚒', q.x, q.y, Math.max(8, this.tile * 0.5), '#f0d4a0');
    }
  }
  helicopter(u, game) {
    const c = this.ctx,
      p = this.point(
        u.x,
        u.y,
        1.2 + Math.min(1, (game.time - (u.born ?? game.time - 1)) * 1.6) * 2.1 + Math.sin(this.t * 3) * 0.09
      ),
      ground = this.point(u.x, u.y),
      s = this.tile;
    c.save();
    this.ellipse(ground.x, ground.y, s * 1.3, s * 0.6, '#10283430');
    const target = u.target && u.target.until > game.time ? this.point(u.target.x, u.target.y) : ground;
    this.poly([p, { x: target.x - s, y: target.y }, { x: target.x + s, y: target.y }], '#f4e6a516');
    this.ellipse(target.x, target.y, s, s * 0.45, '#fff1bc18');
    c.translate(p.x, p.y);
    c.rotate((u.heading ?? 0) * 0.2);
    this.ellipse(0, 0, s * 0.65, s * 0.33, '#4d7188');
    this.ellipse(s * 0.3, -s * 0.04, s * 0.36, s * 0.25, '#a7d3dc');
    this.line({ x: -s * 0.5, y: 0 }, { x: -s * 1.45, y: -s * 0.2 }, '#668ca0', s * 0.12);
    this.line({ x: -s * 1.45, y: -s * 0.4 }, { x: -s * 1.45, y: s * 0.1 }, '#d1dcce', s * 0.05);
    for (const y of [-0.32, 0.32])
      this.line({ x: -s * 0.5, y: s * y }, { x: s * 0.55, y: s * y }, '#b9d3d6', s * 0.055);
    this.ellipse(0, -s * 0.2, s * 1.4, s * 0.25, '#c8ded326');
    const a = this.t * 45;
    this.line(
      { x: Math.cos(a) * s * 1.4, y: -s * 0.2 + Math.sin(a) * s * 0.25 },
      { x: -Math.cos(a) * s * 1.4, y: -s * 0.2 - Math.sin(a) * s * 0.25 },
      '#dbe6d5bb',
      s * 0.045
    );
    this.ellipse(-s * 0.6, 0, 2, 2, '#efad8e');
    c.restore();
    for (let i = 0; i < 3; i++)
      this.ring(u.x, u.y, 0.6 + ((this.t * 1.5 + i / 3) % 1) * 1.5, '#b8d7cb', 0.18);
  }
  facadeProtection(b, fp) {
    if (!b.protection) return;
    const c = this.ctx,
      solid = (b.armorHp ?? 0) > 0,
      color = solid ? '#d3ba80' : '#796d64';
    for (let i = 0; i < 4; i++) {
      const x = b.x - fp * 0.35 + i * fp * 0.23;
      this.prism(x, b.y + fp * 0.52, 0.48, 0.12, solid ? 0.6 : 0.18, '#7f8174', color, 0.3);
      if (b.protection >= 2 && solid)
        for (let j = 0; j < 3; j++)
          this.prism(x - 0.18 + j * 0.14, b.y + fp * 0.55, 0.04, 0.08, 1.1, '#8da8aa', '#ccd5c2', 0.25);
    }
    if (b.protection >= 3) {
      for (const dx of [-1, 1])
        this.prism(b.x + dx * (fp * 0.55), b.y + fp * 0.65, 0.18, 0.2, solid ? 1.2 : 0.35, '#7a8c8c', color);
      this.line(
        this.point(b.x - fp * 0.6, b.y + fp * 0.65, 1.2),
        this.point(b.x + fp * 0.6, b.y + fp * 0.65, 1.2),
        solid ? '#d1d8b6' : '#716e63',
        2
      );
    }
    const p = this.point(b.x, b.y + fp * 0.6, 0.02),
      w = Math.max(25, this.tile * 1.5);
    c.fillStyle = '#202e3d';
    c.fillRect(p.x - w / 2, p.y + 10, w, 3);
    c.fillStyle = solid ? '#edce8d' : '#b78278';
    c.fillRect(p.x - w / 2, p.y + 10, (w * (b.armorHp ?? 0)) / (b.armorMax || 1), 3);
  }
  palaceInterior(b, game) {
    const c = this.ctx;
    this.tileShape(12, 12, 4.5, 4.5, 0.14, '#d9cfb7', '#e9e1c6');
    for (let i = 0; i < 5; i++)
      this.line(this.point(9.9 + i, 9.8, 0.15), this.point(9.9 + i, 14.2, 0.15), '#b8b29f', 1);
    this.prism(12, 9.8, 4.5, 0.18, 2.2, '#a7b6b5', '#d5d6bc');
    this.prism(9.8, 12, 0.18, 4.5, 2.2, '#a7b6b5', '#d5d6bc');
    for (const x of [10.5, 13.5]) this.prism(x, 14.1, 1.3, 0.18, 1, '#b5c0bb', '#d4d7c1');
    for (const x of [11.45, 12.55]) this.prism(x, 14.05, 0.15, 0.22, 2, '#c9d0c2', '#e7debb');
    this.prism(12, 14.05, 1.3, 0.22, 0.16, '#c9d0c2', '#e7debb', 2);
    this.tileShape(12, 12, 1.05, 4.2, 0.16, '#ae7e75');
    this.prism(12, 10.65, 1.5, 0.65, 0.75, '#866956', '#b69770');
    this.prism(12, 10.15, 0.7, 0.5, 1, '#6c7c81', '#c4c7ad');
    const flag = this.point(13.5, 10, 2.2);
    this.line(flag, this.point(13.5, 10, 0.2), '#c5c9b8', 2);
    c.fillStyle = game.breach.stage === 'renversement' ? '#d98f76' : '#8cc6b5';
    c.fillRect(flag.x, flag.y, 22, 12);
    this.text(
      'BUREAU PRÉSIDENTIEL',
      this.point(12, 10.2, 2.5).x,
      this.point(12, 10.2, 2.5).y,
      Math.max(8, this.tile * 0.23),
      '#f1dfb9'
    );
  }
  cinematic(game) {
    const c = this.ctx,
      b = game.breach,
      l = b.leader,
      p = this.point(l.x, l.y, 0.2),
      s = Math.max(10, this.tile * 0.45);
    c.fillStyle = '#c49b59';
    this.round(p.x - s * 0.25, p.y - s * 0.95, s * 0.5, s * 0.75, 2);
    c.fill();
    this.line({ x: p.x - s * 0.2, y: p.y - s * 0.9 }, { x: p.x + s * 0.2, y: p.y - s * 0.35 }, '#f3e4b4', 3);
    this.ellipse(p.x, p.y - s * 1.2, s * 0.22, s * 0.23, '#e0b896');
    this.text(b.leader.captured ? 'DIRIGEANT CAPTURÉ' : 'CHEF D’ÉTAT', p.x, p.y - s * 1.8, 10, '#f5dba6');
    if (l.captured)
      for (const dx of [-0.5, 0.5])
        this.person({ x: l.x + dx, y: l.y + 0.1, type: 'heavy', seed: 0.2 + dx * 0.1, moving: true });
    c.fillStyle = '#06121be6';
    c.fillRect(0, 0, this.width, Math.max(30, this.height * 0.07));
    c.fillRect(0, this.height - 105, this.width, 105);
    const title =
      b.stage === 'portail'
        ? 'LE PORTAIL CÈDE'
        : b.stage === 'entrée'
          ? 'LA FOULE ENTRE DANS LE PALAIS'
          : b.stage === 'capture'
            ? 'LE CHEF D’ÉTAT EST CAPTURÉ'
            : 'LE RÉGIME EST RENVERSÉ';
    this.text(title, this.width / 2, this.height - 69, clamp(this.width * 0.019, 11, 23), '#f0d8b3', '750');
    this.text(
      `${b.enteredCount} / ${b.actors.length} ont franchi le portail · ${l.captured ? 'escorte vers la sortie' : 'vue intérieure du palais'}`,
      this.width / 2,
      this.height - 38,
      10,
      '#cecbc0',
      '500'
    );
  }

  hitBuilding(x, y, game) {
    return [...game.buildings].reverse().find(b => Math.abs(x - b.x) < 1.9 && Math.abs(y - b.y) < 1.9);
  }
  pick(sx, sy, game) {
    for (const b of game.services ?? []) {
      const q = this.point(b.x, b.y, b.state === 'built' ? 1 : 0);
      if (Math.hypot((sx - q.x) / 1.6, sy - q.y) < this.tile * 1.3) return { type: 'service', id: b.id };
    }
    const ground = this.unproject(sx, sy),
      unit = game.units.find(u => dist(u, ground) < 0.85);
    if (unit) return { type: 'unit', id: unit.id };
    // Use the rendered six-sided prism silhouette, avoiding invisible rectangular hit areas.
    const inside = poly => {
      let hit = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i],
          b = poly[j];
        if (a.y > sy !== b.y > sy && sx < ((b.x - a.x) * (sy - a.y)) / (b.y - a.y) + a.x) hit = !hit;
      }
      return hit;
    };
    for (const b of [...game.buildings].sort((a, b) => b.x + b.y - a.x - a.y)) {
      const r = (b.primary ? 3.84 : 3.39) / 2,
        h = b.hp > 0 ? b.h + 0.4 : 0.4,
        x = b.x,
        y = b.y;
      if (
        inside([
          this.point(x - r, y - r, h),
          this.point(x + r, y - r, h),
          this.point(x + r, y - r, 0),
          this.point(x + r, y + r, 0),
          this.point(x - r, y + r, 0),
          this.point(x - r, y + r, h),
        ])
      )
        return { type: 'building', id: b.id };
    }
    const p = this.unproject(sx, sy),
      u = game.units.find(u => dist(u, p) < 0.85);
    if (u) return { type: 'unit', id: u.id };
    const b = game.barriers.find(b => dist(b, p) < 0.6);
    if (b) return { type: 'barrier', id: b.id };
    return { type: 'ground', x: Math.round(p.x), y: Math.round(p.y) };
  }
}
