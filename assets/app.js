/* ============================================================
   MineX Store — shared app layer
   catalog · cart · shared chrome · art mounting
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- catalog ---------------- */
  // Every price below mirrors the live store.
  var CATALOG = {
    ranks: [
      { id: 'squire', name: 'Squire', roman: 'I', price: 5, tint: '#9AA6BA', tagline: 'The starter rank. Identity, kits, a place to keep things.',
        marquee: ['/kit squire every 30 days', '2 homes', '1 vault row'],
        perks: ['<code>/kit squire</code> — 30-day cooldown', '<code>/sethome</code> × 2 homes', '<code>/vault</code> · 1 row', 'No upkeep — yours forever'] },
      { id: 'knight', name: 'Knight', roman: 'II', price: 15, tint: '#6FA8DC', tagline: 'Ender chest anywhere. The first rank that changes how you play.',
        marquee: ['/ec anywhere', '4 homes', '2 vault rows'],
        perks: ['<code>/ec</code> — ender chest anywhere', '<code>/sethome</code> × 4 homes', '<code>/vault</code> · 2 rows', 'All Squire perks included'] },
      { id: 'lord', name: 'Lord', roman: 'III', price: 30, tint: '#A78BFA', tagline: 'Nicknames with colour, private voice groups, more room.',
        marquee: ['/nick with colours', '6 homes', 'private voice'],
        perks: ['<code>/nick</code> with colours', 'Private voice groups', '<code>/sethome</code> × 6 homes', 'All Knight perks included'] },
      { id: 'king', name: 'King', roman: 'IV', price: 25, total: 50, plan: '4 × $6.25 weekly', tint: '#E2823C', tagline: 'Claim flight and a warp for your own builds.',
        marquee: ['/fly in claims', '/pwarp ×1', 'fast /back'],
        perks: ['<code>/fly</code> inside your claims', '<code>/pwarp</code> × 1 player warp', 'Fast <code>/back</code> recovery', 'All Lord perks included'] },
      { id: 'emperor', name: 'Emperor', roman: 'V', price: 37.5, total: 75, plan: '4 × $9.38 weekly', tint: '#F1C34C', top: true, tagline: 'The last rank. Maximum limits, the full utility suite.',
        marquee: ['max homes + vaults', 'priority queue', 'everything below'],
        perks: ['Max homes, vaults and land claims', 'Priority queue on full servers', 'Full utility suite, no restrictions', 'Everything Squire → King included'] }
    ],
    crates: [
      /* Materials follow the name. A "Mythic" crate should not be a wooden box,
         and "Common" should not look like endgame loot. Each tier has its own
         construction: wood, banded wood, iron-bound, runed stone, gilded, and
         finally obsidian with a glowing core. */
      { id: 'spawner', name: 'Spawner Crate', tier: 'Special', price: 1.99, tint: '#9AA6BA', blurb: 'One sealed spawner core. 64 possibilities.',
        glow: '#7CFFB0',
        art: { style: 'sealed', metal: '#A8B49A', gem: '#7CFFB0' },
        headline: 'Spawner core', chance: '100%',
        odds: [
          ['Spawner core', 100, 0.0],
          ['Bonus dust × 8', 35, 0.10],
          ['Golden egg', 4, 0.35],
          ['Iron block × 16', 22, 0.05],
          ['Diamond × 4', 9, 0.20]
        ] },

      { id: 'common', name: 'Common Crate', tier: 'Tier I', price: 2.99, tint: '#7BA05B', blurb: 'Protection IV netherite, ready to wear.',
        glow: '#A8F07A',
        art: { style: 'plain', metal: '#93A083', gem: '#A8F07A' },
        headline: 'Prot IV piece', chance: '100%',
        odds: [
          ['Protection IV piece', 100, 0.0],
          ['Mending book', 40, 0.12],
          ['Ancient scrap × 2', 8, 0.40],
          ['Netherite ingot', 14, 0.16],
          ['XP bottle × 32', 26, 0.05]
        ] },

      { id: 'rare', name: 'Rare Crate', tier: 'Tier II', price: 5.99, tint: '#4F9CF0', blurb: 'Beyond-vanilla enchants start here.',
        glow: '#6FD8FF',
        art: { style: 'iron', metal: '#7FA8CC', gem: '#6FD8FF' },
        headline: 'Tier-II piece', chance: '100%',
        odds: [
          ['Tier-II enchanted piece', 100, 0.0],
          ['Double-enchant roll', 30, 0.15],
          ['Rare trim', 6, 0.45],
          ['Netherite upgrade', 12, 0.22],
          ['Enchanted book × 2', 20, 0.08]
        ] },

      { id: 'epic', name: 'Epic Crate', tier: 'Tier III', price: 10.99, tint: '#A78BFA', blurb: 'Stacked multi-enchant gear with particle traits.',
        glow: '#C9A8FF',
        art: { style: 'runed', metal: '#A98BD8', gem: '#C9A8FF' },
        headline: 'Triple-enchant gear', chance: '100%',
        odds: [
          ['Triple-enchant gear', 100, 0.0],
          ['Particle trait', 25, 0.18],
          ['Gilded trim', 7, 0.42],
          ['Mending + Unbreaking III', 18, 0.14],
          ['Shard bundle × 250', 10, 0.3]
        ] },

      { id: 'legendary', name: 'Legendary Crate', tier: 'Tier IV', price: 27.99, tint: '#F1C34C', blurb: 'Shogun set. Five unbreakable pieces.',
        glow: '#FFDE7A',
        art: { style: 'gilded', metal: '#E8C874', gem: '#FFDE7A' },
        headline: 'Shogun piece', chance: '100%',
        odds: [
          ['Shogun armour piece', 100, 0.0],
          ['Skinned + tradeable', 18, 0.20],
          ['Full-set aura', 3, 0.50],
          ['Shogun weapon', 12, 0.25],
          ['Unbreakable roll', 8, 0.40]
        ] },

      { id: 'mythic', name: 'Mythic Crate', tier: 'Endgame', price: 34.99, tint: '#F0687E', blurb: 'Dragon Knight. Six mythic pieces. The endgame set.',
        glow: '#FF6FD8',
        art: { style: 'obsidian', metal: '#B75BA8', gem: '#FF6FD8' },
        headline: 'Dragon Knight piece', chance: '100%',
        odds: [
          ['Dragon Knight piece', 100, 0.0],
          ['Skinned + tradeable', 15, 0.22],
          ['Wings trait', 2, 0.55],
          ['Dragon scale × 4', 10, 0.4],
          ['Mythic weapon roll', 6, 0.5]
        ] }
    ],
    land: [
      { id: 'p1', name: 'Protection Block I', tier: 'Tier I', tag: 'Outpost', size: 25, price: 2.0, tint: '#7BA05B', blurb: '25³ blocks. Your first claim — enough for a base and a farm.',
        perks: ['Anti-grief, PvP disabled inside', 'Trust list for friends', 'Retrieve later with <code>/fo retrieve</code>'],
        art: { a: '#6d4a26', b: '#3f9c6c', emblem: '#d8ffe0', core: '#4ce0a0', mark: 'dot' } },
      { id: 'p2', name: 'Protection Block II', tier: 'Tier II', tag: 'Hamlet', size: 49, price: 4.5, tint: '#4F9CF0', blurb: '49³ blocks. Room for a full compound with your friends.',
        perks: ['Per-player trust, containers included', 'Everything in Block I', 'Retrieve later with <code>/fo retrieve</code>'],
        art: { a: '#6d4a26', b: '#3f7fc0', emblem: '#d8f0ff', core: '#4fb8ff', mark: 'cross' } },
      { id: 'p3', name: 'Protection Block III', tier: 'Tier III', tag: 'Town', size: 97, price: 18.5, tint: '#A78BFA', blurb: '97³ blocks. Sub-flags and PvE toggles for a whole settlement.',
        perks: ['Sub-flags and PvE toggle', 'Everything in Block II', 'Retrieve later with <code>/fo retrieve</code>'],
        art: { a: '#6d4a26', b: '#7c5cc4', emblem: '#eee0ff', core: '#b18cff', mark: 'star' } },
      { id: 'p4', name: 'Protection Block IV', tier: 'Tier IV', tag: 'Capital', size: 193, price: 34.0, tint: '#F1C34C', blurb: '193³ blocks. The largest cube — full flag control.',
        perks: ['Full flag control, largest cube', 'Everything in Block III', 'Sellers keep 70% on resale'],
        art: { a: '#6d4a26', b: '#b8912f', emblem: '#fff3cf', core: '#ffd75e', mark: 'crown' } }
    ],
    passes: [
      { id: 'pass-plus', name: 'MineX+ Pass', price: 10, tint: '#57D9EF', days: 30, blurb: 'Premium limits and the utility suite, for 30 days.',
        perks: ['Premium limits across all systems', 'Utility command access', 'Each payment adds 30 days — never auto-renews'] },
      { id: 'pass-plus-plus', name: 'MineX++ Pass', price: 25, tint: '#A78BFA', days: 30, blurb: 'Maximum limits, priority queue, full suite.',
        perks: ['Max limits on every system', 'Priority queue on full servers', 'Full utility suite, 30 days'] }
    ],
    boosters: [
      { id: 'booster-pack', name: 'Shard Booster Pack', price: 1, tint: '#57D9EF', blurb: '3 × 1-hour boosters. ×2 shards for the whole server.',
        perks: ['3 × 1-hour global ×2 boosters', 'Activate whenever you want', 'Queued hours, never wasted'] }
    ]
  };

  /* ---------------- state ---------------- */
  var LS_CART = 'minex-cart-v8';
  var LS_USER = 'minex-user-v8';
  var LS_THEME = 'minex-theme-v8';

  var state = { cart: [], user: 'Steve_Example', theme: 'dark' };

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_CART) || '[]');
      if (Array.isArray(c)) state.cart = c.filter(function (x) { return x && x.id && typeof x.price === 'number'; });
    } catch (e) { }
    try {
      var u = localStorage.getItem(LS_USER);
      if (u) state.user = u;
    } catch (e) { }
    try {
      var t = localStorage.getItem(LS_THEME);
      if (t === 'light' || t === 'dark') state.theme = t;
      else {
        var attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'light' || attr === 'dark') state.theme = attr;
        else if (global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches) state.theme = 'light';
      }
    } catch (e) { }
  }
  function persist() {
    try {
      localStorage.setItem(LS_CART, JSON.stringify(state.cart));
      localStorage.setItem(LS_USER, state.user);
      localStorage.setItem(LS_THEME, state.theme);
    } catch (e) { }
  }

  /* ---------------- helpers ---------------- */
  function money(n) {
    return '$' + (Math.round(n * 100) / 100).toFixed(2);
  }
  function splitPrice(n) {
    var s = (Math.round(n * 100) / 100).toFixed(2).split('.');
    return { whole: s[0], dec: s[1] };
  }
  function el(sel, root) { return (root || document).querySelector(sel); }
  function els(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------------- theme ---------------- */
  var SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24"><path d="M20 14.2A8.4 8.4 0 019.8 4 8.5 8.5 0 1020 14.2z"/></svg>';

  function applyTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    var sc = t === 'dark' ? 'url("assets/img/spawn-night.png")' : 'url("assets/img/spawn-day.png")';
    document.documentElement.style.setProperty('--scene-img', sc);
    els('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      b.innerHTML = t === 'dark' ? SUN : MOON;
    });
    persist();
  }

  /* ---------------- art mounting ---------------- */
  var ART_KIND = {
    crate: function (spec) { return MXArt.crateKey(spec); },
    crest: function (spec) { return MXArt.crest(spec); },
    rank: function (spec) { return MXArt.rankItem(spec.id || 'squire'); },
    land: function (spec) { return MXArt.protBlock(spec); },
    flask: function (spec) { return MXArt.potionSprite(spec); },
    plusbadge: function (spec) { return MXArt.plusBadge(spec); },
    shard: function (spec) { return MXArt.shardIcon(spec); },
    key: function (spec) { return MXArt.keyIcon(spec); },
    ticket: function (spec) { return MXArt.ticketIcon(spec); },
    chest: function (spec) { return MXArt.chestIcon(spec); },
    crown: function (spec) { return MXArt.crownIcon(spec); },
    castle: function (spec) { return MXArt.castle(spec); },
    spawner: function (spec) { return MXArt.spawner(spec); }
  };

  // cache of rendered data URLs keyed by kind+spec
  var artCache = {};
  function artDataURL(kind, spec, size) {
    var key = kind + '|' + JSON.stringify(spec) + '|' + size;
    if (artCache[key]) return artCache[key];
    var mk = ART_KIND[kind];
    if (!mk) return null;
    var cv = document.createElement('canvas');
    MXArt.render(mk(spec || {}), cv, { size: size || 300 });
    var url = cv.toDataURL('image/png');
    artCache[key] = url;
    return url;
  }

  function mountArt(root) {
    els('canvas[data-art]', root || document).forEach(function (cv) {
      if (cv.dataset.done) return;
      var kind = cv.dataset.art;
      var spec = {};
      try { spec = JSON.parse(cv.dataset.spec || '{}'); } catch (e) { }
      var mk = ART_KIND[kind];
      if (!mk) return;
      try {
        MXArt.render(mk(spec), cv, { size: parseInt(cv.dataset.size || '300', 10) });
        cv.dataset.done = '1';
      } catch (e) { console.warn('art failed', kind, e); }
    });
  }

  /* ---------------- cart ---------------- */
  function cartCount() {
    return state.cart.reduce(function (n, i) { return n + (i.qty || 1); }, 0);
  }
  function cartTotal() {
    return state.cart.reduce(function (n, i) { return n + i.price * (i.qty || 1); }, 0);
  }
  function cartSavings() {
    return state.cart.reduce(function (n, i) { return n + ((i.was || 0) - i.price) * (i.qty || 1); }, 0);
  }
  function addToCart(item) {
    var found = state.cart.filter(function (i) { return i.id === item.id; })[0];
    if (found) found.qty = (found.qty || 1) + (item.qty || 1);
    else state.cart.push({ id: item.id, name: item.name, price: item.price, was: item.was || 0, kind: item.kind || 'item', sub: item.sub || '', qty: item.qty || 1 });
    persist();
    syncCartUI();
    openCart();
    toast(item.name + ' added');
    bumpCart();
  }
  function removeFromCart(id) {
    state.cart = state.cart.filter(function (i) { return i.id !== id; });
    persist(); syncCartUI();
  }
  function setQty(id, q) {
    var it = state.cart.filter(function (i) { return i.id === id; })[0];
    if (!it) return;
    it.qty = Math.max(1, Math.min(99, q));
    persist(); syncCartUI();
  }

  function syncCartUI() {
    var n = cartCount(), t = cartTotal();
    els('[data-cart-num]').forEach(function (e) {
      e.textContent = n;
      e.style.display = n ? '' : 'none';
    });
    els('[data-cart-total]').forEach(function (e) { e.textContent = t > 0 ? money(t) : ''; });
    els('[data-user]').forEach(function (e) { e.value = state.user; });
    var body = el('[data-cart-body]');
    if (body) renderCartBody(body);
    var sum = el('[data-cart-sum]');
    if (sum) renderCartSummary(sum);
  }

  function renderCartBody(body) {
    if (!state.cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
        '<div class="ic"><svg viewBox="0 0 24 24"><path d="M4 7h16l-1.4 12.2a2 2 0 01-2 1.8H7.4a2 2 0 01-2-1.8L4 7z"/><path d="M9 7V5a3 3 0 016 0v2"/></svg></div>' +
        '<b>Your basket is empty</b>' +
        '<p>Ranks, crate keys and protection blocks all deliver to your Minecraft name.</p>' +
        '</div>';
      return;
    }
    var kindMap = { rank: 'crest', crate: 'crate', land: 'land', pass: 'ticket', booster: 'flask' };
    var specMap = {
      squire: { rim: '#B9C4D6', face: '#4E5B72', face2: '#3B4658', inner: '#1B2233', gem: '#BFE1F0', prongs: 1 },
      knight: { rim: '#8FC0EE', face: '#2F5C8E', face2: '#244667', inner: '#132437', gem: '#8FE6FF', prongs: 2 },
      lord: { rim: '#BBA6FF', face: '#5B3F96', face2: '#472F76', inner: '#221640', gem: '#D6C6FF', prongs: 3 },
      king: { rim: '#F0A85C', face: '#A34A22', face2: '#7E3818', inner: '#3A1608', gem: '#FFD9A8', prongs: 3, tip: '#FFD9A8' },
      emperor: { rim: '#F1C34C', face: '#8D2440', face2: '#6A1A2F', inner: '#2A0E18', gem: '#FFE9A8', prongs: 5, tip: '#FFF2C4', wings: true }
    };
    var html = state.cart.map(function (i) {
      var kind = kindMap[i.kind] || 'chest';
      var spec;
      if (i.kind === 'rank') spec = specMap[i.rankId] || specMap.squire;
      else if (i.kind === 'crate') spec = i.spec || {};
      else if (i.kind === 'land') spec = i.spec || {};
      else if (i.kind === 'pass') spec = { a: '#DDE5F2', b: '#8A98AE', c: i.tint || '#57D9EF' };
      else if (i.kind === 'booster') spec = {};
      else spec = {};
      var url = artDataURL(kind, spec, 200);
      return '<div class="cart-item">' +
        '<div class="thumb">' + (url ? '<img src="' + url + '" alt="" style="width:100%;height:100%;object-fit:contain">' : '') + '</div>' +
        '<div class="info"><b>' + esc(i.name) + '</b><span>' + esc(i.sub || 'Delivers to ' + state.user) + '</span>' +
        '<div class="stepper" style="margin-top:5px;width:max-content">' +
        '<button data-qty="-" data-id="' + esc(i.id) + '" aria-label="Decrease">−</button>' +
        '<span>' + (i.qty || 1) + '</span>' +
        '<button data-qty="+" data-id="' + esc(i.id) + '" aria-label="Increase">+</button>' +
        '</div></div>' +
        '<div class="right"><span class="pr">' + money(i.price * (i.qty || 1)) + '</span>' +
        '<button class="rm" data-remove="' + esc(i.id) + '">Remove</button></div>' +
        '</div>';
    }).join('');
    body.innerHTML = html;
  }

  function renderCartSummary(sum) {
    var total = cartTotal(), saved = cartSavings();
    sum.innerHTML =
      '<div class="sum">' +
      '<div class="row"><span>Subtotal</span><b>' + money(total) + '</b></div>' +
      (saved > 0 ? '<div class="row save"><span>Launch offer applied</span><b>−' + money(saved) + '</b></div>' : '') +
      '<div class="row"><span>Delivery</span><b>Instant, in-game</b></div>' +
      '<div class="total"><span>Total</span><b>' + money(total) + '</b></div>' +
      '</div>';
  }

  function openCart() {
    var d = el('[data-drawer]'), s = el('[data-scrim]');
    if (d) d.classList.add('on');
    if (s) s.classList.add('on');
    document.body.style.overflow = 'hidden';
    var inp = el('[data-user]');
    if (inp) setTimeout(function () { inp.focus(); }, 340);
  }
  function closeCart() {
    var d = el('[data-drawer]'), s = el('[data-scrim]');
    if (d) d.classList.remove('on');
    if (s) s.classList.remove('on');
    document.body.style.overflow = '';
  }
  function bumpCart() {
    var b = el('[data-cart-num]');
    if (!b) return;
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  }

  /* ---------------- toast ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var t = el('[data-toast]');
    if (!t) return;
    t.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4.5 12.5l5 5 10-11"/></svg>' + esc(msg);
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2100);
  }

  /* ---------------- shared chrome ---------------- */
  function navHTML(active) {
    var items = [
      ['index.html', 'Store', 'store'],
      ['ranks.html', 'Ranks', 'ranks'],
      ['crates.html', 'Crates', 'crates'],
      ['protection.html', 'Protection', 'protection'],
      ['boosters.html', 'Boosters', 'boosters']
    ];
    return items.map(function (i) {
      return '<a href="' + i[0] + '"' + (active === i[2] ? ' class="on"' : '') + '>' + i[1] + '</a>';
    }).join('');
  }

  function mnavHTML(active) {
    return navHTML(active) + '<div class="mip">play.minex.gg · official store</div>';
  }

  function topHTML(active) {
    return '' +
      '<header class="top"><div class="top-in">' +
      '<button class="mnav-btn" data-mnav aria-label="Menu" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '<a class="brand" href="index.html">' +
      '<span class="brand-mark"><img src="assets/img/logo-mark.png" alt="MineX"></span>' +
      '<span class="brand-txt"><b>MineX</b><small>Server Store</small></span>' +
      '</a>' +
      '<nav class="links">' + navHTML(active) + '</nav>' +
      '<div class="top-right">' +
      '<button class="ip" data-copy-ip title="Copy server IP"><span class="dot"></span>play.minex.gg</button>' +
      '<button class="theme-btn" data-theme-toggle aria-label="Toggle theme"></button>' +
      '<button class="cart-btn" data-cart-btn data-open-cart>' +
      '<svg viewBox="0 0 24 24"><path d="M4 7h16l-1.4 12.2a2 2 0 01-2 1.8H7.4a2 2 0 01-2-1.8L4 7z"/><path d="M9 7V5a3 3 0 016 0v2"/></svg>' +
      '<span class="cart-label">Basket</span>' +
      '<span class="cart-n" data-cart-num>0</span>' +
      '</button>' +
      '</div></div>' +
      '<div class="mnav" data-mnav-panel>' + mnavHTML(active) + '</div>' +
      '</header>';
  }

  function drawerHTML() {
    return '' +
      '<div class="scrim" data-scrim></div>' +
      '<aside class="drawer" data-drawer aria-label="Basket">' +
      '<header class="drawer-head"><h3>Your basket</h3><span class="n" data-cart-num>0</span>' +
      '<button class="drawer-close" data-close-cart aria-label="Close">' +
      '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>' +
      '<div class="drawer-body" data-cart-body></div>' +
      '<div class="drawer-foot">' +
      '<div class="who-field"><label for="whoinp">Minecraft username</label>' +
      '<div class="inp"><input id="whoinp" data-user placeholder="Your in-game name" maxlength="16" spellcheck="false" autocomplete="off"></div></div>' +
      '<div data-cart-sum></div>' +
      '<button class="btn btn-primary btn-block" data-checkout>' +
      '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>Continue to secure checkout</button>' +
      '<div class="checkout-note"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8.5 10V7.5a3.5 3.5 0 017 0V10"/></svg>Card payment · verified server-side · instant delivery</div>' +
      '</div></aside>' +
      '<div class="toast" data-toast></div>';
  }

  function footHTML() {
    return '' +
      '<footer class="foot"><div class="foot-in">' +
      '<div class="foot-brand">' +
      '<a class="brand" href="index.html"><span class="brand-mark"><img src="assets/img/logo-mark.png" alt="MineX"></span>' +
      '<span class="brand-txt"><b>MineX</b><small>Server Store</small></span></a>' +
      '<p>The official store for play.minex.gg. Permanent ranks, previewable crate keys and player-traded protection.</p>' +
      '<button class="foot-ip" data-copy-ip>play.minex.gg <svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2"><rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a1 1 0 011-1h10"/></svg></button>' +
      '</div>' +
      '<div><h4>Shop</h4><ul>' +
      '<li><a href="ranks.html">Ranks</a></li><li><a href="crates.html">Crates</a></li>' +
      '<li><a href="protection.html">Protection</a></li><li><a href="boosters.html">Boosters</a></li>' +
      '<li><a href="ranks.html#passes">30-day passes</a></li></ul></div>' +
      '<div><h4>Support</h4><ul>' +
      '<li><a href="#" data-ext="discord">Discord community</a></li>' +
      '<li><a href="#" data-ext="faq">Delivery &amp; refunds</a></li>' +
      '<li><a href="#" data-ext="faq">How checkout works</a></li>' +
      '<li><a href="https://scan.minex.gg/market" target="_blank" rel="noopener">Player marketplace</a></li>' +
      '<li><a href="https://scan.minex.gg" target="_blank" rel="noopener">Item explorer</a></li></ul></div>' +
      '<div><h4 class="live">Server</h4><ul>' +
      '<li><a href="#" data-copy-ip>play.minex.gg</a></li>' +
      '<li><a href="#" data-ext="status">Status &amp; uptime</a></li>' +
      '<li><a href="#" data-ext="rules">Server rules</a></li>' +
      '<li><a href="#" data-ext="terms">Terms of service</a></li>' +
      '<li><a href="#" data-ext="privacy">Privacy</a></li></ul></div>' +
      '</div>' +
      '<div class="foot-base">' +
      '<span>© 2026 MineX · fan project for a private Minecraft server, not affiliated with Mojang or Microsoft</span>' +
      '<div class="pay"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span><span>APPLE PAY</span><span>GOOGLE PAY</span></div>' +
      '</div></footer>';
  }

  /* ---------------- wiring ---------------- */
  function boot(active) {
    load();

    var topSlot = el('[data-chrome-top]');
    if (topSlot) topSlot.outerHTML = topHTML(active);
    var footSlot = el('[data-chrome-foot]');
    if (footSlot) footSlot.outerHTML = footHTML();

    document.body.insertAdjacentHTML('beforeend', drawerHTML());

    applyTheme(state.theme);

    // theme
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-theme-toggle]');
      if (t) { applyTheme(state.theme === 'dark' ? 'light' : 'dark'); return; }

      var op = e.target.closest('[data-open-cart]');
      if (op) { openCart(); return; }
      var mn = e.target.closest('[data-mnav]');
      if (mn) {
        var panel = el('[data-mnav-panel]');
        if (panel) {
          var on = panel.classList.toggle('on');
          mn.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
        return;
      }
      var cl = e.target.closest('[data-close-cart]');
      if (cl) { closeCart(); return; }
      if (e.target.closest('[data-scrim]')) { closeCart(); return; }

      var cp = e.target.closest('[data-copy-ip]');
      if (cp) {
        e.preventDefault();
        try { navigator.clipboard.writeText('play.minex.gg'); } catch (err) { }
        cp.classList.add('copied');
        toast('Server IP copied');
        setTimeout(function () { cp.classList.remove('copied'); }, 1400);
        return;
      }

      var q = e.target.closest('[data-qty]');
      if (q) {
        var id = q.getAttribute('data-id');
        var it = state.cart.filter(function (i) { return i.id === id; })[0];
        if (it) setQty(id, (it.qty || 1) + (q.getAttribute('data-qty') === '+' ? 1 : -1));
        return;
      }
      var rm = e.target.closest('[data-remove]');
      if (rm) { removeFromCart(rm.getAttribute('data-remove')); return; }

      var ad = e.target.closest('[data-add]');
      if (ad) {
        e.preventDefault();
        var item = {};
        try { item = JSON.parse(ad.getAttribute('data-add')); } catch (err) { }
        if (item && item.id) addToCart(item);
        return;
      }

      var co = e.target.closest('[data-checkout]');
      if (co) {
        if (!state.cart.length) { toast('Your basket is empty'); return; }
        toast('Opening secure checkout⬦');
        return;
      }

      var ex = e.target.closest('[data-ext]');
      if (ex) { e.preventDefault(); toast('Coming soon on the live store'); return; }
    });

    // username binding
    document.addEventListener('input', function (e) {
      var inp = e.target.closest('[data-user]');
      if (!inp) return;
      state.user = inp.value.trim() || 'Steve_Example';
      els('[data-user]').forEach(function (o) { if (o !== inp) o.value = state.user; });
      persist();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCart();
    });

    // misc
    els('[data-copy-ip]').forEach(function (b) {
      if (b.tagName !== 'BUTTON') return;
    });

    syncCartUI();
    mountArt();
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveal() {
    document.documentElement.classList.add('js');
    var items = els('.rv');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (i) { i.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var d = parseFloat(en.target.getAttribute('data-delay') || '0');
          setTimeout(function () { en.target.classList.add('in'); }, d);
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '120px 0px 120px 0px', threshold: 0 });
    items.forEach(function (i) { io.observe(i); });

    // safety net: anything already in view, or that never fired, becomes visible
    setTimeout(function () {
      items.forEach(function (i) {
        if (i.classList.contains('in')) return;
        var r = i.getBoundingClientRect();
        if (r.top < window.innerHeight + 200) i.classList.add('in');
      });
    }, 900);
  }

  /* ---------------- hero parallax ---------------- */
  function initParallax() {
    var stage = el('[data-stage]');
    if (!stage) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = els('.stage-item', stage);
    var raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 2;
      ty = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    stage.addEventListener('mouseleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    function tick() {
      cx += (tx - cx) * .12;
      cy += (ty - cy) * .12;
      items.forEach(function (it, i) {
        var d = (i + 1) * 5;
        it.style.transform = 'translate3d(' + (cx * d) + 'px,' + (cy * d) + 'px,0)';
      });
      if (Math.abs(cx - tx) > .002 || Math.abs(cy - ty) > .002) raf = requestAnimationFrame(tick);
      else raf = null;
    }
  }

  global.MX = {
    CATALOG: CATALOG, state: state, boot: boot, mountArt: mountArt, artDataURL: artDataURL,
    money: money, splitPrice: splitPrice, el: el, els: els, esc: esc,
    addToCart: addToCart, openCart: openCart, closeCart: closeCart, toast: toast,
    initReveal: initReveal, initParallax: initParallax, syncCartUI: syncCartUI
  };
})(window);

