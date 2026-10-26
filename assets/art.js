/* ============================================================
   MineX - hand-authored isometric voxel art.
   No images. No AI. Products are composed from a voxel grid;
   faces are back-face culled and lit with a key light, fill,
   rim light and per-vertex AO. Rendered at 2x for crisp edges.
   ============================================================ */
(function (global) {
  'use strict';

  /* ============================================================
     Sprite helper.

     Hand-written ASCII grids cap detail at whatever fits in ~16 cells. This
     builds objects from geometry at 3-4x that resolution, then CSS scales them
     down — detail is authored large and reduced for display.
     ============================================================ */
  function Sprite(w, h) {
    this.w = w; this.h = h; this.g = []; this.hm = [];
    for (var y = 0; y < h; y++) {
      var row = new Array(w), hrow = new Array(w);
      for (var x = 0; x < w; x++) { row[x] = null; hrow[x] = null; }
      this.g.push(row);
      this.hm.push(hrow);
    }
  }
  /* Raised cells. The renderer turns a height difference into a lit side wall,
     which is what gives a lid, a strap or a clasp real relief instead of being
     a flat painted shape. Default height is 2, so sprites that never call this
     render exactly as before. */
  Sprite.prototype.setH = function (x, y, c, h) {
    this.set(x, y, c);
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return this;
    this.hm[y][x] = h;
    return this;
  };
  Sprite.prototype.set = function (x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return this;
    this.g[y][x] = c;
    return this;
  };
  Sprite.prototype.get = function (x, y) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return null;
    return this.g[y][x];
  };
  Sprite.prototype.rect = function (x0, y0, x1, y1, c) {
    for (var y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (var x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
        this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    return this;
  };
  Sprite.prototype.line = function (x0, y0, x1, y1, c, thick) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    thick = thick || 1;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var x = Math.round(x0 + (x1 - x0) * t);
      var y = Math.round(y0 + (y1 - y0) * t);
      for (var o = 0; o < thick; o++) this.set(x + o, y, c);
    }
    return this;
  };
  Sprite.prototype.outline = function (col) {
    var src = this.g.map(function (r) { return r.slice(); });
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) {
      if (!src[y][x]) continue;
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var n = 0; n < 4; n++) {
        var nx = x + nb[n][0], ny = y + nb[n][1];
        if (nx < 0 || nx >= this.w || ny < 0 || ny >= this.h || !src[ny][nx]) {
          this.g[y][x] = col; break;
        }
      }
    }
    return this;
  };
  /* Crop the sprite to the painted cells. Sprites are authored on a generous
     grid so nothing clips while it is being drawn, which leaves empty rows and
     columns around the object; the renderer frames the whole grid, not the
     artwork, so that padding shows up as the icon sitting small in its card. */
  Sprite.prototype.trim = function () {
    var x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) {
      if (!this.g[y][x]) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return this;
    var w = x1 - x0 + 1, h = y1 - y0 + 1;
    var g = [], hm = [];
    for (var ny = 0; ny < h; ny++) {
      var row = new Array(w), hrow = new Array(w);
      for (var nx = 0; nx < w; nx++) {
        row[nx] = this.g[y0 + ny][x0 + nx];
        hrow[nx] = this.hm[y0 + ny][x0 + nx];
      }
      g.push(row); hm.push(hrow);
    }
    this.g = g; this.hm = hm; this.w = w; this.h = h;
    return this;
  };

  Sprite.prototype.model = function (emissive) {
    var hm = [];
    var hasH = false;
    for (var y = 0; y < this.h; y++) {
      hm[y] = [];
      for (var x = 0; x < this.w; x++) {
        if (!this.g[y][x]) { hm[y][x] = null; continue; }
        if (this.hm[y][x] != null) { hm[y][x] = this.hm[y][x]; hasH = true; }
        else hm[y][x] = 2;
      }
    }
    // A sprite that never set heights collapses to one flat plane, exactly as
    // the old default did — no accidental relief on the rank items.
    if (!hasH) for (var y2 = 0; y2 < this.h; y2++) for (var x2 = 0; x2 < this.w; x2++) {
      if (hm[y2][x2] != null) hm[y2][x2] = 2;
    }
    return { kind: 'badge', grid: this.g, height: hm, crown: [], rimSet: [],
      gw: this.w, gh: this.h, dome: false, colors: {}, emissive: emissive || [] };
  };

  function starInto(spr, cx, cy, r, colInner, colEdge) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rad = (i % 2 === 0) ? r : r * 0.42;
      pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
    }
    function inside(px, py) {
      var c = false;
      for (var i2 = 0, j = pts.length - 1; i2 < pts.length; j = i2++) {
        var xi = pts[i2][0], yi = pts[i2][1], xj = pts[j][0], yj = pts[j][1];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c;
      }
      return c;
    }
    for (var y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (!inside(x + 0.5, y + 0.5)) continue;
        spr.set(x, y, (y < cy - r * 0.15) ? colInner : colEdge);
      }
  }

  /* ---------------- voxel container ---------------- */
  function Vox() { this.v = new Map(); this.emissive = {}; }
  Vox.prototype.k = function (x, y, z) { return x + ',' + y + ',' + z; };
  Vox.prototype.has = function (x, y, z) { return this.v.has(x + ',' + y + ',' + z); };
  Vox.prototype.get = function (x, y, z) { return this.v.get(x + ',' + y + ',' + z); };
  Vox.prototype.set = function (x, y, z, c) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    if (c === null || c === undefined) { this.v.delete(x + ',' + y + ',' + z); return this; }
    this.v.set(x + ',' + y + ',' + z, { x: x, y: y, z: z, c: c });
    return this;
  };
  Vox.prototype.del = function (x, y, z) { this.v.delete(this.k(x, y, z)); return this; };
  Vox.prototype.box = function (x0, y0, z0, x1, y1, z1, c, hollow) {
    x0 = Math.round(x0); y0 = Math.round(y0); z0 = Math.round(z0);
    x1 = Math.round(x1); y1 = Math.round(y1); z1 = Math.round(z1);
    var t;
    if (x0 > x1) { t = x0; x0 = x1; x1 = t; }
    if (y0 > y1) { t = y0; y0 = y1; y1 = t; }
    if (z0 > z1) { t = z0; z0 = z1; z1 = t; }
    for (var x = x0; x <= x1; x++)
      for (var y = y0; y <= y1; y++)
        for (var z = z0; z <= z1; z++) {
          if (hollow && x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1) continue;
          this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
        }
    return this;
  };
  Vox.prototype.sphere = function (cx, cy, cz, r, c, hollow) {
    for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      for (var y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        for (var z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
          var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy) + (z - cz) * (z - cz));
          if (d > r + 0.25) continue;
          if (hollow && d < r - 0.9) continue;
          this.set(x, y, z, typeof c === 'function' ? c(x, y, z, d) : c);
        }
    return this;
  };
  Vox.prototype.cyl = function (cx, cz, y0, y1, r, c, hollow) {
    for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      for (var z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
        var d = Math.sqrt((x - cx) * (x - cx) + (z - cz) * (z - cz));
        if (d > r + 0.28) continue;
        var inner = d < r - 0.95;
        for (var y = Math.round(y0); y <= Math.round(y1); y++) {
          if (hollow && inner && y !== Math.round(y0) && y !== Math.round(y1)) continue;
          this.set(x, y, z, typeof c === 'function' ? c(x, y, z, d) : c);
        }
      }
    return this;
  };
  Vox.prototype.bounds = function () {
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    this.v.forEach(function (v) {
      if (v.x < mn[0]) mn[0] = v.x; if (v.y < mn[1]) mn[1] = v.y; if (v.z < mn[2]) mn[2] = v.z;
      if (v.x > mx[0]) mx[0] = v.x; if (v.y > mx[1]) mx[1] = v.y; if (v.z > mx[2]) mx[2] = v.z;
    });
    if (mn[0] > mx[0]) { mn = [0, 0, 0]; mx = [0, 0, 0]; }
    return { mn: mn, mx: mx, size: [mx[0] - mn[0] + 1, mx[1] - mn[1] + 1, mx[2] - mn[2] + 1] };
  };

  /* ---------------- colour ---------------- */
  function hexRgb(h) {
    if (h.charAt(0) !== '#') return [128, 128, 128];
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function shade(h, f) {
    var c = hexRgb(h);
    return toHex(
      Math.max(0, Math.min(255, Math.round(c[0] * f))),
      Math.max(0, Math.min(255, Math.round(c[1] * f))),
      Math.max(0, Math.min(255, Math.round(c[2] * f)))
    );
  }
  function mixHex(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    return toHex(
      Math.round(A[0] + (B[0] - A[0]) * t),
      Math.round(A[1] + (B[1] - A[1]) * t),
      Math.round(A[2] + (B[2] - A[2]) * t)
    );
  }
  function addHex(h, r, g, b) {
    var c = hexRgb(h);
    return toHex(
      Math.max(0, Math.min(255, Math.round(c[0] + r))),
      Math.max(0, Math.min(255, Math.round(c[1] + g))),
      Math.max(0, Math.min(255, Math.round(c[2] + b)))
    );
  }
  function hash(x, y, z) {
    var h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return h - Math.floor(h);
  }
  /* Material helper. Per-voxel random colour reads as confetti at small sizes,
     so variation is applied per *plank* — one course of a face — which is how a
     built object actually varies. `axis` picks the direction the planks run. */
  function grain(x, y, z, pal, axis) {
    var k;
    if (axis === 'y') k = y;
    else if (axis === 'x') k = Math.floor(x / 3);
    else if (axis === 'z') k = Math.floor(z / 3);
    else k = y;                              // default: horizontal courses
    var n = hash(k * 7.31, 1.7, 3.73);
    var i = Math.floor(n * pal.length);
    if (i >= pal.length) i = pal.length - 1;
    return pal[i];
  }

  /* ---------------- lighting ---------------- */
  var KEY = norm([0.62, 0.86, 0.36]);       // key light dir (toward light)
  var FILL = norm([-0.7, 0.18, -0.55]);      // cool fill from behind-left
  var RIMD = norm([-0.35, 0.55, -0.75]);     // rim from behind

  function norm(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /* ---------------- renderer ---------------- */
  var AOLUT = [1.0, 0.90, 0.78, 0.64];
  var ISO_Y = 0.92;

  function render(model, canvas, opt) {
    opt = opt || {};
    if (model && model.kind === 'badge') return renderBadge(model, canvas, opt);
    var vox = (model instanceof Vox) ? model : (model.vox || model);
    if (!vox || !vox.v) throw new Error('no voxels');
    var px = opt.size || 260;
    var dpr = opt.dpr || Math.min(2.5, Math.max(1.5, global.devicePixelRatio || 1));
    var fill = opt.fill || 0.95;
    var b = vox.bounds();
    var has = vox.has.bind(vox);

    canvas.width = Math.round(px * dpr);
    canvas.height = Math.round(px * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.lineJoin = 'round';

    // ---- camera ----
    var midX = (b.mn[0] + b.mx[0] + 1) / 2, midZ = (b.mn[2] + b.mx[2] + 1) / 2;
    var midY = (b.mn[1] + b.mx[1] + 1) / 2;
    var spanW = (b.size[0] + b.size[2]);
    var spanH = (b.size[0] + b.size[2]) * 0.5 + b.size[1] * ISO_Y;
    var hw = Math.min((px * fill) / spanW, (px * fill) / spanH);
    var ox = px / 2;
    var oy = px / 2 + (opt.yOff || 0) * px;

    function P(x, y, z) {
      return [
        ox + ((x - midX) - (z - midZ)) * hw,
        oy + ((x - midX) + (z - midZ)) * hw * 0.5 - (y - midY) * hw * ISO_Y
      ];
    }

    var faces = [];
    var NORMALS = { top: [0, 1, 0], right: [1, 0, 0], left: [0, 0, 1] };

    // For each face kind, the neighbouring *voxel* across each of the four
    // edges, in corner order. An edge is silhouette when that neighbour is
    // absent — i.e. no coplanar face continues past it. Offsets are relative
    // to the voxel, not to the face plane.
    var EDGE_NB = {
      top: [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]],
      right: [[0, 0, -1], [0, 1, 0], [0, 0, 1], [0, -1, 0]],
      left: [[0, -1, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0]]
    };

    function outline(x, y, z, kind) {
      var nb = EDGE_NB[kind], out = [];
      for (var e = 0; e < 4; e++) {
        out.push(!has(x + nb[e][0], y + nb[e][1], z + nb[e][2]));
      }
      return out;
    }

    function pushFace(pts, ao, col, kind, depth, x, y, z) {
      faces.push({
        p: pts, ao: ao, col: col, kind: kind,
        out: outline(x, y, z, kind),
        d: depth * 3 + (kind === 'left' ? 0 : kind === 'right' ? 1 : 2)
      });
    }

    vox.v.forEach(function (v) {
      var x = v.x, y = v.y, z = v.z, col = v.c;

      if (!has(x, y + 1, z)) {
        var a = [], ao = [], cs = [[0, 0], [1, 0], [1, 1], [0, 1]];
        for (var i = 0; i < 4; i++) {
          var dx = cs[i][0], dz = cs[i][1];
          a.push(P(x + dx, y + 1, z + dz));
          var nx = dx ? 1 : -1, nz = dz ? 1 : -1;
          var s1 = has(x + nx, y + 1, z) ? 1 : 0;
          var s2 = has(x, y + 1, z + nz) ? 1 : 0;
          var cr = has(x + nx, y + 1, z + nz) ? 1 : 0;
          ao.push((s1 && s2) ? 3 : (s1 + s2 + cr));
        }
        pushFace(a, ao, col, 'top', x + y + z, x, y, z);
      }
      if (!has(x + 1, y, z)) {
        var a2 = [], ao2 = [], cs2 = [[0, 0], [0, 1], [1, 1], [1, 0]];
        for (var j = 0; j < 4; j++) {
          var dy = cs2[j][0], dz2 = cs2[j][1];
          a2.push(P(x + 1, y + dy, z + dz2));
          var ny = dy ? 1 : -1, nz2 = dz2 ? 1 : -1;
          var s1b = has(x + 1, y + ny, z) ? 1 : 0;
          var s2b = has(x + 1, y, z + nz2) ? 1 : 0;
          var crb = has(x + 1, y + ny, z + nz2) ? 1 : 0;
          ao2.push((s1b && s2b) ? 3 : (s1b + s2b + crb));
        }
        pushFace(a2, ao2, col, 'right', x + y + z, x, y, z);
      }
      if (!has(x, y, z + 1)) {
        var a3 = [], ao3 = [], cs3 = [[0, 0], [1, 0], [1, 1], [0, 1]];
        for (var k = 0; k < 4; k++) {
          var dx3 = cs3[k][0], dy3 = cs3[k][1];
          a3.push(P(x + dx3, y + dy3, z + 1));
          var nx3 = dx3 ? 1 : -1, ny3 = dy3 ? 1 : -1;
          var s1c = has(x + nx3, y, z + 1) ? 1 : 0;
          var s2c = has(x, y + ny3, z + 1) ? 1 : 0;
          var crc = has(x + nx3, y + ny3, z + 1) ? 1 : 0;
          ao3.push((s1c && s2c) ? 3 : (s1c + s2c + crc));
        }
        pushFace(a3, ao3, col, 'left', x + y + z, x, y, z);
      }
    });

    faces.sort(function (A, B) { return A.d - B.d; });

    var em = vox.emissive || model.emissive || {};
    var glow = opt.glow !== false;

    // ---- ground contact shadow ----
    if (opt.shadow !== false) {
      var baseY = P(midX, b.mn[1], midZ)[1] + hw * 0.10;
      var rad = Math.max(b.size[0], b.size[2]) * hw * 0.80;
      var g = ctx.createRadialGradient(ox, baseY, 0, ox, baseY, rad);
      g.addColorStop(0, 'rgba(0,0,0,0.72)');
      g.addColorStop(0.36, 'rgba(0,0,0,0.30)');
      g.addColorStop(0.72, 'rgba(0,0,0,0.07)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(ox, baseY); ctx.scale(1, 0.30); ctx.translate(-ox, -baseY);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ox, baseY, rad, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    // ---- emissive bloom underlay ----
    if (glow) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(' + Math.max(5, px * 0.032) + 'px)';
      ctx.globalAlpha = 0.7;
      faces.forEach(function (fa) {
        var gc = em[fa.col];
        if (!gc) return;
        ctx.fillStyle = gc;
        ctx.beginPath();
        ctx.moveTo(fa.p[0][0], fa.p[0][1]);
        for (var i = 1; i < 4; i++) ctx.lineTo(fa.p[i][0], fa.p[i][1]);
        ctx.closePath(); ctx.fill();
      });
      ctx.restore();
    }

    // ---- main face pass ----
    // NB: strokes are limited to silhouette edges. Stroking every quad draws a
    // mesh over every flat surface, which is what made the earlier models look
    // quilted rather than carved.
    faces.forEach(function (fa) {
      var p = fa.p, ao = fa.ao;
      var base = fa.col;
      var emissive = em[base];
      var n = NORMALS[fa.kind];
      var avg = (AOLUT[ao[0]] + AOLUT[ao[1]] + AOLUT[ao[2]] + AOLUT[ao[3]]) / 4;  // 1 = open, lower = enclosed

      var kd = Math.max(0, dot(n, KEY));
      var sd = 0.5 + 0.5 * n[1];
      var fd = Math.max(0, dot(n, FILL));
      var rd = Math.max(0, dot(n, RIMD));

      // key + sky + fill, then AO occlusion
      var lum = 0.26 + 0.58 * kd + 0.12 * sd + 0.06 * fd;
      lum *= 0.74 + 0.26 * avg;
      var col = emissive ? shade(emissive, 0.92 + 0.12 * kd) : shade(base, lum);

      if (!emissive) {
        // warm key tint on lit faces, cool bounce in shadow
        col = mixHex(col, '#ffd9a8', 0.05 * kd);
        col = mixHex(col, '#56709e', 0.05 * (1 - sd) * 0.6 + 0.028 * fd);
        if (rd > 0.25 && fa.kind !== 'top') {
          col = mixHex(col, '#cfe4ff', 0.09 * Math.min(1, rd));
        }
        // gentle bounce light rising from the ground plane
        if (fa.kind !== 'top') {
          var bounce = 0.035 * (1 - avg);
          col = mixHex(col, '#b98a52', bounce);
        }
      }

      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      // Close the hairline an antialiased shared edge would otherwise leave.
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.stroke();

      // soft AO gradient toward the darkest corner
      var darkIdx = 0, darkVal = -1;
      for (var q = 0; q < 4; q++) if (ao[q] > darkVal) { darkVal = ao[q]; darkIdx = q; }
      if (darkVal >= 2 && !emissive) {
        ctx.save();
        ctx.clip();
        var dx = p[darkIdx][0], dy = p[darkIdx][1];
        var gr = ctx.createRadialGradient(dx, dy, 0, dx, dy, hw * 2.0);
        gr.addColorStop(0, 'rgba(0,0,0,0.22)');
        gr.addColorStop(0.55, 'rgba(0,0,0,0.07)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, px, px);
        ctx.restore();
      }

      // silhouette-only outline: an edge is drawn when the neighbouring voxel
      // in that direction has no coplanar face of its own
      if (opt.edges !== false && fa.out) {
        ctx.beginPath();
        var drew = false;
        for (var e = 0; e < 4; e++) {
          if (!fa.out[e]) continue;
          var a0 = p[e], a1 = p[(e + 1) % 4];
          ctx.moveTo(a0[0], a0[1]);
          ctx.lineTo(a1[0], a1[1]);
          drew = true;
        }
        if (drew) {
          ctx.strokeStyle = 'rgba(4,6,10,0.34)';
          ctx.lineWidth = Math.max(0.9, hw * 0.085);
          ctx.stroke();
        }
      }
    });

    return canvas;
  }

  /* ================= MODELS ================= */

  /* ---------- crest: flat heraldic badge, pixel-crisp ----------
     Drawn screen-aligned (not isometric) - a badge reads better flat,
     and it gives the product grid a second visual language.          */
  function badge(o) {
    o = o || {};
    var RIM = o.rim || '#E6B03C';
    var RIM_D = shade(RIM, 0.50);
    var RIM_L = mixHex(RIM, '#ffffff', 0.50);
    var FACE = o.face || '#9B3140';
    var FACE_D = shade(FACE, 0.66);
    var FACE_L = mixHex(FACE, '#ffffff', 0.16);
    var GEM = o.gem || '#5CD8EA';
    var PRONGS = o.prongs === undefined ? 3 : o.prongs;

    /* A heraldic shield, not a rounded rectangle. The silhouette is the whole
       read: flat top, near-vertical sides for the upper third, then a hard
       curve into a point at the bottom.                              */
    var GW = 19, GH = 23, CX = 9;
    var grid = [], rimSet = [];

    function halfAt(y) {
      // y: 0 at top. A heater shield: straight sides, then a curve that stays
      // wide until it turns in sharply. A linear power curve looks like a cone.
      if (y <= 7) return 9;
      var t = (y - 7) / (GH - 7);            // 0..1 over the lower two thirds
      return Math.max(0, 9 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.9)), 0.58));
    }

    for (var y = 0; y < GH; y++) {
      grid[y] = []; rimSet[y] = [];
      var half = halfAt(y);
      for (var x = 0; x < GW; x++) {
        var dx = Math.abs(x - CX);
        if (dx > half) { grid[y][x] = null; rimSet[y][x] = false; continue; }
        // rim thickness follows the silhouette so it never swallows the point
        var rimW = half < 3 ? 0.9 : 1.7;
        var isRim = dx > half - rimW || y === 0 || y >= GH - 2;
        grid[y][x] = isRim ? RIM : FACE;
        rimSet[y][x] = isRim;
      }
    }

    // engraved line inside the rim
    for (var y2 = 2; y2 < GH - 3; y2++) {
      var h2 = halfAt(y2) - 1.7;
      if (h2 < 1.4) continue;
      for (var x2 = 0; x2 < GW; x2++) {
        var d2 = Math.abs(x2 - CX);
        if (d2 >= h2 - 1.0 && d2 <= h2) grid[y2][x2] = FACE_D;
      }
    }

    /* Gem: a proper faceted lozenge. Lit from the upper left, so the top-left
       quadrant is the highlight, the bottom-right is the shadow. The previous
       version shaded by ring index, which produced a symmetric blob that read
       as a cross.                                                     */
    var gy = 11;
    var shape = [
      [0, -4],
      [-1, -3], [0, -3], [1, -3],
      [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
      [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
      [-2, 0,], [-1, 0], [0, 0], [1, 0], [2, 0],
      [-1, 1], [0, 1], [1, 1],
      [0, 2]
    ];
    shape.forEach(function (p) {
      var px = CX + p[0], py = gy + p[1];
      if (py < 0 || py >= GH || px < 0 || px >= GW) return;
      if (!grid[py][px]) return;
      // directional shading: relative to the gem centre, lit from top-left
      var u = p[0] / 2, vv = p[1] / 4;
      var shadeT = (-u * 0.5 - vv * 0.62 + 0.46);
      var c = mixHex(shade(GEM, 0.44), mixHex(GEM, '#ffffff', 0.30), Math.max(0, Math.min(1, shadeT)));
      // crisp facet split down the centre line
      if (p[0] === 0 && p[1] <= 0) c = mixHex(c, '#ffffff', 0.18);
      if (Math.abs(p[0]) === 2 || p[1] === -4 || p[1] === 2) c = shade(c, 0.88);
      grid[py][px] = c;
    });

    // Collect every colour the gem actually painted. The renderer decides
    // emissive-vs-lit by exact colour match, so listing only the base GEM
    // meant all the facet tones were treated as lit material and flattened.
    var gemTones = [];
    shape.forEach(function (p) {
      var px = CX + p[0], py = gy + p[1];
      if (py < 0 || py >= GH || px < 0 || px >= GW) return;
      var cc = grid[py][px];
      if (cc && cc !== FACE && cc !== FACE_D && cc !== RIM && cc !== RIM_D && gemTones.indexOf(cc) < 0) gemTones.push(cc);
    });

    // gold setting around the gem
    for (var sy = -5; sy <= 3; sy++) {
      for (var sx = -3; sx <= 3; sx++) {
        var py2 = gy + sy, px2 = CX + sx;
        if (py2 < 0 || py2 >= GH || px2 < 0 || px2 >= GW) continue;
        if (!grid[py2][px2]) continue;
        var onShape = shape.some(function (p) { return p[0] === sx && p[1] === sy; });
        if (onShape) continue;
        // only the ring immediately around the gem
        var near = shape.some(function (p) {
          return Math.abs(p[0] - sx) <= 1 && Math.abs(p[1] - sy) <= 1;
        });
        if (near) grid[py2][px2] = RIM_D;
      }
    }

    // crown: a solid three-point band, never floating
    if (PRONGS !== 0) {
      var crown = [];
      var pts = PRONGS === 5 ? [3, 6, 9, 12, 15] : PRONGS === 2 ? [5, 13] : [4, 9, 14];
      // base band spanning the shield top
      for (var cb = 3; cb <= 15; cb++) {
        crown.push([cb, -1, RIM]);
        crown.push([cb, -2, shade(RIM, 0.82)]);
      }
      pts.forEach(function (px4, i) {
        var mid = i === Math.floor(pts.length / 2);
        var h4 = mid ? 4 : 3;
        for (var k = 3; k <= 2 + h4; k++) {
          var isTop = k === 2 + h4;
          var yy = -k;
          crown.push([px4, yy, isTop ? (o.tip || GEM) : RIM]);
          if (!isTop) {
            crown.push([px4 - 1, yy, shade(RIM, 0.86)]);
            crown.push([px4 + 1, yy, shade(RIM, 0.72)]);
          }
        }
      });
      return { kind: 'badge', grid: grid, crown: crown, rimSet: rimSet, gw: GW, gh: GH,
        height: crestHeights(o),
        colors: { RIM: RIM, RIM_D: RIM_D, RIM_L: RIM_L, FACE: FACE, FACE_D: FACE_D, FACE_L: FACE_L, GEM: GEM },
        emissive: gemTones.concat([o.tip]) };
    }
    return { kind: 'badge', grid: grid, crown: [], rimSet: rimSet, gw: GW, gh: GH,
      height: crestHeights(o),
      colors: { RIM: RIM, RIM_D: RIM_D, RIM_L: RIM_L, FACE: FACE, FACE_D: FACE_D, FACE_L: FACE_L, GEM: GEM },
      emissive: gemTones };
  }

  /* ============================================================
     Rank items: one unique object per tier.

     Shields and medals both made all five ranks look like the same thing in
     different colours, which is the opposite of what a ladder should do. Each
     tier is now its own object, escalating in grandeur:

        I   Squire   a plain helm
        II  Knight   a sword
        III Lord     a banner
        IV  King     a crown
        V   Emperor  a sceptre and orb

     They share the pixel-heightmap renderer, so they are lit by the same rig
     as the crates and the booster — one set, five silhouettes.
     ============================================================ */

  /* ============================================================
     Rank items.

     One unique object per tier, drawn with the Sprite helper so each is
     authored from geometry at 2x the old resolution. Hand-written ASCII grids
     capped detail at whatever fitted in 16 rows, which is why the ranks read as
     fuzzy blobs at card size while the crate and potion read cleanly.

        I   Squire   an open helm
        II  Knight   a longsword
        III Lord     a banner
        IV  King     a jewelled crown
        V   Emperor  a peaked crown over an orb
     ============================================================ */
  /* ============================================================
     Rank items.

     Design rule learned the hard way: at 150px in a card, an icon must be a
     near-square SOLID MASS with multi-tone shading. Thin silhouettes — a 1px
     sword blade, a flat flag, a wide low crown — leave most of the frame empty
     and read as clip art. The Squire helm worked because it is a filled,
     rounded, shaded object; every other tier is now built to that same weight.

        I   Squire   bascinet helm
        II  Knight   heavy longsword, broad blade
        III Lord     hanging banner, thick folds
        IV  King     tall crown, domed cap
        V   Emperor  crown over orb, tightly grouped
     ============================================================ */
  var RANK_BUILD = {
    squire: function () {
      var s = new Sprite(40, 42);
      var ST = '#9FAABC', ST_L = '#E2EAF5', ST_M = '#77828F', ST_D = '#3C4554';
      var DARK = '#0C121B', GOLD = '#B9A46A';
      var TOPY = 3, BOTY = 33, CXh = 20;
      for (var y = TOPY; y <= BOTY; y++) {
        var t = (y - TOPY) / (BOTY - TOPY);
        var half;
        if (t < 0.40) half = 3 + (t / 0.40) * 11.5;
        else if (t < 0.52) half = 14.5;
        else half = 13.4 - (t - 0.52) * 1.4;
        for (var x = Math.round(CXh - half); x <= Math.round(CXh + half); x++) {
          var dx = (x - CXh) / (half || 1);
          var c;
          if (dx > 0.78) c = ST_M;
          else if (dx < -0.45) c = ST_L;
          else c = ST;
          if (t < 0.10) c = ST_M;
          s.set(x, y, c);
        }
      }
      s.rect(6, 17, 34, 17, ST_D);
      s.rect(10, 19, 18, 21, DARK);
      s.rect(22, 19, 30, 21, DARK);
      s.rect(10, 20, 30, 20, '#161E2A');
      s.rect(19, 18, 21, 25, ST_M);
      s.rect(20, 18, 20, 25, ST_L);
      [24, 26, 28].forEach(function (yy) {
        s.set(14, yy, DARK); s.set(17, yy, DARK);
        s.set(23, yy, DARK); s.set(26, yy, DARK);
      });
      s.rect(5, 34, 35, 36, ST_M);
      s.rect(4, 37, 36, 38, ST_D);
      [9, 20, 31].forEach(function (rx) { s.set(rx, 16, GOLD); });
      s.outline(DARK);
      return s;
    },

    /* Knight: a HEAVY sword. The old one had a 1px blade which vanished at card
       size. This is a broad blade with a visible bevel, a wide crossguard, a
       thick wrapped grip and a large pommel — a solid vertical mass. */
    knight: function () {
      var s = new Sprite(40, 52);
      var B = '#C9DAEC', B_L = '#F6FAFF', B_M = '#A8BED6', B_D = '#7C93AE';
      var G = '#EFC155', G_L = '#FFE9A8', G_M = '#C99A22', G_D = '#8E6A12';
      var W = '#6E411C', W_L = '#92592A', W_D = '#4A2A10';
      var DARK = '#0C121B';

      // blade: 9 wide with a light edge and a shadow edge
      var BX0 = 14, BX1 = 26, BY0 = 3, BY1 = 31;
      for (var y = BY0; y <= BY1; y++) {
        for (var x = BX0; x <= BX1; x++) {
          var c = B;
          if (x === BX0) c = B_M;
          else if (x === BX1) c = B_D;
          else if (x === BX0 + 1) c = B_L;
          else if (x === BX0 + 2) c = B_L;
          else if (x === BX1 - 1) c = B_M;
          // fuller down the centre
          if (x >= 19 && x <= 21) c = B_M;
          s.set(x, y, c);
        }
      }
      // taper to a point
      for (var k = 0; k < 5; k++) {
        var w = 4 - k;
        for (var o = -w; o <= w; o++) s.set(20 + o, BY0 - 1 - k, k > 2 ? B_M : B_L);
      }
      // ricasso shading near the guard
      s.rect(14, 27, 26, 30, B_M);

      // crossguard: wide, thick, flared ends
      s.rect(5, 32, 35, 36, G);
      s.rect(5, 32, 35, 33, G_L);
      s.rect(5, 36, 35, 36, G_M);
      s.rect(5, 32, 7, 37, G_M);
      s.rect(33, 32, 35, 37, G_M);
      s.rect(8, 37, 10, 37, G_D);
      s.rect(30, 37, 32, 37, G_D);

      // grip
      s.rect(17, 37, 23, 45, W);
      s.rect(17, 37, 18, 45, W_L);
      s.rect(22, 37, 23, 45, W_D);
      for (var gy = 38; gy <= 44; gy += 2) s.rect(17, gy, 23, gy, W_D);

      // pommel: a big flared block
      s.rect(15, 46, 25, 50, G);
      s.rect(15, 46, 25, 47, G_L);
      s.rect(15, 50, 25, 50, G_D);
      s.rect(18, 47, 22, 49, G_M);

      s.outline(DARK);
      return s;
    },

    /* III - Lord: a jewelled chalice.
       Eight drawings failed before I changed the object class rather than
       redrawing it again.

       Banner, axe, hammer, two double-bit axes and a halberd are very
       different things, but every one puts a wide shape at the top of a thin
       shaft - and that is the silhouette of a flag. Symmetry made it a bow
       tie; a shaft continuing above the head made it a pennant. The structure
       was the problem, not the draughtsmanship.

       A chalice has no shaft and is a filled, symmetric, near-square mass -
       the formula that worked for the Squire helm. It is also violet enamel
       rather than gold, because a gold cup sitting between a gold crown and a
       gold throne repeats the "same thing in different colours" failure. The
       rank tint for Lord is violet, so the material matches the tier. */
    lord: function () {
      var s = new Sprite(52, 56);
      var V = '#6E3FA6', V_L = '#B08AE0', V_M = '#522E7E', V_D = '#341A52', V_X = '#1E0F33';
      var G = '#F1C34C', G_L = '#FFEFC2', G_M = '#D8A62E', G_D = '#9A7214', G_X = '#6B4E0C';
      var C = '#7FE6F5', C_L = '#DFFDFF';
      var DARK = '#160B26';
      var CX = 26;
      var RIM = 5, BOT = 25, RIMHW = 15;

      /* ---- cup: elliptical rim opening onto a tapering bowl ---- */
      for (var y = RIM; y <= BOT; y++) {
        var t = (y - RIM) / (BOT - RIM);
        var hw = 3.2 + (RIMHW - 3.2) * Math.pow(1 - t, 0.58);
        for (var x = Math.round(CX - hw); x <= Math.round(CX + hw); x++) {
          var u = (x - CX) / (hw || 1);
          var c;
          if (u < -0.66) c = V_L;
          else if (u < -0.20) c = V;
          else if (u < 0.26) c = V_M;
          else if (u < 0.66) c = V_D;
          else c = V_X;
          /* polished enamel: a narrow specular streak left of centre */
          if (u > -0.52 && u < -0.40 && t > 0.16 && t < 0.80) c = mixHex(V_L, '#ffffff', 0.34);
          /* rounded underside of the bowl falls into shadow */
          if (t > 0.84) c = shade(c, 0.80);
          s.set(x, y, c);
        }
      }

      /* ---- opening: dark interior, so the cup is visibly hollow ---- */
      for (var oy = -2; oy <= 2; oy++) {
        var ohw = Math.round(13.6 * Math.sqrt(Math.max(0, 1 - Math.pow(oy / 3.2, 2))));
        for (var ox = -ohw; ox <= ohw; ox++) {
          var oc = oy === -2 ? V_X : (oy <= 0 ? '#0F0720' : '#1A0D2E');
          s.set(CX + ox, RIM + oy, oc);
        }
      }

      /* ---- gold rim: an ellipse, brightest at the top left ---- */
      for (var lx = -RIMHW; lx <= RIMHW; lx++) {
        var rr = lx / RIMHW;
        var dy = Math.round(Math.pow(rr, 2) * 2.6);
        if (Math.abs(rr) > 0.99) continue;
        s.set(CX + lx, RIM - 2 + dy, lx < -2 ? G_L : G);
        s.set(CX + lx, RIM + 3, lx < 0 ? G_M : G_D);
        if (Math.abs(rr) > 0.86) {
          s.set(CX + lx, RIM - 1 + dy, G_L);
          s.set(CX + lx, RIM + 2, G);
        }
      }

      /* ---- gold band round the belly, with three cyan gems ---- */
      for (var bx = -13; bx <= 13; bx++) {
        var frac = Math.abs(bx) / 13;
        if (frac > 0.97) continue;
        var by = BOT - 8 + Math.round(Math.pow(frac, 2) * 3.2);
        s.set(CX + bx, by, bx < 0 ? G_L : G_M);
        s.set(CX + bx, by + 1, G_D);
      }
      [-6, 0, 6].forEach(function (jx) {
        var jy = BOT - 7 + Math.round(Math.pow(Math.abs(jx) / 13, 2) * 3.2);
        s.set(CX + jx - 1, jy, C);
        s.set(CX + jx, jy, C_L);
        s.set(CX + jx + 1, jy, mixHex(C, V_X, 0.45));
      });

      /* ---- stem: a knop on a short gold shaft ---- */
      var SY0 = BOT + 1, SY1 = BOT + 11;
      for (var sy = SY0; sy <= SY1; sy++) {
        var st = (sy - SY0) / (SY1 - SY0);
        var shw = 2.2 + 3.0 * Math.pow(Math.sin(Math.PI * st), 1.5);
        for (var sx = Math.round(CX - shw); sx <= Math.round(CX + shw); sx++) {
          var su = (sx - CX) / (shw || 1);
          var sc = su < -0.36 ? G_L : su < 0.26 ? G : su < 0.66 ? G_M : G_D;
          s.set(sx, sy, sc);
        }
      }
      /* ring around the knop, in violet to tie it to the cup */
      var KY = BOT + 6;
      for (var kx = -4; kx <= 4; kx++) {
        var kh = 3.2 * Math.sqrt(Math.max(0, 1 - Math.pow(kx / 4.6, 2)));
        if (Math.abs(kx) > kh) continue;
        s.set(CX + kx, KY, kx < 0 ? V_L : V_M);
        s.set(CX + kx, KY + 1, V_D);
      }

      /* ---- foot: flares wide so the object is bottom-heavy and stable ---- */
      var FY0 = BOT + 12, FY1 = 49;
      for (var fy = FY0; fy <= FY1; fy++) {
        var ft = (fy - FY0) / (FY1 - FY0);
        var fhw = 3 + 11.5 * Math.pow(ft, 0.58);
        for (var fx = Math.round(CX - fhw); fx <= Math.round(CX + fhw); fx++) {
          var fu = (fx - CX) / (fhw || 1);
          var fc;
          if (fu < -0.54) fc = G_L;
          else if (fu < -0.02) fc = G;
          else if (fu < 0.44) fc = G_M;
          else fc = G_D;
          if (fy === FY1) fc = fu > 0.30 ? G_X : G_D;
          else if (fy === FY0) fc = shade(fc, 0.84);
          s.set(fx, fy, fc);
        }
      }
      /* base lip */
      s.rect(CX - 15, FY1 + 1, CX + 15, FY1 + 2, G_M);
      s.rect(CX - 15, FY1 + 1, CX + 15, FY1 + 1, G_L);
      s.rect(CX - 15, FY1 + 2, CX + 15, FY1 + 2, G_X);

      s.outline(DARK);
      return s;
    },

    /* IV - King: an open crown over a velvet cap.
       The comb problem was proportion, not colour. Earlier crowns had points
       twice as tall as the band, so they read as fence pickets - and the dark
       spaces between them read as holes rather than as cloth. Here the band is
       the dominant mass, the points are short and wide, and the cap behind
       them is lit velvet, so the notches are shallow and material, not gaps. */
    king: function () {
      var s = new Sprite(50, 44);
      var G = '#F1C34C', G_L = '#FFEBAD', G_M = '#C99A22', G_D = '#8E6A12', G_X = '#6B4E0C';
      var V = '#8E1F33', V_L = '#C04058', V_M = '#6E1526', V_D = '#4A0C18';
      var R = '#D2394F', R_L = '#FF9AAA';
      var DARK = '#2A1C05';
      var B0 = 27, B1 = 37;

      /* ---- velvet cap: a shallow arc, lit from the upper left so it reads as
         a surface rather than as a hole between the points ---- */
      for (var x = 5; x <= 45; x++) {
        var u = (x - 5) / 40;
        var top = 17 + Math.round(Math.pow(u - 0.5, 2) * 26);
        for (var y = top; y < B0; y++) {
          var c;
          if (y === top) c = V_L;
          else if (y < top + 3) c = V_L;
          else if (u > 0.62) c = V_M;
          else if (u < 0.16) c = V_M;
          else c = V;
          if (y > B0 - 3) c = V_D;
          s.set(x, y, c);
        }
      }

      /* ---- five short points: wide at the base, flat-topped, jewel-capped ---- */
      var P = [[8, 15], [17, 11], [25, 8], [33, 11], [42, 15]];
      P.forEach(function (p) {
        var px = p[0], ty = p[1];
        for (var y = ty; y < B0; y++) {
          var t = (y - ty) / (B0 - ty);
          var w = Math.round(2.4 + 2.4 * Math.pow(t, 0.7));
          for (var o = -w; o <= w; o++) {
            var c = G;
            if (o <= -w + 1) c = G_L;
            else if (o >= w - 1) c = G_M;
            s.set(px + o, y, c);
          }
        }
        /* flat top with a jewel set into it */
        s.rect(px - 2, ty, px + 2, ty, G_L);
        s.rect(px - 1, ty - 2, px + 1, ty - 1, R);
        s.set(px - 1, ty - 2, R_L);
      });

      /* ---- band: the dominant mass ---- */
      s.rect(3, B0, 47, B1, G);
      s.rect(3, B0, 47, B0, G_L);
      s.rect(3, B0 + 1, 47, B0 + 1, mixHex(G, '#ffffff', 0.16));
      s.rect(3, B1 - 1, 47, B1, G_M);
      s.rect(3, B1, 47, B1, G_D);
      /* engraved beading along the band */
      for (var bx = 6; bx <= 44; bx += 4) {
        s.set(bx, B0 + 4, G_D);
        s.set(bx + 1, B0 + 4, G_L);
      }

      /* ---- three cut jewels, faceted ---- */
      [12, 25, 38].forEach(function (jx) {
        for (var jy = B0 + 6; jy <= B0 + 9; jy++) {
          for (var jx2 = jx - 4; jx2 <= jx + 4; jx2++) {
            var d = Math.abs(jx2 - jx) + Math.abs(jy - (B0 + 7.5));
            if (d > 4) continue;
            var jc = R;
            if (jy <= B0 + 6) jc = R_L;
            else if (jy >= B0 + 9) jc = shade(R, 0.66);
            else if (jx2 < jx) jc = mixHex(R, '#ffffff', 0.14);
            else if (jx2 > jx) jc = shade(R, 0.82);
            s.set(jx2, jy, jc);
          }
        }
      });

      /* ---- lower rim, slightly proud so the crown has a footing ---- */
      s.rect(2, B1 + 1, 48, B1 + 3, G_M);
      s.rect(2, B1 + 1, 48, B1 + 1, G_L);
      s.rect(2, B1 + 3, 48, B1 + 3, G_X);

      s.outline(DARK);
      return s;
    },

    /* V - Emperor: a throne.
       Two crowns in a row would read as one crown twice, and the crown-over-orb
       read as a bowl. A throne is the seat of rule rather than its symbol, so
       the ladder ends on a different object entirely.

       The first attempt had transparent gaps between the arm posts and the
       seat. On a light card those gaps are page background, so the throne read
       as a bus with windows. Every row below is filled before it is detailed. */
    emperor: function () {
      var s = new Sprite(52, 56);
      var G = '#F1C34C', G_L = '#FFEBAD', G_M = '#C99A22', G_D = '#8E6A12', G_X = '#6B4E0C';
      var V = '#8E1F33', V_L = '#C04058', V_M = '#6E1526', V_D = '#4A0C18';
      var R = '#D2394F', R_L = '#FF9AAA';
      var DARK = '#2A1C05';

      /* ---- SOLID MASS FIRST: the whole seat block, no holes ---- */
      s.rect(3, 8, 49, 45, G);
      /* ---- backrest, inset into the mass ---- */
      s.rect(9, 10, 43, 30, V);
      /* frame edges of the backrest */
      s.rect(9, 10, 43, 11, G_L);
      s.rect(9, 12, 43, 12, mixHex(G, '#ffffff', 0.2));
      s.rect(7, 8, 45, 9, G_L);
      s.rect(7, 31, 45, 31, G_M);
      s.rect(9, 32, 43, 32, G_D);

      /* velvet shading: lit upper left, deep shadow at the base */
      for (var vy = 13; vy <= 29; vy++) {
        for (var vx = 10; vx <= 42; vx++) {
          var u = (vx - 10) / 32;
          var c = V;
          if (vy < 16) c = V_L;
          else if (u > 0.64) c = V_M;
          else if (u < 0.14) c = V_M;
          else if (u > 0.44 && u < 0.56) c = V_L;
          if (vy > 26) c = V_D;
          s.set(vx, vy, c);
        }
      }

      /* ---- crown crest on the backrest ---- */
      var EX = 26, EY = 18;
      s.rect(EX - 7, EY + 2, EX + 7, EY + 6, G);
      s.rect(EX - 7, EY + 2, EX + 7, EY + 2, G_L);
      s.rect(EX - 7, EY + 6, EX + 7, EY + 6, G_D);
      [-6, 0, 6].forEach(function (ox, i) {
        var px = EX + ox;
        for (var k = 0; k <= 4; k++) {
          var w = k < 2 ? 2 : 1;
          s.rect(px - w, EY - 3 + k, px + w, EY - 3 + k, k === 0 ? G_L : G);
        }
        s.set(px, EY - 4, G_L);
      });
      [-4, 0, 4].forEach(function (ox) { s.set(EX + ox, EY + 4, R); });

      /* ---- finials on the top corners ---- */
      [[9, 8], [43, 8]].forEach(function (f) {
        s.rect(f[0] - 2, f[1] - 5, f[0] + 2, f[1] - 1, G);
        s.rect(f[0] - 2, f[1] - 5, f[0] + 2, f[1] - 5, G_L);
        s.set(f[0] - 1, f[1] - 6, G_L);
        s.set(f[0] + 1, f[1] - 6, G_M);
        s.set(f[0], f[1] - 7, R);
      });

      /* ---- armrests: solid caps meeting the backrest ---- */
      [3, 43].forEach(function (ax, ai) {
        s.rect(ax, 20, ax + 6, 24, G);
        s.rect(ax, 20, ax + 6, 20, G_L);
        s.rect(ax, 24, ax + 6, 24, G_M);
        /* padded top in velvet */
        s.rect(ax, 17, ax + 6, 19, V);
        s.rect(ax, 17, ax + 6, 17, V_L);
        s.rect(ax, 19, ax + 6, 19, V_M);
        /* solid support down to the plinth - no gap */
        s.rect(ax + 1, 25, ax + 5, 38, G);
        s.rect(ax + 1, 25, ax + 2, 38, G_L);
        s.rect(ax + 4, 25, ax + 5, 38, G_M);
      });

      /* ---- seat cushion ---- */
      s.rect(8, 33, 44, 38, V);
      s.rect(8, 33, 44, 34, V_L);
      s.rect(8, 38, 44, 38, V_D);
      for (var sx = 10; sx <= 42; sx += 5) s.set(sx, 36, shade(V, 0.86));

      /* ---- plinth: two solid steps, no legs ---- */
      s.rect(3, 39, 49, 42, G);
      s.rect(3, 39, 49, 39, G_L);
      s.rect(3, 42, 49, 42, G_D);
      s.rect(1, 43, 51, 46, G_M);
      s.rect(1, 43, 51, 43, G_L);
      s.rect(1, 46, 51, 46, G_X);
      /* carved notches along the plinth face */
      for (var nx = 6; nx <= 46; nx += 7) {
        s.rect(nx, 44, nx + 2, 45, G_D);
        s.set(nx, 44, G_X);
      }

      s.outline(DARK);
      return s;
    }

  };


  function rankItem(id, o) {
    o = o || {};
    var build = RANK_BUILD[id] || RANK_BUILD.squire;
    return build().model([]);
  }

  /* ---------- pixel icon badges ----------
     Small items (shards, keys, tickets, chests) read better as crisp
     screen-aligned pixel icons than as tiny 3D volumes. Same visual
     language as the rank crest, so the shop reads as one set.        */
  function icon(rows, palette, o) {
    o = o || {};
    var h = rows.length, w = 0;
    rows.forEach(function (r) { if (r.length > w) w = r.length; });
    var grid = [], rim = [];
    for (var y = 0; y < h; y++) {
      grid[y] = []; rim[y] = [];
      for (var x = 0; x < w; x++) {
        var ch = rows[y].charAt(x) || '.';
        grid[y][x] = (ch === '.' || ch === ' ') ? null : (palette[ch] || null);
        rim[y][x] = false;
      }
    }
    var em = [];
    if (o.glowKeys) for (var i = 0; i < o.glowKeys.length; i++) {
      if (palette[o.glowKeys[i]]) em.push(palette[o.glowKeys[i]]);
    }
    return { kind: 'badge', grid: grid, crown: [], rimSet: rim, gw: w, gh: h,
      colors: {}, emissive: em, bevel: false };
  }

  /* render a badge model - screen aligned, pixel crisp */
  /* ============================================================
     Pixel sprite renderer with real depth.

     The previous version drew flat coloured squares with a 1px outline, which
     reads as a sticker. This treats the sprite as a height map: every cell has
     a height, a surface normal is derived from the surrounding heights, and the
     normal is lit by the same key/sky/fill rig as the voxel models. Height
     drops draw a visible side wall, so edges step back like carved relief.
     ============================================================ */
  var SPRITE_LIGHT = norm([-0.46, -0.58, 0.68]);   // key: upper-left, toward viewer
  var SPRITE_HALF = norm([-0.30, -0.38, 0.88]);    // for specular

  function renderBadge(model, canvas, opt) {
    opt = opt || {};
    var px = opt.size || 260;
    var dpr = opt.dpr || Math.min(2.5, Math.max(1.5, global.devicePixelRatio || 1));
    canvas.width = Math.round(px * dpr);
    canvas.height = Math.round(px * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, px, px);

    var gw = model.gw, gh = model.gh;
    var grid = model.grid;
    var em = model.emissive || [];

    // ---- height map ----
    // Explicit heights win. Where absent, derive a soft dome from the distance
    // to the silhouette edge, so shapes read as slightly rounded relief.
    var H = [];
    for (var y = 0; y < gh; y++) {
      H[y] = [];
      for (var x = 0; x < gw; x++) {
        if (!grid[y][x]) { H[y][x] = null; continue; }
        if (model.height && model.height[y] && model.height[y][x] != null) {
          H[y][x] = model.height[y][x];
        } else if (model.dome === false) {
          H[y][x] = 1;
        } else {
          var edgeDist = 3;
          var scan = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (var s = 0; s < 4; s++) {
            for (var d = 1; d <= 3; d++) {
              var nx2 = x + scan[s][0] * d, ny2 = y + scan[s][1] * d;
              if (nx2 < 0 || nx2 >= gw || ny2 < 0 || ny2 >= gh || !grid[ny2][nx2]) {
                edgeDist = Math.min(edgeDist, d - 1);
                break;
              }
            }
          }
          H[y][x] = 1 + Math.min(2, edgeDist);
        }
      }
    }

    function hAt(x, y) {
      if (x < 0 || x >= gw || y < 0 || y >= gh) return 0;
      return H[y][x] == null ? 0 : H[y][x];
    }

    // ---- framing ----
    var crown = model.crown || [];
    var topExtra = 0;
    crown.forEach(function (c) { if (c[1] < topExtra) topExtra = c[1]; });
    var totalH = gh + Math.abs(topExtra) + 2;
    var cell = Math.floor(Math.min(px * 0.88 / gw, px * 0.88 / totalH));
    var ox = Math.round((px - gw * cell) / 2);
    var oy = Math.round((px - totalH * cell) / 2 + Math.abs(topExtra) * cell);

    function R(x, y, col, dx, dy, w, h) {
      ctx.fillStyle = col;
      ctx.fillRect(
        Math.round(ox + x * cell + (dx || 0)),
        Math.round(oy + y * cell + (dy || 0)),
        Math.ceil((w || 1) * cell),
        Math.ceil((h || 1) * cell)
      );
    }

    // ---- drop shadow, offset like the voxel rig's contact shadow ----
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.filter = 'blur(' + Math.max(4, px * 0.03) + 'px)';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(px / 2 + cell * 0.5, oy + gh * cell + cell * 0.2,
      gw * cell * 0.36, cell * 1.1, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    // ---- pass 1: side walls ----
    // Where the cell to the right or below is lower (or empty), draw the wall.
    for (var wy = 0; wy < gh; wy++) {
      for (var wx = 0; wx < gw; wx++) {
        var hc = H[wy][wx];
        if (hc == null) continue;
        var base = grid[wy][wx];

        var hRight = hAt(wx + 1, wy);
        var hDown = hAt(wx, wy + 1);
        var dropR = Math.max(0, hc - hRight);
        var dropD = Math.max(0, hc - hDown);

        // right wall
        if (dropR > 0) {
          var wcol = shade(base, 0.52);
          R(wx, wy, wcol, cell - 1, 0, 1 / cell * dropR * cell / cell, 1);
          ctx.fillStyle = wcol;
          ctx.fillRect(Math.round(ox + (wx + 1) * cell - cell * 0.16),
            Math.round(oy + wy * cell + cell * 0.1),
            Math.ceil(cell * 0.16),
            Math.ceil(cell * 0.95));
        }
        // bottom wall
        if (dropD > 0) {
          var dcol = shade(base, 0.40);
          ctx.fillStyle = dcol;
          ctx.fillRect(Math.round(ox + wx * cell + cell * 0.06),
            Math.round(oy + (wy + 1) * cell - cell * 0.16),
            Math.ceil(cell * 0.94),
            Math.ceil(cell * 0.16));
        }
      }
    }

    // ---- pass 2: lit top faces ----
    for (var y2 = 0; y2 < gh; y2++) {
      for (var x2 = 0; x2 < gw; x2++) {
        var c2 = grid[y2][x2];
        if (!c2) continue;
        var h2 = H[y2][x2];

        // normal from the height field
        var nx = (hAt(x2 - 1, y2) - hAt(x2 + 1, y2)) * 0.55;
        var ny = (hAt(x2, y2 - 1) - hAt(x2, y2 + 1)) * 0.55;
        var nz = 1.0;
        var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;

        var kd = Math.max(0, nx * SPRITE_LIGHT[0] + ny * SPRITE_LIGHT[1] + nz * SPRITE_LIGHT[2]);
        var spec = Math.pow(kd, 22) * 0.5;

        // ambient occlusion: neighbours that are taller darken this cell
        var aoN = 0, aoC = 0;
        var nb = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (var q = 0; q < nb.length; q++) {
          var nnx = x2 + nb[q][0], nny = y2 + nb[q][1];
          if (nnx < 0 || nnx >= gw || nny < 0 || nny >= gh) continue;
          aoC++;
          if (hAt(nnx, nny) > h2) aoN++;
        }
        var ao = 1 - (aoC ? (aoN / aoC) * 0.20 : 0);

        var lum = (0.52 + 0.62 * kd) * ao;
        var col = shade(c2, lum);

        // emissive cells stay hot but still get a little directional shaping
        if (em.indexOf(c2) >= 0) {
          // Painted facets already carry this cell's shading. Multiplying by
          // lum would flatten them all to one tone — which is what turned the
          // gem into a grey blob. Leave the colour and add specular only.
          col = c2;
          if (spec > 0.03) col = mixHex(col, '#ffffff', Math.min(0.16, spec));
        } else {
          col = mixHex(col, '#ffe6bb', 0.045 * kd);
          col = mixHex(col, '#43567e', 0.05 * (1 - kd));
          if (spec > 0.02) col = mixHex(col, '#ffffff', Math.min(0.22, spec));
        }

        R(x2, y2, col);

        // top highlight on the up-facing edge of raised cells
        if (h2 > hAt(x2, y2 - 1) && !isGlowCell(grid, y2 - 1, x2)) {
          R(x2, y2, 'rgba(255,255,255,0.13)', 0, 0, 1, 0.14);
        }
      }
    }

    function isGlowCell(g, yy, xx) { return false; }

    // ---- pass 3: bloom on emissive cells ----
    // Kept deliberately faint. Every gem facet tone is emissive, so a stronger
    // additive pass over ~20 adjacent cells blows the whole gem to white.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(' + Math.max(3, px * 0.014) + 'px)';
    ctx.globalAlpha = 0.085;
    for (var yy2 = 0; yy2 < gh; yy2++) for (var xx2 = 0; xx2 < gw; xx2++) {
      var cc = grid[yy2][xx2];
      if (!cc || em.indexOf(cc) < 0) continue;
      ctx.fillStyle = cc;
      ctx.fillRect(ox + xx2 * cell, oy + yy2 * cell, cell, cell);
    }
    ctx.restore();

    // ---- pass 4: crown prongs, lit as raised relief ----
    crown.forEach(function (cr) {
      var col0 = cr[2];
      var gxw = Math.round(ox + cr[0] * cell), gyw = Math.round(oy + cr[1] * cell);
      // side wall
      ctx.fillStyle = shade(col0, 0.45);
      ctx.fillRect(gxw, gyw + Math.ceil(cell * 0.86), Math.ceil(cell), Math.ceil(cell * 0.16));
      ctx.fillRect(gxw + Math.ceil(cell * 0.86), gyw, Math.ceil(cell * 0.14), Math.ceil(cell));
      // face
      ctx.fillStyle = shade(col0, 1.06);
      ctx.fillRect(gxw, gyw, Math.ceil(cell * 0.9), Math.ceil(cell * 0.9));
      // top catch light
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(gxw, gyw, Math.ceil(cell * 0.9), Math.ceil(cell * 0.12));
    });

    return canvas;
  }
  /* ---------- crate ---------- */
  /* ---------- crate keys ----------
     A crate is a box and a box is square by definition, so six crate icons were
     always going to read as six squares. The product is the KEY that opens it,
     which is also what actually arrives in your inventory.

     The first version of this set varied only the BOW, and two tiers even shared
     one. A key is about 70% shaft-and-bit, so that varied a third of the image
     and every key looked the same at card size - hence "not much change other
     than size".

     Every structural number is per tier now: bow shape and radius, shaft width
     and length, bit reach, bit depth, and tooth count. The silhouettes differ
     before any colour is applied.

       tier      bow          shaft          bit
       -------   ----------   ------------   ----------------------
       Spawner   cage hex     stocky         wide, few deep teeth
       Common    plain ring   thin and long  small and simple
       Rare      clover       long and slim  long, fine teeth
       Epic      diamond      medium         split into two lobes
       Legendary lantern      thick          broad and ornate
       Mythic    winged       very thick     hooked, asymmetric
     ---------------------------------------------------------------------- */
  var KEY_BUILD = {
    /*            bow        R    hole  shaftW  shaftLen  bitReach  bitDepth  teeth */
    sealed: { bow: 'cage', R: 12.5, hole: 5.4, sw: 6, sl: 30, reach: 15, depth: 15, teeth: 2, metal: '#93A78C', gem: '#7CFFB0', spike: 0, studs: 0 },
    plain: { bow: 'round', R: 10.5, hole: 4.4, sw: 4, sl: 40, reach: 10, depth: 11, teeth: 2, metal: '#8E9C7E', gem: '#A8F07A', spike: 0, studs: 0 },
    iron: { bow: 'clover', R: 13.5, hole: 5.8, sw: 5, sl: 38, reach: 18, depth: 16, teeth: 4, metal: '#74A2CE', gem: '#6FD8FF', spike: 0, studs: 0 },
    runed: { bow: 'diamond', R: 13, hole: 6.6, sw: 7, sl: 32, reach: 16, depth: 20, teeth: 3, split: 1, metal: '#A185DA', gem: '#C9A8FF', spike: 0, studs: 0 },
    gilded: { bow: 'lantern', R: 12, hole: 6.2, sw: 9, sl: 34, reach: 20, depth: 22, teeth: 3, metal: '#E8C874', gem: '#FFDE7A', spike: 1, studs: 0 },
    obsidian: { bow: 'wing', R: 14, hole: 6.0, sw: 10, sl: 30, reach: 22, depth: 18, teeth: 2, hook: 1, metal: '#B75BA8', gem: '#FF6FD8', spike: 1, studs: 0 }
  };

  function crateKey(o) {
    o = o || {};
    var B = KEY_BUILD[o.style] || KEY_BUILD.iron;
    var M = o.metal || B.metal;
    var M_L = mixHex(M, '#ffffff', 0.58);
    var M_H = mixHex(M, '#ffffff', 0.30);
    var M_M = M;
    var M_D = shade(M, 0.64);
    var M_X = shade(M, 0.42);
    var GEM = o.gem || B.gem;
    var GEM_L = mixHex(GEM, '#ffffff', 0.62);
    var GEM_D = shade(GEM, 0.55);
    var DARK = shade(M, 0.20);

    var spr = new Sprite(84, 96);

    /* ---- per-tier structure ---- */
    var R = B.R, HOLE = B.hole;
    var SW = B.sw, SLEN = B.sl, REACH = B.reach, BDEPTH = B.depth, NTEETH = B.teeth;

    var BX = 30, BY = R + 5;                 // bow centre
    var CL0 = BY + R + 1, CL1 = CL0 + 4;     // collar
    var SY0 = CL0 + 1, SY1 = SY0 + SLEN;     // shaft
    var BIT0 = SY1 - BDEPTH, BIT1 = SY1;     // bit occupies the shaft's foot
    var SX0 = BX - Math.floor(SW / 2), SX1 = SX0 + SW - 1;
    var BXR = SX1 + REACH;

    function band(u) {
      if (u < 0.14) return M_L;
      else if (u < 0.34) return M_H;
      else if (u < 0.62) return M_M;
      else if (u < 0.86) return M_D;
      return M_X;
    }

    /* ================= BOW ================= */
    if (B.bow === 'cage') {
      /* hexagonal cage: frame, hollow centre, rivets at the vertices */
      var CYR = R + 1;
      for (var yc = BY - CYR; yc <= BY + CYR; yc++) {
        for (var xc = BX - CYR; xc <= BX + CYR; xc++) {
          var dxc = xc - BX, dyc = yc - BY;
          var hd = Math.max(Math.abs(dxc), Math.abs(dxc) * 0.5 + Math.abs(dyc) * 0.87);
          if (hd > CYR || hd < CYR - 4.6) continue;
          var cc = band((dxc + CYR) / (2 * CYR));
          if (dyc < -CYR * 0.4 && dxc < 2) cc = M_L;
          spr.set(xc, yc, cc);
        }
      }
      for (var yh = BY - HOLE - 2; yh <= BY + HOLE + 2; yh++) {
        for (var xh = BX - HOLE - 2; xh <= BX + HOLE + 2; xh++) {
          var hdx = xh - BX, hdy = yh - BY;
          var hd3 = Math.sqrt(hdx * hdx + hdy * hdy);
          if (hd3 < HOLE - 0.6 || hd3 > HOLE + 1.2) continue;
          spr.set(xh, yh, hdx < 0 ? M_X : DARK);
        }
      }
      for (var vi = 0; vi < 6; vi++) {
        var va = -Math.PI / 2 + vi * (Math.PI / 3);
        var vx = Math.round(BX + Math.cos(va) * (CYR - 2.4));
        var vy = Math.round(BY + Math.sin(va) * (CYR - 2.4));
        spr.set(vx, vy, GEM);
      }
    } else if (B.bow === 'round') {
      for (var y = BY - R; y <= BY + R; y++) {
        for (var x = BX - R; x <= BX + R; x++) {
          var dx = x - BX, dy = y - BY;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > R || d < HOLE) continue;
          var c = band((dx + R) / (2 * R));
          if (dy < -R * 0.45 && dx < 2) c = M_L;
          spr.set(x, y, c);
        }
      }
      for (var hy = BY - HOLE - 1; hy <= BY + HOLE + 1; hy++) {
        for (var hx = BX - HOLE - 1; hx <= BX + HOLE + 1; hx++) {
          var hdx2 = hx - BX, hdy2 = hy - BY;
          var hd2 = Math.sqrt(hdx2 * hdx2 + hdy2 * hdy2);
          if (hd2 < HOLE - 1.1 || hd2 > HOLE + 0.4) continue;
          spr.set(hx, hy, hdx2 < 0 ? M_X : DARK);
        }
      }
    } else if (B.bow === 'clover') {
      var lobes = [[0, -1], [-1, 0.76], [1, 0.76]];
      var LR = R * 0.60, OFF = R * 0.42;
      for (var y2 = BY - R; y2 <= BY + R; y2++) {
        for (var x2 = BX - R; x2 <= BX + R; x2++) {
          var dx2 = x2 - BX, dy2 = y2 - BY;
          var dd = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dd < HOLE) continue;
          var ins = dd < R * 0.44;
          for (var li = 0; li < 3; li++) {
            var lx = dx2 - lobes[li][0] * OFF, ly = dy2 - lobes[li][1] * OFF;
            if (lx * lx + ly * ly < LR * LR) { ins = true; break; }
          }
          if (!ins) continue;
          spr.set(x2, y2, band((dx2 + R) / (2 * R)));
        }
      }
    } else if (B.bow === 'diamond') {
      for (var y3 = BY - R; y3 <= BY + R; y3++) {
        for (var x3 = BX - R; x3 <= BX + R; x3++) {
          var dxx = x3 - BX, dyy = y3 - BY;
          if (Math.abs(dxx) + Math.abs(dyy) > R + 2) continue;
          var c3 = band((dxx + R) / (2 * R));
          if (dxx + dyy < -4) c3 = M_L;
          else if (dxx + dyy > 6) c3 = M_D;
          spr.set(x3, y3, c3);
        }
      }
      for (var by2 = BY - 9; by2 <= BY + 9; by2++) {
        for (var bx2 = BX - 9; bx2 <= BX + 9; bx2++) {
          if (Math.abs(bx2 - BX) + Math.abs(by2 - BY) > 10) continue;
          spr.set(bx2, by2, DARK);
        }
      }
      for (var gy = -6.5; gy <= 6.5; gy++) {
        for (var gx = -6.5; gx <= 6.5; gx++) {
          if (Math.abs(gx) + Math.abs(gy) > 7.4) continue;
          var gc = GEM;
          if (gx < -0.8 && gy < 0.8) gc = GEM_L;
          else if (gx + gy > 3) gc = GEM_D;
          else if (gx > 2) gc = shade(GEM, 0.78);
          spr.set(BX + Math.round(gx), BY + Math.round(gy), gc);
        }
      }
      spr.set(BX - 4, BY - 4, mixHex(GEM_L, '#ffffff', 0.45));
      spr.set(BX - 3, BY - 4, GEM_L);
      spr.set(BX - 4, BY - 3, GEM_L);
    } else if (B.bow === 'lantern') {
      var LT = BY - R - 1, LB = BY + R + 1;
      for (var y4 = LT; y4 <= LB; y4++) {
        var t4 = (y4 - LT) / (LB - LT);
        var hw = t4 < 0.14 ? R * 0.86 : (t4 < 0.58 ? R : R * (1 - Math.pow((t4 - 0.58) / 0.42, 1.6) * 0.70));
        for (var x4 = BX - hw; x4 <= BX + hw; x4++) {
          var c4 = band((x4 - (BX - hw)) / (2 * hw));
          if (y4 === LT) c4 = M_L;
          else if (y4 >= LB - 1) c4 = M_X;
          spr.set(Math.round(x4), y4, c4);
        }
      }
      for (var wy = BY - 6; wy <= BY + 5; wy++) {
        for (var wx = BX - 6; wx <= BX + 6; wx++) {
          var wdx = (wx - BX) / 6.4, wdy = (wy - BY) / 6.6;
          if (wdx * wdx + wdy * wdy > 1) continue;
          var wc = GEM;
          if (wdx + wdy < -0.5) wc = GEM_L;
          else if (wdx + wdy > 0.8) wc = GEM_D;
          spr.set(wx, wy, wc);
        }
      }
      spr.set(BX - 4, BY - 4, mixHex(GEM_L, '#ffffff', 0.45));
      spr.set(BX - 3, BY - 4, GEM_L);
    } else {
      /* wing: a faceted core with swept wings either side - the widest bow in
         the set, so the mythic key is unmistakable in silhouette */
      for (var y5 = BY - R; y5 <= BY + R; y5++) {
        for (var x5 = BX - R; x5 <= BX + R; x5++) {
          var dx5 = x5 - BX, dy5 = y5 - BY;
          var man = Math.abs(dx5) + Math.abs(dy5) * 1.15;
          if (man > R + 1 || man < HOLE * 0.9) continue;
          spr.set(x5, y5, band((dx5 + R) / (2 * R)));
        }
      }
      /* swept wings */
      [-1, 1].forEach(function (dir) {
        for (var wi = 1; wi <= 8; wi++) {
          var wy2 = BY - 4 + Math.round(wi * 0.55);
          var wh = Math.max(0, 3 - Math.floor(wi / 2.6));
          for (var wj = -wh; wj <= wh; wj++) {
            var pxw = BX + dir * (R + wi - 1);
            if (!spr.get(pxw, wy2 + wj)) continue;
            spr.set(pxw, wy2 + wj, dir < 0 ? M_H : M_D);
          }
        }
      });
      /* gem set in the core */
      for (var gy2 = -4; gy2 <= 4; gy2++) {
        for (var gx2 = -4; gx2 <= 4; gx2++) {
          if (Math.abs(gx2) + Math.abs(gy2) > 5) continue;
          var gc2 = GEM;
          if (gx2 < -0.5 && gy2 < 0.5) gc2 = GEM_L;
          else if (gx2 + gy2 > 2) gc2 = GEM_D;
          spr.set(BX + gx2, BY + gy2, gc2);
        }
      }
    }

    /* finial above the bow on the top two tiers */
    if (B.spike) {
      var SPY = BY - R - 2;
      for (var pi = 0; pi <= 6; pi++) {
        var w2 = pi < 3 ? 1 : 0;
        for (var oo = -w2; oo <= w2; oo++) {
          spr.set(BX + oo, SPY - pi, pi >= 5 ? GEM_L : (oo < 0 ? M_L : M_D));
        }
      }
      spr.set(BX - 2, SPY, M_D);
      spr.set(BX + 2, SPY, M_X);
    }

    /* ================= COLLAR ================= */
    for (var cy = CL0; cy <= CL1; cy++) {
      for (var cx = SX0 - 3; cx <= SX1 + 3; cx++) {
        var cc2 = band((cx - (SX0 - 3)) / (SX1 + 3 - (SX0 - 3)));
        if (cy === CL0) cc2 = M_L;
        else if (cy === CL1) cc2 = M_X;
        spr.set(cx, cy, cc2);
      }
    }

    /* ================= SHAFT ================= */
    for (var sy = SY0; sy <= SY1; sy++) {
      for (var sx = SX0; sx <= SX1; sx++) {
        spr.set(sx, sy, band((sx - SX0) / Math.max(1, SX1 - SX0)));
      }
    }
    /* rib bands, spaced to the shaft length so they never crowd */
    var ribGap = Math.max(6, Math.round(SLEN / 4));
    for (var ry2 = SY0 + ribGap; ry2 < BIT0; ry2 += ribGap) {
      for (var rx2 = SX0; rx2 <= SX1; rx2++) {
        var rt = (rx2 - SX0) / Math.max(1, SX1 - SX0);
        spr.set(rx2, ry2, rt < 0.4 ? M_L : rt < 0.75 ? M_D : M_X);
      }
    }

    /* ================= BIT ================= */
    /* Read the bitt list as the outer edge inset from the top of the bit down.
       A small number means the tooth sticks out further. */
    var nB = Math.max(2, NTEETH * 2);
    var bandH = (BIT1 - BIT0 + 1) / nB;
    var amp = NTEETH >= 4 ? 3 : (NTEETH === 3 ? 4 : 5);
    var BITT = [];
    for (var bi0 = 0; bi0 < nB; bi0++) BITT.push(bi0 % 2 === 0 ? 1 : 1 + amp);

    if (B.split) {
      /* two lobes with a gap between them - a different shape, not a trim */
      var midY = Math.round((BIT0 + BIT1) / 2);
      for (var yy2 = BIT0; yy2 <= BIT1; yy2++) {
        if (yy2 > midY - 2 && yy2 < midY + 2) continue;
        var bi2 = Math.min(nB - 1, Math.floor((yy2 - BIT0) / bandH));
        var ins2 = BITT[bi2];
        var end2 = BXR - ins2;
        for (var xx2 = SX1 + 1; xx2 <= end2; xx2++) {
          var uu2 = (xx2 - (SX1 + 1)) / Math.max(1, end2 - (SX1 + 1));
          var bc2 = band(uu2);
          if (yy2 === BIT0 || yy2 === midY - 1 || yy2 === midY + 1) bc2 = M_L;
          else if (yy2 === BIT1) bc2 = M_X;
          if (xx2 >= end2) bc2 = M_D;
          spr.set(xx2, yy2, bc2);
        }
      }
    } else {
      for (var yy = BIT0; yy <= BIT1; yy++) {
        var bi = Math.min(nB - 1, Math.floor((yy - BIT0) / bandH));
        var inset = BITT[bi];
        var xEnd = BXR - inset;
        /* the hook tier curves its foot back toward the shaft */
        if (B.hook && yy > BIT1 - 5) xEnd -= (yy - (BIT1 - 5)) * 2;
        for (var xx = SX1 + 1; xx <= xEnd; xx++) {
          var uu = (xx - (SX1 + 1)) / Math.max(1, xEnd - (SX1 + 1));
          var bc = band(uu);
          if (yy === BIT0) bc = M_L;
          else if (yy === BIT1) bc = M_X;
          if (xx >= xEnd) bc = M_D;
          spr.set(xx, yy, bc);
        }
      }
    }

    /* bright lip along the top of the bit */
    var lipEnd = BXR - BITT[0];
    for (var lx = SX1 + 1; lx <= lipEnd; lx++) {
      if (spr.get(lx, BIT0)) spr.set(lx, BIT0, M_L);
    }

    spr.outline(shade(DARK, 0.62));

    var em = [GEM, GEM_L, GEM_D];
    return spr.trim().model(em);
  }

  /* ---------- crest, as real 3D geometry ----------
     The badge renderer produced flat stickers with an outline. This is a
     shaped shield with actual thickness: a bevelled rim, a dished field, a
     cast gem, and a crown that sits on the top edge. It is lit by the same
     key/sky/fill rig as the crates, so the two sit in the same scene.        */
  function crest3d(o) {
    o = o || {};
    var v = new Vox();

    var RIM = o.rim || '#e6b03c';
    var RIM_D = shade(RIM, 0.55);
    var RIM_L = mixHex(RIM, '#ffffff', 0.42);
    var FACE = o.face || '#9b3140';
    var FACE_D = shade(FACE, 0.74);
    var FACE_L = mixHex(FACE, '#ffffff', 0.20);
    var GEM = o.gem || '#5cd8ea';
    var PRONGS = o.prongs === undefined ? 3 : o.prongs;

    var W = 15, CX = 7, ROWS = 19, D = 5;

    // Shield outline: straight shoulders then a curve to a point.
    function halfAt(y) {
      if (y <= 9) return 7;
      var t = (y - 9) / (ROWS - 9);
      return 7 * Math.pow(Math.max(0, 1 - t * t * 0.94), 0.62);
    }

    for (var y = 0; y < ROWS; y++) {
      var half = halfAt(y);
      if (half < 0.45) continue;
      for (var x = 0; x <= W; x++) {
        var dx = Math.abs(x - CX);
        if (dx > half) continue;
        var dEdge = half - dx;                       // distance in from the edge
        var yEdge = Math.min(y, ROWS - 1 - y);
        var inset = Math.min(dEdge, yEdge);

        for (var z = 0; z < D; z++) {
          var c;
          if (z === 0) {
            c = RIM_D;                                // back face
          } else if (z === D - 1) {
            // front face: gold rim reads as a raised border
            c = inset < 1.4 ? RIM : (inset < 2.3 ? shade(RIM, 0.86) : FACE);
            if (inset >= 2.3 && inset < 2.8) c = FACE_D;   // engraved line
          } else {
            // side wall: gold on the rim, crimson in the field, and the rim
            // itself steps outward so the edge catches light
            if (inset < 1.4) c = z >= D - 2 ? RIM : RIM_D;
            else c = z >= D - 2 ? FACE : FACE_D;
          }
          v.set(x, y, z, c);
        }
        // proud bezel: one extra voxel on the rim only
        if (inset < 1.4) v.set(x, y, D, y === 0 ? RIM_L : RIM);
      }
    }

    // ---- dished field: recess the centre one voxel so it is not a flat slab ----
    for (var y2 = 3; y2 < ROWS - 3; y2++) {
      var h2 = halfAt(y2) - 2.6;
      if (h2 < 0.9) continue;
      for (var x2 = 0; x2 <= W; x2++) {
        if (Math.abs(x2 - CX) > h2) continue;
        v.del(x2, y2, D - 1);
        v.set(x2, y2, D - 2, FACE_D);
      }
    }

    // ---- cast gem: a raised diamond in the dished field ----
    var gy = 8;
    var facets = [
      [0, 0, mixHex(GEM, '#ffffff', 0.85), 2],
      [0, 1, mixHex(GEM, '#ffffff', 0.5), 1],
      [0, -1, mixHex(GEM, '#ffffff', 0.5), 1],
      [0, 2, GEM, 0], [0, -2, GEM, 0],
      [-1, 1, GEM, 0], [1, 1, shade(GEM, 0.84), 0],
      [-1, 0, mixHex(GEM, '#ffffff', 0.3), 0], [1, 0, shade(GEM, 0.76), 0],
      [-1, -1, shade(GEM, 0.8), 0], [1, -1, shade(GEM, 0.66), 0],
      [-1, 2, shade(GEM, 0.84), 0], [1, 2, shade(GEM, 0.66), 0],
      [-1, -2, shade(GEM, 0.72), 0], [1, -2, shade(GEM, 0.56), 0],
      [0, 3, shade(GEM, 0.54), 0], [0, -3, shade(GEM, 0.46), 0],
      [-2, 0, shade(GEM, 0.64), 0], [2, 0, shade(GEM, 0.52), 0]
    ];
    facets.forEach(function (f) {
      var gx = CX + f[0], gyy = gy + f[1];
      if (gyy < 0 || gyy >= ROWS) return;
      // raised centre voxel so the gem reads as set into the shield
      v.set(gx, gyy, D - 1, f[2]);
      if (f[3] > 0) v.set(gx, gyy, D, f[2]);
    });

    // ---- crown on the top edge ----
    if (PRONGS !== 0) {
      var pts = PRONGS === 5 ? [2, 4, 7, 10, 12] : PRONGS === 2 ? [3, 11] : [3, 7, 11];
      // solid band along the top
      for (var bx = 2; bx <= 12; bx++) {
        for (var bz = 0; bz < D; bz++) v.set(bx, ROWS, bz, bz === 0 ? RIM_D : RIM);
      }
      pts.forEach(function (px, i) {
        var h = (i === Math.floor(pts.length / 2)) ? 3 : 2;
        for (var k = 1; k <= h; k++) {
          var top = (k === h);
          var cc = top ? (o.tip || GEM) : RIM;
          for (var pz = 0; pz < D; pz++) v.set(px, ROWS + k, pz, pz === 0 ? RIM_D : cc);
        }
        // widen the base so the prongs read as towers, not antennae
        if (h > 1) {
          for (var pz2 = 0; pz2 < D; pz2++) {
            v.set(px - 1, ROWS + 1, pz2, pz2 === 0 ? RIM_D : shade(RIM, 0.92));
            v.set(px + 1, ROWS + 1, pz2, pz2 === 0 ? RIM_D : shade(RIM, 0.78));
          }
        }
      });
    }

    // ---- plinth so it stands rather than floats ----
    for (var px2 = 3; px2 <= 11; px2++) {
      for (var pz3 = 0; pz3 < D; pz3++) {
        v.set(px2, -1, pz3, pz3 === 0 ? RIM_D : RIM);
        v.set(px2, -2, pz3, shade(RIM_D, 0.72));
      }
    }

    v.emissive[GEM] = GEM;
    v.emissive[mixHex(GEM, '#ffffff', 0.85)] = GEM;
    v.emissive[mixHex(GEM, '#ffffff', 0.5)] = GEM;
    if (o.tip) v.emissive[o.tip] = o.tip;
    return v;
  }

  /* ---------- booster: a cluster of angular crystal shards ----------
     Reworked after review. The previous model was a single smooth lozenge
     with a waist and a bulge, which read ambiguously. This is a cluster of
     three hard-edged prisms at different heights: unmistakably crystalline,
     and the silhouette has intentional asymmetry.                          */
  function crystal(o) {
    o = o || {};
    var v = new Vox();
    var C = o.color || '#2FD8F0';
    var C_D = shade(C, 0.38);
    var C_M = shade(C, 0.72);
    var C_L = mixHex(C, '#ffffff', 0.62);

    /* One shard: a hexagonal prism, pointed at the top, flat-based.
       (cx,cz) base centre, y0 base height, half = radius, h = total height. */
    function shard(cx, cz, y0, half, h, lit) {
      for (var i = 0; i < h; i++) {
        var y = y0 + i;
        var t = i / (h - 1);
        // taper only the top third into a point; body stays straight
        var w = t < 0.68 ? half : half * (1 - (t - 0.68) / 0.32);
        if (w < 0.5) continue;
        for (var x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++)
          for (var z = Math.floor(cz - w); z <= Math.ceil(cz + w); z++) {
            var dx = x - cx, dz = z - cz;
            var d = Math.sqrt(dx * dx + dz * dz);
            if (d > w + 0.4) continue;
            // flat hexagon cut — hard edges, not a circle
            if (Math.abs(dx) + Math.abs(dz) > w * 1.58) continue;
            if (Math.abs(dx) > w * 0.98 || Math.abs(dz) > w * 0.98) continue;

            // Facets by azimuth: the hexagon splits into a lit key face, a
            // mid face and a shadow face with hard lines between them. That
            // hard split is what reads as cut glass rather than a rounded lump.
            var az = Math.atan2(dz, dx);
            var c;
            if (lit) {
              if (az > -2.5 && az < -0.6) c = mixHex(C, '#ffffff', 0.38);
              else if (az >= -0.6 && az < 0.8) c = C;
              else c = C_M;
              if (d > w - 0.8) c = shade(c, 0.84);
            } else {
              c = (az > -2.3 && az < 0.3) ? mixHex(C, '#ffffff', 0.12) : C_M;
              if (d > w - 0.8) c = shade(c, 0.7);
            }
            v.set(x, y, z, c);
          }
      }
      // bright vertical seam on the lit face
      if (lit) {
        for (var k = 2; k < h - 2; k++) {
          var yk = y0 + k;
          for (var s = 1; s <= 2; s++) {
            if (v.has(cx - s, yk, cz + s - 1)) v.set(cx - s, yk, cz + s - 1, C_L);
          }
        }
      }
    }

    // three shards: tall centre, two shorter flanking at different depths
    shard(6, 8, 2, 2.5, 14, true);      // centre, tallest, lit
    shard(10, 6, 1, 1.8, 8, false);     // right, mid
    shard(4, 5, 1, 1.5, 5, false);      // left, short

    // gold collar banding the cluster at its base
    v.cyl(7, 7, 1, 1, 5.4, '#8a6a20', true);
    v.cyl(7, 7, 0, 0, 4.6, shade('#e6b03c', 0.78), false);
    v.cyl(7, 7, 2, 2, 5.0, shade('#e6b03c', 0.9), true);

    v.emissive[C] = C;
    v.emissive[C_L] = mixHex(C, '#ffffff', 0.42);
    v.emissive[mixHex(C, '#ffffff', 0.16)] = mixHex(C, '#ffffff', 0.12);
    return v;
  }

  /* ---------- booster: a corked potion with stars and a plus ----------
     Drawn as a pixel sprite through the height-map renderer, the same system
     as the rank items. A bottle needs a controlled silhouette; in a 15-cube
     voxel grid the isometric projection flattens it into a lump.            */
  /* ---------- booster: a wide-based potion with stars suspended inside ------
     Rebuilt from primitives at 46x56 — about 4x the old cell count — then
     scaled down in CSS. The old version painted stars onto the glass surface,
     which is why they read as decorations rather than as contents; these sit
     inside the liquid, behind a glass wall drawn around them.
     ---------------------------------------------------------------------- */
  function potionSprite(o) {
    o = o || {};
    var LQ = o.liquid || '#1FB6D4';
    var LQ_D = shade(LQ, 0.52);
    var LQ_L = mixHex(LQ, '#ffffff', 0.62);
    var GLASS = mixHex(LQ, '#0A2E3E', 0.72);
    var GLASS_L = mixHex(GLASS, '#ffffff', 0.66);
    var GOLD = o.gold || '#E6B03C';
    var GOLD_D = shade(GOLD, 0.62);
    var CORK = o.cork || '#8A5A2B';
    var CORK_L = shade(CORK, 1.26);
    var CORK_D = shade(CORK, 0.74);
    var STAR = o.star || '#C77DFF';
    var STAR_L = mixHex(STAR, '#ffffff', 0.62);
    var STAR_D = shade(STAR, 0.70);
    var EDGE = '#081220';

    var W = 46, H = 56, CX = 23;
    var spr = new Sprite(W, H);

    /* ---- body profile: very wide base, short neck ----
       Authored as explicit radii per row so the silhouette is deliberate. */
    var PROFILE = [
      // y, radius
      [0, 0], [1, 6.5], [2, 8.5], [3, 9.5], [4, 10.0], [5, 10.2],
      [6, 10.2], [7, 10.1], [8, 10.0], [9, 9.8], [10, 9.7], [11, 9.7],
      [12, 9.6], [13, 9.6], [14, 9.5], [15, 9.5], [16, 9.5], [17, 9.5],
      [18, 9.4], [19, 9.4], [20, 9.3], [21, 9.2], [22, 9.0], [23, 8.8],
      [24, 8.4], [25, 7.8], [26, 7.0], [27, 6.0], [28, 4.8], [29, 3.8],
      [30, 3.2], [31, 3.0], [32, 2.9], [33, 2.9], [34, 2.9], [35, 3.0],
      [36, 3.4], [37, 3.8], [38, 3.9], [39, 3.7]
    ];
    function radAt(y) {
      for (var i = 0; i < PROFILE.length; i++) if (PROFILE[i][0] === y) return PROFILE[i][1];
      return 0;
    }

    /* The profile is authored top-down (y=0 is the crown of the body), but the
       sprite is drawn bottom-up so the wide base sits on the floor. */
    var FLOOR = H - 5;                       // leave room for the metal foot
    function Y(y) { return FLOOR - y; }

    /* ---- glass wall + liquid ---- */
    for (var y = 0; y <= 39; y++) {
      var r = radAt(y);
      if (r < 0.6) continue;
      for (var x = Math.floor(CX - r); x <= Math.ceil(CX + r); x++) {
        var dx = Math.abs(x - CX);
        if (dx > r + 0.3) continue;
        var wall = dx > r - 1.35;
        var c;
        if (wall) {
          c = (x < CX - r * 0.25) ? GLASS_L : GLASS;
        } else {
          // liquid, darker toward the base
          c = y > 26 ? LQ_D : LQ;
        }
        spr.set(x, Y(y), c);
      }
    }

    /* ---- stars INSIDE the liquid, with glass drawn over them ----
       Painted into the liquid region, then the wall pass re-applies so they
       are visibly behind glass. */
    /* ---- specular streak and liquid surface ---- */
    for (var sy = 8; sy <= 30; sy++) {
      var sr = radAt(sy);
      spr.set(CX - Math.round(sr) + 3, Y(sy), '#E8FBFF');
      if (sy % 3 === 0) spr.set(CX - Math.round(sr) + 4, Y(sy), mixHex(GLASS_L, '#ffffff', 0.5));
    }
    // liquid surface line across the widest point
    for (var sx = CX - 8; sx <= CX + 8; sx++) {
      if (spr.get(sx, Y(6))) spr.set(sx, Y(6), LQ_L);
    }
    /* Positions are sprite rows, not profile rows. The belly (FLOOR-8 ..
       FLOOR-20) is where the bottle is widest, so the stars live there —
       previously they were mapped to the narrow shoulder and looked absent. */
    var starSpots = [
      [17, FLOOR - 12, 5.2],
      [30, FLOOR - 17, 4.2],
      [22, FLOOR - 22, 4.8],
      [31, FLOOR - 8, 3.4],
      [12, FLOOR - 18, 3.0],
      [24, FLOOR - 31, 3.6]
    ];
    // A soft 1px halo behind each star only where it touches liquid. A box
    // shadow here painted dark rectangles over the whole body.
    starSpots.forEach(function (s) {
      var rr = Math.round(s[2]) + 1;
      for (var yy = -rr; yy <= rr; yy++) {
        for (var xx = -rr; xx <= rr; xx++) {
          var d = Math.sqrt(xx * xx + yy * yy);
          if (d < s[2] - 0.5 || d > rr) continue;
          var px = Math.round(s[0] + xx), py = s[1] + yy;
          var cur = spr.get(px, py);
          if (cur === LQ || cur === LQ_D) spr.set(px, py, shade(LQ, 0.46));
        }
      }
    });
    starSpots.forEach(function (s) {
      starInto(spr, s[0], s[1], s[2], STAR_L, STAR);
    });
    spr.set(22, FLOOR - 22, '#FFFFFF');
    spr.set(22, FLOOR - 23, '#FFFFFF');
    spr.set(17, FLOOR - 12, '#FFFFFF');

    /* Re-stamp only the single outermost glass pixel of each row. Anything
       wider eats the stars, which is what kept clipping them to tips. */
    for (var y3 = 0; y3 <= 39; y3++) {
      var r3 = radAt(y3);
      if (r3 < 0.6) continue;
      var lx = Math.floor(CX - r3), rx = Math.ceil(CX + r3);
      spr.set(lx, Y(y3), GLASS_L);
      spr.set(rx, Y(y3), GLASS);
    }

    /* ---- neck: short and straight, same width as the cork ---- */
    for (var ny = 40; ny <= 44; ny++) {
      var nr = 3.0;
      for (var nx = CX - nr; nx <= CX + nr; nx++) {
        var ndx = Math.abs(nx - CX);
        spr.set(nx, Y(ny), ndx >= nr - 0.6 ? (nx < CX ? GLASS_L : GLASS) : GOLD_D);
      }
    }
    /* gold collar: barely wider than the neck, with rounded shoulders, so it
       reads as a fitting rather than a flange across the top. */
    for (var cy2 = 39; cy2 <= 41; cy2++) {
      var cw = cy2 === 39 ? 4.2 : (cy2 === 40 ? 3.9 : 3.4);
      for (var cx3 = Math.floor(CX - cw); cx3 <= Math.ceil(CX + cw); cx3++) {
        var cdx = Math.abs(cx3 - CX);
        if (cdx > cw + 0.3) continue;
        spr.set(cx3, Y(cy2), cdx >= cw - 1 ? GOLD_D : (cy2 === 41 ? GOLD : shade(GOLD, 0.88)));
      }
    }
    /* cork: rounded, narrower than the collar */
    for (var ky = 45; ky <= 50; ky++) {
      var kr = ky === 50 ? 1.9 : (ky === 45 ? 2.4 : 2.8);
      for (var kx = CX - Math.round(kr); kx <= CX + Math.round(kr); kx++) {
        var kdx = Math.abs(kx - CX);
        if (kdx > kr + 0.3) continue;
        spr.set(kx, Y(ky), kdx >= kr - 0.9 ? CORK_D : (kx < CX ? CORK_L : CORK));
      }
    }

    /* ---- foot: a wide metal base, drawn at the BOTTOM of the sprite ----
       Previously this was written into rows 0..3, which is the top of the
       canvas — hence the gold flange floating above the cork. */
    for (var fy = 0; fy <= 3; fy++) {
      var fr = 10.6 - fy * 0.6;
      var rowY = FLOOR + fy;                  // the floor is Y(0), so sit just below it
      for (var fx = Math.floor(CX - fr); fx <= Math.ceil(CX + fr); fx++) {
        var fdx = Math.abs(fx - CX);
        if (fdx > fr + 0.3) continue;
        spr.set(fx, rowY, fdx > fr - 1.3 ? GOLD_D : (fy === 0 ? shade(GOLD, 0.84) : GOLD));
      }
    }

    spr.outline(EDGE);

    var em = [];
    [LQ, LQ_L, LQ_D, STAR, STAR_L, STAR_D, shade(STAR, 0.8)].forEach(function (c) {
      if (em.indexOf(c) < 0) em.push(c);
    });
    return spr.model(em);
  }

  /* The boost badge: a gold disc with a plus, drawn as its own sprite so it can
     be composited beside the bottle without fighting the bottle's silhouette. */
  var PLUS_ROWS = [
    '..#####..',
    '.#GGGGG#.',
    '#GGGGGGG#',
    '#GGG#GGG#',
    '#GG###GG#',
    '#GGG#GGG#',
    '#GGGGGGG#',
    '.#GGGGG#.',
    '..#####..'
  ];

  function plusBadge(o) {
    o = o || {};
    var GOLD = o.gold || '#E6B03C';
    return icon(PLUS_ROWS, {
      '#': shade(GOLD, 0.42),
      G: GOLD
    }, { glowKeys: [] });
  }
  /* ---------- protection block ---------- */
  /* ---------- protection block ----------
     Reads as a solid carved block: stone body, raised metal corner posts and
     edge banding, and a filled shield plate on the two visible faces. */
  function protBlock(o) {
    o = o || {};
    var v = new Vox(), S = 13, M = 6, LAST = S - 1;
    var STONE = o.a || '#6d4a26';
    var B = o.b || '#3f9c6c';
    var METAL = o.metal || mixHex(B, '#000000', 0.35);
    var EMB = o.emblem || '#e6ffe9';
    var CORE = o.core || B;

    function onPost(x, z) { return (x === 0 || x === LAST) && (z === 0 || z === LAST); }

    for (var x = 0; x < S; x++) for (var y = 0; y < S; y++) for (var z = 0; z < S; z++) {
      var edge = x === 0 || x === LAST || y === 0 || y === LAST || z === 0 || z === LAST;
      if (!edge) continue;
      var c;
      if (onPost(x, z)) c = METAL;                       // corner posts
      else if (y === 0) c = shade(STONE, 0.62);          // base
      else if (y === LAST) c = shade(STONE, 1.08);       // top
      else if (y === LAST - 1 || y === 1) c = METAL;      // edge banding
      else {
        // stone courses: one tone per row, subtle
        c = [STONE, shade(STONE, 0.95), shade(STONE, 1.05)][y % 3];
      }
      v.set(x, y, z, c);
    }

    // ---- carved shield plate on +X and +Z ----
    // A filled shield: flat shoulders, tapering to a point. No outline-only
    // rings, which is what made the earlier version read as a horseshoe.
    function plate(face) {
      // recessed border
      for (var a = 2; a <= 10; a++) for (var b2 = 2; b2 <= 10; b2++) {
        var borderPx = a === 2 || a === 10 || b2 === 2 || b2 === 10;
        if (!borderPx) continue;
        var bc = shade(STONE, 0.7);
        if (face === 'x') v.set(LAST, b2, a, bc); else v.set(a, b2, LAST, bc);
      }
      // filled shield field
      for (var ya = 3; ya <= 10; ya++) {
        var t = (ya - 3) / 7;                       // 0 top .. 1 point
        var half;
        if (ya <= 7) half = 3;                      // straight shoulders
        else half = 3 * (1 - Math.pow((ya - 7) / 3.2, 1.5));
        for (var xa = -3; xa <= 3; xa++) {
          if (Math.abs(xa) > half + 0.06) continue;
          var px = M + xa;
          if (face === 'x') v.set(LAST, ya, px, B); else v.set(px, ya, LAST, B);
        }
      }
      // shield rim, one voxel proud, gold/metal
      for (var yb = 3; yb <= 10; yb++) {
        var t2 = (yb - 3) / 7;
        var h2;
        if (yb <= 7) h2 = 3; else h2 = 3 * (1 - Math.pow((yb - 7) / 3.2, 1.5));
        var hOut = Math.min(3.5, h2 + 0.9);
        for (var xb = -4; xb <= 4; xb++) {
          var d = Math.abs(xb);
          if (d <= h2 + 0.06) continue;
          if (d > hOut + 0.06) continue;
          var px2 = M + xb;
          if (px2 < 2 || px2 > 10) continue;
          var rc = METAL;
          if (face === 'x') v.set(LAST, yb, px2, rc); else v.set(px2, yb, LAST, rc);
        }
      }
      // emblem: a filled diamond, clearly readable at 120px
      var dia = [
        [0, -2], [0, -1], [-1, -1], [1, -1],
        [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0],
        [0, 1], [-1, 1], [1, 1],
        [0, 2]
      ];
      dia.forEach(function (p) {
        var px3 = M + p[0], py3 = 6 + p[1];
        if (face === 'x') v.set(LAST, py3, px3, EMB); else v.set(px3, py3, LAST, EMB);
      });
      // hot core at the centre of the diamond
      if (face === 'x') v.set(LAST, 6, M, CORE); else v.set(M, 6, LAST, CORE);
    }
    plate('x'); plate('z');

    // glowing corner caps on the top face — reads as "active"
    [[0, 0], [LAST, 0], [0, LAST], [LAST, LAST]].forEach(function (p) {
      v.set(p[0], LAST, p[1], CORE);
    });

    v.emissive[CORE] = CORE;
    v.emissive[EMB] = mixHex(EMB, CORE, 0.14);
    return v;
  }

  /* ---------- shard booster: a tall shard on a gold pedestal ---------- */
  function potion(o) {
    o = o || {};
    var v = new Vox(), cx = 6, cz = 6;
    var LQ = o.liquid || '#1FB6D4';
    var GOLD = o.gold || '#E6B03C';

    // tall crystal: 20 rows, max half-width 6 -> clearly vertical
    var prof = [1, 2, 3, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 4, 3, 2, 1];
    var y0 = 3;
    prof.forEach(function (half, i) {
      var y = y0 + i;
      for (var x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++)
        for (var z = Math.floor(cz - half); z <= Math.ceil(cz + half); z++) {
          var dx = x - cx, dz = z - cz;
          var d = Math.sqrt(dx * dx + dz * dz);
          if (d > half + 0.4) continue;
          // only surface voxels are ever visible, so shade by position:
          // front-left faces catch the key light, back-right falls into shadow
          var t = (i) / (prof.length - 1);              // 0 top .. 1 bottom
          var front = (dx + dz) / (half + 0.001);       // -1.4 .. 1.4
          var lum = 0.62 + (1 - t) * 0.30 - front * 0.20;
          var c = shade(LQ, Math.max(0.34, Math.min(1.35, lum)));
          v.set(x, y, z, c);
        }
    });
    // a bright vertical facet down the lit edge
    for (var yy = 5; yy <= 19; yy++) {
      var halfY = prof[yy - y0];
      if (halfY === undefined) continue;
      var hx = Math.round(cx - halfY + 0.6), hz = Math.round(cz - halfY + 0.6);
      if (v.has(hx, yy, hz)) v.set(hx, yy, hz, mixHex(LQ, '#ffffff', 0.62));
      if (v.has(hx + 1, yy, hz)) v.set(hx + 1, yy, hz, mixHex(LQ, '#ffffff', 0.45));
      if (v.has(hx, yy, hz + 1)) v.set(hx, yy, hz + 1, mixHex(LQ, '#ffffff', 0.40));
    }

    // ---- gold pedestal ----
    v.cyl(cx, cz, 1, 1, 5.0, shade(GOLD, 0.84), true);
    v.cyl(cx, cz, 2, 2, 4.2, GOLD, true);

    v.emissive[LQ] = LQ;
    v.emissive[shade(LQ, 1.2)] = mixHex(LQ, '#ffffff', 0.12);
    v.emissive[shade(LQ, 0.92)] = mixHex(LQ, '#ffffff', 0.06);
    v.emissive[shade(LQ, 0.78)] = mixHex(LQ, '#ffffff', 0.04);
    v.emissive[mixHex(LQ, '#ffffff', 0.62)] = mixHex(LQ, '#ffffff', 0.34);
    v.emissive[mixHex(LQ, '#ffffff', 0.45)] = mixHex(LQ, '#ffffff', 0.26);
    v.emissive[mixHex(LQ, '#ffffff', 0.40)] = mixHex(LQ, '#ffffff', 0.24);
    return v;
  }

  /* ---------- key ---------- */
  function key(o) {
    o = o || {};
    var v = new Vox(), CX = 6;
    var G = o.gold || '#e6b03c', Gd = o.dark || '#a3761c', J = o.jewel || '#59d6ea';
    for (var x = 0; x <= 12; x++) for (var y = 0; y <= 14; y++) {
      var d = Math.sqrt(Math.pow(x - CX, 2) + Math.pow(y - 11, 2));
      if (d <= 5.6 && d >= 3.4) {
        v.set(x, y, 0, Gd); v.set(x, y, 1, G);
        if (d > 4.7) v.set(x, y, 2, shade(G, 0.94));
      }
      if (d < 3.4) v.set(x, y, 0, Gd);
    }
    v.set(CX, 11, 1, J); v.set(CX, 11, 2, mixHex(J, '#ffffff', 0.45));
    v.set(CX, 12, 1, shade(J, 0.82)); v.set(CX, 10, 1, shade(J, 0.82));
    v.set(CX - 1, 11, 1, shade(J, 0.68)); v.set(CX + 1, 11, 1, shade(J, 0.68));
    for (var y2 = 0; y2 <= 8; y2++) {
      v.set(CX, y2, 0, Gd); v.set(CX, y2, 1, G); v.set(CX, y2, 2, shade(G, 0.96));
      v.set(CX - 1, y2, 1, Gd); v.set(CX + 1, y2, 1, Gd);
    }
    [[CX + 1, 1], [CX + 2, 1], [CX + 1, 2]].forEach(function (p) { v.set(p[0], p[1], 0, Gd); v.set(p[0], p[1], 1, G); });
    [[CX + 1, 4], [CX + 2, 4], [CX + 3, 4], [CX + 1, 3], [CX + 2, 3]].forEach(function (p) { v.set(p[0], p[1], 0, Gd); v.set(p[0], p[1], 1, G); });
    v.emissive[J] = J;
    return v;
  }

  /* ---------- pass ticket ---------- */
  function ticket(o) {
    o = o || {};
    var v = new Vox();
    var A = o.a || '#e6b03c', B = o.b || '#a3761c', C = o.c || '#59d6ea';
    for (var x = 0; x <= 15; x++) for (var y = 0; y <= 10; y++) {
      v.set(x, y, 0, B);
      v.set(x, y, 1, A);
    }
    [[4, 0], [10, 0], [4, 10], [10, 10]].forEach(function (p) {
      v.del(p[0], p[1], 0); v.del(p[0], p[1], 1);
      v.del(p[0], p[1] === 0 ? 1 : 9, 0); v.del(p[0], p[1] === 0 ? 1 : 9, 1);
    });
    for (var x2 = 2; x2 <= 13; x2++) for (var y2 = 2; y2 <= 8; y2++) {
      v.set(x2, y2, 1, o.panel || '#221a10');
    }
    var s = [[7, 7], [6, 6], [8, 6], [7, 6], [7, 5], [6, 5], [8, 5], [5, 5], [9, 5], [7, 4], [7, 3]];
    s.forEach(function (p) { v.set(p[0], p[1], 1, C); });
    for (var y3 = 0; y3 <= 10; y3++) if (y3 % 2 === 0) v.set(15, y3, 1, B);
    v.emissive[C] = C;
    return v;
  }

  /* ---------- shard ---------- */
  function shard(o) {
    o = o || {};
    var v = new Vox(), CX = 6, CZ = 6;
    var C = o.color || '#59d6ea';
    var prof = [1, 3, 5, 6, 7, 7, 6, 5, 3, 1];
    for (var y = 0; y < prof.length; y++) {
      var half = prof[y] / 2;
      for (var x = Math.floor(CX - half); x <= Math.ceil(CX + half); x++)
        for (var z = Math.floor(CZ - half); z <= Math.ceil(CZ + half); z++) {
          var d = Math.sqrt(Math.pow(x - CX, 2) + Math.pow(z - CZ, 2));
          if (d > half + 0.35) continue;
          v.set(x, y, z, d > half - 1 ? C : mixHex(C, '#ffffff', 0.32));
        }
    }
    v.emissive[C] = C;
    v.emissive[mixHex(C, '#ffffff', 0.32)] = mixHex(C, '#ffffff', 0.16);
    return v;
  }

  /* ---------- chest ---------- */
  function chest(o) {
    o = o || {};
    var v = new Vox();
    var W = o.wood || ['#9c6a37', '#a87340', '#8c5e30'], B = o.band || '#43382c', G = o.gold || '#e6b03c';
    for (var x = 0; x <= 14; x++) for (var y = 0; y <= 8; y++) for (var z = 0; z <= 10; z++) {
      if (x > 0 && x < 14 && y > 0 && y < 8 && z > 0 && z < 10) continue;
      var c = grain(x, y, z, W);
      if (y === 0) c = shade(W[0], 0.76);
      if (y === 5) c = B;
      if ((x === 0 || x === 14) && (z === 0 || z === 10)) c = B;
      v.set(x, y, z, c);
    }
    for (var lx = 0; lx <= 14; lx++) for (var lz = 0; lz <= 10; lz++) {
      var lc = W[1];
      if (lz === 0 || lz === 10) lc = B;
      if (lx === 0 || lx === 14) lc = B;
      v.set(lx, 9, lz, lc);
    }
    v.box(6, 4, 10, 8, 6, 10, G);
    v.set(7, 5, 10, '#2e2210');
    v.emissive[G] = G;
    return v;
  }

  /* ---------- castle ---------- */
  function castle(o) {
    o = o || {};
    var v = new Vox();
    var ST = o.stone || ['#8b8f96', '#7c8089', '#989ea6'];
    var GR = o.grass || '#5f9a45', RF = o.roof || '#b5503f', FLAG = o.flag || '#e6b03c';
    for (var x = 0; x <= 14; x++) for (var z = 0; z <= 14; z++) {
      if (Math.hypot(x - 7, z - 7) > 7.6) continue;
      v.set(x, 0, z, grain(x, 0, z, ST));
      v.set(x, 1, z, grain(x, 1, z, [GR, shade(GR, 0.9), shade(GR, 1.1)]));
    }
    for (var kx = 4; kx <= 10; kx++) for (var kz = 4; kz <= 10; kz++) for (var ky = 2; ky <= 8; ky++) {
      var edge = kx === 4 || kx === 10 || kz === 4 || kz === 10;
      if (!edge && ky < 8) continue;
      v.set(kx, ky, kz, ky === 8 ? RF : grain(kx, ky, kz, ST));
    }
    for (var bx = 4; bx <= 10; bx++) for (var bz = 4; bz <= 10; bz++) {
      var e2 = bx === 4 || bx === 10 || bz === 4 || bz === 10;
      if (e2 && (bx + bz) % 2 === 0) v.set(bx, 9, bz, grain(bx, 9, bz, ST));
    }
    for (var tx = 6; tx <= 8; tx++) for (var tz = 6; tz <= 8; tz++) for (var ty = 9; ty <= 12; ty++) {
      if (tx === 7 && tz === 7 && ty < 12) continue;
      v.set(tx, ty, tz, ty >= 12 ? RF : grain(tx, ty, tz, ST));
    }
    v.set(7, 13, 7, FLAG); v.set(7, 14, 7, FLAG); v.set(7, 15, 7, shade(FLAG, 0.8));
    for (var pz = 11; pz <= 14; pz++) v.set(7, 2, pz, '#c8b389');
    v.emissive[FLAG] = FLAG;
    return v;
  }

  /* ---------- spawner ---------- */
  function spawner(o) {
    o = o || {};
    var v = new Vox(), S = 11;
    var A = o.a || '#7f8794', B = o.b || '#4c525c', CORE = o.core || '#59d6ea';
    for (var x = 0; x < S; x++) for (var y = 0; y < S; y++) for (var z = 0; z < S; z++) {
      var edge = x === 0 || x === S - 1 || y === 0 || y === S - 1 || z === 0 || z === S - 1;
      if (!edge) continue;
      var rib = x === 2 || x === S - 3 || y === 2 || y === S - 3 || z === 2 || z === S - 3;
      v.set(x, y, z, rib ? B : grain(x, y, z, [A, shade(A, 0.93), shade(A, 1.06)]));
    }
    v.set(S - 1, 5, 5, CORE); v.set(5, 5, S - 1, CORE);
    v.set(S - 1, 6, 5, mixHex(CORE, '#ffffff', 0.45));
    v.set(5, 6, S - 1, mixHex(CORE, '#ffffff', 0.45));
    v.emissive[CORE] = CORE;
    v.emissive[mixHex(CORE, '#ffffff', 0.45)] = mixHex(CORE, '#ffffff', 0.3);
    return v;
  }

  /* ---------- pixel icon art ---------- */

  /* ---- icon art: 16-wide pixel sprites, built to read at 120px ---- */

  // Vertical crystal: symmetric, solid, unambiguously a shard.
  // Deliberately no alternating highlight voxels — at 120px they read as a
  // barcode rather than as facets.
  var SHARD_ROWS = [
    '.......##.......',
    '......#LL#......',
    '......#LL#......',
    '.....#LLLL#.....',
    '.....#LLLL#.....',
    '....#LLLLLL#....',
    '....#LLLLLL#....',
    '....#LLLLLL#....',
    '....#LLLLLL#....',
    '....#LLLLLL#....',
    '....#LLLLLL#....',
    '.....#LLLL#.....',
    '.....#LLLL#.....',
    '.....#LLLL#.....',
    '....#LLLLLL#....',
    '....#LLLLLL#....',
    '.....#LLLL#.....',
    '......#LL#......',
    '......#LL#......',
    '.......##.......'
  ];

  // Key: ring bow with a jewel at the top, straight shaft, two teeth.
  var KEY_ROWS = [
    '................',
    '.....#####......',
    '....##GGG##.....',
    '...##G###G##....',
    '...#GG#J#GG#....',
    '...#G##J##G#....',
    '...#GG###GG#....',
    '....##GGG##.....',
    '.....#####......',
    '......#D#.......',
    '......#D#.......',
    '......#D#.......',
    '......#DD#......',
    '......#D#.......',
    '......#DD#......',
    '......#D#.......',
    '......#D#.......',
    '......#D#.......',
    '......#D#.......',
    '.......#........'
  ];

  // Ticket: a 30-day pass card — dark body, gold border, bright star, and a
  // punched notch on the left so it reads as a stub rather than a screen.
  var TICKET_ROWS = [
    '................',
    '..############..',
    '..#PPPPPPPPPP#..',
    '..#PGGGGGGGGP#..',
    '..#PGGGGGGGGP#..',
    '.#PPGG#GG#GGPP#.',
    '.#PPG##GG##GPP#.',
    '.#PPG#GGGG#GPP#.',
    '.#PPG##GG##GPP#.',
    '.#PPGG#GG#GGPP#.',
    '..#PGGGGGGGGP#..',
    '..#PGGGGGGGGP#..',
    '..#PPPPPPPPPP#..',
    '..############..',
    '................',
    '................'
  ];

  // Chest: banded lid, wood body, big readable gold lock.
  var CHEST_ROWS = [
    '................',
    '....########....',
    '...#WWWWWWWW#...',
    '..#WWWWWWWWWW#..',
    '..#WWWWWWWWWW#..',
    '..############..',
    '..#DDDDDDDDDD#..',
    '..#DDDDGGDDDD#..',
    '..#DDDGGGGDDD#..',
    '..#DDDGGGGDDD#..',
    '..#DDDGGGGDDD#..',
    '..#DDDDGGDDDD#..',
    '..#DDDDDDDDDD#..',
    '..#DDDDDDDDDD#..',
    '...##########...',
    '................'
  ];

  /* Crown: generated rather than hand-painted, because hand-authored ASCII
     rows kept producing floating prongs. */
  function crownRows() {
    var W = 17, H = 15, g = [];
    for (var y = 0; y < H; y++) g.push(new Array(W).fill('.'));
    function px(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch; }
    function rect(x0, x1, y0, y1, ch) {
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) px(x, y, ch);
    }
    // three prongs, each 3 wide so they read as solid towers
    rect(2, 4, 3, 8, 'G');
    rect(7, 9, 1, 8, 'G');
    rect(12, 14, 3, 8, 'G');
    // jewel caps
    px(2, 2, 'L'); px(3, 2, 'L'); px(4, 2, 'L');
    px(7, 0, 'L'); px(8, 0, 'L'); px(9, 0, 'L');
    px(12, 2, 'L'); px(13, 2, 'L'); px(14, 2, 'L');
    // valleys between the prongs, one course deep
    rect(5, 6, 8, 8, 'g');
    rect(10, 11, 8, 8, 'g');
    // body + jewel band
    rect(2, 14, 9, 10, 'G');
    rect(2, 14, 11, 12, 'g');
    for (var jy = 9; jy <= 10; jy++) for (var jx = 7; jx <= 9; jx++) px(jx, jy, 'R');
    // outline, skipping the jewel
    var out = g.map(function (r) { return r.slice(); });
    for (var y2 = 1; y2 < H; y2++) for (var x2 = 1; x2 < W - 1; x2++) {
      if (g[y2][x2] === '.' || g[y2][x2] === 'R' || g[y2][x2] === 'L') continue;
      if (g[y2][x2 - 1] === '.' || g[y2][x2 + 1] === '.' || g[y2 - 1][x2] === '.') out[y2][x2] = '#';
    }
    return out.map(function (r) { return r.join(''); });
  }
  var CROWN_ROWS = crownRows();


  /* ---- constructors that produce icon badges ---- */
  function shardIcon(o) {
    o = o || {};
    var C = o.color || '#2FD8F0';
    var pal = {
      '#': shade(C, 0.34),
      L: C,
      s: mixHex(C, '#ffffff', 0.72)
    };
    var m = icon(SHARD_ROWS, pal, { glowKeys: ['L', 's'] });
    m.facet = true;
    return m;
  }
  function keyIcon(o) {
    o = o || {};
    var G = o.gold || '#E6B03C';
    var J = o.jewel || '#5CD8EA';
    return icon(KEY_ROWS, {
      '#': shade(G, 0.40), G: G, D: shade(G, 0.70), J: J
    }, { glowKeys: ['J'] });
  }
  function ticketIcon(o) {
    o = o || {};
    var A = o.a || '#E6B03C';
    var C = o.c || '#5CD8EA';
    return icon(TICKET_ROWS, {
      '#': shade(A, 0.38), P: o.panel || '#2A2214',
      G: A, S: C
    }, { glowKeys: ['S'] });
  }
  function chestIcon(o) {
    o = o || {};
    var W = o.wood || '#A87340';
    return icon(CHEST_ROWS, {
      '#': '#3A2A18', W: W, D: shade(W, 0.62), G: o.gold || '#E6B03C'
    }, { glowKeys: ['G'] });
  }
  function crownIcon(o) {
    o = o || {};
    var G = o.gold || '#E6B03C';
    return icon(CROWN_ROWS, {
      '#': shade(G, 0.34), G: G, g: shade(G, 0.62),
      R: o.jewel || '#E8546A'
    }, { glowKeys: ['R'] });
  }

  /* Explicit height maps for the crest: the rim stands proud, the field is
     dished, the gem sits highest. Without this the dome fallback makes the
     whole badge a single smooth bump. */
  function crestHeights(o) {
    o = o || {};
    var GW = 19, GH = 23, CX = 9;
    function halfAt(y) {
      if (y <= 7) return 9;
      var t = (y - 7) / (GH - 7);
      return Math.max(0, 9 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.75)), 0.62));
    }
    var hm = [];
    for (var y = 0; y < GH; y++) {
      hm[y] = [];
      var half = halfAt(y);
      for (var x = 0; x < GW; x++) {
        var dx = Math.abs(x - CX);
        if (dx > half) { hm[y][x] = null; continue; }
        var rimW = half < 3 ? 0.9 : 1.7;
        var inset = Math.min(half - dx, Math.min(y, GH - 1 - y));
        // rim sits proud; field is one step down. Flat field keeps the gem's
        // painted facets as the only normal source there.
        hm[y][x] = (dx > half - rimW || y === 0 || y >= GH - 2) ? 3 : 2;
      }
    }
    return hm;
  }
  global.MXArt = {
    Vox: Vox, render: render, mix: mixHex, shade: shade, add: addHex, grain: grain, hash: hash,
    crateKey: crateKey, crest: badge, rankItem: rankItem, badge: badge, crest3d: crest3d, crystal: crystal, potionSprite: potionSprite, plusBadge: plusBadge, protBlock: protBlock, potion: potion, key: key,
    ticket: ticket, shard: shard, chest: chest, castle: castle, spawner: spawner,
    icon: icon, Sprite: Sprite, starInto: starInto, shardIcon: shardIcon, keyIcon: keyIcon, ticketIcon: ticketIcon, crestHeights: crestHeights,
    chestIcon: chestIcon, crownIcon: crownIcon
  };
})(window);



