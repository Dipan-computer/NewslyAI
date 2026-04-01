import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { addNotification } from "../Utils/NotificationHelper";
import { API_BASE_URL } from "../config";

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
  "today",
]);

function NewsDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentArticle, setCurrentArticle] = useState(
    location.state?.article || null
  );
  const [relatedNews, setRelatedNews] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [relatedError, setRelatedError] = useState("");
  const [visible, setVisible] = useState(false);

  const [summary, setSummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (location.state?.article) {
      setCurrentArticle(location.state.article);
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setVisible(false);
    setSummary([]);
    setSummaryError("");
    setSummaryOpen(false);

    const timer = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(timer);
  }, [currentArticle?.title]);

  const getRelatedQuery = (title = "") => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
      .slice(0, 6)
      .join(" ");
  };

  useEffect(() => {
    if (currentArticle?.title) {
      fetchRelatedNews(currentArticle.title);
    }
  }, [currentArticle?.title]);

  const fetchRelatedNews = async (title) => {
    try {
      setLoadingRelated(true);
      setRelatedError("");

      const keywordQuery = getRelatedQuery(title) || title;

      const response = await fetch(
        `${API_BASE_URL}/related-news?title=${encodeURIComponent(keywordQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch related news");
      }

      const data = await response.json();

      const formatted = (Array.isArray(data) ? data : []).map(
        (article, index) => ({
          id: article.url || `${index + 1}`,
          title: article.title || "No title available",
          description:
            article.description || "No description available for this article.",
          content:
            article.content ||
            article.description ||
            "Full content is not available for this article.",
          source: article.source?.name || article.author || "Unknown Source",
          image: article.urlToImage || "",
          url: article.url || "",
          time: article.publishedAt
            ? new Date(article.publishedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Recently",
          category: article.source?.name || "Related News",
          type: "related",
        })
      );

      const filtered = formatted.filter(
        (item) =>
          item.title &&
          item.url &&
          item.title !== currentArticle?.title &&
          item.url !== currentArticle?.url
      );

      setRelatedNews(filtered.slice(0, 6));

      if (!filtered.length) {
        setRelatedError("Related stories are still being prepared.");
      }
    } catch (error) {
      console.log("Related news fetch failed:", error);
      setRelatedNews([]);
      setRelatedError("Related stories are warming up. Please check again shortly.");
    } finally {
      setLoadingRelated(false);
    }
  };

  const generateSummary = async () => {
    try {
      setLoadingSummary(true);
      setSummaryError("");
      setSummaryOpen(true);

      const response = await fetch(`${API_BASE_URL}/ai-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: currentArticle?.title || "",
          description: currentArticle?.description || "",
          content: currentArticle?.content || "",
          source:
            typeof currentArticle?.source === "string"
              ? currentArticle?.source
              : currentArticle?.source?.name || currentArticle?.author || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate summary");
      }

      setSummary(Array.isArray(data.summary) ? data.summary : []);
    } catch (error) {
      console.log("AI summary error:", error);
      setSummary([]);
      setSummaryError("Unable to generate AI summary right now.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const cleanedContent = useMemo(() => {
    if (!currentArticle) return [];

    const description =
      currentArticle.description || "No description available for this article.";

    let rawContent =
      currentArticle.content ||
      currentArticle.description ||
      "Full content is not available in the current feed.";

    rawContent = rawContent
      .replace(/\[\+\d+\s*chars?\]/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const blockedPhrases = [
      "ONLY AVAILABLE IN PAID PLANS",
      "available in paid plans",
      "read more",
      "subscribe to continue",
    ];

    const looksBlocked = blockedPhrases.some((phrase) =>
      rawContent.toLowerCase().includes(phrase.toLowerCase())
    );

    const finalContent = looksBlocked || rawContent.length < 80 ? description : rawContent;

    const paragraphs = finalContent
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!paragraphs.length) {
      return [description];
    }

    return paragraphs;
  }, [currentArticle]);

  if (!currentArticle) {
    return (
      <div className="min-h-screen bg-[#020817] text-white">
        <Header />

        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-center">
            <p className="text-xl font-semibold">No article found</p>
            <p className="mt-2 text-sm text-slate-400">
              Open an article from any feed using the Read button.
            </p>

            <button
              onClick={() => navigate(-1)}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  const title = currentArticle.title || "No title available";
  const description =
    currentArticle.description || "No description available for this article.";
  const source =
    typeof currentArticle.source === "string"
      ? currentArticle.source
      : currentArticle.source?.name ||
        currentArticle.author ||
        "Unknown Source";
  const image = currentArticle.image || currentArticle.urlToImage || "";
  const articleUrl = currentArticle.url || "";
  const publishedTime = currentArticle.time || "Recently";
  const category = currentArticle.category || currentArticle.type || "News";

  const handleSave = () => {
    const existingSaved = JSON.parse(localStorage.getItem("savedNews")) || [];

    const alreadySaved = existingSaved.some((item) => item.title === title);

    if (alreadySaved) {
      addNotification({
        type: "warning",
        title: "Already Saved",
        message: "This article is already in your saved list.",
      });
      alert("This news is already saved");
      return;
    }

    const updatedSaved = [...existingSaved, currentArticle];
    localStorage.setItem("savedNews", JSON.stringify(updatedSaved));

    addNotification({
      type: "saved",
      title: "Article Saved",
      message: title.length > 55 ? `${title.slice(0, 55)}...` : title,
    });

    alert("News saved successfully");
  };

  const handleOpenOriginal = () => {
    if (!articleUrl) {
      alert("Original article link is not available.");
      return;
    }

    window.open(articleUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title,
        text: description,
        url: articleUrl || window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(articleUrl || title);
        alert("Article link copied to clipboard");
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  };

  const openRelatedArticle = (article) => {
    setCurrentArticle(article);
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div
        className={`mx-auto max-w-4xl px-4 py-4 transition-all duration-500 sm:py-6 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
        >
          ← Back
        </button>

        <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220] shadow-xl shadow-black/20">
          {image && (
            <div className="relative">
              <img
                src={image}
                alt={title}
                className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-medium text-blue-200 backdrop-blur">
                  {category}
                </span>

                <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] text-slate-200 backdrop-blur">
                  {publishedTime}
                </span>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-7">
            {!image && (
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-medium text-blue-300">
                  {category}
                </span>

                <span className="text-[11px] text-slate-400">
                  {publishedTime}
                </span>
              </div>
            )}

            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Source: {source}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Mode: {category}
              </span>
            </div>

            <p className="mt-6 text-base leading-8 text-slate-300">
              {description}
            </p>

            {/* AI Summary */}
            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                    NewslyAI Summary
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Get a quick smart summary of this article
                  </p>
                </div>

                <button
                  onClick={generateSummary}
                  disabled={loadingSummary}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70"
                >
                  {loadingSummary ? "Generating..." : "Generate AI Summary"}
                </button>
              </div>

              {summaryOpen && (
                <div className="mt-4 rounded-xl border border-white/10 bg-[#0b1220]/60 p-4">
                  {loadingSummary && (
                    <p className="text-sm text-slate-300">
                      Creating a smart summary for this article...
                    </p>
                  )}

                  {!loadingSummary && summaryError && (
                    <p className="text-sm text-rose-200">{summaryError}</p>
                  )}

                  {!loadingSummary && !summaryError && summary.length > 0 && (
                    <div className="space-y-3">
                      {summary.map((point, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="mt-1 text-blue-300">•</span>
                          <p className="text-sm leading-7 text-slate-300">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Full Story
              </p>

              <div className="space-y-4 text-[15px] leading-8 text-slate-300">
                {cleanedContent.map((para, index) => (
                  <p key={index}>{para}</p>
                ))}

                {!articleUrl && (
                  <p className="text-sm text-slate-400">
                    Original source link is not available for this article.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Save Article
              </button>

              <button
                onClick={handleOpenOriginal}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Open Original
              </button>

              <button
                onClick={handleShare}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Share
              </button>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">🔗 Related Articles</h3>
            {loadingRelated && (
              <p className="text-xs text-slate-400">Loading...</p>
            )}
          </div>

          {!loadingRelated && relatedNews.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">
                {relatedError || "No related articles found right now."}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {relatedNews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openRelatedArticle(item)}
                  className="min-w-[260px] cursor-pointer rounded-2xl border border-white/10 bg-[#0b1220] p-3 transition hover:bg-white/[0.03]"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center rounded-xl bg-white/5 text-xs text-slate-500">
                      No Image
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                      {item.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{item.source}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

export default NewsDetails;