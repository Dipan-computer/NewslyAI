import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function ModeSelection() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("newslyUser")) || {
    name: "User",
  };

  const handleSelect = (mode) => {
    localStorage.setItem("newslyMode", mode);

    if (mode === "student") {
      navigate("/student-feed");
    } else if (mode === "local") {
      navigate("/local-feed");
    } else {
      navigate("/general-feed");
    }
  };

  const saveFallbackLocationAndOpen = () => {
    localStorage.setItem(
      "newslyLocation",
      JSON.stringify({
        city: "Agartala",
        region: "Tripura",
        country: "India",
        lat: null,
        lon: null,
      })
    );
    localStorage.setItem("newslyMode", "local");
    navigate("/local-feed");
  };

  const reverseGeocodeLocation = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error("Failed to reverse geocode");
      }

      const data = await response.json();
      const address = data.address || {};

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "Your Area";

      const region =
        address.state ||
        address.region ||
        address.state_district ||
        "Live Location";

      const country = address.country || "India";

      localStorage.setItem(
        "newslyLocation",
        JSON.stringify({
          city,
          region,
          country,
          lat,
          lon,
        })
      );

      localStorage.setItem("newslyMode", "local");
      navigate("/local-feed");
    } catch (error) {
      console.log("Reverse geocoding failed:", error);
      saveFallbackLocationAndOpen();
    }
  };

  const handleLocalMode = () => {
    if (!navigator.geolocation) {
      saveFallbackLocationAndOpen();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        await reverseGeocodeLocation(lat, lon);
      },
      () => {
        saveFallbackLocationAndOpen();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Header />

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm text-slate-400">
              👋 Welcome back, {user.name}
            </p>

            <h2 className="text-2xl font-semibold md:text-3xl">
              Choose your experience
            </h2>

            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Select how you want your news feed
            </p>
          </div>

          <div className="space-y-5">
            <div
              onClick={() => handleSelect("general")}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0b1220] p-6 transition duration-200 hover:scale-[1.01] hover:border-blue-500/30 hover:bg-white/[0.03]"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <p className="text-sm font-medium text-blue-400">
                  General Mode
                </p>
              </div>

              <h3 className="text-2xl font-semibold">Local to Global News</h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Get local, national, international and political updates in one
                clean personalized feed.
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  News • Politics • World
                </span>
                <span className="text-sm text-blue-300 transition group-hover:translate-x-1">
                  Enter →
                </span>
              </div>
            </div>

            <div
              onClick={() => handleSelect("student")}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0b1220] p-6 transition duration-200 hover:scale-[1.01] hover:border-purple-500/30 hover:bg-white/[0.03]"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <p className="text-sm font-medium text-purple-400">
                  Student Mode
                </p>
              </div>

              <h3 className="text-2xl font-semibold">Current Affairs & Jobs</h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Focus on exams, jobs, education, scholarships and career
                updates designed for students.
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Exams • Jobs • Education
                </span>
                <span className="text-sm text-purple-300 transition group-hover:translate-x-1">
                  Enter →
                </span>
              </div>
            </div>

            <div
              onClick={handleLocalMode}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0b1220] p-6 transition duration-200 hover:scale-[1.01] hover:border-green-500/30 hover:bg-white/[0.03]"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">📍</span>
                <p className="text-sm font-medium text-green-400">
                  Personalized Local Mode
                </p>
              </div>

              <h3 className="text-2xl font-semibold">
                Real-Time News Around You
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Get location-based local headlines personalized according to
                your real-time area for a more relevant daily news experience.
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Nearby • Real-Time • Local
                </span>
                <span className="text-sm text-green-300 transition group-hover:translate-x-1">
                  Enter →
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              ✨ Pick your mode and continue with a personalized experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeSelection;