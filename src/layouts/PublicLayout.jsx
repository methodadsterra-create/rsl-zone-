import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdTag from '../components/AdTag';

export default function PublicLayout() {
  return (
    <div className="site-shell">
      <AdTag />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
