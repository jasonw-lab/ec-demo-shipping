// material-ui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import NavGroup from './NavGroup';
import menuItem from 'menu-items';
import { useAuth } from 'contexts/AuthContext';

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

export default function Navigation() {
  const { hasRole } = useAuth();

  // Filter menu items based on user role
  const filteredItems = menuItem.items.filter((item) => {
    // Hide admin group for non-admin users
    if (item.id === 'group-admin' && !hasRole('admin')) {
      return false;
    }
    return true;
  });

  const navGroups = filteredItems.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={item.id} item={item} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ pt: 2 }}>{navGroups}</Box>;
}
