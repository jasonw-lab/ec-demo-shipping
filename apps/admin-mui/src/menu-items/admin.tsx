// assets
import { TeamOutlined, UserOutlined } from '@ant-design/icons';

// icons
const icons = {
  TeamOutlined,
  UserOutlined
};

// ==============================|| MENU ITEMS - ADMIN ||============================== //

const admin = {
  id: 'group-admin',
  title: '管理',
  type: 'group',
  children: [
    {
      id: 'users',
      title: 'ユーザー管理',
      type: 'item',
      url: '/users',
      icon: icons.TeamOutlined,
      breadcrumbs: false
    }
  ]
};

export default admin;
