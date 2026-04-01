import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { addNotification } from "../Utils/NotificationHelper";

function Explore() {
  const navigate = useNavigate();

  const categories = ["Politics", "Tech", "Sports", "Education", "Jobs"];

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const fetchNews = async (query) => {
    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const response = await fetch(
        `http:/newslyai.onrender.com/news?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data = await response.json();

      const formattedNews = (Array.isArray(data) ? data : []).map(
        (article, index) => ({
          id: index + 1,
          category: article.source?.name || "News",
          title: article.title || "No title available",
          source: article.author || article.source?.name || "Unknown Source",
          time: article.publishedAt
            ? new Date(article.publishedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Recently",
          description:
            article.description || "No description available for this article.",
          image: article.urlToImage || "",
          url: article.url || "",
          content: article.content || "",
          type: "explore",
        })
      );

      setNews(formattedNews);
    } catch (err) {
      console.error("Explore search error:", err);
      setError("Unable to fetch live search results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchNews(selectedCategory);
    }
  }, [selectedCategory]);

  const handleSearch = () => {
    const value = search.trim();
    if (!value) return;
    setSelectedCategory("");
    fetchNews(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSave = (article) => {
    const existingSaved = JSON.parse(localStorage.getItem("savedNews")) || [];

    const alreadySaved = existingSaved.some(
      (item) => item.title === article.title
    );

    if (alreadySaved) {
      addNotification({
        type: "warning",
        title: "Already Saved",
        message: "This article is already in your saved list.",
      });
      alert("This news is already saved");
      return;
    }

    const updatedSaved = [...existingSaved, article];
    localStorage.setItem("savedNews", JSON.stringify(updatedSaved));

    addNotification({
      type: "saved",
      title: "Article Saved",
      message:
        article.title.length > 55
          ? `${article.title.slice(0, 55)}...`
          : article.title,
    });

    alert("News saved successfully");
  };

  const handleRead = (article) => {
    navigate("/news-details", { state: { article } });
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div className="mx-auto max-w-3xl px-3 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">🔎 Explore</h2>
          <p className="text-xs text-slate-400">
            Search and browse trending categories
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search news..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />

            <button
              onClick={handleSearch}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Search
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSearch(cat);
                  setSelectedCategory(cat);
                }}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {!searched && (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#0b1220] p-5">
            <p className="text-sm text-slate-300">Start exploring live news</p>
            <p className="mt-1 text-xs text-slate-400">
              Search anything or tap a category to load real-time articles.
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#0b1220] p-5 text-center">
            <p className="text-sm text-slate-300">Loading search results...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && searched && news.length === 0 && (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#0b1220] p-5 text-center">
            <p className="text-sm text-slate-300">No results found</p>
            <p className="mt-1 text-xs text-slate-400">
              Try another keyword or category
            </p>
          </div>
        )}

        {!loading && !error && news.length > 0 && (
          <div className="mt-6 space-y-3">
            {news.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-[#0b1220] p-4 shadow-sm"
              >
                {item.image && (
                  <div className="mb-3 overflow-hidden rounded-lg border border-white/10">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  </div>
                )}

                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-300">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>

                <h3 className="text-sm font-semibold leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  {item.description}
                </p>

                <p className="mt-2 text-[11px] text-slate-400">{item.source}</p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleRead(item)}
                    className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-blue-500"
                  >
                    Read
                  </button>

                  <button
                    onClick={() => handleSave(item)}
                    className="rounded-md border border-white/10 px-3 py-1 text-[11px] text-slate-300 transition hover:bg-white/5"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}

export default Explore;