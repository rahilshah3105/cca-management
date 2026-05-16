import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, IndianRupee, CircleDashed, Users, LogOut, LogIn, Sun, Moon, Trophy, BookOpen, Image } from 'lucide-react';
import { useStore, showConfirm } from '../store/useStore';
import ExportData from './ExportData';
import './Sidebar.css';

const Sidebar = () => {
  const { theme, toggleTheme, isAdmin, logout, adminName } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout?');
    if (!confirmed) return;
    logout();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/funds', label: 'Fund Management', icon: <IndianRupee size={20} /> },
    { path: '/balls', label: 'Ball Inventory', icon: <CircleDashed size={20} /> },
    { path: '/players', label: 'Players', icon: <Users size={20} /> },
    { path: '/rules', label: 'Rules', icon: <BookOpen size={20} /> },
    { path: '/matches', label: 'Matches', icon: <Trophy size={20} /> },
    { path: '/gallery', label: 'Gallery', icon: <Image size={20} /> },
  ];

  const isFundManagementActive =
    location.pathname === '/funds' ||
    location.pathname === '/stumps-contribution' ||
    location.pathname === '/balls-contribution' ||
    location.pathname === '/bats-contribution';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">🏏</div>
        <div>
          <h2>{isAdmin ? 'CCA Admin' : 'CCA'}</h2>
          {isAdmin && adminName && (
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Logged in as {adminName}
            </p>
          )}
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => {
              if (item.path === '/funds') {
                return isFundManagementActive ? 'nav-item active' : 'nav-item';
              }

              return isActive ? 'nav-item active' : 'nav-item';
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isAdmin && <ExportData />}
        <button className="nav-item theme-toggle-btn" onClick={toggleTheme} style={{ width: '100%', background: 'transparent', color: 'var(--text-color)', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {isAdmin ? (
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ width: '100%', background: 'transparent', color: 'var(--text-color)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        ) : (
          <button className="nav-item login-btn" onClick={() => navigate('/login')} style={{ width: '100%', background: 'transparent', color: 'var(--primary-color)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogIn size={20} />
            <span>Admin Login</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
