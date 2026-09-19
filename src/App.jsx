import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import LanguageRedirect from './components/LanguageRedirect';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

import Home from './pages/Home';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Transfers from './pages/Transfers';
import Matches from './pages/Matches';
import Table from './pages/Table';
import Clubs from './pages/Clubs';
import ClubPage from './pages/ClubPage';
import Players from './pages/Players';
import PlayerPage from './pages/PlayerPage';
import Search from './pages/Search';
import About from './pages/About';
import NotFound from './pages/NotFound';

import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminArticles from './pages/admin/Articles';
import ArticleEditor from './pages/admin/ArticleEditor';
import AdminMatches from './pages/admin/Matches';
import AdminTeams from './pages/admin/Teams';
import AdminPlayers from './pages/admin/Players';
import AdminTransfers from './pages/admin/Transfers';
import AdminMedia from './pages/admin/Media';
import AdminCategories from './pages/admin/Categories';
import AdminLanguages from './pages/admin/Languages';
import AdminSeo from './pages/admin/Seo';
import AdminSettings from './pages/admin/Settings';

// A small wrapper so LanguageProvider (which reads :lang via useParams) sits
// inside the matched "/:lang/*" route, wrapping the public layout and all
// its nested pages via <Outlet/>.
function LangRoot() {
  return (
    <LanguageProvider>
      <PublicLayout />
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* First-visit / unprefixed-path detection */}
          <Route path="/" element={<LanguageRedirect />} />

          {/* Public, language-prefixed site */}
          <Route path="/:lang" element={<LangRoot />}>
            <Route index element={<Home />} />
            <Route path="news" element={<News />} />
            <Route path="news/:slug" element={<NewsArticle />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="matches" element={<Matches />} />
            <Route path="matches/upcoming" element={<Matches />} />
            <Route path="matches/results" element={<Matches />} />
            <Route path="table" element={<Table />} />
            <Route path="clubs" element={<Clubs />} />
            <Route path="clubs/:slug" element={<ClubPage />} />
            <Route path="players" element={<Players />} />
            <Route path="players/:slug" element={<PlayerPage />} />
            <Route path="search" element={<Search />} />
            <Route path="about" element={<About />} />
            {/* Unmatched paths inside a language prefix ("/en/foo") get a
                proper 404 here, rather than falling through to the
                top-level "*" and being re-prefixed with another language
                segment. */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/new" element={<ArticleEditor />} />
            <Route path="articles/:id" element={<ArticleEditor />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="players" element={<AdminPlayers />} />
            <Route path="transfers" element={<AdminTransfers />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="languages" element={<AdminLanguages />} />
            <Route path="seo" element={<AdminSeo />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Anything else (including unprefixed public paths) falls back to
              language detection, which preserves the rest of the path. */}
          <Route path="*" element={<LanguageRedirect />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
