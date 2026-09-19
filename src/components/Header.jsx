import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { t } = useLanguage();
  const langPath = useLangPath();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { key: 'home', to: langPath('') },
    { key: 'news', to: langPath('news') },
    { key: 'transfers', to: langPath('transfers') },
    { key: 'matches', to: langPath('matches') },
    { key: 'table', to: langPath('table') },
    { key: 'clubs', to: langPath('clubs') },
    { key: 'players', to: langPath('players') },
  ];

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link to={langPath('')} className="site-header__brand" onClick={() => setMenuOpen(false)}>
          <span className="site-header__brand-mark">SPL</span>
          <span className="site-header__brand-name">{t('brand.name')}</span>
        </Link>

        <nav className="site-header__nav site-header__nav--desktop" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.key === 'home'}
              className={({ isActive }) => `site-header__link${isActive ? ' is-active' : ''}`}
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__tools">
          <Link to={langPath('search')} className="site-header__search-btn" aria-label={t('common.search')}>
            🔍
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="site-header__burger"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" className="site-header__nav--mobile" aria-label="Primary mobile">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.key === 'home'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `site-header__link${isActive ? ' is-active' : ''}`}
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
