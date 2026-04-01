import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

function Saved() {
  const [savedNews, setSavedNews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSavedNews = JSON.parse(localStorage.getItem("savedNews")) || [];
    setSavedNews(storedSavedNews);
  }, []);

  const handleRemove = (title) => {
    const updatedSavedNews = savedNews.filter((item) => item.title !== title);
    localStorage.setItem("savedNews", JSON.stringify(updatedSavedNews));
    setSavedNews(updatedSavedNews);
  };

  const handleRead = (article) => {
    navigate("/news-details", { state: { article } });
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div className="mx-auto max-w-3xl px-3 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">🔖 Saved News</h2>
          <p className="text-xs text-slate-400">Your bookmarked articles</p>
        </div>

        {savedNews.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0b1220] p-6 text-center">
            <p className="text-sm text-slate-300">No saved articles yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Tap Save on any news card to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedNews.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-[#0b1220] p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      item.type === "student"
                        ? "bg-purple-500/15 text-purple-300"
                        : "bg-blue-500/15 text-blue-300"
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>

                <h3 className="text-sm font-semibold leading-snug">
                  {item.title}
                </h3>

                <p className="mt-1 text-[11px] text-slate-400">{item.source}</p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleRead(item)}
                    className="rounded-md bg-slate-700 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-slate-600"
                  >
                    Read
                  </button>

                  <button
                    onClick={() => handleRemove(item.title)}
                    className="rounded-md border border-red-500/20 px-3 py-1 text-[11px] text-red-400 transition hover:bg-red-500/10"
                  >
                    Remove
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

export default Saved;