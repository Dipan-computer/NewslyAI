require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios");

const authRoutes = require("./routes/authRoutes");
const Article = require("./models/Article");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.set("io", io);
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Newsly backend is running",
  });
});

const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/news";

const GENERAL_CACHE_MINUTES = 30;
const STUDENT_CACHE_MINUTES = 30;
const LOCAL_CACHE_MINUTES = 45;
const SEARCH_CACHE_MINUTES = 20;

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
  "said",
  "says",
  "will",
  "has",
  "have",
  "had",
  "was",
  "were",
  "been",
  "being",
]);

const extractKeywords = (text = "") =>
  normalizeText(text)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 8);

const normalizeNewsDataArticle = (item, feedType, queryKey = "", locationKey = "") => ({
  title: item?.title || "No title available",
  description: item?.description || "No description available for this article.",
  content:
    item?.content ||
    item?.description ||
    "Full content is not available for this article.",
  url: item?.link || "",
  urlToImage: item?.image_url || "",
  publishedAt: item?.pubDate ? new Date(item.pubDate) : new Date(),
  sourceName: item?.source_name || "NewsData",
  author: item?.source_name || "Unknown Source",
  feedType,
  queryKey,
  locationKey,
  fetchedAt: new Date(),
});

const toFrontendArticle = (doc) => ({
  title: doc.title,
  description: doc.description,
  content: doc.content,
  url: doc.url,
  urlToImage: doc.urlToImage,
  publishedAt: doc.publishedAt,
  source: { name: doc.sourceName || "Unknown Source" },
  author: doc.author || "Unknown Source",
});

const isFresh = (date, maxMinutes) => {
  if (!date) return false;
  const ageMs = Date.now() - new Date(date).getTime();
  return ageMs < maxMinutes * 60 * 1000;
};

const getLocationKey = ({ city = "", region = "", country = "India" }) =>
  `${(city || "").trim().toLowerCase()}__${(region || "")
    .trim()
    .toLowerCase()}__${(country || "India").trim().toLowerCase()}`;

const buildNewsDataParams = ({ query = "", category = "", country = "in", language = "en" }) => {
  const params = {
    apikey: NEWS_API_KEY,
    language,
  };

  if (country) params.country = country;
  if (category) params.category = category;
  if (query) params.q = query;

  return params;
};

const fetchFromNewsData = async ({
  query = "",
  category = "",
  country = "in",
  language = "en",
}) => {
  if (!NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY is missing in .env");
  }

  const response = await axios.get(NEWSDATA_BASE_URL, {
    params: buildNewsDataParams({ query, category, country, language }),
  });

  const results = Array.isArray(response.data?.results) ? response.data.results : [];
  return results.filter((item) => item && item.title && item.link);
};

const upsertArticles = async (articles, feedType, queryKey = "", locationKey = "") => {
  if (!articles.length) return [];

  const normalized = articles.map((item) =>
    normalizeNewsDataArticle(item, feedType, queryKey, locationKey)
  );

  for (const item of normalized) {
    try {
      await Article.findOneAndUpdate(
        {
          url: item.url,
          feedType: item.feedType,
          queryKey: item.queryKey,
          locationKey: item.locationKey,
        },
        {
          $set: {
            title: item.title,
            description: item.description,
            content: item.content,
            urlToImage: item.urlToImage,
            publishedAt: item.publishedAt,
            sourceName: item.sourceName,
            author: item.author,
            fetchedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {}
  }

  const docs = await Article.find({
    feedType,
    queryKey,
    locationKey,
  })
    .sort({ publishedAt: -1, fetchedAt: -1 })
    .limit(15);

  return docs.map(toFrontendArticle);
};

const getCachedArticles = async (feedType, queryKey = "", locationKey = "", limit = 15) => {
  const docs = await Article.find({
    feedType,
    queryKey,
    locationKey,
  })
    .sort({ publishedAt: -1, fetchedAt: -1 })
    .limit(limit);

  return docs;
};

const getLatestFetchedAt = async (feedType, queryKey = "", locationKey = "") => {
  const latest = await Article.findOne({
    feedType,
    queryKey,
    locationKey,
  }).sort({ fetchedAt: -1 });

  return latest?.fetchedAt || null;
};

const safeFetchAndCache = async (fetcher, feedType, queryKey = "", locationKey = "") => {
  try {
    const raw = await fetcher();
    if (!raw.length) return [];
    return await upsertArticles(raw, feedType, queryKey, locationKey);
  } catch (error) {
    if (error.response?.status === 429) {
      console.log(`Rate limited for ${feedType} ${queryKey || locationKey || ""}`);
      return [];
    }
    console.log(`Fetch/cache failed for ${feedType}:`, error.message);
    return [];
  }
};

const fetchGeneralArticles = async () => {
  try {
    const top = await fetchFromNewsData({
      category: "top",
      country: "in",
      language: "en",
    });
    if (top.length) return top;
  } catch (error) {
    console.log("General top fetch failed:", error.message);
  }

  return await fetchFromNewsData({
    query: "India OR politics OR business OR technology",
    country: "in",
    language: "en",
  });
};

const fetchStudentArticles = async () => {
  const queries = [
    "education OR exams OR jobs OR scholarships OR current affairs",
    "student jobs education India",
    "government jobs OR exam notification OR education news",
  ];

  for (const query of queries) {
    try {
      const items = await fetchFromNewsData({
        query,
        country: "in",
        language: "en",
      });
      if (items.length) return items;
    } catch (error) {
      console.log("Student query failed:", query, error.message);
    }
  }

  return [];
};

const fetchLocalArticles = async ({ city, region, country }) => {
  const queries = [];
  const safeCity = (city || "").trim();
  const safeRegion = (region || "").trim();
  const safeCountry = (country || "India").trim();

  if (safeCity && safeRegion) queries.push(`${safeCity} OR ${safeRegion}`);
  if (safeCity && safeCountry) queries.push(`${safeCity} OR ${safeCountry}`);
  if (safeRegion && safeCountry) queries.push(`${safeRegion} OR ${safeCountry}`);
  if (safeCity) queries.push(`${safeCity} local news`);
  if (safeRegion) queries.push(`${safeRegion} news`);
  queries.push("Agartala OR Tripura OR North East India");

  for (const query of queries) {
    try {
      const items = await fetchFromNewsData({
        query,
        country: "in",
        language: "en",
      });
      if (items.length) return items;
    } catch (error) {
      console.log("Local query failed:", query, error.message);
    }
  }

  return [];
};

const refreshGeneralCache = async () => {
  return await safeFetchAndCache(fetchGeneralArticles, "general");
};

const refreshStudentCache = async () => {
  return await safeFetchAndCache(fetchStudentArticles, "student");
};

app.get("/news", async (req, res) => {
  try {
    const { type, q, city = "", region = "", country = "India" } = req.query;

    if (q) {
      const queryKey = normalizeText(q);
      const latestFetchedAt = await getLatestFetchedAt("search", queryKey, "");
      const cachedDocs = await getCachedArticles("search", queryKey, "", 15);

      if (cachedDocs.length && isFresh(latestFetchedAt, SEARCH_CACHE_MINUTES)) {
        return res.status(200).json(cachedDocs.map(toFrontendArticle));
      }

      const fresh = await safeFetchAndCache(
        () =>
          fetchFromNewsData({
            query: q,
            country: "in",
            language: "en",
          }),
        "search",
        queryKey,
        ""
      );

      if (fresh.length) {
        return res.status(200).json(fresh);
      }

      return res.status(200).json(cachedDocs.map(toFrontendArticle));
    }

    if (type === "general") {
      const latestFetchedAt = await getLatestFetchedAt("general", "", "");
      const cachedDocs = await getCachedArticles("general", "", "", 15);

      if (cachedDocs.length) {
        if (!isFresh(latestFetchedAt, GENERAL_CACHE_MINUTES)) {
          refreshGeneralCache();
        }
        return res.status(200).json(cachedDocs.map(toFrontendArticle));
      }

      const fresh = await refreshGeneralCache();
      return res.status(200).json(fresh);
    }

    if (type === "student") {
      const latestFetchedAt = await getLatestFetchedAt("student", "", "");
      const cachedDocs = await getCachedArticles("student", "", "", 15);

      if (cachedDocs.length) {
        if (!isFresh(latestFetchedAt, STUDENT_CACHE_MINUTES)) {
          refreshStudentCache();
        }
        return res.status(200).json(cachedDocs.map(toFrontendArticle));
      }

      const fresh = await refreshStudentCache();
      return res.status(200).json(fresh);
    }

    if (type === "local") {
      const locationKey = getLocationKey({ city, region, country });
      const latestFetchedAt = await getLatestFetchedAt("local", "", locationKey);
      const cachedDocs = await getCachedArticles("local", "", locationKey, 15);

      if (cachedDocs.length) {
        if (!isFresh(latestFetchedAt, LOCAL_CACHE_MINUTES)) {
          safeFetchAndCache(
            () => fetchLocalArticles({ city, region, country }),
            "local",
            "",
            locationKey
          );
        }
        return res.status(200).json(cachedDocs.map(toFrontendArticle));
      }

      const fresh = await safeFetchAndCache(
        () => fetchLocalArticles({ city, region, country }),
        "local",
        "",
        locationKey
      );

      return res.status(200).json(fresh);
    }

    const cachedDocs = await getCachedArticles("general", "", "", 15);
    if (cachedDocs.length) {
      return res.status(200).json(cachedDocs.map(toFrontendArticle));
    }

    const fresh = await refreshGeneralCache();
    return res.status(200).json(fresh);
  } catch (error) {
    console.error("News route error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch news",
    });
  }
});

app.get("/related-news", async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const keywords = extractKeywords(title);

    if (!keywords.length) {
      return res.status(200).json([]);
    }

    const allRecent = await Article.find({})
      .sort({ publishedAt: -1, fetchedAt: -1 })
      .limit(100);

    const scored = allRecent
      .map((article) => {
        const haystack = normalizeText(
          `${article.title} ${article.description} ${article.sourceName}`
        );

        const score = keywords.reduce(
          (sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0),
          0
        );

        return { article, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => toFrontendArticle(item.article));

    return res.status(200).json(scored);
  } catch (error) {
    console.error("Related news error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch related news",
    });
  }
});

/* ---------------- AI SUMMARY ---------------- */

const splitIntoSentences = (text = "") => {
  return String(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);
};

const cleanSummaryText = (text = "") =>
  String(text)
    .replace(/\[\+\d+\s*chars?\]/gi, "")
    .replace(/read more/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const buildSmartSummary = ({ title = "", description = "", content = "", source = "" }) => {
  const combinedText = cleanSummaryText(
    `${title}. ${description}. ${content}. Source ${source}.`
  );

  const sentences = splitIntoSentences(combinedText);

  if (!sentences.length) {
    return [
      "This article discusses a current topic with limited readable content available.",
      "The main context comes from the headline and short description.",
      "Open the original article for deeper details and source context.",
    ];
  }

  const headlineWords = new Set(extractKeywords(`${title} ${description}`));

  const scored = sentences.map((sentence, index) => {
    const words = extractKeywords(sentence);
    let score = 0;

    words.forEach((word) => {
      if (headlineWords.has(word)) score += 3;
      score += 1;
    });

    if (index === 0) score += 2;
    if (sentence.length > 70 && sentence.length < 220) score += 2;

    return { sentence, score, index };
  });

  const best = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  const cleaned = [...new Set(best)].slice(0, 4);

  if (!cleaned.length) {
    return [
      "This article covers an important current update.",
      "The headline and description suggest the topic has broader relevance.",
      "Open the original source for complete detail and context.",
    ];
  }

  return cleaned.map((line) => {
    const trimmed = line.replace(/\s+/g, " ").trim();
    return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  });
};

app.post("/ai-summary", async (req, res) => {
  try {
    const { title, description, content, source } = req.body || {};

    if (!title && !description && !content) {
      return res.status(400).json({
        message: "Article content is required for summary",
      });
    }

    const summaryPoints = buildSmartSummary({
      title,
      description,
      content,
      source,
    });

    return res.status(200).json({
      summary: summaryPoints,
    });
  } catch (error) {
    console.error("AI summary error:", error.message);
    return res.status(500).json({
      message: "Failed to generate AI summary",
    });
  }
});

/* ------------------------------------------ */

const runBackgroundWarmup = async () => {
  console.log("Running cache warmup...");
  await refreshGeneralCache();
  await refreshStudentCache();
};

const startServer = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    server.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);

      await runBackgroundWarmup();

      setInterval(refreshGeneralCache, GENERAL_CACHE_MINUTES * 60 * 1000);
      setInterval(refreshStudentCache, STUDENT_CACHE_MINUTES * 60 * 1000);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
};

startServer();