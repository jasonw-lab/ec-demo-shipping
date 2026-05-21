import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import { ProtectedRoute } from 'contexts/AuthContext';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// render - shipping
const ShippingSummary = Loadable(lazy(() => import('pages/shipping/summary')));
const ShippingList = Loadable(lazy(() => import('pages/shipping/list')));

// render - profile
const ProfilePage = Loadable(lazy(() => import('pages/profile')));

// render - user management
const UserManagementPage = Loadable(lazy(() => import('pages/users')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '/',
      element: <ShippingSummary />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'shipping',
      children: [
        {
          path: 'summary',
          element: <ShippingSummary />
        },
        {
          path: 'list',
          element: <ShippingList />
        }
      ]
    },
    {
      path: 'profile',
      element: <ProfilePage />
    },
    {
      path: 'users',
      element: (
        <ProtectedRoute requiredRole="admin">
          <UserManagementPage />
        </ProtectedRoute>
      )
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;
