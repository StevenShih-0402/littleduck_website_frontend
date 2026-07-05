// ── front: blog list / article page / works showcase ────────────
function BlogPage() {
  const { db, theme } = useLake();
  const [cat, setCat] = React.useState("全部");
  const pub = db.articles.filter(a => a.status === "published");
  const cats = ["全部", ...Array.from(new Set([...(db.settings.catsBlog || []), ...pub.map(a => a.cat)]))];
  const list = (cat === "全部" ? pub : pub.filter(a => a.cat === cat))
    .slice().sort((a, b) => b.date < a.date ? -1 : 1);

  return (
    <div>
      <SecHead num="03" zh="部落格" en="BLOG"
        sub={theme === "night" ? "$ ls blog/ --sort=date | grep " + (cat === "全部" ? "'*'" : "'" + cat + "'") : "小說、隨筆與技術筆記。"} />
      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>
      <div className="space-y-0">
        {list.map(a => (
          <button key={a.id} onClick={() => go("article/" + a.id)}
            className="w-full text-left py-4 border-b v-soft cursor-pointer group block">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="mono text-[10px] v-dim shrink-0 w-24">{a.date}</span>
              <span className="mono text-[9.5px] v-acc shrink-0 border v-line rad px-1.5 py-0.5">{a.cat}</span>
              <span className="ntc text-[16px] sm:text-[17px] font-black group-hover:underline">{a.title}</span>
            </div>
            <div className="ntc text-[12.5px] v-dim leading-relaxed sm:pl-[108px] max-w-2xl">{a.blurb}</div>
            {a.award && <div className="mono text-[10px] v-acc2 mt-1 sm:pl-[108px]">★ {a.award}</div>}
          </button>
        ))}
      </div>
      {list.length === 0 && <div className="mono text-[12px] v-dim py-10 text-center">此分類尚無文章。</div>}
    </div>
  );
}

function ArticlePage({ id }) {
  const { db, update, theme } = useLake();
  const a = db.articles.find(x => x.id === id);
  const night = theme === "night";
  const [fs, setFs] = React.useState(() => Number(localStorage.getItem("lake_read_fs")) || 14.5);
  const setFsP = v => { setFs(v); localStorage.setItem("lake_read_fs", v); };
  // count a view once per session
  React.useEffect(() => {
    if (!a) return;
    const k = "lake_viewed_" + a.id;
    if (!sessionStorage.getItem(k)) {
      sessionStorage.setItem(k, "1");
      update(d => {
        const t = d.articles.find(x => x.id === a.id);
        if (t) t.views += 1;
        return d;
      });
    }
  }, [id]);
  if (!a || a.status !== "published") {
    return (
      <div className="py-16 text-center">
        <div className="mono text-[13px] v-dim mb-4">404 — 找不到這篇文章（可能已下架）。</div>
        <button className="btn ntc" onClick={() => go("blog")}>← 回部落格</button>
      </div>
    );
  }
  return (
    <div className="max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => go("blog")} className="mono text-[11px] v-dim hover-rule cursor-pointer tap">
          {night ? "$ cd ../blog" : "← 回部落格目錄"}
        </button>
        <label className="flex items-center gap-1.5 mono text-[10px] v-dim">
          {night ? "--font-size" : "字級"}
          <select className="inp mono text-[11px] cursor-pointer" style={{ width: "auto", padding: "4px 8px" }}
            value={fs} onChange={e => setFsP(Number(e.target.value))}>
            <option value={13}>小</option>
            <option value={14.5}>標準</option>
            <option value={17}>大</option>
            <option value={20}>特大</option>
          </select>
        </label>
      </div>

      {/* Notion-like banner */}
      {a.banner && (
        <div className="relative overflow-hidden rad border v-line mb-6 h-44 sm:h-56">
          <img src={a.banner} alt="" className="w-full h-full object-cover"
            style={a.bannerFade ? { opacity: .45 } : {}} />
          {a.bannerFade && <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, var(--bg))" }}></div>}
        </div>
      )}

      {night ? (
        <div className="mono text-[10px] v-dim uppercase tracking-[.2em] mb-3 flex gap-3 flex-wrap">
          <span className="v-acc">$ cat blog/{a.id}.md</span><span>{a.date}</span><span>{a.views} views</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3">
          <span className="ntc text-[11px] font-black px-2.5 py-1" style={{ background: "var(--ink)", color: "var(--paper)" }}>{a.cat}</span>
          <span className="mono text-[10px] v-dim uppercase tracking-[.2em]">{a.date} · {a.views} VIEWS</span>
        </div>
      )}
      <h1 className="ntc text-[32px] sm:text-[42px] font-black tracking-tight leading-[1.1] mb-3">{a.title}</h1>
      {a.award && <div className="mono text-[11px] v-acc2 mb-4">★ {a.award}</div>}
      <div className="border-t rule-heavy my-6" style={{ borderTopWidth: "var(--heavy)" }}></div>
      <Markdown text={a.body} size={fs} />

      {/* end mark: MAG ■ / TERM EOF */}
      {night ? (
        <div className="mono text-[11px] v-dim mt-8">^D<br /><span className="v-acc">-- EOF --</span><span className="cursor"></span></div>
      ) : (
        <div className="mt-8 flex items-center gap-3">
          <span className="inline-block w-3.5 h-3.5" style={{ background: "var(--ink)" }}></span>
          <span className="mono text-[10px] v-dim uppercase tracking-[.25em]">Fin</span>
        </div>
      )}

      <ArticleComments article={a} />
    </div>
  );
}

// ── per-article comments（預設摺疊，保持閱讀版面乾淨）──
function ArticleComments({ article }) {
  const { db, update, theme } = useLake();
  const night = theme === "night";
  const list = db.comments.filter(c => c.articleId === article.id && c.status === "visible");
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const submit = () => {
    if (!text.trim()) return;
    update(d => {
      d.comments.unshift({
        id: Lake.uid(), name: name.trim() || "匿名訪客", date: Lake.today(),
        text: text.trim(), status: "pending", reply: "", articleId: article.id,
      });
      return d;
    });
    setName(""); setText(""); setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <div className="border-t rule-heavy mt-10 pt-5" style={{ borderTopWidth: "var(--heavy)" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between cursor-pointer tap mb-1 group">
        <span className="mono text-[10.5px] v-dim uppercase tracking-[.2em] group-hover:opacity-75">
          {night ? "$ cat comments/" + article.id + ".log · " + list.length : "讀者留言 · COMMENTS · " + list.length}
        </span>
        <span className="mono text-[11px] v-acc">{open ? (night ? "[-] 摺疊" : "− 摺疊") : (night ? "[+] 展開" : "＋ 展開留言")}</span>
      </button>
      {!open && (
        <div className="mono text-[10.5px] v-dim mb-3">
          {list.length > 0 ? "有 " + list.length + " 則回應。" : "目前還沒有留言，等你搶頭香。"}
        </div>
      )}
      {open && (
      <React.Fragment>
      <div className="space-y-3 mb-5 mt-3">
        {list.map(c => (
          <div key={c.id} className="v-card p-3.5 theme-fade">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="ntc text-[12.5px] font-black">{c.name}</span>
              <span className="mono text-[10px] v-dim">{c.date}</span>
            </div>
            <div className="ntc text-[13px] leading-relaxed">{c.text}</div>
            {c.reply && (
              <div className="mt-2 border-l-2 pl-3" style={{ borderColor: "var(--acc)" }}>
                <span className="mono text-[10px] v-acc mr-2">↳ 屋主</span>
                <span className="ntc text-[12.5px] v-dim">{c.reply}</span>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="mono text-[11px] v-dim">{night ? "(empty) — 頭香" : "頭香！"}</div>}
      </div>
      <div className="v-card p-4 theme-fade">
        <div className="grid sm:grid-cols-[180px_1fr] gap-2.5 mb-2.5">
          <input className="inp ntc" placeholder="暱稱（可留空）" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
        </div>
        <textarea className="inp ntc" rows={2} placeholder={night ? "> 留言內容…" : "留言內容…"} value={text} onChange={e => setText(e.target.value)} maxLength={300}></textarea>
        <div className="flex items-center justify-between mt-2.5">
          <div className="mono text-[10px] v-dim">{sent ? "✓ 已送出，待審核後顯示" : text.length + " / 300"}</div>
          <button className="btn btn-acc ntc" onClick={submit}>送出留言</button>
        </div>
      </div>
      </React.Fragment>
      )}
    </div>
  );
}

// ── works：與部落格連動 — 展示的是標記 showcase 的文章，點開直接閱讀全文 ──
function WorkGridCard({ a, idx }) {
  return (
    <div className="v-card overflow-hidden flex flex-col theme-fade cursor-pointer group" onClick={() => go("article/" + a.id)}>
      <Gallery images={a.gallery} label={"cover · " + a.title} className="h-40" />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="ntc font-black text-[15px] leading-snug group-hover:underline">{a.title}</div>
          <div className="mono text-[10px] v-dim shrink-0">{a.y || ""}</div>
        </div>
        {a.award && <div className="mono text-[9.5px] v-acc mb-2">{a.award}</div>}
        <div className="ntc text-[12px] v-dim leading-relaxed flex-1 line-clamp-3">{a.blurb}</div>
        <div className="mono text-[9.5px] v-dim mt-3 pt-2 border-t v-soft flex justify-between">
          <span>NO. {String(idx + 1).padStart(2, "0")}</span>
          <span className="v-acc">閱讀全文 →</span>
        </div>
      </div>
    </div>
  );
}
function WorkListRow({ a }) {
  return (
    <div className="v-card p-3 flex gap-3 items-stretch theme-fade cursor-pointer group" onClick={() => go("article/" + a.id)}>
      <Gallery images={a.gallery} label="cover" className="w-24 sm:w-32 shrink-0 self-stretch min-h-[72px]" />
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="mono text-[10px] v-dim">{a.y}</span>
          <span className="ntc font-bold text-[14px] group-hover:underline">{a.title}</span>
          <span className="mono text-[9.5px] v-acc">{a.award}</span>
        </div>
        <div className="ntc text-[12px] v-dim leading-relaxed mt-1 line-clamp-2">{a.blurb}</div>
        <div className="mono text-[9.5px] v-acc mt-1.5">閱讀全文 →</div>
      </div>
    </div>
  );
}

function WorksPage() {
  const { db, theme } = useLake();
  const wCats = db.settings.catsWorks || [];
  const [tab, setTab] = React.useState("全部");
  const all = db.articles.filter(a => a.showcase && a.status === "published");
  const grid = theme !== "night"; // MAG=grid, TERM=list
  const showCats = tab === "全部" ? wCats : [tab];

  return (
    <div>
      <SecHead num="02" zh="作品展示" en="WORKS"
        sub={grid ? "編輯台上的陳列架 — 點開任一作品即可閱讀全文。" : "$ ls works/ --link=blog — 點開作品即閱讀全文。"} />
      <div className="flex flex-wrap gap-2 mb-7">
        <Chip active={tab === "全部"} onClick={() => setTab("全部")}>全部</Chip>
        {wCats.map(c => <Chip key={c} active={tab === c} onClick={() => setTab(c)}>{c}</Chip>)}
      </div>

      {showCats.map(c => {
        const list = all.filter(a => a.workCat === c);
        if (list.length === 0) return null;
        return (
          <section key={c} className="mb-10">
            <div className="mono text-[10.5px] v-dim uppercase tracking-[.2em] mb-3 border-b v-soft pb-1.5">
              {grid ? "— " + c + " —" : "## " + c + "/"} <span className="v-acc">{list.length}</span>
            </div>
            {grid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((a, i) => <WorkGridCard key={a.id} a={a} idx={i} />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {list.map(a => <WorkListRow key={a.id} a={a} />)}
              </div>
            )}
          </section>
        );
      })}
      {all.length === 0 && <div className="mono text-[12px] v-dim py-10 text-center">尚無展示中的作品 — 到後台將文章加入作品展示。</div>}
    </div>
  );
}

Object.assign(window, { BlogPage, ArticlePage, ArticleComments, WorksPage });
