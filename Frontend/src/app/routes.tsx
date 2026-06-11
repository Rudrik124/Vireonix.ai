import { createBrowserRouter, Navigate, useRouteError } from "react-router";
import { PortalGate } from "../shared/routing/route-guards";
// Developer Portal
import { DeveloperDashboardPage } from "../portals/developer/pages/developer-dashboard-page";
import { DeveloperUsersPage } from "../portals/developer/pages/developer-users-page";
import { DeveloperCreditsPage } from "../portals/developer/pages/developer-credits-page";
import { DeveloperTesterCreditsPage } from "../portals/developer/pages/developer-tester-credits-page";
import { DeveloperErrorLogsPage } from "../portals/developer/pages/developer-error-logs-page";
import { DeveloperAnalyticsPage } from "../portals/developer/pages/developer-analytics-page";
import { DeveloperFeedbackPage } from "../portals/developer/pages/developer-feedback-page";
import { DeveloperReportPage } from "../portals/developer/pages/developer-report-page";
import { DeveloperSettingsPage } from "../portals/developer/pages/developer-settings-page";
import { DeveloperCostsPage } from "../portals/developer/pages/developer-costs-page";
import { DeveloperLogsPage } from "../portals/developer/pages/developer-logs-page";
import { DeveloperOperationsPage } from "../portals/developer/pages/developer-operations-page";
import { DeveloperWorkflowLabPage } from "../portals/developer/pages/developer-workflow-lab-page";
// Admin Portal
import { AdminDashboardPage } from "../portals/admin/pages/admin-dashboard-page";
import { TestingCredentialsPage } from "../portals/admin/pages/testing-credentials-page";
// Tester Portal
import { TesterDashboardPage } from "../portals/tester/pages/tester-dashboard-page";
import { TesterTestEnvironmentPage } from "../portals/tester/pages/tester-test-environment-page";
import { TesterBugReportsPage } from "../portals/tester/pages/tester-bug-reports-page";
import { TesterTestCasesPage } from "../portals/tester/pages/tester-test-cases-page";
import { TesterCreditsPage } from "../portals/tester/pages/tester-credits-page";
import { TesterProfilePage } from "../portals/tester/pages/tester-profile-page";
import { TesterAnalyticsPage } from "../portals/tester/pages/tester-analytics-page";
import { TesterFeedbackPage } from "../portals/tester/pages/tester-feedback-page";
// User Portal
import { UserDashboardPage } from "../portals/user/pages/user-dashboard-page";

function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-purple-500/10">
        <h1 className="text-3xl font-black tracking-tight text-white">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">We were unable to load this part of the editor. Please try refreshing or return to the quick edit home page.</p>
        <pre className="mt-6 overflow-auto rounded-2xl bg-slate-950/80 p-4 text-xs text-slate-300 border border-white/10">
          {String(error ?? 'Unknown error')}
        </pre>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/quick-edit/upload" className="inline-flex items-center justify-center rounded-full bg-purple-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-purple-400">Back to Quick Edit</a>
          <a href="/" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-purple-500/40">Go Home</a>
        </div>
      </div>
    </div>
  );
}

const legacyUserRoutes = [
  {
    path: "/",
    async lazy() {
      const { LandingPage } = await import("./main/landing-page");
      return { Component: LandingPage };
    }
  },
  {
    path: "/video-type",
    async lazy() {
      const { VideoTypePage } = await import("./main/video-type-page");
      return { Component: VideoTypePage };
    }
  },
  {
    path: "/features",
    async lazy() {
      const { FeaturesSelectionPage } = await import("./main/features-selection");
      return { Component: FeaturesSelectionPage };
    }
  },
  {
    path: "/create",
    async lazy() {
      const { AIGenerativeVideoPage } = await import("./pages/AI-Video_Generation/ai-generative-video");
      return { Component: AIGenerativeVideoPage };
    }
  },
  {
    path: "/editor",
    async lazy() {
      const { EditorPage } = await import("./pages/editor/editor-page");
      return { Component: EditorPage };
    }
  },
  {
    path: "/home",
    async lazy() {
      const { HomePage } = await import("./main/home-page");
      return { Component: HomePage };
    }
  },
  {
    path: "/processing",
    async lazy() {
      const { ProcessingPage } = await import("./pages/AI-Video_Generation/processing");
      return { Component: ProcessingPage };
    }
  },
  {
    path: "/result",
    async lazy() {
      const { ResultPage } = await import("./pages/AI-Video_Generation/result");
      return { Component: ResultPage };
    }
  },
  {
    path: "/reference-video/setup",
    async lazy() {
      const { ReferenceVideoSetupScreen } = await import("./pages/reference-video/setup-screen");
      return { Component: ReferenceVideoSetupScreen };
    }
  },
  {
    path: "/reference-video/processing",
    async lazy() {
      const { ReferenceVideoProcessingScreen } = await import("./pages/reference-video/processing-screen");
      return { Component: ReferenceVideoProcessingScreen };
    }
  },
  {
    path: "/reference-video/result",
    async lazy() {
      const { ReferenceVideoResultScreen } = await import("./pages/reference-video/result-screen");
      return { Component: ReferenceVideoResultScreen };
    }
  },
  {
    path: "/images-to-video/upload",
    async lazy() {
      const { ImagesToVideoUploadScreen } = await import("./pages/images-to-video/upload-screen");
      return { Component: ImagesToVideoUploadScreen };
    }
  },
  {
    path: "/images-to-video/arrange",
    async lazy() {
      const { ImagesToVideoArrangeScreen } = await import("./pages/images-to-video/arrange-screen");
      return { Component: ImagesToVideoArrangeScreen };
    }
  },
  {
    path: "/images-to-video/style",
    async lazy() {
      const { ImagesToVideoStyleScreen } = await import("./pages/images-to-video/style-screen");
      return { Component: ImagesToVideoStyleScreen };
    }
  },
  {
    path: "/images-to-video/preview",
    async lazy() {
      const { ImagesToVideoPreviewScreen } = await import("./pages/images-to-video/preview-screen");
      return { Component: ImagesToVideoPreviewScreen };
    }
  },
  {
    path: "/timeline-editor",
    async lazy() {
      const { TimelineEditorPage } = await import("./pages/timeline-editor/timeline-editor-page");
      return { Component: TimelineEditorPage };
    }
  },
  {
    path: "/wallet",
    async lazy() {
      const { WalletPage } = await import("./main/wallet-page");
      return { Component: WalletPage };
    }
  },
  {
    path: "/quick-edit",
    errorElement: <RouteErrorBoundary />,
    async lazy() {
      const { QuickEditLayout } = await import("./pages/quick-edit/layout");
      return { Component: QuickEditLayout };
    },
    children: [
      {
        path: "upload",
        async lazy() {
          const { QuickEditUploadScreen } = await import("./pages/quick-edit/upload-screen");
          return { Component: QuickEditUploadScreen };
        }
      },
      {
        path: "style",
        errorElement: <RouteErrorBoundary />,
        async lazy() {
          const { QuickEditStyleScreen } = await import("./pages/quick-edit/style-screen");
          return { Component: QuickEditStyleScreen };
        }
      },
      {
        path: "processing",
        async lazy() {
          const { QuickEditProcessingScreen } = await import("./pages/quick-edit/processing-screen");
          return { Component: QuickEditProcessingScreen };
        }
      },
      {
        path: "result",
        async lazy() {
          const { QuickEditResultScreen } = await import("./pages/quick-edit/result-screen");
          return { Component: QuickEditResultScreen };
        }
      },
    ],
  },
];

export const router = createBrowserRouter([
  {
    path: "/auth/callback",
    async lazy() {
      const { AuthCallbackPage } = await import("./pages/Auth/auth-callback");
      return { Component: AuthCallbackPage };
    }
  },
  // User Portal Routes
  {
    path: "/user/dashboard",
    element: (
      <PortalGate portal="user">
        <UserDashboardPage />
      </PortalGate>
    ),
  },
  // Legacy routes for backward compatibility
  {
    path: "/app",
    element: (
      <PortalGate portal="user">
        <UserDashboardPage />
      </PortalGate>
    ),
  },
  // Developer Portal Routes
  {
    path: "/developer/dashboard",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperDashboardPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/users",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperUsersPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/credits",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperCreditsPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/costs",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperCostsPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/tester-credits",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperTesterCreditsPage />
      </PortalGate>
    ),
  },
  // Developer testing lab removed
  {
    path: "/developer/error-logs",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperErrorLogsPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/analytics",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperAnalyticsPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/reports",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperReportPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/feedback",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperFeedbackPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/settings",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperSettingsPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/workflows",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperWorkflowLabPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/logs",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperLogsPage />
      </PortalGate>
    ),
  },
  {
    path: "/developer/operations",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin"]}>
        <DeveloperOperationsPage />
      </PortalGate>
    ),
  },
  // Legacy internal routes for backward compatibility
  {
    path: "/internal",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <DeveloperDashboardPage />
      </PortalGate>
    ),
  },
  {
    path: "/internal/workflows",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <DeveloperWorkflowLabPage />
      </PortalGate>
    ),
  },
  {
    path: "/internal/logs",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <DeveloperLogsPage />
      </PortalGate>
    ),
  },
  {
    path: "/internal/operations",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin"]}>
        <DeveloperOperationsPage />
      </PortalGate>
    ),
  },
  // Admin Portal Routes
  {
    path: "/admin/dashboard",
    element: (
      <PortalGate portal="admin" allowedRoles={["super_admin", "admin"]}>
        <AdminDashboardPage />
      </PortalGate>
    ),
  },
  {
    path: "/admin/testing-credentials",
    element: (
      <PortalGate portal="admin" allowedRoles={["super_admin", "admin"]}>
        <TestingCredentialsPage />
      </PortalGate>
    ),
  },
  // Tester Portal Routes
  {
    path: "/tester/dashboard",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterDashboardPage />
      </PortalGate>
    ),
  },
  {
    path: "/tester/test-environment",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterTestEnvironmentPage />
      </PortalGate>
    ),
  },
  {
    path: "/tester/bug-reports",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterBugReportsPage />
      </PortalGate>
    ),
  },
  {
    path: "/tester/test-cases",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterTestCasesPage />
      </PortalGate>
    ),
  },
  {
    path: "/tester/credits",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterCreditsPage />
      </PortalGate>
    ),
  },

  {
    path: "/tester/profile",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterProfilePage />
      </PortalGate>
    ),
  },

  {
    path: "/tester/analytics",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterAnalyticsPage />
      </PortalGate>
    ),
  },
  {
    path: "/tester/feedback",
    element: (
      <PortalGate portal="tester" allowedRoles={["super_admin", "admin", "developer", "tester"]}>
        <TesterFeedbackPage />
      </PortalGate>
    ),
  },
  ...legacyUserRoutes,
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);
