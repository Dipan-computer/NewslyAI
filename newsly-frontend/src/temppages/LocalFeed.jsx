import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  score += (profile.modes?.[modeKey] || 0) * 5;
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

function LocalFeed() {
  const navigate = useNavigate();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Agartala, Tripura");

  const getSavedLocation = () => {
    const savedLocation = JSON.parse(localStorage.getItem("newslyLocation"));

    if (!savedLocation) {
      return {
        city: "Agartala",
        region: "Tripura",
        country: "India",
      };
    }

    return {
      city: savedLocation.city || "",
      region: savedLocation.region || "",
      country: savedLocation.country || "India",
      lat: savedLocation.lat || null,
      lon: savedLocation.lon || null,
    };
  };

  const getReadableLocationLabel = (location) => {
    const city = (location.city || "").trim();
    const region = (location.region || "").trim();
    const country = (location.country || "India").trim();

    const badCityValues = ["Your Area", "Live Location", "Unknown", ""];
    const badRegionValues = ["Live Location", "Unknown", ""];

    const safeCity = badCityValues.includes(city) ? "" : city;
    const safeRegion = badRegionValues.includes(region) ? "" : region;

    if (safeCity && safeRegion) {
      return `${safeCity}, ${safeRegion}`;
    }

    if (safeCity && !safeRegion) {
      return `${safeCity}, ${country}`;
    }

    if (!safeCity && safeRegion) {
      return `${safeRegion}, ${country}`;
    }

    return "Agartala, Tripura";
  };

  const formatArticles = (data) =>
    sortPersonalized(
      (Array.isArray(data) ? data : []).map((article, index) => ({
        id: article.url || `${index + 1}`,
        category: article.source?.name || "Local News",
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
        type: "local",
        description:
          article.description || "No description available for this article.",
        image: article.urlToImage || "",
        url: article.url || "",
        content: article.content || "",
      }))
    );

  const fetchLocalNews = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const savedLocation = getSavedLocation();
      setLocationLabel(getReadableLocationLabel(savedLocation));

      const params = new URLSearchParams({
        type: "local",
        city: savedLocation.city || "",
        region: savedLocation.region || "",
        country: savedLocation.country || "India",
      });

      const response = await fetch(`${API_BASE_URL}/news?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch local news");
      }

      const data = await response.json();
      const formattedNews = formatArticles(data);

      if (!formattedNews.length) {
        throw new Error("No local articles available yet");
      }

      setNews(formattedNews);
      setRetryCount(0);
    } catch (err) {
      console.error("Local feed error:", err);

      if (!news.length && retryCount < 2) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 1800);
      } else if (!news.length) {
        setError("We’re preparing your local feed. Please refresh in a moment.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocalNews();
  }, []);

  useEffect(() => {
    if (retryCount > 0) {
      fetchLocalNews();
    }
  }, [retryCount]);

  const recommendedArticle = useMemo(() => {
    if (!news.length) return null;
    const profile = getProfile();
    const top = news[0];
    return getArticleScore(top, profile) > 0 ? top : null;
  }, [news]);

  const remainingNews = useMemo(() => {
    if (!recommendedArticle) return news;
    return news.filter((item) => item.title !== recommendedArticle.title);
  }, [news, recommendedArticle]);

  const dailyBriefArticles = useMemo(() => {
    const base = recommendedArticle ? [recommendedArticle, ...remainingNews] : news;
    return base.slice(0, 5);
  }, [news, recommendedArticle, remainingNews]);

  const handleRead = (article) => {
    navigate("/news-details", { state: { article } });
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
        message: "This local article is already in your saved list.",
      });

      alert("This news is already saved");
      return;
    }

    const updatedSaved = [...existingSaved, article];
    localStorage.setItem("savedNews", JSON.stringify(updatedSaved));

    addNotification({
      type: "saved",
      title: "Local Article Saved",
      message:
        article.title.length > 55
          ? `${article.title.slice(0, 55)}...`
          : article.title,
    });

    alert("News saved successfully");
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div className="mx-auto max-w-3xl px-3 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">📍 Local Feed</h2>
          <p className="text-xs text-slate-400">
            Personalized local updates near you
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-4">
          <p className="text-[10px] uppercase tracking-wide text-green-300">
            Personalized Local Mode
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{locationLabel}</h2>
              <p className="mt-1 text-xs text-slate-300">
                Local updates based on your selected or detected area
              </p>
            </div>

            <button
              onClick={() => fetchLocalNews({ silent: true })}
              className="rounded-md bg-green-600 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-green-500"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading && !news.length && (
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1220] p-5">
            <p className="text-sm text-slate-200">Loading local updates...</p>
            <p className="mt-1 text-xs text-slate-400">
              Please wait while Newsly prepares your local feed.
            </p>
          </div>
        )}

        {!loading && !error && dailyBriefArticles.length > 0 && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-emerald-300">
                  Local Brief
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">
                  Nearby highlights
                </h3>
              </div>

              {recommendedArticle && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] text-emerald-200">
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

        {!!error && !news.length && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-100">{error}</p>
          </div>
        )}

        {!loading && !error && !news.length && (
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1220] p-5">
            <p className="text-sm text-slate-300">No local articles available yet</p>
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
                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-[11px] text-green-300">
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
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
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

export default LocalFeed;