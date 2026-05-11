import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, IndianRupee, CircleDashed, Users, LogOut, LogIn, Sun, Moon, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import ExportData from './ExportData';
import './Sidebar.css';

const Sidebar = () => {
  const { theme, toggleTheme, isAdmin, logout } = useStore();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/funds', label: 'Fund Management', icon: <IndianRupee size={20} /> },
    { path: '/balls', label: 'Ball Inventory', icon: <CircleDashed size={20} /> },
    { path: '/players', label: 'Players', icon: <Users size={20} /> },
    { path: '/matches', label: 'Matches', icon: <Trophy size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">🏏</div>
        <h2>CCA Admin</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isAdmin && <ExportData />}
        <button className="nav-item theme-toggle-btn" onClick={toggleTheme} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {isAdmin ? (
          <button className="nav-item logout-btn" onClick={logout} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        ) : (
          <button className="nav-item login-btn" onClick={() => navigate('/login')} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--primary-color)' }}>
            <LogIn size={20} />
            <span>Admin Login</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
