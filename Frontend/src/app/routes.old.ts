import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    async lazy() {
      const { VideoTypePage } = await import("./main/home-page");
      return { Component: VideoTypePage };
    }
  },
  {
    path: "/auth/callback",
    async lazy() {
      const { AuthCallbackPage } = await import("./pages/Auth/auth-callback");
      return { Component: AuthCallbackPage };
    }
  },
  {
    path: "/features",
    async lazy() {
      const { FeaturesSelectionPage } = await import("./main/features-selection");
      return { Component: FeaturesSelectionPage };
    }
  },
  // AI Generated Video (original flow)
  {
    path: "/create",
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

  // Quick AI Edit Layout with Music Provider
  {
    path: "/quick-edit",
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
      }
    ]
  }
]);
