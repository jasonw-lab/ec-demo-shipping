import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

// project imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import IconButton from 'components/@extended/IconButton';
import { useAuth } from 'contexts/AuthContext';

// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setOpen(false);
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role display name
  const getRoleDisplay = (roles) => {
    if (!roles || roles.length === 0) return '';
    const roleLabels = {
      admin: 'システム管理者',
      operator: 'オペレーター',
      viewer: '閲覧者'
    };
    return roleLabels[roles[0]] || roles[0];
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 'auto' }}>
      <Tooltip title="プロフィール" disableInteractive>
        <ButtonBase
          sx={(theme) => ({
            p: 0.25,
            borderRadius: 1,
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.secondary.dark}`, outlineOffset: 2 }
          })}
          aria-label="open profile"
          ref={anchorRef}
          aria-controls={open ? 'profile-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Avatar
            alt={user?.display_name || 'User'}
            size="sm"
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { outline: '1px solid', outlineColor: 'primary.main' }
            }}
          >
            {getInitials(user?.display_name)}
          </Avatar>
        </ButtonBase>
      </Tooltip>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.vars.customShadows.z1, width: 290, minWidth: 240, maxWidth: { xs: 250, md: 290 } })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.5, pt: 3 }}>
                    <Grid container sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Grid>
                        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
                          <Avatar alt={user?.display_name || 'User'} sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {getInitials(user?.display_name)}
                          </Avatar>
                          <Stack>
                            <Typography variant="h6">{user?.display_name || 'ユーザー'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getRoleDisplay(user?.roles)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid>
                        <Tooltip title="ログアウト">
                          <IconButton size="large" sx={{ color: 'text.primary' }} onClick={handleLogout}>
                            <LogoutOutlined />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </CardContent>

                  <Divider />

                  <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
                    <ListItemButton onClick={handleProfileClick}>
                      <ListItemIcon>
                        <UserOutlined />
                      </ListItemIcon>
                      <ListItemText primary="プロフィール設定" />
                    </ListItemButton>
                    <ListItemButton onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutOutlined />
                      </ListItemIcon>
                      <ListItemText primary="ログアウト" />
                    </ListItemButton>
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
