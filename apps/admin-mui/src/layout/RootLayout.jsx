import { Outlet } from 'react-router-dom';
import { AuthProvider } from 'contexts/AuthContext';

// ==============================|| ROOT LAYOUT ||============================== //

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
