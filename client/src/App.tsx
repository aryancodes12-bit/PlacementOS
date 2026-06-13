import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ComingSoonPage } from "./components/ui/ComingSoonPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dsa"
            element={
              <ProtectedRoute>
                <ComingSoonPage
                  title="DSA Tracker"
                  description="Track solved problems, weak topics, difficulty distribution, and placement prep consistency."
                  nextStep="Build DSA CRUD APIs and connect real dashboard stats."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ComingSoonPage
                  title="Resume Analyzer"
                  description="Upload resumes, analyze ATS readiness, detect missing keywords, and track improvement."
                  nextStep="Build resume upload, parsing, and analysis workflow."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <ComingSoonPage
                  title="Interview Replay"
                  description="Log interview experiences, questions asked, weak areas, and recommended follow-up actions."
                  nextStep="Build interview replay CRUD and analysis dashboard."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviews/new"
            element={
              <ProtectedRoute>
                <ComingSoonPage
                  title="Log Interview"
                  description="Add your first mock or real interview experience."
                  nextStep="Build interview creation form and connect it to the backend."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ComingSoonPage
                  title="Settings"
                  description="Manage account preferences and application settings."
                  nextStep="Add account and preference controls later."
                />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;