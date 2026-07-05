// ── admin: login, shell (3 skins), dashboard overview, settings ──
function AdminLogin({ onLogin }) {
  const [pw, setPw] = React.useState("");
  return (
    <div className="adm adm-neutral flex items-center justify-center min-h-screen px-4">
      <div className="a-panel p-8 w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-6">
          <img src="assets/duck-logo.jpg" alt="" className="w-10 h-10 rounded-full" />
          <div>
            <div className="ntc font-black text-[16px]">湖畔後台</div>
            <div className="a-dim text-[11px] mono">lakeside · admin console</div>
          </div>
        </div>
        <label className="block text-[12px] font-bold mb-1.5 ntc">管理員密碼</label>
        <input type="password" className="a-inp mb-2" value={pw} placeholder="••••••••"
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onLogin()} />
        <div className="a-dim text-[10.5px] mono mb-5">原型示意：任意密碼皆可登入。</div>
        <button className="a-btn a-btn-acc w-full ntc" onClick={onLogin}>登入後台 →</button>
        <button className="a-btn w-full mt-2 ntc" onClick={() => go("home")}>← 回前台</button>
      </div>
    </div>
  );
}

const ADMIN_TABS = [
  { key: "over", zh: "總覽", icon: "◧" },
  { key: "posts", zh: "文章管理", icon: "≡" },
  { key: "works", zh: "作品管理", icon: "▦" },
  { key: "cmts", zh: "留言管理", icon: "◍" },
  { key: "spon", zh: "贊助管理", icon: "◈" },
  { key: "set", zh: "網站設定", icon: "⚙" },
];

function AdminShell() {
  const { db } = useLake();
  const [authed, setAuthed] = React.useState(() => sessionStorage.getItem("lake_admin") === "1");
  const [tab, setTab] = React.useState("over");
  const [skin, setSkin] = React.useState(() => localStorage.getItem("lake_admin_skin") || "neutral");
  const [editId, setEditId] = React.useState(null); // article being edited
  const setSkinP = s => { setSkin(s); localStorage.setItem("lake_admin_skin", s); };

  if (!authed) return <AdminLogin onLogin={() => { sessionStorage.setItem("lake_admin", "1"); setAuthed(true); }} />;

  const pendingC = db.comments.filter(c => c.status === "pending").length;
  const openEditor = id => { setEditId(id); setTab("editor"); };

  return (
    <div className={"adm adm-" + skin}>
      {/* topbar */}
      <div className="a-panel rounded-none border-x-0 border-t-0 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 min-h-14 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <img src="assets/duck-logo.jpg" alt="" className="w-8 h-8 rounded-full" />
          <div className="ntc font-black text-[14px]">湖畔後台</div>
          <div className="a-dim mono text-[10px] hidden sm:block">admin console</div>
          <div className="flex-1"></div>
          {/* skin explorer */}
          <div className="flex items-center gap-1 mono text-[10px] mr-2">
            <span className="a-dim hidden sm:inline mr-1">風格</span>
            {[["neutral", "中性"], ["day", "MAG"], ["night", "TERM"]].map(([k, l]) => (
              <button key={k} onClick={() => setSkinP(k)}
                className={"px-2 py-1 cursor-pointer tap " + (skin === k ? "a-acc-bg rounded" : "a-dim hover:opacity-75")}
                style={skin === k ? { borderRadius: "var(--a-rad)" } : {}}>
                {l}
              </button>
            ))}
          </div>
          <button className="a-btn ntc text-[11px]" onClick={() => go("home")}>看前台</button>
          <button className="a-btn ntc text-[11px]" onClick={() => { sessionStorage.removeItem("lake_admin"); setAuthed(false); }}>登出</button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-5">
        {/* sidebar */}
        <nav className="col-span-12 lg:col-span-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
          {ADMIN_TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setEditId(null); }}
              className={"tap text-left px-3 py-2 ntc text-[13px] font-bold whitespace-nowrap cursor-pointer flex items-center gap-2 " +
                (tab === t.key || (tab === "editor" && t.key === "posts") ? "a-acc-bg" : "a-dim hover:opacity-75")}
              style={{ borderRadius: "var(--a-rad)" }}>
              <span className="mono">{t.icon}</span>{t.zh}
              {t.key === "cmts" && pendingC > 0 && (
                <span className="mono text-[9px] px-1.5 rounded-full" style={{ background: "var(--a-acc)", color: "var(--a-acc-c)", opacity: tab === "cmts" ? .7 : 1 }}>{pendingC}</span>
              )}
            </button>
          ))}
        </nav>
        {/* content */}
        <div className="col-span-12 lg:col-span-10">
          {tab === "over" && <AdminOverview goTab={setTab} />}
          {tab === "posts" && <AdminPosts openEditor={openEditor} />}
          {tab === "editor" && <AdminEditor id={editId} back={() => setTab("posts")} />}
          {tab === "works" && <AdminWorks openEditor={openEditor} />}
          {tab === "cmts" && <AdminComments />}
          {tab === "spon" && <AdminSponsor />}
          {tab === "set" && <AdminSettings />}
        </div>
      </div>
    </div>
  );
}

// ── overview: stats dashboard ──
function AdminOverview({ goTab }) {
  const { db } = useLake();
  const days = db.stats.daily;
  const last14 = days.slice(-14);
  const maxV = Math.max(...last14.map(d => d.views));
  const totV = days.reduce((s, d) => s + d.views, 0);
  const totU = days.reduce((s, d) => s + d.visitors, 0);
  const pub = db.articles.filter(a => a.status === "published");
  const top = [...db.articles].sort((a, b) => b.views - a.views).slice(0, 5);
  const pending = db.comments.filter(c => c.status === "pending");

  const Kpi = ({ label, v, sub }) => (
    <div className="a-panel p-4">
      <div className="a-dim mono text-[10px] uppercase tracking-[.15em] mb-1">{label}</div>
      <div className="ntc font-black text-[26px] leading-none">{v}</div>
      <div className="a-dim text-[10.5px] mono mt-1">{sub}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="30 日瀏覽量" v={totV.toLocaleString()} sub="views / 30d" />
        <Kpi label="30 日訪客" v={totU.toLocaleString()} sub="unique visitors" />
        <Kpi label="已發布文章" v={pub.length} sub={db.articles.length - pub.length + " 篇草稿"} />
        <Kpi label="待審留言" v={pending.length} sub={db.comments.length + " 則留言"} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* traffic bars */}
        <div className="a-panel p-5 col-span-12 lg:col-span-7">
          <div className="flex items-baseline justify-between mb-4">
            <div className="ntc font-black text-[14px]">流量趨勢</div>
            <div className="a-dim mono text-[10px]">最近 14 天 · 假資料示意</div>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {last14.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full relative flex items-end" style={{ height: "104px" }}>
                  <div className="w-full transition-all"
                    style={{ height: (d.views / maxV * 100) + "%", background: "var(--a-acc)", opacity: .35 + .65 * (d.views / maxV), borderRadius: "3px 3px 0 0" }}
                    title={d.d + " · " + d.views + " views"}></div>
                </div>
                <div className="a-dim mono text-[8px]">{d.d}</div>
              </div>
            ))}
          </div>
        </div>
        {/* top articles */}
        <div className="a-panel p-5 col-span-12 lg:col-span-5">
          <div className="ntc font-black text-[14px] mb-3">熱門文章</div>
          <div className="space-y-2">
            {top.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2.5">
                <span className="mono text-[11px] a-acc font-bold w-5">{i + 1}</span>
                <span className="ntc text-[12.5px] font-bold flex-1 truncate">{a.title}</span>
                <span className="mono text-[10px] a-dim">{a.views}</span>
              </div>
            ))}
          </div>
          <button className="a-btn w-full mt-4 ntc text-[11px]" onClick={() => goTab("posts")}>管理文章 →</button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="a-panel p-4 flex items-center gap-3">
          <span className="mono a-acc">◍</span>
          <span className="ntc text-[13px] flex-1">有 <b>{pending.length}</b> 則留言待審核。</span>
          <button className="a-btn a-btn-acc ntc text-[11px]" onClick={() => goTab("cmts")}>前往審核</button>
        </div>
      )}
    </div>
  );
}

// ── sponsor: 設定 + 數據 ──
function AdminSponsor() {
  const { db, update } = useLake();
  const sp = db.settings.sponsor;
  const dons = db.donations || [];
  const set = (k, v) => update(d => { d.settings.sponsor[k] = v; return d; });
  const setTier = (i, k, v) => update(d => { d.settings.sponsor.tiers[i][k] = v; return d; });

  const total = dons.reduce((s, x) => s + x.amt, 0);
  const month = dons.filter(x => x.date.startsWith("2026 / 07"));
  const monthTotal = month.reduce((s, x) => s + x.amt, 0);
  const avg = dons.length ? Math.round(total / dons.length) : 0;

  const Kpi = ({ label, v, sub }) => (
    <div className="a-panel p-4">
      <div className="a-dim mono text-[10px] uppercase tracking-[.15em] mb-1">{label}</div>
      <div className="ntc font-black text-[26px] leading-none">{v}</div>
      <div className="a-dim text-[10.5px] mono mt-1">{sub}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="ntc font-black text-[16px]">贊助管理</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="累計贊助" v={"NT$ " + total.toLocaleString()} sub={dons.length + " 筆"} />
        <Kpi label="本月贊助" v={"NT$ " + monthTotal.toLocaleString()} sub={month.length + " 筆 · 7 月"} />
        <Kpi label="平均金額" v={"NT$ " + avg} sub="avg / donation" />
        <Kpi label="最近一筆" v={dons[0] ? "NT$ " + dons[0].amt : "—"} sub={dons[0] ? dons[0].date : "尚無贊助"} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 設定 */}
        <div className="a-panel p-5 col-span-12 lg:col-span-6 space-y-4">
          <div className="ntc font-black text-[14px]">贊助視窗設定</div>
          <div>
            <label className="block ntc text-[12px] font-bold mb-1">標題</label>
            <input className="a-inp ntc" value={sp.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div>
            <label className="block ntc text-[12px] font-bold mb-1">副標題</label>
            <input className="a-inp ntc" value={sp.subtitle} placeholder="例：人要吃飯才能創作、網站要錢才能運作。" onChange={e => set("subtitle", e.target.value)} />
          </div>
          <div>
            <label className="block ntc text-[12px] font-bold mb-1.5">預設金額按鈕 × 3（金額 + 說明小字）</label>
            <div className="space-y-2">
              {sp.tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-[90px_1fr] gap-2">
                  <input type="number" className="a-inp mono text-[12px]" value={t.amt}
                    onChange={e => setTier(i, "amt", Number(e.target.value) || 0)} />
                  <input className="a-inp ntc" value={t.label} placeholder="例：Claude 訂閱費"
                    onChange={e => setTier(i, "label", e.target.value)} />
                </div>
              ))}
            </div>
            <div className="a-dim mono text-[10px] mt-1.5">前台贊助視窗即時反映。</div>
          </div>
        </div>
        {/* 紀錄 */}
        <div className="a-panel p-5 col-span-12 lg:col-span-6">
          <div className="ntc font-black text-[14px] mb-3">贊助紀錄</div>
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {dons.map(x => (
              <div key={x.id} className="flex items-baseline gap-2.5 border-b a-line pb-2">
                <span className="mono text-[10px] a-dim shrink-0">{x.date}</span>
                <span className="ntc text-[12.5px] font-bold flex-1 truncate">{x.name}{x.note ? <span className="a-dim font-normal">「{x.note}」</span> : null}</span>
                <span className="mono text-[12px] a-acc font-bold shrink-0">NT$ {x.amt}</span>
              </div>
            ))}
            {dons.length === 0 && <div className="a-dim mono text-[11px]">尚無贊助紀錄。</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── settings ──
function AdminSettings() {
  const { db, update } = useLake();
  const s = db.settings;
  const set = (k, v) => update(d => { d.settings[k] = v; return d; });
  const setSocial = (i, k, v) => update(d => { d.settings.social[i][k] = v; return d; });
  const addSocial = () => update(d => { d.settings.social.push({ label: "新連結", url: "" }); return d; });
  const delSocial = i => update(d => { d.settings.social.splice(i, 1); return d; });
  const [saved, setSaved] = React.useState(false);
  const [newCatB, setNewCatB] = React.useState("");
  const [newCatW, setNewCatW] = React.useState("");
  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const addCat = (key, val, clear) => {
    const v = val.trim();
    if (!v) return;
    update(d => {
      if (!d.settings[key].includes(v)) d.settings[key].push(v);
      return d;
    });
    clear("");
  };
  const delCat = (key, c) => {
    const inUse = key === "catsBlog"
      ? db.articles.some(a => a.cat === c)
      : db.articles.some(a => a.showcase && a.workCat === c);
    if (inUse) { alert("尚有文章使用「" + c + "」分類，請先調整那些文章。"); return; }
    update(d => { d.settings[key] = d.settings[key].filter(x => x !== c); return d; });
  };

  const inp = (k, extra) => (
    <input className="a-inp" value={s[k]} onChange={e => set(k, e.target.value)} {...(extra || {})} />
  );

  const CatEditor = (key, label, hint, newVal, setNewVal) => (
    <div>
      <div className="ntc text-[12px] font-bold mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {s[key].map(c => (
          <span key={c} className="inline-flex items-center gap-1.5 border a-line px-2.5 py-1 ntc text-[12px]" style={{ borderRadius: "var(--a-rad)" }}>
            {c}
            <button className="a-dim mono text-[11px] cursor-pointer hover:opacity-70" title="刪除分類" onClick={() => delCat(key, c)}>✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="a-inp ntc" style={{ maxWidth: "200px" }} value={newVal} placeholder="新分類名稱"
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCat(key, newVal, setNewVal)} />
        <button className="a-btn ntc text-[11px]" onClick={() => addCat(key, newVal, setNewVal)}>＋新增</button>
      </div>
      <div className="a-dim text-[10px] mono mt-1">{hint}</div>
    </div>
  );

  return (
    <div className="max-w-[680px] space-y-5">
      <div className="a-panel p-5 space-y-4">
        <div className="ntc font-black text-[14px]">基本資料</div>
        <div><label className="block ntc text-[12px] font-bold mb-1">網站標題</label>{inp("title")}</div>
        <div><label className="block ntc text-[12px] font-bold mb-1">英文副標</label>{inp("titleEn")}</div>
        <div>
          <label className="block ntc text-[12px] font-bold mb-1">a.k.a. 稱號（首頁名片顯示）</label>
          {inp("aka", { placeholder: "例：站長小鴨" })}
        </div>
        <div><label className="block ntc text-[12px] font-bold mb-1">標語（首頁大標下方，等寬字）</label>{inp("tagline", { placeholder: "例：Programmer × Novelist" })}</div>
        <div><label className="block ntc text-[12px] font-bold mb-1">副標題（接在標語後方）</label>{inp("subtitle", { placeholder: "例：程式與小說，是成本最低的『創作』。" })}</div>
        <div><label className="block ntc text-[12px] font-bold mb-1">座右銘</label>{inp("motto")}</div>
        <div>
          <label className="block ntc text-[12px] font-bold mb-1">公告列</label>
          {inp("announcement")}
          <div className="a-dim text-[10px] mono mt-1">留空即隱藏前台公告列。改動立即反映在前台。</div>
        </div>
      </div>

      <div className="a-panel p-5 space-y-4">
        <div className="ntc font-black text-[14px]">分類管理</div>
        {CatEditor("catsBlog", "部落格分類", "新分類會出現在文章編輯器的分類選單與前台篩選。使用中的分類無法刪除。", newCatB, setNewCatB)}
        {CatEditor("catsWorks", "作品展示分類", "作品展示頁依此分組；文章編輯器勾選展示後可選擇分類。", newCatW, setNewCatW)}
      </div>

      <div className="a-panel p-5 space-y-3">
        <div className="flex items-center">
          <div className="ntc font-black text-[14px] flex-1">社群連結</div>
          <button className="a-btn ntc text-[11px]" onClick={addSocial}>＋新增連結</button>
        </div>
        {s.social.map((so, i) => (
          <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-2">
            <input className="a-inp" value={so.label} onChange={e => setSocial(i, "label", e.target.value)} />
            <input className="a-inp mono text-[12px]" value={so.url} placeholder="https://…" onChange={e => setSocial(i, "url", e.target.value)} />
            <button className="a-btn ntc text-[11px] a-dim" title="刪除" onClick={() => delSocial(i)}>✕</button>
          </div>
        ))}
        {s.social.length === 0 && <div className="a-dim mono text-[11px]">尚無連結 — 頁尾將不顯示社群區。</div>}
      </div>

      <div className="a-panel p-4 a-dim ntc text-[12px]">
        原型注記 — 目前所有內容（文章、作品、留言、設定、贊助）都存在瀏覽器儲存中模擬資料庫；正式版換成後端 API 後，這些後台介面維持不變，直接對接資料庫即可。
      </div>

      <div className="flex items-center gap-3">
        <button className="a-btn a-btn-acc ntc" onClick={flash}>儲存設定</button>
        {saved && <span className="mono text-[11px] a-acc">✓ 已儲存（原型即時生效）</span>}
        <div className="flex-1"></div>
        <button className="a-btn ntc text-[11px]" onClick={() => { if (confirm("重設所有內容為預設值？")) { Lake.reset(); location.reload(); } }}>重設示範資料</button>
      </div>
    </div>
  );
}

Object.assign(window, { AdminShell, AdminLogin, AdminOverview, AdminSettings, AdminSponsor });
