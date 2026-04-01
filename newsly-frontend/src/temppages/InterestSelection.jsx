import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function InterestSelection() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem("newslyUser"));
  const token = localStorage.getItem("newslyToken");
  const userName = savedUser?.name || "User";

  const generalInterests = [
    "Local",
    "India",
    "World",
    "Politics",
    "Tech",
    "Business",
    "Sports",
  ];

  const studentInterests = [
    "Current Affairs",
    "Jobs",
    "Exams",
    "Education",
    "Skills",
    "Government Updates",
  ];

  const interestOptions =
    savedUser?.mode === "student" ? studentInterests : generalInterests;

  const [selectedInterests, setSelectedInterests] = useState(
    savedUser?.interests || []
  );
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(
        selectedInterests.filter((item) => item !== interest)
      );
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSaveInterests = async () => {
    if (!savedUser || !token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    if (selectedInterests.length === 0) {
      alert("Please select at least one interest");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.put(
        "https://newslyai.onrender.com/auth/interests",
        {
          interests: selectedInterests,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem("newslyUser", JSON.stringify(res.data.user));

      alert("Interests saved successfully");

      if (savedUser.mode === "student") {
        navigate("/student-feed");
      } else {
        navigate("/general-feed");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save interests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center px-6">
      <div className="max-w-3xl w-full">
        <p className="text-center text-slate-400 mb-2">
          Welcome back, {userName}
        </p>

        <h1 className="text-4xl font-bold text-center mb-3">
          Select Your Interests
        </h1>

        <p className="text-center text-slate-400 mb-10">
          Choose topics you want to see more often in your feed
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          {interestOptions.map((interest) => {
            const isSelected = selectedInterests.includes(interest);

            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-5 py-3 border transition ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-500"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={handleSaveInterests}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Interests"}
          </button>

          <Link
            to="/mode"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InterestSelection;