// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './views/Layout';
import { ProjectsView } from './views/ProjectsView';
import { VideoView } from './views/VideoView';
import { StoryView } from './views/StoryView';
import { DecisionsView } from './views/DecisionsView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ProjectsView />
      },
      {
        path: 'video',
        element: <VideoView />
      },
      {
        path: 'story',
        element: <StoryView />
      },
      {
        path: 'decisions',
        element: <DecisionsView />
      }
    ]
  }
]);