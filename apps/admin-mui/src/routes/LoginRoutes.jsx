import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';
import { isAuthenticated } from 'services/auth';

// jwt auth
const LoginPage = Loadable(lazy(() => import('pages/auth/Login')));

// ==============================|| AUTH ROUTING ||============================== //

// Redirect wrapper for login page
function LoginRedirect({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const LoginRoutes = {
  path: '/',
  children: [
    {
      path: 'login',
      element: (
        <LoginRedirect>
          <LoginPage />
        </LoginRedirect>
      )
    }
  ]
};

export default LoginRoutes;
