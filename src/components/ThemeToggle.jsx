import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
    >
      <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
      <span className="visually-hidden">{isDark ? t('theme.dark') : t('theme.light')}</span>
    </button>
  );
}
