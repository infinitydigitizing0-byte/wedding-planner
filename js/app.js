"use strict";
/* Wedding Planner — everything stays on this device (localStorage). */
const KEY = "weddingplanner.v1";
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const addD = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffD = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtD = s => { if (!s) return ""; const d = pd(s); return `${DN[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
const byId = (a, id) => a.find(x => x.id === id);
const THEMES = [["blush", "Blush", "#C47A86", "#FBF6F4"], ["sage", "Sage", "#6F8F73", "#F2F5F1"], ["champagne", "Champagne", "#A9884F", "#FBF7F0"], ["dustyblue", "Dusty Blue", "#6C87A8", "#F1F4F8"], ["terracotta", "Terracotta", "#B9694E", "#FBF3EF"], ["classic", "Black & White", "#2E2A2B", "#F5F4F2"], ["dark", "Midnight", "#E9A8B4", "#15131A"]];
const COVERS = ["💍", "💐", "🤍", "🥂", "🌸", "🕊️", "✨", "💒", "🌿", "🎀", "🌹", "💌"];
const RSVP = [["invited", "✉️ Invited", "inv"], ["yes", "✅ Attending", "yes"], ["no", "❌ Declined", "no"], ["pending", "⏳ No reply", "wait"]];
const SIDES = ["Bride", "Groom", "Both"];
const GROUPS = ["Family", "Friends", "Work", "Plus-one", "Kids", "Other"];
const MEALS = ["—", "Chicken", "Beef", "Fish", "Vegetarian", "Vegan", "Kids meal"];
const VCAT = [["Venue", "🏛️"], ["Catering", "🍽️"], ["Photographer", "📸"], ["Videographer", "🎥"], ["Florist", "💐"], ["Music / DJ", "🎶"], ["Cake", "🎂"], ["Dress & Attire", "👗"], ["Hair & Makeup", "💄"], ["Rings", "💍"], ["Stationery", "💌"], ["Decor & Rentals", "🕯️"], ["Transport", "🚗"], ["Officiant", "📜"], ["Honeymoon", "🏝️"], ["Other", "✨"]];
const vcatE = c => (VCAT.find(v => v[0] === c) || VCAT[15])[1];
const CHECK0 = [[365, "Set your budget"], [365, "Draft the guest list"], [360, "Choose a date"], [350, "Book the venue"], [330, "Hire a planner (optional)"], [300, "Book photographer"], [300, "Book caterer"], [270, "Book band / DJ"], [270, "Shop for the dress"], [240, "Choose wedding party"], [240, "Send save-the-dates"], [210, "Book florist"], [180, "Book hair & makeup"], [180, "Order wedding cake"], [180, "Plan honeymoon"], [150, "Book transport"], [120, "Order invitations"], [120, "Buy wedding rings"], [90, "Book officiant"], [75, "Final dress fitting booked"], [60, "Send invitations"], [45, "Choose readings & vows"], [30, "Apply for marriage licence"], [30, "Chase missing RSVPs"], [21, "Finalise seating chart"], [14, "Confirm all vendors"], [14, "Give final numbers to caterer"], [7, "Pack for honeymoon"], [7, "Prepare vendor payments & tips"], [2, "Rehearsal"], [1, "Rest & pamper yourself"]];
const TL0 = [["10:00", "Hair & makeup"], ["13:00", "Photos — getting ready"], ["14:30", "Ceremony"], ["15:15", "Confetti & group photos"], ["16:00", "Drinks reception"], ["18:00", "Dinner & speeches"], ["20:00", "First dance"], ["20:15", "Party!"], ["23:30", "Send-off ✨"]];

/* ---------- state ---------- */
function blank() { return { v: 1, n1: "", n2: "", title: "Wedding Planner", theme: "blush", cover: "💍", cur: "$", date: "", venue: "", budget: 0, onboarded: false, guests: [], vendors: [], costs: [], checks: [], tables: [], timeline: [], gifts: [], palette: ["#F3D9DC", "#C47A86", "#E9E1D4", "#7E9A82", "#FFFFFF"], ideas: "", created: today() }; }
let S; try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { S = blank(); }
S = Object.assign(blank(), S);
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save — storage is full"); } }
let view = "home", sel = {};
const money = n => { n = Number(n) || 0; return (n < 0 ? "−" : "") + S.cur + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 }); };
const num = v => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : Math.round(n * 100) / 100; };
const couple = () => S.n1 && S.n2 ? `${S.n1} & ${S.n2}` : S.n1 || S.n2 || "";
const headcount = g => 1 + (g.plus ? 1 : 0) + num(g.kids);
const attending = () => S.guests.filter(g => g.rsvp === "yes").reduce((a, g) => a + headcount(g), 0);
const invitedCount = () => S.guests.reduce((a, g) => a + headcount(g), 0);
const costEst = () => S.costs.reduce((a, c) => a + num(c.est), 0) + S.vendors.reduce((a, v) => a + num(v.price), 0);
const costPaid = () => S.costs.reduce((a, c) => a + num(c.paid), 0) + S.vendors.reduce((a, v) => a + num(v.paid), 0);
const daysLeft = () => S.date ? diffD(today(), S.date) : null;

/* ---------- ui ---------- */
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200); }
function confetti() { const c = document.createElement("div"); c.className = "confetti"; const cols = ["#C47A86", "#F3D9DC", "#B8955A", "#7E9A82", "#fff"]; for (let i = 0; i < 60; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = cols[i % 5]; s.style.animationDelay = Math.random() * .5 + "s"; c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 2200); }
function sheet(h) { $("sheetIn").innerHTML = h; $("sheet").classList.add("on"); }
function closeSheet() { $("sheet").classList.remove("on"); }
function head(t, sub, right = "") { return `<div class="head"><div><div class="kick">${esc(S.cover)} ${esc(couple() ? couple() + " · " : "")}${esc(S.title)}${S.date ? " · " + fmtD(S.date) : ""}</div><h1>${t}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div><div class="row">${right}</div></div>`; }
function ringSVG(p, size, stroke, col, bg) { const r = (size - stroke) / 2, c = 2 * Math.PI * r; return `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, p))}"/></svg>`; }
const rTag = k => { const r = RSVP.find(x => x[0] === k) || RSVP[0]; return `<span class="st rsvp-${r[2]}">${r[1]}</span>`; };
function checkRow(c) { const due = S.date ? addD(S.date, -c.before) : ""; const late = !c.done && due && due < today(); return `<div class="list-it ${c.done ? "done" : ""}"><button class="tick ${c.done ? "on" : ""}" data-a="ck" data-id="${c.id}">✓</button><div class="tx"><b>${esc(c.t)}</b>${due ? `<div class="mut xs" style="${late ? "color:var(--red);font-weight:800" : ""}">📅 ${fmtD(due)}${late ? " · overdue" : ""}</div>` : ""}</div><button class="btn ghost sm" data-a="ckDel" data-id="${c.id}">✕</button></div>`; }
function guestRow(g) { const t = byId(S.tables, g.table); return `<div class="task"><button class="tick ${g.rsvp === "yes" ? "on" : ""}" data-a="rsvpNext" data-id="${g.id}" title="Change RSVP">${g.rsvp === "yes" ? "✓" : ""}</button><div class="t"><div class="n">${esc(g.n)}${g.plus ? ` <span class="mut sm">+1</span>` : ""}${num(g.kids) ? ` <span class="mut sm">+${num(g.kids)} kids</span>` : ""}</div>
  <div class="m"><span>${esc(g.side || "")}${g.group ? " · " + esc(g.group) : ""}</span>${g.meal && g.meal !== "—" ? `<span>🍽️ ${esc(g.meal)}</span>` : ""}${t ? `<span>🪑 ${esc(t.n)}</span>` : ""}</div></div>${rTag(g.rsvp)}<button class="btn ghost sm" data-a="editGuest" data-id="${g.id}">Edit</button></div>`; }

/* ---------- nav ---------- */
const NAV = [["Plan", [["home", "💍", "Dashboard"], ["checklist", "✅", "Checklist"], ["budget", "💰", "Budget"], ["vendors", "📇", "Vendors"]]],
  ["Guests", [["guests", "👥", "Guest list & RSVP"], ["seating", "🪑", "Seating chart"], ["gifts", "🎁", "Gifts & thank-yous"]]],
  ["The day", [["timeline", "🕰️", "Day-of timeline"], ["ideas", "🎨", "Ideas & colours"]]],
  ["App", [["settings", "🎀", "Personalize"], ["help", "❓", "Help"]]]];
const BNAV = [["home", "💍", "Home"], ["guests", "👥", "Guests"], ["budget", "💰", "Budget"], ["checklist", "✅", "To-do"], ["more", "☰", "More"]];
function renderNav() {
  $("snav").innerHTML = `<div class="logo" style="flex-direction:column;align-items:flex-start;gap:0">${couple() ? `<span class="scr" style="font-size:30px;line-height:1.05">${esc(couple())}</span>` : ""}<span>${esc(S.cover)} ${esc(S.title)}</span>${S.date ? `<span class="mut xs" style="font-family:'DM Sans';margin-top:4px">${fmtD(S.date)}</span>` : ""}</div>` + NAV.map(([g, it]) => `<div class="g">${g}</div>` + it.map(([k, e, n]) => `<button class="${view === k ? "on" : ""}" data-go="${k}"><span>${e}</span>${n}</button>`).join("")).join("");
  const inMore = !BNAV.some(b => b[0] === view);
  $("bnav").innerHTML = BNAV.map(([k, e, n]) => `<button class="${view === k || (k === "more" && inMore) ? "on" : ""}" data-go="${k}"><span class="i">${e}</span>${n}</button>`).join("");
}

/* ---------- screens ---------- */
function scrHome() {
  const dl = daysLeft(), ck = S.checks, cd = ck.filter(c => c.done).length, est = costEst(), paid = costPaid(), att = attending(), inv = invitedCount();
  const rc = k => S.guests.filter(g => g.rsvp === k).length;
  const next = ck.filter(c => !c.done).sort((a, b) => b.before - a.before).slice(0, 5);
  const dues = S.vendors.filter(v => num(v.price) - num(v.paid) > 0 && v.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  const w = S.date ? Math.floor(Math.max(0, dl) / 7) : 0;
  return head(couple() ? `${esc(couple())} 💕` : "Your wedding", S.venue ? "📍 " + esc(S.venue) : "Let's plan the best day ever", `<button class="btn" data-a="addGuest">+ Guest</button>`) + `
  <div class="g21"><div class="grid" style="align-content:start">
   <div class="hero"><div class="row" style="gap:20px;flex-wrap:wrap;justify-content:space-between">
    <div><div class="l">${S.date ? (dl > 0 ? "Countdown to “I do”" : dl === 0 ? "Today's the day!" : "Married!") : "Set your date"}</div>
     ${S.date && dl > 0 ? `<div class="cd2" style="margin-top:8px"><div><b>${dl}</b><span>DAYS</span></div><div><b>${w}</b><span>WEEKS</span></div><div><b>${Math.max(0, Math.round(dl / 30.4))}</b><span>MONTHS</span></div></div>` : `<div class="big" style="font-size:34px;margin-top:6px">${S.date ? (dl === 0 ? "💍 Congratulations!" : "🥂 Happily ever after") : "📅 Pick a date in Personalize"}</div>`}
     <div class="row" style="margin-top:14px"><button class="btn" data-go="checklist">✅ Checklist</button><button class="btn ghost" data-go="guests">👥 Guests</button></div></div>
    <div class="ring">${ringSVG(ck.length ? cd / ck.length : 0, 118, 12, "#fff", "rgba(255,255,255,.25)")}<div class="c">${ck.length ? Math.round(cd / ck.length * 100) : 0}%<small>planned</small></div></div></div></div>
   <div class="g4"><div class="kpi"><div class="l">Budget</div><div class="v">${money(S.budget || est)}</div></div><div class="kpi"><div class="l">Paid so far</div><div class="v" style="color:var(--br)">${money(paid)}</div></div><div class="kpi"><div class="l">Left to pay</div><div class="v">${money(est - paid)}</div></div><div class="kpi"><div class="l">Attending</div><div class="v">${att}<span class="mut sm"> / ${inv}</span></div></div></div>
   <div class="card"><h3>💌 RSVPs</h3><div class="pbar" style="height:16px;display:flex">${[["yes", "#5DB57A"], ["pending", "#F2B630"], ["invited", "#D9D2CF"], ["no", "#E8857A"]].map(([k, c]) => `<i style="width:${S.guests.length ? rc(k) / S.guests.length * 100 : 0}%;border-radius:0;background:${c}"></i>`).join("")}</div>
    <div class="row" style="margin-top:10px">${RSVP.map(r => `<span class="chip">${r[1]} · <b>${rc(r[0])}</b></span>`).join("")}</div></div>
   <div class="card"><h3>✅ Up next<span class="sp"></span><button class="btn ghost sm" data-go="checklist">All</button></h3>${next.map(checkRow).join("") || `<div class="empty">Everything's done! 🎉</div>`}</div>
  </div><div class="grid" style="align-content:start">
   <div class="card"><h3>💸 Payments due</h3>${dues.map(v => `<div class="list-it"><span style="font-size:22px">${vcatE(v.cat)}</span><div class="tx"><b>${esc(v.n)}</b><div class="mut xs">📅 ${fmtD(v.due)}</div></div><b>${money(num(v.price) - num(v.paid))}</b></div>`).join("") || `<div class="mut sm">No payments due.</div>`}</div>
   <div class="card"><h3>📇 Vendors booked</h3><div class="row">${VCAT.slice(0, 10).map(([c, e]) => { const b = S.vendors.some(v => v.cat === c && v.status === "booked"); return `<span class="chip" style="${b ? "background:var(--gr2);color:var(--gr)" : "opacity:.6"}">${e} ${c}${b ? " ✓" : ""}</span>`; }).join("")}</div></div>
   <div class="card"><h3>🪑 Seating</h3><div class="mut sm">${S.guests.filter(g => g.rsvp === "yes" && g.table).length} of ${S.guests.filter(g => g.rsvp === "yes").length} attending guests seated · ${S.tables.length} tables</div><button class="btn ghost sm" style="margin-top:10px" data-go="seating">Open seating chart</button></div>
  </div></div>`;
}
function scrChecklist() {
  const f = sel.cf || "todo", groups = [[365, 271, "12+ months before"], [270, 181, "9–6 months before"], [180, 91, "6–3 months before"], [90, 31, "3–1 months before"], [30, 8, "The last month"], [7, 0, "The final week"]];
  let l = S.checks.slice(); if (f === "todo") l = l.filter(c => !c.done); if (f === "done") l = l.filter(c => c.done);
  const dn = S.checks.filter(c => c.done).length;
  return head("Checklist", `${dn} of ${S.checks.length} done`, `<div class="seg">${[["todo", "To do"], ["all", "All"], ["done", "Done"]].map(([k, n]) => `<button class="${f === k ? "on" : ""}" data-a="cf" data-v="${k}">${n}</button>`).join("")}</div>`) + `
  <div class="g21"><div class="grid" style="align-content:start">${groups.map(([a, b, t]) => { const g = l.filter(c => c.before <= a && c.before >= b).sort((x, y) => y.before - x.before); return g.length ? `<div class="card"><h3>${t}<span class="sp"></span><span class="chip">${g.filter(c => c.done).length}/${g.length}</span></h3>${g.map(checkRow).join("")}</div>` : ""; }).join("") || `<div class="card"><div class="empty"><span class="e">🎉</span>Nothing here.</div></div>`}</div>
  <div class="card" style="align-self:start"><h3>Add a task</h3><form data-f="check"><input class="i" id="ckT" placeholder="e.g. Book a cake tasting" style="margin-bottom:8px"><label class="f"><span>HOW LONG BEFORE THE WEDDING?</span><select class="i" id="ckB">${[[365, "12 months"], [270, "9 months"], [180, "6 months"], [90, "3 months"], [60, "2 months"], [30, "1 month"], [14, "2 weeks"], [7, "1 week"], [1, "The day before"]].map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></label><button class="btn">Add task</button></form>
   <div class="pbar" style="margin-top:16px;height:12px"><i style="width:${S.checks.length ? dn / S.checks.length * 100 : 0}%;background:var(--br)"></i></div>${!S.date ? `<div class="note" style="margin-top:12px">Set your wedding date in Personalize to see a due date for every task.</div>` : ""}</div></div>`;
}
function scrBudget() {
  const est = costEst(), paid = costPaid(), B = S.budget || 0, cats = {};
  S.vendors.forEach(v => { const c = cats[v.cat] = cats[v.cat] || { est: 0, paid: 0 }; c.est += num(v.price); c.paid += num(v.paid); });
  S.costs.forEach(x => { const c = cats[x.cat] = cats[x.cat] || { est: 0, paid: 0 }; c.est += num(x.est); c.paid += num(x.paid); });
  const rows = Object.entries(cats).sort((a, b) => b[1].est - a[1].est), mx = Math.max(1, ...rows.map(r => r[1].est));
  return head("Budget", `${money(paid)} paid · ${money(est - paid)} still to pay`, `<button class="btn" data-a="addCost">+ Expense</button>`) + `
  <div class="g4"><div class="kpi"><div class="l">Total budget</div><div class="v">${B ? money(B) : "—"}</div></div><div class="kpi"><div class="l">Estimated cost</div><div class="v" style="color:${B && est > B ? "var(--red)" : "inherit"}">${money(est)}</div><div class="s">${B ? (est > B ? money(est - B) + " over" : money(B - est) + " under") : ""}</div></div><div class="kpi"><div class="l">Paid</div><div class="v" style="color:var(--mint)">${money(paid)}</div></div><div class="kpi"><div class="l">Cost per guest</div><div class="v">${attending() ? money(Math.round(est / attending())) : "—"}</div></div></div>
  <div class="g21" style="margin-top:14px"><div class="card"><h3>By category</h3>${rows.map(([c, v]) => `<div style="margin-bottom:11px"><div class="row sm" style="flex-wrap:nowrap"><b>${vcatE(c)} ${esc(c)}</b><span class="sp"></span><span class="mut">${money(v.paid)} paid of ${money(v.est)}</span></div><div class="pbar" style="height:12px;position:relative"><i style="width:${v.est / mx * 100}%;background:var(--br);opacity:.3;position:absolute"></i><i style="width:${v.paid / mx * 100}%;background:var(--br);position:absolute"></i></div></div>`).join("") || `<div class="mut sm">Add vendors and expenses to see your budget.</div>`}</div>
  <div class="grid" style="align-content:start"><div class="card"><h3>Overall budget</h3><label class="f"><span>TOTAL WEDDING BUDGET</span><input class="i" inputmode="decimal" data-a2="budget" value="${S.budget || ""}" placeholder="${S.cur}20,000"></label><div class="pbar" style="height:14px"><i style="width:${B ? Math.min(100, paid / B * 100) : 0}%;background:var(--mint)"></i></div><div class="mut sm" style="margin-top:6px">${B ? Math.round(paid / B * 100) + "% paid" : "Set a total to track it."}</div></div>
   <div class="card"><h3>Other expenses</h3>${S.costs.map(c => `<div class="list-it"><span style="font-size:20px">${vcatE(c.cat)}</span><div class="tx"><b>${esc(c.n)}</b><div class="mut xs">${money(c.paid)} paid of ${money(c.est)}</div></div><button class="btn ghost sm" data-a="editCost" data-id="${c.id}">Edit</button></div>`).join("") || `<div class="mut sm">Things without a vendor — favours, licence, outfits…</div>`}</div></div></div>`;
}
function scrVendors() {
  return head("Vendors", `${S.vendors.filter(v => v.status === "booked").length} booked · ${S.vendors.length} total`, `<button class="btn" data-a="addVendor">+ Vendor</button>`) + (S.vendors.length ? `<div class="g3">${S.vendors.slice().sort((a, b) => (a.status === "booked" ? 0 : 1) - (b.status === "booked" ? 0 : 1)).map(v => { const left = num(v.price) - num(v.paid);
    return `<div class="card"><div class="row" style="flex-wrap:nowrap"><span style="font-size:30px">${vcatE(v.cat)}</span><div style="flex:1;min-width:0"><div class="b" style="font-size:17px">${esc(v.n)}</div><div class="mut xs">${esc(v.cat)}</div></div><span class="st ${v.status === "booked" ? "rsvp-yes" : "rsvp-wait"}">${v.status === "booked" ? "✓ Booked" : "Considering"}</span></div>
     <div class="row" style="margin:12px 0 6px"><b style="font-size:20px">${money(v.price)}</b><span class="sp"></span><span class="mut sm">${money(v.paid)} paid</span></div><div class="pbar"><i style="width:${num(v.price) ? num(v.paid) / num(v.price) * 100 : 0}%;background:var(--br)"></i></div>
     <div class="mut sm" style="margin-top:8px">${left > 0 ? `${money(left)} left${v.due ? " · due " + fmtD(v.due) : ""}` : num(v.price) ? "✅ Paid in full" : ""}</div>${v.contact ? `<div class="sm" style="margin-top:6px">📞 ${esc(v.contact)}</div>` : ""}
     <div class="row" style="margin-top:10px"><button class="btn ghost sm" data-a="editVendor" data-id="${v.id}">Edit</button>${left > 0 ? `<button class="btn sm" data-a="payVendor" data-id="${v.id}">+ Payment</button>` : ""}</div></div>`; }).join("")}</div>`
    : `<div class="card"><div class="empty"><span class="e">📇</span>Add your venue, photographer, florist… and track every payment.<br><br><button class="btn" data-a="addVendor">+ Add a vendor</button></div></div>`);
}
function scrGuests() {
  const f = sel.gf || "all", q = (sel.gq || "").toLowerCase(); let l = S.guests.slice(); if (f !== "all") l = l.filter(g => g.rsvp === f || g.side === f); if (q) l = l.filter(g => g.n.toLowerCase().includes(q));
  l.sort((a, b) => a.n.localeCompare(b.n));
  const meals = {}; S.guests.filter(g => g.rsvp === "yes" && g.meal && g.meal !== "—").forEach(g => meals[g.meal] = (meals[g.meal] || 0) + 1 + (g.plus ? 1 : 0));
  return head("Guest list & RSVP", `${invitedCount()} invited · ${attending()} attending`, `<button class="btn ghost noprint" onclick="print()">🖨 Print</button><button class="btn" data-a="addGuest">+ Guest</button>`) + `
  <div class="g21"><div class="card"><div class="row" style="margin-bottom:8px"><div class="seg">${[["all", "All"], ["yes", "Attending"], ["pending", "No reply"], ["no", "Declined"], ["Bride", "Bride's"], ["Groom", "Groom's"]].map(([k, n]) => `<button class="${f === k ? "on" : ""}" data-a="gf" data-v="${k}">${n}</button>`).join("")}</div></div>
   <input class="i" data-a2="gq" placeholder="🔎 Search guests" value="${esc(sel.gq || "")}" style="margin-bottom:6px">${l.map(guestRow).join("") || `<div class="empty"><span class="e">👥</span>No guests yet.</div>`}
   <form data-f="quickGuest" class="row" style="flex-wrap:nowrap;margin-top:10px"><input class="i" id="qgN" placeholder="Quick add: type a name and press Enter"><button class="btn">Add</button></form></div>
  <div class="grid" style="align-content:start"><div class="card"><h3>Summary</h3>${SIDES.map(s => `<div class="row sm" style="padding:3px 0"><b>${s}'s side</b><span class="sp"></span>${S.guests.filter(g => g.side === s).reduce((a, g) => a + headcount(g), 0)}</div>`).join("")}<div class="row sm" style="padding:3px 0"><b>Plus-ones</b><span class="sp"></span>${S.guests.filter(g => g.plus).length}</div><div class="row sm" style="padding:3px 0"><b>Kids</b><span class="sp"></span>${S.guests.reduce((a, g) => a + num(g.kids), 0)}</div></div>
   <div class="card"><h3>🍽️ Meal choices</h3>${Object.entries(meals).map(([m, n]) => `<div class="row sm" style="padding:3px 0"><b>${esc(m)}</b><span class="sp"></span>${n}</div>`).join("") || `<div class="mut sm">Add meal choices when guests RSVP.</div>`}</div>
   <div class="note">💡 Tap the circle next to a guest to cycle their RSVP: invited → attending → declined → no reply.</div></div></div>`;
}
function scrSeating() {
  const att = S.guests.filter(g => g.rsvp === "yes"), un = att.filter(g => !g.table);
  return head("Seating chart", `${att.length - un.length} of ${att.length} attending guests seated`, `<button class="btn ghost noprint" onclick="print()">🖨 Print</button><button class="btn" data-a="addTable">+ Table</button>`) + `
  <div class="g21"><div class="tables">${S.tables.map(t => { const gs = S.guests.filter(g => g.table === t.id), seats = gs.reduce((a, g) => a + headcount(g), 0);
    return `<div class="tbl2"><div class="ring">${esc(t.n)}<small class="mut" style="font-family:'DM Sans';font-size:12px">${seats}/${t.seats} seats</small></div><div class="g">${gs.map(g => `<span>${esc(g.n)}${g.plus ? " +1" : ""}</span>`).join("") || `<span class="mut">Empty</span>`}</div><div class="row noprint" style="justify-content:center;margin-top:10px"><button class="btn ghost sm" data-a="editTable" data-id="${t.id}">Edit</button></div></div>`; }).join("") || `<div class="card"><div class="empty">Add your tables first.</div></div>`}</div>
  <div class="card noprint" style="align-self:start"><h3>Not seated yet<span class="sp"></span><span class="chip">${un.length}</span></h3>${un.map(g => `<div class="list-it"><div class="tx"><b>${esc(g.n)}${g.plus ? " +1" : ""}</b><div class="mut xs">${esc(g.side || "")} · ${esc(g.group || "")}</div></div><select class="i" style="max-width:130px;padding:6px 8px" data-a2="seat" data-id="${g.id}"><option value="">Seat at…</option>${S.tables.map(t => `<option value="${t.id}">${esc(t.n)}</option>`).join("")}</select></div>`).join("") || `<div class="mut sm">Everyone attending has a seat 🎉</div>`}
   <div class="mut xs" style="margin-top:10px">Only guests marked “Attending” appear here. Change a seat any time from the guest's Edit screen.</div></div></div>`;
}
function scrGifts() {
  const sent = S.gifts.filter(g => g.ty).length;
  return head("Gifts & thank-yous", `${S.gifts.length} gifts · ${sent} thank-you notes sent`, `<button class="btn" data-a="addGift">+ Gift</button>`) + `<div class="card">${S.gifts.map(g => `<div class="list-it ${g.ty ? "done" : ""}"><button class="tick ${g.ty ? "on" : ""}" data-a="ty" data-id="${g.id}" title="Thank-you sent">✓</button><div class="tx"><b>${esc(g.from)}</b><div class="mut xs">🎁 ${esc(g.gift)}${g.amt ? " · " + money(g.amt) : ""}</div></div><span class="st ${g.ty ? "rsvp-yes" : "rsvp-wait"}">${g.ty ? "💌 Thanked" : "Thank-you to send"}</span><button class="btn ghost sm" data-a="delGift" data-id="${g.id}">✕</button></div>`).join("") || `<div class="empty"><span class="e">🎁</span>Log each gift as it arrives, then tick off your thank-you notes.</div>`}</div>`;
}
function scrTimeline() {
  const l = S.timeline.slice().sort((a, b) => a.t.localeCompare(b.t));
  return head("Day-of timeline", S.date ? fmtD(S.date) : "Your wedding day, hour by hour", `<button class="btn ghost noprint" onclick="print()">🖨 Print</button>`) + `<div class="g21"><div class="card timeline">${l.map(x => `<div class="ti"><b class="t">${esc(x.t)}</b><div style="flex:1"><b>${esc(x.e)}</b>${x.who ? `<div class="mut xs">👤 ${esc(x.who)}</div>` : ""}</div><button class="btn ghost sm noprint" data-a="tlDel" data-id="${x.id}">✕</button></div>`).join("") || `<div class="empty">No events yet.</div>`}</div>
  <div class="card noprint" style="align-self:start"><h3>Add to the day</h3><form data-f="tl"><div class="g2" style="grid-template-columns:110px 1fr;gap:10px"><label class="f"><span>TIME</span><input class="i" type="time" id="tlT" value="12:00"></label><label class="f"><span>WHAT</span><input class="i" id="tlE" placeholder="Cake cutting"></label></div><label class="f"><span>WHO'S IN CHARGE (OPTIONAL)</span><input class="i" id="tlW" placeholder="Best man"></label><button class="btn">Add</button></form>
   ${!S.timeline.length ? `<button class="btn ghost sm" style="margin-top:10px" data-a="tlStarter">+ Add a sample timeline</button>` : ""}</div></div>`;
}
function scrIdeas() {
  return head("Ideas & colours", "Your wedding look in one place") + `<div class="g2"><div class="card"><h3>🎨 Colour palette</h3><div class="pal">${S.palette.map((c, i) => `<label style="cursor:pointer"><i style="background:${c}"></i><input type="color" value="${c}" data-a2="pal" data-i="${i}" style="opacity:0;width:0;height:0;position:absolute"></label>`).join("")}</div><div class="mut xs" style="margin-top:8px">Tap a colour to change it.</div></div>
   <div class="card"><h3>💡 Ideas & inspiration</h3><textarea class="notepad" style="min-height:300px" data-a2="ideas" placeholder="Flowers, dress ideas, songs, vows, Pinterest links…">${esc(S.ideas)}</textarea></div></div>`;
}
function scrSettings() {
  return head("Personalize", "Make it yours") + `<div class="g2"><div class="grid" style="align-content:start"><div class="card"><h3>💍 Your wedding</h3>
   <div class="cover" style="margin-bottom:12px"><div class="em">${esc(S.cover)}</div><div>${couple() ? `<div class="o" style="font-size:34px">${esc(couple())}</div>` : ""}<div class="ti">${esc(S.title)}</div></div></div>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>NAME 1</span><input class="i" data-set="n1" value="${esc(S.n1)}" placeholder="Emma"></label><label class="f"><span>NAME 2</span><input class="i" data-set="n2" value="${esc(S.n2)}" placeholder="James"></label></div>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>WEDDING DATE</span><input class="i" type="date" data-set="date" value="${S.date}"></label><label class="f"><span>VENUE</span><input class="i" data-set="venue" value="${esc(S.venue)}"></label></div>
   <div class="g2" style="grid-template-columns:2fr 1fr;gap:10px"><label class="f"><span>TITLE</span><input class="i" data-set="title" value="${esc(S.title)}" list="tl"><datalist id="tl">${["Wedding Planner", "Our Wedding", "Wedding Organizer", "The Big Day", "Mr & Mrs"].map(t => `<option value="${t}">`).join("")}</datalist></label><label class="f"><span>CURRENCY</span><input class="i" data-set="cur" value="${esc(S.cur)}" maxlength="4"></label></div>
   <div class="pick mut" style="margin-bottom:6px">THEME</div><div class="sw" style="margin-bottom:14px">${THEMES.map(([k, n, c, b]) => `<button class="${S.theme === k ? "on" : ""}" data-a="theme" data-v="${k}"><i style="background:linear-gradient(135deg,${b} 50%,${c} 50%)"></i>${n}</button>`).join("")}</div>
   <div class="pick mut" style="margin-bottom:6px">ICON</div><div class="row">${COVERS.map(c => `<button class="chip ${S.cover === c ? "on" : ""}" data-a="cover" data-v="${c}" style="font-size:19px">${c}</button>`).join("")}</div></div></div>
  <div class="grid" style="align-content:start"><div class="card"><h3>💾 Your data</h3><div class="mut sm" style="margin-bottom:12px">Saved on this device only. Download a backup now and then — and share it with your partner to use on their phone.</div><div class="row"><button class="btn" data-a="backup">⬇ Download backup</button><button class="btn ghost" data-a="restore">⬆ Restore</button></div><input type="file" id="restoreFile" accept=".json" style="display:none">
   <div class="row" style="margin-top:16px"><button class="btn ghost" data-a="demo">✨ Load example data</button><button class="btn ghost" data-a="erase" style="color:var(--red)">Erase everything</button></div></div>
   <div class="card"><h3>📲 Install on your phone</h3><div class="sm"><b>iPhone/iPad:</b> Safari → Share → Add to Home Screen.<br><b>Android:</b> Chrome → ⋮ → Add to Home screen.<br><b>Computer:</b> Chrome or Edge → install icon.</div></div></div></div>`;
}
function scrHelp() { const q = [["Where to start", "Add your names, date and budget in Personalize. Then open the Checklist — every task gets a due date counted back from your wedding day."], ["Guests & RSVP", "Add guests with their side, group, plus-one and kids. Tap the circle to change RSVP. Meal choices and headcount add up automatically."], ["Budget & vendors", "Add each vendor with their price and what you've paid. Other costs go under Budget → + Expense. Everything adds up in one place."], ["Seating chart", "Add tables, then seat attending guests from the list on the right. Print it for the venue."], ["Sharing with your partner", "Each device keeps its own copy. Use Personalize → Download backup, send the file, and Restore on the other phone."], ["Where is my data?", "Only on this device. Nothing is uploaded."]];
  return head("Help", "Quick answers") + `<div class="g2">${q.map(([a, b]) => `<div class="card"><h3>${a}</h3><div class="sm mut">${b}</div></div>`).join("")}</div>`; }
function scrMore() { return head("More", "Everything in your planner") + NAV.map(([g, it]) => `<div class="pick mut" style="margin:14px 2px 8px">${g.toUpperCase()}</div><div class="tiles">${it.map(([k, e, n]) => `<button class="tile" data-go="${k}"><div class="e">${e}</div><div class="n">${n}</div></button>`).join("")}</div>`).join(""); }
function scrOnboard() {
  return `<div class="onb"><div class="card"><div class="cover" style="margin-bottom:14px"><div class="em">${esc(S.cover)}</div><div>${couple() ? `<div class="o" style="font-size:34px">${esc(couple())}</div>` : ""}<div class="ti">${esc(S.title)}</div></div></div>
   <h1 style="font-family:Serif;font-weight:400;font-size:30px;margin-bottom:4px">${couple() ? "Congratulations, " + esc(couple()) + "! 💍" : "Congratulations! 💍"}</h1><div class="mut" style="margin-bottom:14px">Let's plan your wedding — calmly, beautifully, all in one place.</div>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>NAME 1</span><input class="i" id="ob1" value="${esc(S.n1)}" placeholder="Emma"></label><label class="f"><span>NAME 2</span><input class="i" id="ob2" value="${esc(S.n2)}" placeholder="James"></label></div>
   <div class="g2" style="grid-template-columns:1fr 1fr 80px;gap:10px"><label class="f"><span>WEDDING DATE</span><input class="i" type="date" id="obD" value="${S.date}"></label><label class="f"><span>BUDGET</span><input class="i" id="obB" inputmode="decimal" placeholder="20000"></label><label class="f"><span>CURRENCY</span><input class="i" id="obC" value="${esc(S.cur)}" maxlength="4"></label></div>
   <div class="pick mut" style="margin-bottom:6px">PICK A THEME</div><div class="sw" style="margin-bottom:16px">${THEMES.map(([k, n, c, b]) => `<button class="${S.theme === k ? "on" : ""}" data-a="obTheme" data-v="${k}"><i style="background:linear-gradient(135deg,${b} 50%,${c} 50%)"></i>${n}</button>`).join("")}</div>
   <div class="row"><button class="btn ghost" data-a="demo">✨ Try with example data</button><span class="sp"></span><button class="btn" data-a="obDone">Start planning 💍</button></div></div></div>`;
}

/* ---------- forms ---------- */
const opts = (arr, v) => arr.map(x => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("");
function guestForm(g) { const n = !g; g = g || { n: "", side: "Both", group: "Family", rsvp: "invited", plus: false, kids: 0, meal: "—", table: "", addr: "", notes: "" };
  sheet(`<h2>${n ? "Add a guest" : "Edit " + esc(g.n)}</h2><form data-f="guest" data-id="${g.id || ""}"><label class="f"><span>NAME</span><input class="i" id="gN" value="${esc(g.n)}" required></label>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>SIDE</span><select class="i" id="gS">${opts(SIDES, g.side)}</select></label><label class="f"><span>GROUP</span><select class="i" id="gG">${opts(GROUPS, g.group)}</select></label></div>
   <label class="f"><span>RSVP</span><select class="i" id="gR">${RSVP.map(r => `<option value="${r[0]}" ${g.rsvp === r[0] ? "selected" : ""}>${r[1]}</option>`).join("")}</select></label>
   <div class="g2" style="grid-template-columns:1fr 1fr 1fr;gap:10px"><label class="f"><span>PLUS-ONE</span><select class="i" id="gP"><option value="0">No</option><option value="1" ${g.plus ? "selected" : ""}>Yes</option></select></label><label class="f"><span>KIDS</span><input class="i" type="number" min="0" id="gK" value="${num(g.kids)}"></label><label class="f"><span>MEAL</span><select class="i" id="gM">${opts(MEALS, g.meal)}</select></label></div>
   <label class="f"><span>TABLE</span><select class="i" id="gT"><option value="">Not seated</option>${S.tables.map(t => `<option value="${t.id}" ${g.table === t.id ? "selected" : ""}>${esc(t.n)}</option>`).join("")}</select></label>
   <label class="f"><span>ADDRESS (FOR INVITES)</span><textarea class="i" id="gA" rows="2">${esc(g.addr)}</textarea></label>
   <div class="row"><button class="btn">${n ? "Add guest" : "Save"}</button><button class="btn ghost" type="button" data-a="close">Cancel</button><span class="sp"></span>${!n ? `<button class="btn ghost" type="button" data-a="delGuest" data-id="${g.id}" style="color:var(--red)">Remove</button>` : ""}</div></form>`); }
function vendorForm(v) { const n = !v; v = v || { n: "", cat: "Venue", status: "considering", price: "", paid: "", due: "", contact: "", notes: "" };
  sheet(`<h2>${n ? "Add a vendor" : "Edit vendor"}</h2><form data-f="vendor" data-id="${v.id || ""}"><div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>CATEGORY</span><select class="i" id="vC">${VCAT.map(([c, e]) => `<option value="${c}" ${v.cat === c ? "selected" : ""}>${e} ${c}</option>`).join("")}</select></label><label class="f"><span>STATUS</span><select class="i" id="vS"><option value="considering">Considering</option><option value="booked" ${v.status === "booked" ? "selected" : ""}>✓ Booked</option></select></label></div>
   <label class="f"><span>NAME</span><input class="i" id="vN" value="${esc(v.n)}" required placeholder="e.g. Rosewood Manor"></label>
   <div class="g2" style="grid-template-columns:1fr 1fr 1fr;gap:10px"><label class="f"><span>TOTAL PRICE</span><input class="i" id="vP" inputmode="decimal" value="${v.price || ""}"></label><label class="f"><span>PAID</span><input class="i" id="vPd" inputmode="decimal" value="${v.paid || ""}"></label><label class="f"><span>BALANCE DUE</span><input class="i" type="date" id="vD" value="${v.due || ""}"></label></div>
   <label class="f"><span>CONTACT</span><input class="i" id="vCt" value="${esc(v.contact)}" placeholder="Phone, email or website"></label>
   <div class="row"><button class="btn">${n ? "Add" : "Save"}</button><button class="btn ghost" type="button" data-a="close">Cancel</button><span class="sp"></span>${!n ? `<button class="btn ghost" type="button" data-a="delVendor" data-id="${v.id}" style="color:var(--red)">Delete</button>` : ""}</div></form>`); }
function costForm(c) { const n = !c; c = c || { n: "", cat: "Other", est: "", paid: "" };
  sheet(`<h2>${n ? "Add an expense" : "Edit expense"}</h2><form data-f="cost" data-id="${c.id || ""}"><label class="f"><span>WHAT</span><input class="i" id="cN" value="${esc(c.n)}" required placeholder="e.g. Wedding favours"></label><label class="f"><span>CATEGORY</span><select class="i" id="cC">${VCAT.map(([x, e]) => `<option value="${x}" ${c.cat === x ? "selected" : ""}>${e} ${x}</option>`).join("")}</select></label>
   <div class="g2" style="grid-template-columns:1fr 1fr;gap:10px"><label class="f"><span>ESTIMATED</span><input class="i" id="cE" inputmode="decimal" value="${c.est || ""}"></label><label class="f"><span>PAID</span><input class="i" id="cP" inputmode="decimal" value="${c.paid || ""}"></label></div>
   <div class="row"><button class="btn">${n ? "Add" : "Save"}</button><button class="btn ghost" type="button" data-a="close">Cancel</button><span class="sp"></span>${!n ? `<button class="btn ghost" type="button" data-a="delCost" data-id="${c.id}" style="color:var(--red)">Delete</button>` : ""}</div></form>`); }

/* ---------- actions ---------- */
const ACT = {
  close: closeSheet,
  addGuest() { guestForm(); }, editGuest(e) { guestForm(byId(S.guests, e.dataset.id)); },
  delGuest(e) { S.guests = S.guests.filter(g => g.id !== e.dataset.id); save(); closeSheet(); render(); },
  rsvpNext(e) { const g = byId(S.guests, e.dataset.id), order = ["invited", "yes", "no", "pending"]; g.rsvp = order[(order.indexOf(g.rsvp) + 1) % 4]; save(); toast((RSVP.find(r => r[0] === g.rsvp) || [])[1]); render(); },
  gf(e) { sel.gf = e.dataset.v; render(); }, cf(e) { sel.cf = e.dataset.v; render(); },
  ck(e) { const c = byId(S.checks, e.dataset.id); c.done = !c.done; save(); if (c.done) { toast("Done ✓ " + c.t); if (S.checks.every(x => x.done)) confetti(); } render(); },
  ckDel(e) { S.checks = S.checks.filter(c => c.id !== e.dataset.id); save(); render(); },
  addVendor() { vendorForm(); }, editVendor(e) { vendorForm(byId(S.vendors, e.dataset.id)); },
  delVendor(e) { if (!confirm("Delete this vendor?")) return; S.vendors = S.vendors.filter(v => v.id !== e.dataset.id); save(); closeSheet(); render(); },
  payVendor(e) { const v = byId(S.vendors, e.dataset.id), a = num(prompt(`Payment to ${v.n}? (${money(num(v.price) - num(v.paid))} left)`, num(v.price) - num(v.paid))); if (!a) return; v.paid = num(v.paid) + a; save(); toast("Payment logged 💸"); render(); },
  addCost() { costForm(); }, editCost(e) { costForm(byId(S.costs, e.dataset.id)); }, delCost(e) { S.costs = S.costs.filter(c => c.id !== e.dataset.id); save(); closeSheet(); render(); },
  addTable() { const n = prompt("Table name:", `Table ${S.tables.length + 1}`); if (!n) return; const s = num(prompt("How many seats?", "8")) || 8; S.tables.push({ id: uid(), n, seats: s }); save(); render(); },
  editTable(e) { const t = byId(S.tables, e.dataset.id), n = prompt("Table name (leave empty to delete):", t.n); if (n === null) return; if (!n) { S.tables = S.tables.filter(x => x !== t); S.guests.forEach(g => { if (g.table === t.id) g.table = ""; }); } else { t.n = n; t.seats = num(prompt("Seats:", t.seats)) || t.seats; } save(); render(); },
  addGift() { sheet(`<h2>Log a gift</h2><form data-f="gift"><label class="f"><span>FROM</span><input class="i" id="gfF" required placeholder="Aunt Sue"></label><label class="f"><span>GIFT</span><input class="i" id="gfG" placeholder="Stand mixer"></label><label class="f"><span>AMOUNT (IF MONEY)</span><input class="i" id="gfA" inputmode="decimal"></label><div class="row"><button class="btn">Add</button><button class="btn ghost" type="button" data-a="close">Cancel</button></div></form>`); },
  ty(e) { const g = byId(S.gifts, e.dataset.id); g.ty = !g.ty; save(); render(); }, delGift(e) { S.gifts = S.gifts.filter(g => g.id !== e.dataset.id); save(); render(); },
  tlDel(e) { S.timeline = S.timeline.filter(x => x.id !== e.dataset.id); save(); render(); },
  tlStarter() { TL0.forEach(([t, ev]) => S.timeline.push({ id: uid(), t, e: ev, who: "" })); save(); render(); },
  theme(e) { S.theme = e.dataset.v; applyTheme(); save(); render(); }, cover(e) { S.cover = e.dataset.v; save(); render(); },
  backup() { const b = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `wedding-planner-backup-${today()}.json`; a.click(); toast("Backup downloaded ⬇"); },
  restore() { $("restoreFile").click(); },
  demo() { if (S.onboarded && S.guests.length && !confirm("Replace everything with example data?")) return; const keep = { n1: S.n1, n2: S.n2, title: S.title, theme: S.theme, cover: S.cover, applied: S.applied }; S = demoData(); if (keep.n1 || keep.applied) Object.assign(S, keep); save(); applyTheme(); view = "home"; sel = {}; render(); toast("Example wedding loaded 💍"); },
  erase() { if (!confirm("Erase everything on this device? There's no undo.")) return; localStorage.removeItem(KEY); S = blank(); sel = {}; view = "home"; applyTheme(); render(); },
  obTheme(e) { ["1", "2"].forEach(k => { const el = $("ob" + k); if (el) S["n" + k] = el.value.trim(); }); S.theme = e.dataset.v; applyTheme(); render(); },
  obDone() { S.n1 = $("ob1").value.trim(); S.n2 = $("ob2").value.trim(); S.date = $("obD").value; S.budget = num($("obB").value); S.cur = $("obC").value.trim() || "$"; CHECK0.forEach(([b, t]) => S.checks.push({ id: uid(), t, before: b, done: false })); S.onboarded = true; save(); render(); confetti(); toast("Let the planning begin 💍"); }
};
const FORMS = {
  guest(f) { const id = f.dataset.id; let g = id && byId(S.guests, id); if (!g) { g = { id: uid() }; S.guests.push(g); }
    Object.assign(g, { n: $("gN").value.trim() || "Guest", side: $("gS").value, group: $("gG").value, rsvp: $("gR").value, plus: $("gP").value === "1", kids: num($("gK").value), meal: $("gM").value, table: $("gT").value, addr: $("gA").value }); save(); closeSheet(); render(); },
  quickGuest() { const v = $("qgN").value.trim(); if (!v) return; S.guests.push({ id: uid(), n: v, side: "Both", group: "Friends", rsvp: "invited", plus: false, kids: 0, meal: "—", table: "", addr: "" }); save(); render(); setTimeout(() => $("qgN") && $("qgN").focus(), 0); },
  vendor(f) { const id = f.dataset.id; let v = id && byId(S.vendors, id); if (!v) { v = { id: uid() }; S.vendors.push(v); } Object.assign(v, { n: $("vN").value.trim() || "Vendor", cat: $("vC").value, status: $("vS").value, price: num($("vP").value), paid: num($("vPd").value), due: $("vD").value, contact: $("vCt").value.trim() }); save(); closeSheet(); render(); if (v.status === "booked") toast("Booked ✓ " + v.n); },
  cost(f) { const id = f.dataset.id; let c = id && byId(S.costs, id); if (!c) { c = { id: uid() }; S.costs.push(c); } Object.assign(c, { n: $("cN").value.trim() || "Expense", cat: $("cC").value, est: num($("cE").value), paid: num($("cP").value) }); save(); closeSheet(); render(); },
  check() { const t = $("ckT").value.trim(); if (!t) return; S.checks.push({ id: uid(), t, before: num($("ckB").value), done: false }); save(); render(); },
  gift() { const f = $("gfF").value.trim(); if (!f) return; S.gifts.push({ id: uid(), from: f, gift: $("gfG").value.trim(), amt: num($("gfA").value), ty: false }); save(); closeSheet(); render(); },
  tl() { const e = $("tlE").value.trim(); if (!e) return; S.timeline.push({ id: uid(), t: $("tlT").value || "12:00", e, who: $("tlW").value.trim() }); save(); render(); }
};

/* ---------- events ---------- */
document.addEventListener("click", ev => { if (ev.target.id === "sheet") return closeSheet();
  const g = ev.target.closest("[data-go]"); if (g) { view = g.dataset.go; sel = {}; closeSheet(); render(); scrollTo(0, 0); return; }
  const a = ev.target.closest("[data-a]"); if (a && ACT[a.dataset.a]) { ev.preventDefault(); ACT[a.dataset.a](a, ev); } });
document.addEventListener("submit", ev => { const f = ev.target.closest("[data-f]"); if (f && FORMS[f.dataset.f]) { ev.preventDefault(); FORMS[f.dataset.f](f); } });
let tmr;
document.addEventListener("input", ev => { const el = ev.target, k = el.dataset.a2; if (!k) return;
  if (k === "ideas") { S.ideas = el.value; clearTimeout(tmr); tmr = setTimeout(save, 350); }
  if (k === "gq") { sel.gq = el.value; render(); const i = document.querySelector('[data-a2="gq"]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
document.addEventListener("change", ev => { const el = ev.target;
  const s = el.closest("[data-set]"); if (s) { S[s.dataset.set] = s.value.trim(); save(); render(); return; }
  const k = el.dataset.a2; if (k === "budget") { S.budget = num(el.value); save(); render(); } if (k === "seat") { byId(S.guests, el.dataset.id).table = el.value; save(); render(); } if (k === "pal") { S.palette[+el.dataset.i] = el.value; save(); render(); }
  if (el.id === "restoreFile") { const file = el.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d || !Array.isArray(d.guests)) throw 0; S = Object.assign(blank(), d); save(); applyTheme(); render(); toast("Backup restored ✓"); } catch (e) { toast("That file isn't a backup from this planner"); } }; r.readAsText(file); } });
document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeSheet(); });
function applyTheme() { document.documentElement.dataset.theme = S.theme === "blush" ? "" : S.theme; const t = THEMES.find(x => x[0] === S.theme) || THEMES[0]; document.querySelector('meta[name="theme-color"]').content = t[3]; }
const SCR = { home: scrHome, checklist: scrChecklist, budget: scrBudget, vendors: scrVendors, guests: scrGuests, seating: scrSeating, gifts: scrGifts, timeline: scrTimeline, ideas: scrIdeas, settings: scrSettings, help: scrHelp, more: scrMore };
function render() { if (!S.onboarded) { $("snav").style.display = "none"; $("bnav").style.display = "none"; $("main").innerHTML = scrOnboard(); return; }
  $("snav").style.display = ""; $("bnav").style.display = ""; if (!SCR[view]) view = "home"; renderNav(); $("main").innerHTML = SCR[view](); }

/* ---------- example data ---------- */
function demoData() {
  const s = blank(), t = today(), date = addD(t, 142); Object.assign(s, { n1: "Emma", n2: "James", date, venue: "Rosewood Manor, Cotswolds", budget: 25000, onboarded: true });
  s.tables = ["Head table", "Table 1", "Table 2", "Table 3", "Table 4", "Kids table"].map((n, i) => ({ id: "t" + i, n, seats: i === 5 ? 6 : 8 }));
  const G = [["Margaret Clarke", "Bride", "Family", "yes", 1, 0, "Fish", "t0"], ["David Clarke", "Bride", "Family", "yes", 0, 0, "Beef", "t0"], ["Susan Reed", "Groom", "Family", "yes", 1, 0, "Chicken", "t0"], ["Olivia Clarke", "Bride", "Family", "yes", 1, 2, "Vegetarian", "t1"], ["Tom Reed", "Groom", "Family", "yes", 1, 1, "Beef", "t1"], ["Sophie Turner", "Bride", "Friends", "yes", 1, 0, "Vegan", "t2"], ["Liam Walsh", "Groom", "Friends", "yes", 0, 0, "Chicken", "t2"], ["Hannah Price", "Bride", "Friends", "yes", 1, 0, "Fish", "t2"], ["Josh Bennett", "Groom", "Friends", "yes", 1, 0, "Beef", ""], ["Grace Hall", "Bride", "Work", "pending", 0, 0, "—", ""], ["Ryan Cole", "Groom", "Work", "yes", 1, 0, "Chicken", "t3"], ["Aunt Sue", "Bride", "Family", "yes", 0, 0, "Fish", "t3"], ["Uncle Pete", "Groom", "Family", "no", 1, 0, "—", ""], ["Chloe Evans", "Bride", "Friends", "pending", 1, 0, "—", ""], ["Mark & Jo Lee", "Both", "Friends", "invited", 0, 0, "—", ""], ["Ella Shaw", "Bride", "Friends", "yes", 0, 0, "Vegetarian", ""], ["Ben Foster", "Groom", "Friends", "yes", 1, 0, "Beef", "t3"], ["Nana Rose", "Bride", "Family", "yes", 0, 0, "Fish", "t1"], ["Grandpa Joe", "Groom", "Family", "yes", 0, 0, "Chicken", "t1"], ["Amy Wright", "Bride", "Work", "no", 0, 0, "—", ""], ["Sam Patel", "Groom", "Work", "pending", 1, 0, "—", ""], ["Lucy Grant", "Bride", "Friends", "yes", 1, 0, "Chicken", "t4"], ["Jack Moore", "Groom", "Friends", "yes", 1, 0, "Beef", "t4"]];
  s.guests = G.map(([n, side, group, rsvp, plus, kids, meal, table], i) => ({ id: "g" + i, n, side, group, rsvp, plus: !!plus, kids, meal, table, addr: "" }));
  const V = [["Rosewood Manor", "Venue", "booked", 8500, 4250, 60], ["Petal & Stem", "Florist", "booked", 1800, 500, 30], ["Lens & Light Studio", "Photographer", "booked", 2400, 800, 14], ["Gourmet Gatherings", "Catering", "booked", 6200, 2000, 21], ["DJ Max", "Music / DJ", "booked", 950, 200, 7], ["Sweet Layers", "Cake", "booked", 480, 100, 10], ["Bella Bridal", "Dress & Attire", "booked", 1650, 1650, 0], ["Glow Beauty", "Hair & Makeup", "considering", 620, 0, 20], ["Classic Cars Co", "Transport", "considering", 450, 0, 14], ["Paper Love", "Stationery", "booked", 380, 380, 0]];
  s.vendors = V.map(([n, cat, status, price, paid, d], i) => ({ id: "v" + i, n, cat, status, price, paid, due: paid < price ? addD(date, -d) : "", contact: "" }));
  s.costs = [["Wedding rings", "Rings", 1400, 1400], ["Marriage licence", "Other", 120, 0], ["Favours", "Decor & Rentals", 260, 90], ["Honeymoon flights", "Honeymoon", 1800, 600]].map(([n, cat, est, paid], i) => ({ id: "c" + i, n, cat, est, paid }));
  s.checks = CHECK0.map(([b, tt], i) => ({ id: "k" + i, t: tt, before: b, done: b > 142 || [16, 17, 18, 19].includes(i) }));
  s.timeline = TL0.map(([tt, e], i) => ({ id: "l" + i, t: tt, e, who: i === 2 ? "Officiant" : i === 5 ? "Best man" : "" }));
  s.gifts = [["Aunt Sue", "Le Creuset dish", 0, true], ["The Lees", "Cash gift", 150, false], ["Work friends", "Stand mixer", 0, false]].map(([from, gift, amt, ty], i) => ({ id: "f" + i, from, gift, amt, ty }));
  s.ideas = "• Blush & sage flowers — peonies, eucalyptus\n• First dance: 'Perfect' — Ed Sheeran\n• Polaroid guest book\n• Late-night pizza van 🍕\n• Sparkler send-off";
  return s;
}

/* ---------- boot ---------- */
(function () { try { const q = new URLSearchParams(location.search), sig = ["n1", "n2", "date", "theme", "cover", "title", "cur"].map(k => q.get(k) || "").join("|");
  if (sig.replace(/\|/g, "") && S.applied !== sig) { if (q.get("n1")) S.n1 = q.get("n1").slice(0, 30); if (q.get("n2")) S.n2 = q.get("n2").slice(0, 30); if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || "")) S.date = q.get("date"); if (THEMES.some(t => t[0] === q.get("theme"))) S.theme = q.get("theme"); if (q.get("cover")) S.cover = q.get("cover").slice(0, 4); if (q.get("title")) S.title = q.get("title").slice(0, 40); if (q.get("cur")) S.cur = q.get("cur").slice(0, 4); S.applied = sig; save(); } } catch (e) { } })();
applyTheme(); render();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
