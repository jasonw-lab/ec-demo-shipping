// assets
import { SendOutlined, UnorderedListOutlined, DashboardOutlined } from '@ant-design/icons';

// icons
const icons = {
  SendOutlined,
  UnorderedListOutlined,
  DashboardOutlined
};

// ==============================|| MENU ITEMS - SHIPPING ||============================== //

const shipping = {
  id: 'group-shipping',
  title: '発送管理',
  type: 'group',
  children: [
    {
      id: 'shipping-summary',
      title: '発送管理サマリー',
      type: 'item',
      url: '/shipping/summary',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'shipping-list',
      title: '発送一覧',
      type: 'item',
      url: '/shipping/list',
      icon: icons.UnorderedListOutlined,
      breadcrumbs: false
    }
  ]
};

export default shipping;
