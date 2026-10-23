// دانلود عکس واقعی از Wikimedia Commons API (بدون Cloudflare) + فیلتر ربط سخت‌گیرانه
// اجرا: node scripts/fetch-images.mjs
import { writeFile, mkdir, readdir } from "node:fs/promises";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = "public/products";
const WANT_PER_CAT = 3;

const CATS = {
  circuits: {
    q: ["anaesthesia machine", "medical ventilator machine", "corrugated breathing tube", "respiratory therapy equipment"],
    good: ["circuit", "tube", "tubing", "breathing", "ventilator", "hose", "respiratory", "anaesthesia", "anesthesia", "corrugated", "ventilation", "machine", "anaesthetic"],
  },
  filters: {
    q: ["breathing system filter", "heat moisture exchanger", "bacterial viral filter breathing"],
    good: ["filter", "hme", "breathing", "respiratory", "exchanger", "bacterial", "viral"],
  },
  airway: {
    q: ["laryngeal mask airway", "endotracheal tube intubation", "oxygen mask patient hospital"],
    good: ["mask", "airway", "laryngeal", "oxygen", "intubation", "endotracheal", "respirator", "cannula", "tracheal"],
  },
  dressing: {
    q: ["surgical adhesive tape", "wound dressing bandage", "gauze bandage medical"],
    good: ["tape", "dressing", "bandage", "gauze", "adhesive", "wound", "plaster"],
  },
  infusion: {
    q: ["intravenous drip bag", "infusion set medical", "syringe injection medical"],
    good: ["iv", "infusion", "drip", "saline", "syringe", "catheter", "intravenous", "injection", "needle", "cannula", "fluid"],
  },
  neonatal: {
    q: ["neonatal incubator", "newborn intensive care unit", "premature infant hospital"],
    good: ["incubator", "neonatal", "newborn", "infant", "nicu", "premature", "neonate", "intensive care", "baby"],
  },
};

const BLOCK = [
  "plant", "thapsus", "mullein", "flower", "botanic", "leaf", "tree", "fungus",
  "molecule", "structure", "formula", "chemical", "crystal", "spectra",
  "engraving", "lithograph", "etching", "woodcut", "drawing", "sketch", "painting", "portrait", "illustration",
  "1854", "1880", "1890", "1900", "1910", "1920", "1930", "1940", "1950", "18th", "19th", "antique", "vintage", "historical", "museum",
  "diagram", "schematic", "schm", "simple ", "chart", "graph", "map", "logo", "icon", "svg", "seal", "coat of arms",
  "stamp", "banknote", "coin", "poster", "cartoon",
  "wellcome", "clover", "ether inhaler", "chloroform", "science museum", "antique", "collection",
  "iwm", "battle", " war ", "wounded", "1942", "1943", "1944", "art.",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fetch با retry برای 429/403 و backoff
async function fetchRetry(url, opts, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, opts);
    if (r.ok) return r;
    if (r.status === 429 || r.status === 403) {
      await sleep(1200 * (i + 1));
      continue;
    }
    return r;
  }
  return fetch(url, opts);
}

function score(title, good) {
  const t = (title || "").toLowerCase();
  if (BLOCK.some((b) => t.includes(b))) return -1;
  let s = 0;
  for (const g of good) if (t.includes(g)) s += 1;
  return s;
}

async function search(q) {
  const api = "https://commons.wikimedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query", format: "json", generator: "search",
    gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "40",
    prop: "imageinfo", iiprop: "url|size|mime", iiurlwidth: "900",
  });
  const r = await fetchRetry(`${api}?${params}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) return [];
  const j = await r.json();
  const pages = j?.query?.pages || {};
  return Object.values(pages).map((p) => {
    const ii = (p.imageinfo || [])[0] || {};
    return {
      title: (p.title || "").replace(/^File:/, ""),
      url: ii.thumburl || ii.url,
      mime: ii.mime,
      w: ii.width, h: ii.height,
      source: ii.descriptionurl,
    };
  }).filter((x) => x.url);
}

async function download(u) {
  const r = await fetchRetry(u, {
    headers: {
      "User-Agent": UA,
      Referer: "https://commons.wikimedia.org/",
      Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
    },
  });
  if (!r.ok) throw new Error("http " + r.status);
  const ct = r.headers.get("content-type") || "";
  if (!/image\/(jpeg|png|webp)/.test(ct)) throw new Error("not image: " + ct);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 15000) throw new Error("too small");
  return buf;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const credits = [];
  const manifest = {};
  const existingFiles = (await readdir(OUT).catch(() => [])).filter((f) => /-\d+\.jpg$/.test(f));

  for (const [cat, cfg] of Object.entries(CATS)) {
    // اگر این دسته از قبل به تعداد کافی عکس دارد، ردش کن (برای re-run بدون فشار روی سرور)
    const existing = existingFiles.filter((f) => f.startsWith(`${cat}-`)).sort();
    if (existing.length >= WANT_PER_CAT) {
      manifest[cat] = existing.slice(0, WANT_PER_CAT).map((f) => `/products/${f}`);
      console.log(`= ${cat}: از قبل موجود (${existing.length})`);
      continue;
    }

    let cands = [];
    for (const q of cfg.q) {
      try { cands.push(...(await search(q))); } catch {}
      await sleep(700);
    }
    const seen = new Set();
    cands = cands
      .filter((c) => !seen.has(c.url) && seen.add(c.url))
      .map((c) => ({ ...c, s: score(c.title, cfg.good) }))
      .filter((c) => c.s > 0 && (c.w || 0) >= 400)
      .sort((a, b) => b.s - a.s);

    const got = [];
    for (const c of cands) {
      if (got.length >= WANT_PER_CAT) break;
      const name = `${cat}-${got.length + 1}.jpg`;
      try {
        const buf = await download(c.url);
        await writeFile(`${OUT}/${name}`, buf);
        got.push(`/products/${name}`);
        credits.push({ file: name, score: c.s, title: c.title, source: c.source });
        console.log(`✓ ${name}  (${(buf.length / 1024) | 0}KB) [ربط:${c.s}]  ${c.title}`);
      } catch {}
      await sleep(600);
    }
    manifest[cat] = got;
    if (!got.length) console.log(`✗ ${cat}: هیچ عکس مرتبطی دانلود نشد`);
  }

  await writeFile(`${OUT}/CREDITS.json`, JSON.stringify(credits, null, 2));
  await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log("\nMANIFEST:\n" + JSON.stringify(manifest, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
