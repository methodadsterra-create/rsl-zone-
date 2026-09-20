import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/matches', label: 'Matches' },
  { to: '/admin/teams', label: 'Teams' },
  { to: '/admin/players', label: 'Players' },
  { to: '/admin/transfers', label: 'Transfers' },
  { to: '/admin/media', label: 'Media' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/languages', label: 'Languages' },
  { to: '/admin/seo', label: 'SEO' },
  { to: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const { settings } = useSiteSettings();

  // the admin panel is always English and left-to-right
  useEffect(() => {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }, []);
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button
          type="button"
          className="admin-topbar__burger"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-controls="admin-sidebar"
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
        <span className="admin-topbar__brand">{(settings?.site_name || 'SPL Zone')} Admin</span>
        <div className="admin-topbar__user">
          <span>{profile?.email}</span>
          {profile?.role && <span className="badge">{profile.role}</span>}
          <button type="button" className="btn btn-outline" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <aside id="admin-sidebar" className={`admin-sidebar${navOpen ? ' is-open' : ''}`}>
          <nav aria-label="Admin">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => `admin-sidebar__link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
