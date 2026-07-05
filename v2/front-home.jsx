// ── front shell + home + guestbook ──────────────────────────────
function FrontShell({ children }) {
  const { db, theme, setTheme, route } = useLake();
  const [drawer, setDrawer] = React.useState(false);
  const nav = [
    { key: "home", zh: "首頁", en: "HOME" },
    { key: "blog", zh: "部落格", en: "BLOG" },
    { key: "works", zh: "作品展示", en: "WORKS" },
    { key: "guest", zh: "留言板", en: "GUESTBOOK" },
  ];
  const active = route.page === "article" ? "blog" : route.page;
  return (
    <div className="min-h-screen v-bg theme-fade">
      {/* announcement */}
      {db.settings.announcement && (
        <div className="v-acc-bg mono text-[11px] text-center py-1.5 px-4 tracking-wide">
          {theme === "night" ? "[notice] " + db.settings.announcement : "◈ " + db.settings.announcement}
        </div>
      )}
      {/* header */}
      <header className="border-b rule-heavy v-paper theme-fade sticky top-0 z-40" style={{ borderBottomWidth: "var(--heavy)" }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button className="lg:hidden tap px-2 v-acc mono text-[18px]" onClick={() => setDrawer(d => !d)} aria-label="menu">☰</button>
          <img src="assets/duck-logo.jpg" alt="" className="w-9 h-9 rounded-full border v-line" />
          <div className="leading-tight mr-4 cursor-pointer" onClick={() => go("home")}>
            <div className="ntc font-black text-[15px] tracking-tight">{db.settings.title}</div>
            <div className="mono text-[9.5px] v-dim uppercase tracking-[.18em] hidden sm:block">{db.settings.titleEn}</div>
          </div>
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {nav.map(n => (
              <button key={n.key} onClick={() => go(n.key)}
                className={"tap px-3 ntc text-[13px] font-bold cursor-pointer border-b-2 whitespace-nowrap " + (active === n.key ? "v-acc" : "v-dim hover:opacity-75")}
                style={{ borderColor: active === n.key ? "var(--acc)" : "transparent" }}>
                {n.zh}<span className="mono text-[9px] ml-1.5 opacity-60">{n.en}</span>
              </button>
            ))}
          </nav>
          <div className="flex-1 lg:flex-none"></div>
          {/* theme toggle: day = MAG · night = TERM */}
          <button onClick={() => setTheme(theme === "night" ? "day" : "night")}
            className="tap mono text-[11px] px-3 border v-line rad cursor-pointer flex items-center gap-2">
            <span className={theme === "day" ? "v-acc font-bold" : "v-dim"}>MAG</span>
            <span className="v-dim">/</span>
            <span className={theme === "night" ? "v-acc font-bold" : "v-dim"}>TERM</span>
          </button>
          <button onClick={() => go("admin")} className="tap mono text-[11px] px-3 v-dim hover:opacity-75 cursor-pointer hidden sm:block">後台 →</button>
        </div>
        {drawer && (
          <div className="lg:hidden border-t v-soft v-paper px-4 py-2 flex flex-col">
            {nav.map(n => (
              <button key={n.key} onClick={() => { go(n.key); setDrawer(false); }}
                className={"tap text-left ntc text-[14px] font-bold py-2 " + (active === n.key ? "v-acc" : "v-dim")}>
                {n.zh}
              </button>
            ))}
            <button onClick={() => { go("admin"); setDrawer(false); }} className="tap text-left mono text-[12px] v-dim py-2">後台 →</button>
          </div>
        )}
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>

      <SponsorFab />

      <footer className="border-t rule-heavy mt-6" style={{ borderTopWidth: "var(--heavy)" }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 justify-between mono text-[10.5px] uppercase tracking-[.15em] v-dim">
          <div>{window.SITE.copyright}</div>
          <div className="flex gap-4">
            {db.settings.social.map(s => (
              <a key={s.label} href={s.url} onClick={e => e.preventDefault()} className="hover-rule cursor-pointer">{s.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── home: 小屋門面 ──
function HomePage() {
  const { db, theme } = useLake();
  const [view, setView] = React.useState(() => localStorage.getItem("lake_home_view") || (theme === "night" ? "list" : "grid"));
  React.useEffect(() => { localStorage.setItem("lake_home_view", view); }, [view]);
  const pub = db.articles.filter(a => a.status === "published");
  const latest = [...pub].sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 5);
  const cats = {};
  pub.forEach(a => { cats[a.cat] = (cats[a.cat] || 0) + 1; });
  const totalViews = db.stats.daily.reduce((s, d) => s + d.views, 0);
  const worksCount = pub.filter(a => a.showcase).length;

  return (
    <div>
      {/* hero: personal card */}
      <div className="grid grid-cols-12 gap-5 sm:gap-7 mb-10">
        <div className="col-span-12 md:col-span-8">
          <div className="mono text-[10.5px] v-dim uppercase tracking-[.25em] mb-3">
            {theme === "night" ? "$ cat lakeside.md --render" : "FEATURE · 小屋門面 / CABIN"}
          </div>
          <h1 className="ntc font-black tracking-tighter leading-[0.95] text-[44px] sm:text-[64px] md:text-[76px]">
            {db.settings.title}
            {theme === "night" && <span className="cursor"></span>}
          </h1>
          <div className="ntc text-[14px] sm:text-[15px] v-dim mt-4 max-w-xl leading-relaxed">
            <span className="mono v-acc">{db.settings.tagline}</span> — {db.settings.subtitle}
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => go("blog")} className="btn btn-acc ntc">開始閱讀 →</button>
            <button onClick={() => go("works")} className="btn ntc">看作品</button>
            <button onClick={() => go("guest")} className="btn ntc">簽到留言</button>
          </div>
        </div>
        {/* profile card — 巴哈小屋味 */}
        <aside className="col-span-12 md:col-span-4">
          <div className="v-card p-5 theme-fade">
            <div className="flex items-center gap-3 mb-4">
              <img src="assets/duck-logo.jpg" alt="" className="w-14 h-14 rounded-full border-2 v-line" />
              <div>
                <div className="ntc font-black text-[16px]">{db.settings.owner}</div>
                <div className="mono text-[10px] v-dim">a.k.a. {db.settings.aka}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center mb-4">
              <div className="border v-soft rad py-2">
                <div className="ntc font-black text-[18px] v-acc">{pub.length}</div>
                <div className="mono text-[9px] v-dim">文章</div>
              </div>
              <div className="border v-soft rad py-2">
                <div className="ntc font-black text-[18px] v-acc">{worksCount}</div>
                <div className="mono text-[9px] v-dim">作品</div>
              </div>
            </div>
            <div className="serif italic text-[14px] v-acc2 leading-snug border-t v-soft pt-3">"{db.settings.motto}"</div>
          </div>
        </aside>
      </div>

      {/* latest + categories */}
      <div className="grid grid-cols-12 gap-5 sm:gap-7">
        <div className="col-span-12 md:col-span-8">
          <div className="relative">
            <SecHead num="01" zh="最新動態" en="" />
            <div className="absolute right-0 top-[14px] flex gap-1">
              {[["list", "≡", "清單"], ["grid", "▦", "網格"]].map(([k, ic, l]) => (
                <button key={k} onClick={() => setView(k)} title={l}
                  className={"mono w-8 h-8 border rad cursor-pointer " + (view === k ? "v-acc-bg border-transparent" : "v-line v-dim hover:opacity-75")}
                  style={{ fontSize: "24px", textAlign: "center", lineHeight: k === "list" ? "27.65px" : "20.05px" }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          {view === "list" ? (
            <div className="space-y-0">
              {latest.map(a => (
                <button key={a.id} onClick={() => go("article/" + a.id)}
                  className="w-full text-left flex items-baseline gap-3 py-3 border-b v-soft cursor-pointer group tap">
                  <span className="mono text-[10px] v-dim shrink-0 w-24">{a.date}</span>
                  <span className="mono text-[9.5px] v-acc shrink-0 border v-line rad px-1.5 py-0.5">{a.cat}</span>
                  <span className="ntc text-[14px] font-bold group-hover:underline flex-1 truncate">{a.title}</span>
                  <span className="mono text-[10px] v-dim shrink-0 hidden sm:block">{a.views} views</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {latest.map(a => (
                <button key={a.id} onClick={() => go("article/" + a.id)}
                  className="v-card p-4 text-left cursor-pointer group theme-fade flex flex-col">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <span className="mono text-[9.5px] v-acc border v-line rad px-1.5 py-0.5">{a.cat}</span>
                    <span className="mono text-[10px] v-dim">{a.date}</span>
                  </div>
                  <div className="ntc text-[15px] font-black group-hover:underline leading-snug">{a.title}</div>
                  <div className="ntc text-[11.5px] v-dim leading-relaxed mt-1.5 line-clamp-2 flex-1">{a.blurb}</div>
                  <div className="mono text-[9.5px] v-dim mt-2 pt-2 border-t v-soft">{a.views} views</div>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => go("blog")} className="mono text-[11px] v-acc hover-rule mt-4 cursor-pointer">全部文章 →</button>
        </div>
        <aside className="col-span-12 md:col-span-4">
          <SecHead num="02" zh="分類" en="CATEGORIES" />
          <div className="space-y-1.5">
            {Object.entries(cats).map(([c, n]) => (
              <button key={c} onClick={() => go("blog")}
                className="w-full flex justify-between items-center py-2 px-3 v-card cursor-pointer hover:opacity-80 tap theme-fade">
                <span className="ntc text-[13px] font-bold">{c}</span>
                <span className="mono text-[11px] v-dim">{n} 篇</span>
              </button>
            ))}
          </div>
          <div className="mono text-[10px] v-dim uppercase tracking-[.2em] mt-7 mb-2">— Guestbook —</div>
          <div className="v-card p-4 theme-fade">
            {db.comments.filter(c => c.status === "visible").slice(0, 1).map(c => (
              <div key={c.id}>
                <div className="ntc text-[12.5px] leading-relaxed">「{c.text}」</div>
                <div className="mono text-[10px] v-dim mt-2">— {c.name} · {c.date}</div>
              </div>
            ))}
            <button onClick={() => go("guest")} className="mono text-[11px] v-acc hover-rule mt-3 cursor-pointer">去留言板 →</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── guestbook: 巴哈小屋風留言板 ──
function GuestPage() {
  const { db, update, theme } = useLake();
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const visible = db.comments.filter(c => c.status === "visible" && !c.articleId);

  const submit = () => {
    if (!text.trim()) return;
    update(d => {
      d.comments.unshift({
        id: Lake.uid(), name: name.trim() || "匿名訪客", date: Lake.today(),
        text: text.trim(), status: "pending", reply: "", articleId: null,
      });
      return d;
    });
    setName(""); setText(""); setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <div className="max-w-[760px]">
      <SecHead num="04" zh="訪客留言板" en="GUESTBOOK"
        sub={theme === "night" ? "$ sign --guestbook — 留言送出後由屋主審核再顯示。" : "讀者來函 — 路過簽到、感想、敲碗都可以，審核後刊登。"} />
      {/* composer */}
      <div className="v-card p-4 sm:p-5 mb-8 theme-fade">
        <div className="mono text-[10.5px] v-dim mb-3">{theme === "night" ? "$ cat >> guestbook.log" : "LETTERS · 投書欄"}</div>
        <div className="grid sm:grid-cols-[200px_1fr] gap-3 mb-3">
          <input className="inp ntc" placeholder="暱稱（可留空）" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
          <div className="mono text-[10px] v-dim self-center hidden sm:block">{Lake.today()} · 訪客</div>
        </div>
        <textarea className="inp ntc" rows={3} placeholder="說點什麼吧…" value={text} onChange={e => setText(e.target.value)} maxLength={300}></textarea>
        <div className="flex items-center justify-between mt-3">
          <div className="mono text-[10px] v-dim">{text.length} / 300</div>
          <button className="btn btn-acc ntc" onClick={submit}>送出留言</button>
        </div>
        {sent && <div className="mono text-[11px] v-acc mt-2">✓ 已送出，待屋主審核後顯示。</div>}
      </div>
      {/* messages */}
      <div className="space-y-4">
        {visible.map(c => (
          <div key={c.id} className="v-card p-4 theme-fade">
            <div className="flex items-baseline gap-3 mb-1.5">
              <div className="w-7 h-7 rounded-full v-acc-bg flex items-center justify-center ntc text-[12px] font-black shrink-0 self-center">
                {c.name.slice(0, 1)}
              </div>
              <span className="ntc text-[13px] font-black">{c.name}</span>
              <span className="mono text-[10px] v-dim">{c.date}</span>
            </div>
            <div className="ntc text-[13.5px] leading-relaxed pl-10">{c.text}</div>
            {c.reply && (
              <div className="mt-3 ml-10 border-l-2 pl-3" style={{ borderColor: "var(--acc)" }}>
                <div className="mono text-[10px] v-acc mb-0.5">↳ 屋主回覆</div>
                <div className="ntc text-[13px] v-dim leading-relaxed">{c.reply}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── sponsor FAB: 蜜蜂檸檬 ──
function HoneyLemonIcon({ size }) {
  return (
    <svg width={size || 26} height={size || 26} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.5 2 L10.8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.5 8 H17.5 L16.3 20.2 A1.8 1.8 0 0 1 14.5 21.8 H9.5 A1.8 1.8 0 0 1 7.7 20.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.3 12.5 H16.7 L16 19.6 A1 1 0 0 1 15 20.5 H9 A1 1 0 0 1 8 19.6 Z" fill="currentColor" opacity=".45" />
      <circle cx="17.2" cy="7.2" r="3" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M17.2 4.6 V9.8 M14.7 7.2 H19.7 M15.5 5.4 L18.9 9 M18.9 5.4 L15.5 9" stroke="currentColor" strokeWidth=".8" />
    </svg>
  );
}

function SponsorFab() {
  const { db, update, theme } = useLake();
  const sp = db.settings.sponsor || { title: "請小鴨喝杯蜂蜜檸檬", subtitle: "", tiers: [] };
  const tiers = sp.tiers || [];
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(tiers[0] ? tiers[0].amt : 50);
  const [custom, setCustom] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [thanks, setThanks] = React.useState(false);
  const finalAmt = custom !== "" ? Number(custom) || 0 : amount;

  const confirm = () => {
    if (finalAmt <= 0) return;
    update(d => {
      d.donations = d.donations || [];
      d.donations.unshift({ id: Lake.uid(), date: Lake.today(), amt: finalAmt, name: "匿名訪客", note: msg.trim() });
      return d;
    });
    setThanks(true);
    setTimeout(() => { setThanks(false); setOpen(false); setCustom(""); setMsg(""); setAmount(tiers[0] ? tiers[0].amt : 50); }, 2200);
  };

  return (
    <React.Fragment>
      <button onClick={() => setOpen(true)} aria-label={sp.title}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full v-acc-bg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        style={{ boxShadow: "0 4px 18px color-mix(in srgb, var(--acc) 45%, transparent)" }}>
        <HoneyLemonIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => !thanks && setOpen(false)}
          style={{ background: "color-mix(in srgb, var(--ink) 40%, transparent)" }}>
          <div className="v-paper border v-line rad w-full max-w-[380px] p-6 theme-fade" onClick={e => e.stopPropagation()}
            style={{ borderWidth: "var(--heavy)" }}>
            {thanks ? (
              <div className="text-center py-8">
                <div className="v-acc mb-3 flex justify-center"><HoneyLemonIcon size={44} /></div>
                <div className="ntc font-black text-[18px]">感謝你的蜂蜜檸檬！</div>
                <div className="mono text-[11px] v-dim mt-1">NT$ {finalAmt} · {theme === "night" ? "payment ok (200)" : "心意已送達"}</div>
              </div>
            ) : (
              <React.Fragment>
                <div className="flex items-center gap-3 mb-1">
                  <span className="v-acc"><HoneyLemonIcon size={30} /></span>
                  <div className="ntc font-black text-[17px]">{sp.title}</div>
                </div>
                {sp.subtitle && <div className="ntc text-[12px] v-dim mb-1.5">{sp.subtitle}</div>}
                <div className="mono text-[10.5px] v-dim mb-5">{theme === "night" ? "$ donate --to=duck" : "SUPPORT · 贊助創作"}</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {tiers.map(t => (
                    <button key={t.amt} onClick={() => { setAmount(t.amt); setCustom(""); }}
                      className={"tap py-2.5 border rad cursor-pointer flex flex-col items-center gap-1 " +
                        (custom === "" && amount === t.amt ? "v-acc-bg border-transparent" : "v-line hover:opacity-75")}>
                      <span className="ntc font-black text-[15px] leading-none">${t.amt}</span>
                      <span className={"ntc text-[10px] leading-none " + (custom === "" && amount === t.amt ? "opacity-80" : "v-dim")}>{t.label}</span>
                    </button>
                  ))}
                </div>
                <input type="number" min="1" className="inp mono mb-3" placeholder="自訂金額（NT$）"
                  value={custom} onChange={e => setCustom(e.target.value)} />
                <textarea className="inp ntc mb-5" rows={2} maxLength={100} placeholder="想對小鴨說的話（可留空）"
                  value={msg} onChange={e => setMsg(e.target.value)}></textarea>
                <div className="flex gap-2">
                  <button className="btn ntc flex-1" onClick={() => setOpen(false)}>下次一定</button>
                  <button className="btn btn-acc ntc flex-1" onClick={confirm}>贊助 NT$ {finalAmt || "—"}</button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { FrontShell, HomePage, GuestPage, SponsorFab, HoneyLemonIcon });
