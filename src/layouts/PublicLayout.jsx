import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdTag from '../components/AdTag';
import PresenceTracker from '../components/PresenceTracker';

export default function PublicLayout() {
  return (
    <div className="site-shell">
      <AdTag />
      <PresenceTracker />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
