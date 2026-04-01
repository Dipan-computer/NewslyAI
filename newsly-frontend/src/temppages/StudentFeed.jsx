import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { addNotification } from "../Utils/NotificationHelper";
import { API_BASE_URL } from "../config";

const PERSONALIZATION_KEY = "newslyPersonalization";

const STOP_WORDS = new Set([
  "the",
  "is",
  "at",
  "which",
  "on",
  "a",
  "an",
  "and",
  "or",
  "of",
  "for",
  "to",
  "in",
  "with",
  "by",
  "from",
  "after",
  "before",
  "into",
  "over",
  "under",
  "about",
  "this",
  "that",
  "these",
  "those",
  "new",
  "latest",
  "breaking",
  "live",
  "update",
  "updates",
  "news",
  "says",
  "said",
  "today",
]);

const getProfile = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(PERSONALIZATION_KEY)) || {
        modes: {},
        categories: {},
        sources: {},
        keywords: {},
      }
    );
  } catch {
    return {
      modes: {},
      categories: {},
      sources: {},
      keywords: {},
    };
  }
};

const normalize = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const extractKeywords = (article) => {
  const text = normalize(
    `${article?.title || ""} ${article?.description || ""} ${article?.source || ""}`
  );

  return [
    ...new Set(
      text
        .split(" ")
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    ),
  ].slice(0, 12);
};

const getArticleScore = (article, profile) => {
  let score = 0;

  const modeKey = (article.type || "").toLowerCase();
  const categoryKey = article.category || "";
  const sourceKey = article.source || "";

  score += (profile.modes?.[modeKey] || 0) * 4;
  score += (profile.categories?.[categoryKey] || 0) * 2;
  score += (profile.sources?.[sourceKey] || 0) * 3;

  extractKeywords(article).forEach((keyword) => {
    score += profile.keywords?.[keyword] || 0;
  });

  return score;
};

const sortPersonalized = (articles = []) => {
  const profile = getProfile();

  return [...articles].sort((a, b) => {
    const scoreA = getArticleScore(a, profile);
    const scoreB = getArticleScore(b, profile);

    if (scoreA !== scoreB) return scoreB - scoreA;
    return 0;
  });
};

function GeneralFeed() {
  const navigate = useNavigate();
  const [generalNews, setGeneralNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const formatArticles = (data) =>
    sortPersonalized(
      (Array.isArray(data) ? data : []).map((article, index) => ({
        id: article.url || `${index + 1}`,
        category: article.source?.name || "General",
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
        type: "general",
        description:
          article.description || "No description available for this article.",
        image: article.urlToImage || "",
        url: article.url || "",
        content: article.content || "",
      }))
    );

  const fetchGeneralNews = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_BASE_URL}/news?type=general`);

      if (!response.ok) {
        throw new Error("Failed to fetch general news");
      }

      const data = await response.json();
      const formattedNews = formatArticles(data);

      if (!formattedNews.length) {
        throw new Error("No general articles available yet");
      }

      setGeneralNews(formattedNews);
      setRetryCount(0);
    } catch (err) {
      console.error("General feed error:", err);

      if (!generalNews.length && retryCount < 2) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 1800);
      } else if (!generalNews.length) {
        setError("We’re warming up the live feed. Please refresh in a moment.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGeneralNews();
  }, []);

  useEffect(() => {
    if (retryCount > 0) {
      fetchGeneralNews();
    }
  }, [retryCount]);

  const recommendedArticle = useMemo(() => {
    if (!generalNews.length) return null;
    const profile = getProfile();
    const top = generalNews[0];
    return getArticleScore(top, profile) > 0 ? top : null;
  }, [generalNews]);

  const remainingNews = useMemo(() => {
    if (!recommendedArticle) return generalNews;
    return generalNews.filter((item) => item.title !== recommendedArticle.title);
  }, [generalNews, recommendedArticle]);

  const dailyBriefArticles = useMemo(() => {
    const base = recommendedArticle
      ? [recommendedArticle, ...remainingNews]
      : generalNews;

    return base.slice(0, 5);
  }, [generalNews, recommendedArticle, remainingNews]);

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
          <h2 className="text-lg font-semibold">🌍 General Feed</h2>
          <p className="text-xs text-slate-400">
            Local, national and global updates
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4">
          <p className="text-[10px] uppercase tracking-wide text-blue-300">
            General Mode
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Your personalized news</h2>

            <button
              onClick={() => fetchGeneralNews({ silent: true })}
              className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-blue-500"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-300">
            Follow local, national, international and political updates in one
            clean feed.
          </p>
        </div>

        {loading && !generalNews.length && (
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1220] p-5">
            <p className="text-sm text-slate-200">Loading your feed...</p>
            <p className="mt-1 text-xs text-slate-400">
              Please wait while Newsly prepares the latest articles.
            </p>
          </div>
        )}

        {!loading && !error && dailyBriefArticles.length > 0 && (
          <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-cyan-300">
                  Daily Brief
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">
                  Top highlights for you
                </h3>
              </div>

              {recommendedArticle && (
                <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] text-cyan-200">
                  Personalized
                </span>
              )}
            </div>

            <div className="space-y-2">
              {dailyBriefArticles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRead(item)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                >
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.source} • {item.time}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {!!error && !generalNews.length && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-100">{error}</p>
          </div>
        )}

        {!loading && !error && !generalNews.length && (
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1220] p-5">
            <p className="text-sm text-slate-300">No general news available yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Please try refreshing in a few moments.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {remainingNews.map((article) => (
            <div
              key={article.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]"
            >
              {article.image ? (
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-white/5 text-sm text-slate-500">
                  No Image Available
                </div>
              )}

              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[11px] text-blue-300">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {article.time}
                  </span>
                </div>

                <h3 className="text-lg font-semibold leading-snug text-white">
                  {article.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {article.description}
                </p>

                <p className="mt-3 text-xs text-slate-500">{article.source}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRead(article)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                  >
                    Read
                  </button>

                  <button
                    onClick={() => handleSave(article)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

export default GeneralFeed;