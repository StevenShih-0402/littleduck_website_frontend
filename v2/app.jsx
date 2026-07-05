// ── app: router + theme + store provider ────────────────────────
function App() {
  const [db, setDb] = React.useState(() => Lake.load());
  const [route, setRoute] = React.useState(parseHash());
  const [theme, setThemeState] = React.useState(() => localStorage.getItem("lake_theme_v2") || "day");

  const update = fn => setDb(prev => {
    const next = fn(JSON.parse(JSON.stringify(prev)));
    Lake.save(next);
    return next;
  });
  const setTheme = t => { setThemeState(t); localStorage.setItem("lake_theme_v2", t); };

  React.useEffect(() => {
    document.documentElement.classList.toggle("night", theme === "night");
  }, [theme]);

  React.useEffect(() => {
    const onHash = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHash);
    if (!location.hash) location.hash = "#/home";
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const ctx = { db, update, theme, setTheme, route };

  let page;
  if (route.page === "admin") {
    page = <AdminShell />;
  } else {
    let inner;
    if (route.page === "blog") inner = <BlogPage />;
    else if (route.page === "article") inner = <ArticlePage id={route.param} />;
    else if (route.page === "works") inner = <WorksPage />;
    else if (route.page === "guest") inner = <GuestPage />;
    else inner = <HomePage />;
    page = <FrontShell>{inner}</FrontShell>;
  }

  return <LakeCtx.Provider value={ctx}>{page}</LakeCtx.Provider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
