import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  ProtectedRoute,
} from "./components/auth/ProtectedRoute";

const OnboardingPage = lazy(() =>
  import("./pages/OnboardingPage").then(
    (module) => ({
      default: module.OnboardingPage,
    })
  )
);

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then(
    (module) => ({
      default: module.LoginPage,
    })
  )
);

const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then(
    (module) => ({
      default: module.RegisterPage,
    })
  )
);

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then(
    (module) => ({
      default: module.DashboardPage,
    })
  )
);

const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then(
    (module) => ({
      default: module.ProfilePage,
    })
  )
);

const DSATrackerPage = lazy(() =>
  import("./pages/DSATrackerPage").then(
    (module) => ({
      default: module.DSATrackerPage,
    })
  )
);

const ResumePage = lazy(() =>
  import("./pages/ResumePage").then(
    (module) => ({
      default: module.ResumePage,
    })
  )
);

const InterviewsPage = lazy(() =>
  import("./pages/InterviewsPage").then(
    (module) => ({
      default: module.InterviewsPage,
    })
  )
);

const NewInterviewPage = lazy(() =>
  import("./pages/NewInterviewPage").then(
    (module) => ({
      default: module.NewInterviewPage,
    })
  )
);

const InterviewDetailPage = lazy(() =>
  import("./pages/InterviewDetailPage").then(
    (module) => ({
      default:
        module.InterviewDetailPage,
    })
  )
);

const DailyPlanPage = lazy(() =>
  import("./pages/DailyPlanPage").then(
    (module) => ({
      default: module.DailyPlanPage,
    })
  )
);

const PricingPage = lazy(() =>
  import("./pages/PricingPage").then(
    (module) => ({
      default: module.PricingPage,
    })
  )
);

const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then(
    (module) => ({
      default: module.SettingsPage,
    })
  )
);

const LegalPage = lazy(() =>
  import("./pages/LegalPage").then(
    (module) => ({
      default: module.LegalPage,
    })
  )
);

const queryClient = new QueryClient();

const RouteLoader = () => {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#050816]"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />

        <p className="mt-4 text-sm text-slate-400">
          Loading PlacementOS…
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider
      client={queryClient}
    >
      <BrowserRouter>
        <Suspense
          fallback={<RouteLoader />}
        >
          <Routes>
            <Route
              path="/"
              element={
                <OnboardingPage />
              }
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register"
              element={<RegisterPage />}
            />

            <Route
              path="/terms"
              element={
                <LegalPage type="terms" />
              }
            />

            <Route
              path="/privacy"
              element={
                <LegalPage type="privacy" />
              }
            />

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

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;