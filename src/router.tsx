// src/router.ts
import { createBrowserRouter } from "react-router-dom";

import { Layout } from "@/views/Layout";
import { ProjectsView } from "@/views/ProjectsView";
import { VideoView } from "@/views/VideoView";
import { StoryView } from "@/views/StoryView";
import { DecisionsView } from "@/views/DecisionsView";
import { VariablesView } from "@/views/VariablesView";
import { PlayView } from "@/views/PlayView";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <ProjectsView /> },
      { path: "/video", element: <VideoView /> },
      { path: "/story", element: <StoryView /> },
      { path: "/decisions", element: <DecisionsView /> },
      { path: "/variables", element: <VariablesView /> },
      { path: "/play", element: <PlayView /> },
    ],
  },
]);
