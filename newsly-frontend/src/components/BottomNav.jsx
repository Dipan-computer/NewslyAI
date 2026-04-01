import { useLocation, useNavigate } from "react-router-dom";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeClass = (paths) =>
    paths.includes(location.pathname)
      ? "bg-white/5 text-blue-300"
      : "text-slate-400 hover:bg-white/5";

  return (
    <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-[#0b1220] p-2 text-[11px]">
      <button
        onClick={() => navigate("/mode")}
        className={`rounded-md py-2 transition ${activeClass([
          "/mode",
          "/general-feed",
          "/student-feed",
        ])}`}
      >
        Home
      </button>

      <button
        onClick={() => navigate("/explore")}
        className={`rounded-md py-2 transition ${activeClass(["/explore"])}`}
      >
        Explore
      </button>

      <button
        onClick={() => navigate("/saved")}
        className={`rounded-md py-2 transition ${activeClass(["/saved"])}`}
      >
        Saved
      </button>

      <button
        onClick={() => navigate("/profile")}
        className={`rounded-md py-2 transition ${activeClass(["/profile"])}`}
      >
        Profile
      </button>
    </div>
  );
}

export default BottomNav;