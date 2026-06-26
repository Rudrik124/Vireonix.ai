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
  // Generate Using Reference Video
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
  // Images to Video
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