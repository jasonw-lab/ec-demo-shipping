import { createBrowserRouter } from 'react-router-dom';

// project imports
import MainRoutes from './MainRoutes';
import LoginRoutes from './LoginRoutes';
import RootLayout from 'layout/RootLayout';

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [MainRoutes, LoginRoutes]
    }
  ],
  { basename: import.meta.env.VITE_APP_BASE_NAME }
);

export default router;
