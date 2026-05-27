import { createBrowserRouter, Navigate } from "react-router";
import { PortalGate } from "../shared/routing/route-guards";
// Developer Portal
import { DeveloperAccessPage } from "../portals/developer/pages/developer-access-page";
import { DeveloperDashboardPage } from "../portals/developer/pages/developer-dashboard-page";
import { DeveloperLogsPage } from "../portals/developer/pages/developer-logs-page";
import { DeveloperOperationsPage } from "../portals/developer/pages/developer-operations-page";
import { DeveloperWorkflowLabPage } from "../portals/developer/pages/developer-workflow-lab-page";
// Admin Portal
import { AdminAuthPage } from "../portals/admin/pages/admin-auth-page";
import { AdminDashboardPage } from "../portals/admin/pages/admin-dashboard-page";
import { TestingCredentialsPage } from "../portals/admin/pages/testing-credentials-page";
// Tester Portal
import { TesterAuthPage } from "../portals/tester/pages/tester-auth-page";
import { TesterDashboardPage } from "../portals/tester/pages/tester-dashboard-page";
import { TesterTestEnvironmentPage } from "../portals/tester/pages/tester-test-environment-page";
// User Portal
import { UserAuthPage } from "../portals/user/pages/user-auth-page";
import { UserDashboardPage } from "../portals/user/pages/user-dashboard-page";

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
    path: "/quick-edit/upload",
    async lazy() {
      const { QuickEditUploadScreen } = await import("./pages/quick-edit/upload-screen");
      return { Component: QuickEditUploadScreen };
    }
  },
  {
    path: "/quick-edit/style",
    async lazy() {
      const { QuickEditStyleScreen } = await import("./pages/quick-edit/style-screen");
      return { Component: QuickEditStyleScreen };
    }
  },
  {
    path: "/quick-edit/processing",
    async lazy() {
      const { QuickEditProcessingScreen } = await import("./pages/quick-edit/processing-screen");
      return { Component: QuickEditProcessingScreen };
    }
  },
  {
    path: "/quick-edit/result",
    async lazy() {
      const { QuickEditResultScreen } = await import("./pages/quick-edit/result-screen");
      return { Component: QuickEditResultScreen };
    }
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
    path: "/user/auth",
    Component: UserAuthPage,
  },
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
    path: "/login",
    Component: UserAuthPage,
  },
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
    path: "/developer/auth",
    Component: DeveloperAccessPage,
  },
  {
    path: "/developer/dashboard",
    element: (
      <PortalGate portal="developer" allowedRoles={["super_admin", "admin", "developer"]}>
        <DeveloperDashboardPage />
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
    path: "/internal/login",
    Component: DeveloperAccessPage,
  },
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
    path: "/admin/auth",
    Component: AdminAuthPage,
  },
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
    path: "/tester/auth",
    Component: TesterAuthPage,
  },
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
  ...legacyUserRoutes,
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);
