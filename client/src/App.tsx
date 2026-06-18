import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumePage } from "./pages/ResumePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DSATrackerPage } from "./pages/DSATrackerPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ComingSoonPage } from "./components/ui/ComingSoonPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import { NewInterviewPage } from "./pages/NewInterviewPage";
import { InterviewDetailPage } from "./pages/InterviewDetailPage";
import { DailyPlanPage } from "./pages/DailyPlanPage";
import { PricingPage } from "./pages/PricingPage";
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
                <DSATrackerPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <InterviewsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviews/new"
            element={
              <ProtectedRoute>
                <NewInterviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interviews/:id"
            element={
              <ProtectedRoute>
                <InterviewDetailPage />
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
          <Route
            path="/daily-plan"
            element={
              <ProtectedRoute>
                <DailyPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <PricingPage />
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