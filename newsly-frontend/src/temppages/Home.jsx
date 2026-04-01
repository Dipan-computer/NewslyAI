import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { API_BASE_URL } from "../config";

export default function Home() {
  const navigate = useNavigate();

  const [generalNews, setGeneralNews] = useState([]);
  const [studentNews, setStudentNews] = useState([]);
  const [localNews, setLocalNews] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const user = JSON.parse(localStorage.getItem("newslyUser"));

  const getSavedLocation = () => {
    try {
      const savedLocation = JSON.parse(localStorage.getItem("newslyLocation"));

      if (!savedLocation) {
        return {
          city: "Agartala",
          region: "Tripura",
          country: "India",
        };
      }

      return {
        city: savedLocation.city || "Agartala",
        region: savedLocation.region || "Tripura",
        country: savedLocation.country || "India",
      };
    } catch {
      return {
        city: "Agartala",
        region: "Tripura",
        country: "India",
      };
    }
  };

  const formatArticle = (article, fallbackType) => ({
    title: article?.title || "No title available",
    description:
      article?.description || "No description available for this article.",
    image: article?.urlToImage || "",
    source: article?.author || article?.source?.name || "Unknown Source",
    url: article?.url || "",
    publishedAt: article?.publishedAt || "",
    type: fallbackType,
  });

  const trimText = (text = "", max = 140) => {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!clean) return "";
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max).trim()}...`;
  };

  const fetchHomeHighlights = async () => {
    try {
      setLoadingHighlights(true);

      const location = getSavedLocation();
      const localParams = new URLSearchParams({
        type: "local",
        city: location.city,
        region: location.region,
        country: location.country,
      });

      const [generalRes, studentRes, localRes] = await Promise.all([
        fetch(`${API_BASE_URL}/news?type=general`),
        fetch(`${API_BASE_URL}/news?type=student`),
        fetch(`${API_BASE_URL}/news?${localParams.toString()}`),
      ]);

      const [generalData, studentData, localData] = await Promise.all([
        generalRes.ok ? generalRes.json() : [],
        studentRes.ok ? studentRes.json() : [],
        localRes.ok ? localRes.json() : [],
      ]);

      setGeneralNews(Array.isArray(generalData) ? generalData : []);
      setStudentNews(Array.isArray(studentData) ? studentData : []);
      setLocalNews(Array.isArray(localData) ? localData : []);
    } catch (error) {
      console.error("Home highlights fetch error:", error);
      setGeneralNews([]);
      setStudentNews([]);
      setLocalNews([]);
    } finally {
      setLoadingHighlights(false);
    }
  };

  useEffect(() => {
    fetchHomeHighlights();
  }, []);

  const topHighlights = useMemo(() => {
    const general = generalNews[0]
      ? {
          ...formatArticle(generalNews[0], "general"),
          label: "🌍 General Top Story",
          accent: "from-blue-500 to-cyan-500",
        }
      : null;

    const student = studentNews[0]
      ? {
          ...formatArticle(studentNews[0], "student"),
          label: "🎓 Student Top Story",
          accent: "from-purple-500 to-fuchsia-500",
        }
      : null;

    const local = localNews[0]
      ? {
          ...formatArticle(localNews[0], "local"),
          label: "📍 Local Top Story",
          accent: "from-emerald-500 to-green-500",
        }
      : null;

    return [general, student, local].filter(Boolean);
  }, [generalNews, studentNews, localNews]);

  useEffect(() => {
    if (topHighlights.length <= 1) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % topHighlights.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [topHighlights.length]);

  useEffect(() => {
    if (activeSlide >= topHighlights.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, topHighlights.length]);

  const openHighlight = () => {
    const article = topHighlights[activeSlide];
    if (!article) return;

    navigate("/news-details", {
      state: {
        article: {
          title: article.title,
          description: article.description,
          image: article.image,
          source: article.source,
          url: article.url,
          publishedAt: article.publishedAt,
          category:
            article.type === "general"
              ? "General"
              : article.type === "student"
              ? "Student"
              : "Local",
          type: article.type,
          content: article.description,
          time: article.publishedAt
            ? new Date(article.publishedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Recently",
        },
      },
    });
  };

  const handleProtectedNavigation = (path) => {
    if (user) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  const currentHighlight = topHighlights[activeSlide];

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-xl font-bold text-transparent sm:text-2xl"
          >
            NewslyAI
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full border border-blue-400/20 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-blue-400 sm:px-5"
                >
                  Login
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-5"
                >
                  Signup
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <section className="rounded-[24px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-5 shadow-2xl shadow-purple-900/20 sm:px-7 sm:py-7 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              📰 Smart News Platform
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/85 backdrop-blur-sm">
              Local • Global • Student
            </span>
          </div>

          <p className="mb-2 text-sm text-white/90">📰 Welcome to NewslyAI</p>

          <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-[4rem] lg:leading-[1.05]">
            Personalized News for General Users & Students
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
            Stay updated with local, national, international, and current
            affairs news in one smart platform designed for everyday readers
            and students.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/85">
              ⚡ Fast browsing
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/85">
              🔖 Save articles
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/85">
              🎓 Student updates
            </span>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={() => handleProtectedNavigation("/mode")}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:scale-[1.03] hover:shadow-xl"
            >
              Get Started
            </button>

            <p className="text-sm text-white/80 sm:text-base">
              Explore personalized feeds, bookmarks, and smart reading.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-3xl font-bold text-white">3</p>
              <p className="mt-1 text-xs text-white/75">Core Experiences</p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="mt-1 text-xs text-white/75">News Access</p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-3xl font-bold text-white">1 App</p>
              <p className="mt-1 text-xs text-white/75">Unified Feed</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-[#07132d] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Daily Top Highlights
              </p>
              <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                Smart spotlight
              </h2>
            </div>

            <button
              onClick={fetchHomeHighlights}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 sm:text-sm"
            >
              Refresh
            </button>
          </div>

          {loadingHighlights ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-300">Loading top highlights...</p>
              <p className="mt-2 text-xs text-slate-500">
                Preparing General, Student, and Local spotlight stories.
              </p>
            </div>
          ) : currentHighlight ? (
            <div>
              <div
                onClick={openHighlight}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] transition hover:border-white/20"
              >
                <div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="order-2 flex flex-col justify-center p-4 sm:p-5 lg:order-1 lg:p-6">
                    <span
                      className={`inline-flex w-fit rounded-full bg-gradient-to-r ${currentHighlight.accent} px-3 py-1.5 text-xs font-semibold text-white`}
                    >
                      {currentHighlight.label}
                    </span>

                    <h3 className="mt-4 line-clamp-3 max-w-3xl text-xl font-semibold leading-tight text-white sm:text-2xl lg:text-[2.15rem]">
                      {trimText(currentHighlight.title, 95)}
                    </h3>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                      {trimText(
                        currentHighlight.description ||
                          "Open this spotlight story for a quick read and clean summary.",
                        145
                      )}
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 sm:text-sm">
                      <span className="truncate">{currentHighlight.source}</span>
                    </div>

                    <p className="mt-5 text-sm font-medium text-blue-300">
                      Read this story →
                    </p>
                  </div>

                  <div className="order-1 p-3 lg:order-2 lg:p-4">
                    {currentHighlight.image ? (
                      <img
                        src={currentHighlight.image}
                        alt={currentHighlight.title}
                        className="h-48 w-full rounded-2xl object-cover sm:h-56 lg:h-full lg:min-h-[230px] xl:min-h-[250px]"
                      />
                    ) : (
                      <div
                        className={`flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-r ${currentHighlight.accent} text-2xl font-bold text-white/90 sm:h-56 lg:h-full lg:min-h-[230px] xl:min-h-[250px]`}
                      >
                        NewslyAI
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                {topHighlights.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      activeSlide === index
                        ? "w-8 bg-white"
                        : "w-5 bg-white/25 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-300">
                Top highlights are being prepared.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Refresh once feeds are loaded to show smart spotlight stories.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => handleProtectedNavigation("/general-feed")}
            className="rounded-2xl border border-white/10 bg-[#07132d] p-5 text-left transition duration-300 hover:scale-[1.015] hover:border-blue-500/30 hover:bg-white/[0.02]"
          >
            <p className="mb-2 text-sm font-medium text-blue-400">
              🌍 General Mode
            </p>
            <h3 className="text-xl font-semibold sm:text-2xl">
              Local to Global News
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Read local, national, and international headlines based on your
              interests and preferred reading style.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Local News
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Politics
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                World
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-blue-300">
              Click to open →
            </p>
          </button>

          <button
            onClick={() => handleProtectedNavigation("/student-feed")}
            className="rounded-2xl border border-white/10 bg-[#07132d] p-5 text-left transition duration-300 hover:scale-[1.015] hover:border-purple-500/30 hover:bg-white/[0.02]"
          >
            <p className="mb-2 text-sm font-medium text-purple-400">
              🎓 Student Mode
            </p>
            <h3 className="text-xl font-semibold sm:text-2xl">
              Current Affairs & Jobs
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Get current affairs, exam updates, education news, internships,
              and job alerts in one focused experience.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Exams
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Jobs
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Education
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-purple-300">
              Click to open →
            </p>
          </button>

          <button
            onClick={() => handleProtectedNavigation("/local-feed")}
            className="rounded-2xl border border-white/10 bg-[#07132d] p-5 text-left transition duration-300 hover:scale-[1.015] hover:border-green-500/30 hover:bg-white/[0.02]"
          >
            <p className="mb-2 text-sm font-medium text-green-400">
              📍 Local Feed
            </p>
            <h3 className="text-xl font-semibold sm:text-2xl">
              Agartala & Tripura
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Follow local updates from Agartala, Tripura, and North East India
              in one dedicated experience.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Agartala
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Tripura
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Northeast
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-green-300">
              Click to open →
            </p>
          </button>

          <button
            onClick={() => handleProtectedNavigation("/saved")}
            className="rounded-2xl border border-white/10 bg-[#07132d] p-5 text-left transition duration-300 hover:scale-[1.015] hover:border-emerald-500/30 hover:bg-white/[0.02]"
          >
            <p className="mb-2 text-sm font-medium text-emerald-400">
              ✨ Smart Experience
            </p>
            <h3 className="text-xl font-semibold sm:text-2xl">
              Bookmarks & Personal Feed
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Save articles, revisit them later, and enjoy a simple, modern,
              distraction-free reading experience.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Save
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Read
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                Explore
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-emerald-300">
              Click to open →
            </p>
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#07132d] px-5 py-4">
          <div className="flex flex-col gap-2 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
            <p>
              Built for a cleaner way to consume news across general, student,
              and local use cases.
            </p>
            <p className="text-xs text-slate-400">
              Personalized • Modern • Responsive
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}