import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./temppages/Home";
import Explore from "./temppages/Explore";
import GeneralFeed from "./temppages/GeneralFeed";
import StudentFeed from "./temppages/StudentFeed";
import LocalFeed from "./temppages/LocalFeed";
import Saved from "./temppages/Saved";
import Profile from "./temppages/Profile";
import Login from "./temppages/Login";
import Signup from "./temppages/Signup";
import InterestSelection from "./temppages/InterestSelection";
import ModeSelection from "./temppages/ModeSelection";
import NewsDetails from "./temppages/NewsDetails";
import ChangePassword from "./temppages/ChangePassword";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#020817] text-white">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/mode"
            element={
              <ProtectedRoute>
                <ModeSelection />
              </ProtectedRoute>
            }
          />

          <Route
            path="/general-feed"
            element={
              <ProtectedRoute>
                <GeneralFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-feed"
            element={
              <ProtectedRoute>
                <StudentFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/local-feed"
            element={
              <ProtectedRoute>
                <LocalFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <Saved />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interests"
            element={
              <ProtectedRoute>
                <InterestSelection />
              </ProtectedRoute>
            }
          />

          <Route
            path="/news-details"
            element={
              <ProtectedRoute>
                <NewsDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;