// ── admin: posts list, markdown editor, works mgmt, comments ────
function StatusPill({ st }) {
  const on = st === "published";
  return (
    <span className="mono text-[9.5px] px-2 py-0.5 border a-line inline-flex items-center gap-1.5" style={{ borderRadius: "var(--a-rad)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "var(--a-acc)" : "var(--a-dim)" }}></span>
      {on ? "已發布" : "草稿"}
    </span>
  );
}

function AdminPosts({ openEditor }) {
  const { db, update } = useLake();
  const [filter, setFilter] = React.useState("all");
  const list = db.articles.filter(a => filter === "all" ? true : a.status === filter);

  const toggle = id => update(d => {
    const a = d.articles.find(x => x.id === id);
    if (a) a.status = a.status === "published" ? "draft" : "published";
    return d;
  });
  const del = id => {
    if (!confirm("刪除這篇文章？")) return;
    update(d => { d.articles = d.articles.filter(x => x.id !== id); return d; });
  };
  const create = () => {
    const id = Lake.uid();
    update(d => {
      d.articles.unshift({ id, title: "未命名文章", cat: (d.settings.catsBlog || ["隨筆"])[0], date: Lake.today(), y: 2026, status: "draft", views: 0, blurb: "", award: "", banner: "", bannerFade: false, showcase: false, workCat: "", gallery: [], body: "" });
      return d;
    });
    openEditor(id);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="ntc font-black text-[16px] mr-2">文章管理</div>
        {[["all", "全部"], ["published", "已發布"], ["draft", "草稿"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={"mono text-[11px] px-2.5 py-1 cursor-pointer tap " + (filter === k ? "a-acc-bg" : "a-dim border a-line")}
            style={{ borderRadius: "var(--a-rad)" }}>{l}</button>
        ))}
        <div className="flex-1"></div>
        <button className="a-btn a-btn-acc ntc text-[12px]" onClick={create}>＋ 新增文章</button>
      </div>
      <div className="a-panel overflow-hidden">
        {list.map((a, i) => (
          <div key={a.id} className={"flex items-center gap-3 px-4 py-3 " + (i > 0 ? "border-t a-line" : "")}>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="ntc font-bold text-[13.5px] truncate">{a.title}</span>
                <span className="mono text-[9.5px] a-acc">{a.cat}</span>
                <StatusPill st={a.status} />
              </div>
              <div className="a-dim mono text-[10px] mt-0.5">{a.date} · {a.views} views</div>
            </div>
            <button className="a-btn ntc text-[11px]" onClick={() => openEditor(a.id)}>編輯</button>
            <button className="a-btn ntc text-[11px]" onClick={() => toggle(a.id)}>{a.status === "published" ? "下架" : "發布"}</button>
            <button className="a-btn ntc text-[11px] a-dim" onClick={() => del(a.id)}>刪除</button>
          </div>
        ))}
        {list.length === 0 && <div className="a-dim mono text-[11px] p-6 text-center">沒有符合的文章。</div>}
      </div>
    </div>
  );
}

// ── markdown editor with live preview ──
function AdminEditor({ id, back }) {
  const { db, update } = useLake();
  const a = db.articles.find(x => x.id === id);
  const [showPrev, setShowPrev] = React.useState(true);
  const [full, setFull] = React.useState(false);
  const [edFs, setEdFs] = React.useState(() => Number(localStorage.getItem("lake_editor_fs")) || 12.5);
  const setEdFsP = v => { setEdFs(v); localStorage.setItem("lake_editor_fs", v); };
  React.useEffect(() => {
    if (!full) return;
    const onKey = e => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [full]);
  if (!a) return <div className="a-dim mono text-[12px]">找不到文章。<button className="a-btn ml-2" onClick={back}>返回</button></div>;
  const set = (k, v) => update(d => { const t = d.articles.find(x => x.id === id); if (t) t[k] = v; return d; });
  const cats = Array.from(new Set([...(db.settings.catsBlog || []), a.cat].filter(Boolean)));
  const wCats = db.settings.catsWorks || [];
  const gallery = a.gallery || [];
  const setGal = (i, v) => update(d => { const t = d.articles.find(x => x.id === id); if (t) { t.gallery = t.gallery || []; t.gallery[i] = v; } return d; });
  const addGal = () => update(d => { const t = d.articles.find(x => x.id === id); if (t) { t.gallery = t.gallery || []; if (t.gallery.length < 10) t.gallery.push(""); } return d; });
  const delGal = i => update(d => { const t = d.articles.find(x => x.id === id); if (t && t.gallery) t.gallery.splice(i, 1); return d; });
  const moveGal = (i, dir) => update(d => {
    const t = d.articles.find(x => x.id === id);
    if (!t || !t.gallery) return d;
    const j = i + dir;
    if (j < 0 || j >= t.gallery.length) return d;
    [t.gallery[i], t.gallery[j]] = [t.gallery[j], t.gallery[i]];
    return d;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button className="a-btn ntc text-[11px]" onClick={back}>← 文章列表</button>
        <div className="ntc font-black text-[15px] flex-1 truncate">編輯：{a.title}</div>
        <StatusPill st={a.status} />
        <button className="a-btn a-btn-acc ntc text-[11px]"
          onClick={() => set("status", a.status === "published" ? "draft" : "published")}>
          {a.status === "published" ? "轉為草稿" : "發布上線"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-12 sm:col-span-6">
          <label className="block ntc text-[11px] font-bold mb-1">標題</label>
          <input className="a-inp ntc" value={a.title} onChange={e => set("title", e.target.value)} />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block ntc text-[11px] font-bold mb-1">分類</label>
          <select className="a-inp ntc" value={a.cat} onChange={e => set("cat", e.target.value)}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block ntc text-[11px] font-bold mb-1">日期</label>
          <input className="a-inp mono text-[12px]" value={a.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div className="col-span-12">
          <label className="block ntc text-[11px] font-bold mb-1">附註（顯示於標題下方，如得獎紀錄、技術棧；留空則不顯示）</label>
          <input className="a-inp ntc" value={a.award || ""} placeholder="例：第 39 屆淡江大學五虎崗文學獎，小說組" onChange={e => set("award", e.target.value)} />
        </div>
        <div className="col-span-12">
          <label className="block ntc text-[11px] font-bold mb-1">摘要（列表顯示）</label>
          <input className="a-inp ntc" value={a.blurb} onChange={e => set("blurb", e.target.value)} />
        </div>
        <div className="col-span-12 sm:col-span-8">
          <label className="block ntc text-[11px] font-bold mb-1">橫幅圖片 URL（Notion 式封面，留空則無）</label>
          <input className="a-inp mono text-[12px]" value={a.banner || ""} placeholder="assets/… 或 https://…" onChange={e => set("banner", e.target.value)} />
        </div>
        <div className="col-span-12 sm:col-span-4 flex items-end pb-1">
          <label className="flex items-center gap-2 ntc text-[12px] cursor-pointer tap">
            <input type="checkbox" checked={!!a.bannerFade} onChange={e => set("bannerFade", e.target.checked)} />
            橫幅半透明淡出
          </label>
        </div>
        {a.banner && (
          <div className="col-span-12">
            <div className="relative overflow-hidden h-24 border a-line" style={{ borderRadius: "var(--a-rad)" }}>
              <img src={a.banner} alt="" className="w-full h-full object-cover" style={a.bannerFade ? { opacity: .45 } : {}}
                onError={e => { e.target.style.display = "none"; }} />
              <div className="absolute bottom-1 right-2 a-dim mono text-[9px]">banner 預覽</div>
            </div>
          </div>
        )}

        {/* 作品展示連動 */}
        <div className="col-span-12">
          <div className="border a-line p-4 space-y-3" style={{ borderRadius: "var(--a-rad)" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 ntc text-[12.5px] font-bold cursor-pointer tap">
                <input type="checkbox" checked={!!a.showcase} onChange={e => set("showcase", e.target.checked)} />
                顯示於「作品展示」
              </label>
              {a.showcase && (
                <select className="a-inp ntc" style={{ width: "auto" }} value={a.workCat || wCats[0] || ""}
                  onChange={e => set("workCat", e.target.value)}>
                  {wCats.map(c => <option key={c}>{c}</option>)}
                </select>
              )}
              <div className="a-dim mono text-[10px]">需為已發布才會出現在前台展示。</div>
            </div>
            {a.showcase && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="ntc text-[11px] font-bold">展示用封面圖（Gallery 左右呈現，最多 10 張，不顯示於內文）</div>
                  <div className="a-dim mono text-[10px]">{gallery.length} / 10</div>
                  <div className="flex-1"></div>
                  <button className="a-btn ntc text-[10.5px]" onClick={addGal} disabled={gallery.length >= 10}
                    style={gallery.length >= 10 ? { opacity: .4, cursor: "not-allowed" } : {}}>＋新增封面</button>
                </div>
                <div className="space-y-1.5">
                  {gallery.map((g, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="a-dim mono text-[10px] w-5 text-right">{i + 1}</span>
                      <div className="w-12 h-9 shrink-0 overflow-hidden border a-line relative" style={{ borderRadius: "var(--a-rad)" }}>
                        {g ? <img src={g} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                           : <div className="a-dim mono text-[8px] flex items-center justify-center h-full">無圖</div>}
                      </div>
                      <input className="a-inp mono text-[11.5px]" value={g} placeholder="assets/… 或 https://…" onChange={e => setGal(i, e.target.value)} />
                      <button className="a-dim mono text-[10px] cursor-pointer hover:opacity-70 px-1" onClick={() => moveGal(i, -1)}>▲</button>
                      <button className="a-dim mono text-[10px] cursor-pointer hover:opacity-70 px-1" onClick={() => moveGal(i, 1)}>▼</button>
                      <button className="a-btn ntc text-[10.5px]" onClick={() => delGal(i)}>刪除</button>
                    </div>
                  ))}
                  {gallery.length === 0 && <div className="a-dim mono text-[10.5px]">尚未設定封面 — 前台會顯示佔位圖。</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={full ? "fixed inset-0 z-50 p-4 sm:p-6 flex flex-col" : ""} style={full ? { background: "var(--a-bg)" } : {}}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="ntc text-[11px] font-bold">內文 · Markdown{full && <span className="a-dim mono text-[9.5px] ml-2">— {a.title}</span>}</div>
          {!full && <div className="a-dim mono text-[9.5px] hidden md:block">## 標題 · **粗體** · - 列表 · &gt; 引言 · ![圖說](網址)</div>}
          <div className="flex-1"></div>
          <button className="a-btn ntc text-[10.5px]" onClick={() => set("body", (a.body || "") + "\n\n![圖片說明](圖片網址)\n")}>＋插入圖片</button>
          <select className="a-inp mono text-[10.5px] cursor-pointer" title="編輯字級" style={{ width: "auto", padding: "4px 8px", minHeight: "0" }}
            value={edFs} onChange={e => setEdFsP(Number(e.target.value))}>
            <option value={12.5}>字級 · 小</option>
            <option value={14}>字級 · 中</option>
            <option value={16}>字級 · 大</option>
            <option value={18}>字級 · 特大</option>
          </select>
          <button className={"mono text-[10px] px-2 py-1 cursor-pointer tap " + (showPrev ? "a-acc-bg" : "a-dim border a-line")}
            style={{ borderRadius: "var(--a-rad)" }} onClick={() => setShowPrev(p => !p)}>預覽 {showPrev ? "ON" : "OFF"}</button>
          <button className={"mono text-[10px] px-2 py-1 cursor-pointer tap " + (full ? "a-acc-bg" : "a-dim border a-line")}
            style={{ borderRadius: "var(--a-rad)" }} onClick={() => setFull(f => !f)} title={full ? "離開全螢幕（Esc）" : "全螢幕編輯"}>
            {full ? "✕ 離開全螢幕" : "⛶ 全螢幕編輯"}
          </button>
        </div>
        <div className={"grid gap-4 " + (showPrev ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1") + (full ? " flex-1 min-h-0" : "")}
          style={full ? { gridTemplateRows: showPrev ? undefined : "minmax(0,1fr)", gridAutoRows: "minmax(0,1fr)" } : {}}>
          <textarea className={"a-inp mono leading-[1.8]" + (full ? " h-full min-h-0 resize-none" : "")} rows={full ? undefined : 18} value={a.body}
            style={{ fontSize: edFs + "px" }}
            onChange={e => set("body", e.target.value)} placeholder="開始寫作…"></textarea>
          {showPrev && (
            <div className="a-panel p-5 overflow-y-auto" style={full ? { height: "100%" } : { maxHeight: "480px" }}>
              <div className="a-dim mono text-[9.5px] uppercase tracking-[.2em] mb-3">— Preview —</div>
              <h1 className="ntc text-[22px] font-black tracking-tight mb-2">{a.title}</h1>
              <Markdown text={a.body || "*（空白內文）*"} size={edFs > 14 ? edFs : undefined} />
            </div>
          )}
        </div>
      </div>
      <div className="a-dim mono text-[10px] mt-3">✓ 即時儲存 — 前台立刻反映（原型使用瀏覽器儲存）。</div>
    </div>
  );
}

// ── works management — 與部落格連動：展示的是標記 showcase 的文章 ──
function AdminWorks({ openEditor }) {
  const { db, update } = useLake();
  const wCats = db.settings.catsWorks || [];
  const [kind, setKind] = React.useState("全部");
  const all = db.articles.filter(a => a.showcase);
  const list = kind === "全部" ? all : all.filter(a => a.workCat === kind);

  const unshow = id => update(d => {
    const a = d.articles.find(x => x.id === id);
    if (a) a.showcase = false;
    return d;
  });
  // 重新排序：直接在 articles 陣列中交換（部落格依日期排序，不受影響）
  const move = (id, dir) => update(d => {
    const idxOf = x => d.articles.findIndex(t => t.id === x);
    const shown = d.articles.filter(a => a.showcase && (kind === "全部" || a.workCat === kind));
    const i = shown.findIndex(a => a.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= shown.length) return d;
    const ai = idxOf(shown[i].id), aj = idxOf(shown[j].id);
    [d.articles[ai], d.articles[aj]] = [d.articles[aj], d.articles[ai]];
    return d;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="ntc font-black text-[16px] mr-2">作品管理</div>
        {["全部", ...wCats].map(k => (
          <button key={k} onClick={() => setKind(k)}
            className={"mono text-[11px] px-2.5 py-1 cursor-pointer tap " + (kind === k ? "a-acc-bg" : "a-dim border a-line")}
            style={{ borderRadius: "var(--a-rad)" }}>{k}</button>
        ))}
        <div className="flex-1"></div>
        <div className="a-dim mono text-[10px] hidden sm:block">展示中 {all.filter(a => a.status === "published").length} 篇</div>
      </div>
      <div className="a-panel p-3 mb-4 a-dim ntc text-[12px]">
        作品展示與部落格連動 — 這裡列出所有標記「顯示於作品展示」的文章；封面圖、分類與內文請由「編輯」進入文章編輯器設定。前台點開作品即閱讀全文。
      </div>
      <div className="a-panel overflow-hidden">
        {list.map((a, i) => (
          <div key={a.id} className={"flex items-center gap-3 px-4 py-3 " + (i > 0 ? "border-t a-line" : "") + (a.status === "published" ? "" : " opacity-50")}>
            <div className="flex flex-col gap-0.5">
              <button className="a-dim mono text-[10px] cursor-pointer hover:opacity-70 px-1" onClick={() => move(a.id, -1)}>▲</button>
              <button className="a-dim mono text-[10px] cursor-pointer hover:opacity-70 px-1" onClick={() => move(a.id, 1)}>▼</button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="ntc font-bold text-[13.5px]">{a.title}</span>
                <span className="mono text-[9.5px] a-acc">{a.workCat}</span>
                {a.status !== "published" && <span className="mono text-[9.5px] a-dim">（草稿 — 前台不顯示）</span>}
              </div>
              <div className="a-dim text-[11px] ntc truncate mt-0.5">{a.blurb}</div>
              <div className="a-dim mono text-[9.5px] mt-0.5">封面 {(a.gallery || []).length} / 10 · {a.views} views</div>
            </div>
            <button className="a-btn ntc text-[11px]" onClick={() => openEditor(a.id)}>編輯</button>
            <button className="a-btn ntc text-[11px]" onClick={() => unshow(a.id)}>移出展示</button>
          </div>
        ))}
        {list.length === 0 && <div className="a-dim mono text-[11px] p-6 text-center">此分類尚無展示作品 — 到文章編輯器勾選「顯示於作品展示」。</div>}
      </div>
      <div className="a-dim mono text-[10px] mt-3">▲▼ 調整前台展示排序 — MAG 網格與 TERM 清單皆依此順序。</div>
    </div>
  );
}

// ── comments management ──
function AdminComments() {
  const { db, update } = useLake();
  const [replying, setReplying] = React.useState(null);
  const [replyText, setReplyText] = React.useState("");
  const artName = id => {
    if (!id) return null;
    const a = db.articles.find(x => x.id === id);
    return a ? a.title : "(已刪文章)";
  };
  const setStatus = (id, st) => update(d => {
    const c = d.comments.find(x => x.id === id);
    if (c) c.status = st;
    return d;
  });
  const del = id => {
    if (!confirm("刪除這則留言？")) return;
    update(d => { d.comments = d.comments.filter(x => x.id !== id); return d; });
  };
  const saveReply = id => {
    update(d => { const c = d.comments.find(x => x.id === id); if (c) c.reply = replyText.trim(); return d; });
    setReplying(null); setReplyText("");
  };
  const groups = [
    ["pending", "待審核"],
    ["visible", "已顯示"],
    ["hidden", "已隱藏"],
  ];

  return (
    <div className="space-y-6">
      <div className="ntc font-black text-[16px]">留言管理</div>
      {groups.map(([st, label]) => {
        const list = db.comments.filter(c => c.status === st);
        if (list.length === 0) return null;
        return (
          <div key={st}>
            <div className="a-dim mono text-[10.5px] uppercase tracking-[.2em] mb-2">{label} · {list.length}</div>
            <div className="a-panel overflow-hidden">
              {list.map((c, i) => (
                <div key={c.id} className={"px-4 py-3 " + (i > 0 ? "border-t a-line" : "")}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="ntc font-bold text-[13px]">{c.name}</span>
                        <span className="a-dim mono text-[10px]">{c.date}</span>
                        <span className="mono text-[9px] px-1.5 py-0.5 border a-line a-dim" style={{ borderRadius: "var(--a-rad)" }}>
                          {artName(c.articleId) ? "文章：" + artName(c.articleId) : "留言板"}
                        </span>
                      </div>
                      <div className="ntc text-[12.5px] mt-0.5">{c.text}</div>
                      {c.reply && <div className="a-acc text-[11.5px] ntc mt-1">↳ {c.reply}</div>}
                    </div>
                    {st !== "visible" && <button className="a-btn a-btn-acc ntc text-[11px]" onClick={() => setStatus(c.id, "visible")}>通過</button>}
                    {st === "visible" && (
                      <button className="a-btn ntc text-[11px]" onClick={() => { setReplying(c.id); setReplyText(c.reply || ""); }}>回覆</button>
                    )}
                    {st !== "hidden" && <button className="a-btn ntc text-[11px]" onClick={() => setStatus(c.id, "hidden")}>隱藏</button>}
                    <button className="a-btn ntc text-[11px] a-dim" onClick={() => del(c.id)}>刪除</button>
                  </div>
                  {replying === c.id && (
                    <div className="mt-3 flex gap-2">
                      <input className="a-inp ntc" value={replyText} placeholder="屋主回覆…" autoFocus
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveReply(c.id)} />
                      <button className="a-btn a-btn-acc ntc text-[11px]" onClick={() => saveReply(c.id)}>送出</button>
                      <button className="a-btn ntc text-[11px]" onClick={() => setReplying(null)}>取消</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { AdminPosts, AdminEditor, AdminWorks, AdminComments, StatusPill });
