import { createBrowserRouter, Navigate, useRouteError, Outlet, ScrollRestoration } from "react-router";
import React from "react";
import { PortalGate } from "../shared/routing/route-guards";
// Developer Portal
import { DeveloperDashboardPage } from "../portals/developer/pages/developer-dashboard-page";
import { DeveloperUsersPage } from "../portals/developer/pages/developer-users-page";
import { DeveloperCreditsPage } from "../portals/developer/pages/developer-credits-page";
import { DeveloperTesterCreditsPage } from "../portals/developer/pages/developer-tester-credits-page";
import { DeveloperErrorLogsPage } from "../portals/developer/pages/developer-error-logs-page";
import { DeveloperSecurityEventsPage } from "../portals/developer/pages/developer-security-events-page";
import { DeveloperAuthenticationMonitoringPage } from "../portals/developer/pages/developer-authentication-monitoring-page";
import { DeveloperPromptSecurityMonitoringPage } from "../portals/developer/pages/developer-prompt-security-monitoring-page";
import { DeveloperFileUploadSecurityMonitoringPage } from "../portals/developer/pages/developer-file-upload-security-monitoring-page";
import { DeveloperRateLimitMonitoringPage } from "../portals/developer/pages/developer-rate-limit-monitoring-page";
import { DeveloperAICostMonitoringPage } from "../portals/developer/pages/developer-ai-cost-monitoring-page";
import { DeveloperAPISecurityMonitoringPage } from "../portals/developer/pages/developer-api-security-monitoring-page";
import { DeveloperUserRiskScoringPage } from "../portals/developer/pages/developer-user-risk-scoring-page";
import { DeveloperSecurityAlertsPage } from "../portals/developer/pages/developer-security-alerts-page";
import { DeveloperAdminActivityMonitoringPage } from "../portals/developer/pages/developer-admin-activity-monitoring-page";
import { DeveloperAuditLogPage } from "../portals/developer/pages/developer-audit-log-page";
import { DeveloperThreatVisualizationPage } from "../portals/developer/pages/developer-threat-visualization-page";
import DeveloperAnalyticsPage from "../portals/developer/pages/developer-analytics-page";
import LoginActivityPage from "./developer/login-activity-page";
import { DeveloperFeedbackPage } from "../portals/developer/pages/developer-feedback-page";
import { DeveloperReportPage } from "../portals/developer/pages/developer-report-page";
import { DeveloperRevenueProfit } from "../portals/developer/pages/developer-revenue-profit-page";
import { DeveloperProfitDistribution } from "../portals/developer/pages/developer-profit-distribution-page";
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
// Security Portal
import { SecurityPortalGate } from "../shared/routing/security-portal-gate";
import { SecurityPortalDashboardPage } from "../portals/security/pages/security-portal-dashboard-page";
import { SecurityOverviewPage } from "../portals/security/pages/security-overview-page";
import { SecurityAuditLogsPage } from "../portals/security/pages/security-audit-logs-page";
import { SecurityAuthenticationPage } from "../portals/security/pages/security-authentication-page";
import { SecurityPromptSecurityPage } from "../portals/security/pages/security-prompt-security-page";
import { SecurityFileUploadPage } from "../portals/security/pages/security-file-upload-page";
import { SecurityRateLimitPage } from "../portals/security/pages/security-rate-limit-page";
import { SecurityAPISecurityPage } from "../portals/security/pages/security-api-security-page";
import { SecurityAICostPage } from "../portals/security/pages/security-ai-cost-page";
import { SecurityUserRiskScoringPage } from "../portals/security/pages/security-user-risk-scoring-page";
import { SecurityAlertsPage } from "../portals/security/pages/security-alerts-page";
import { SecurityAdminActivityPage } from "../portals/security/pages/security-admin-activity-page";
import { SecurityThreatVisualizationPage } from "../portals/security/pages/security-threat-visualization-page";
import { SecuritySettingsPage } from "../portals/security/pages/security-settings-page";
import { SecurityRolesPage } from "../portals/security/pages/security-roles-page";

function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 p-8">
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
    path: "/home",
    async lazy() {
      const { VideoTypePage } = await import("./main/home-page");
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

function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/auth/callback",
        async lazy() {
          const { AuthCallbackPage } = await import("./pages/Auth/auth-callback");
          return { Component: AuthCallbackPage };
        }
      },
      {
        path: "/developer/auth",
        async lazy() {
          const { DeveloperAccessPage } = await import("../portals/developer/pages/developer-access-page");
          return { Component: DeveloperAccessPage };
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
        path: "/developer/revenue-profit",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperRevenueProfit />
          </PortalGate>
        ),
      },
      {
        path: "/developer/profit-distribution",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperProfitDistribution />
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
        path: "/developer/security-events",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperSecurityEventsPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/authentication-monitoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperAuthenticationMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/prompt-security-monitoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperPromptSecurityMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/file-upload-security-monitoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperFileUploadSecurityMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/rate-limit-monitoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperRateLimitMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/ai-cost-monitoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperAICostMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/api-security-monitoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperAPISecurityMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/user-risk-scoring",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperUserRiskScoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/security-alerts",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <DeveloperSecurityAlertsPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/admin-activity",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin"]}>
            <DeveloperAdminActivityMonitoringPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/audit-log",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin"]}>
            <DeveloperAuditLogPage />
          </PortalGate>
        ),
      },
      {
        path: "/developer/threat-visualization",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin"]}>
            <DeveloperThreatVisualizationPage />
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
      {
        path: "/developer/login-activity",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <LoginActivityPage />
            </React.Suspense>
          </PortalGate>
        ),
      },
      {
        path: "/developer/analytics",
        element: (
          <PortalGate portal="developer" allowedRoles={["super_admin", "admin"]}>
            <DeveloperAnalyticsPage />
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
      // Security Portal Routes
      {
        path: "/security",
        element: (
          <SecurityPortalGate>
            <SecurityPortalDashboardPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/overview",
        element: (
          <SecurityPortalGate>
            <SecurityOverviewPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/audit-logs",
        element: (
          <SecurityPortalGate>
            <SecurityAuditLogsPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/authentication-monitoring",
        element: (
          <SecurityPortalGate>
            <SecurityAuthenticationPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/prompt-security",
        element: (
          <SecurityPortalGate>
            <SecurityPromptSecurityPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/file-upload-security",
        element: (
          <SecurityPortalGate>
            <SecurityFileUploadPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/rate-limit-monitoring",
        element: (
          <SecurityPortalGate>
            <SecurityRateLimitPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/api-security",
        element: (
          <SecurityPortalGate>
            <SecurityAPISecurityPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/ai-cost-monitoring",
        element: (
          <SecurityPortalGate>
            <SecurityAICostPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/user-risk-scoring",
        element: (
          <SecurityPortalGate>
            <SecurityUserRiskScoringPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/security-alerts",
        element: (
          <SecurityPortalGate>
            <SecurityAlertsPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/admin-activity",
        element: (
          <SecurityPortalGate>
            <SecurityAdminActivityPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/threat-visualization",
        element: (
          <SecurityPortalGate>
            <SecurityThreatVisualizationPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/settings",
        element: (
          <SecurityPortalGate>
            <SecuritySettingsPage />
          </SecurityPortalGate>
        ),
      },
      {
        path: "/security/roles",
        element: (
          <SecurityPortalGate>
            <SecurityRolesPage />
          </SecurityPortalGate>
        ),
      },
      ...legacyUserRoutes,
      {
        path: "*",
        element: <Navigate to="/" replace />,
      }
    ]
  }
]);
