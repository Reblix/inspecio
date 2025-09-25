import './styles.css';
import { registerSW } from './pwa/registerSW';
import { login, logout } from './sp/auth';
import './ui/dashboard';
import './ui/metas';
import './ui/form';

registerSW();

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn')?.addEventListener('click', login as any);
  document.getElementById('logoutBtn')?.addEventListener('click', logout as any);

  const syncActive = () => {
    const hash = (location.hash.replace('#', '') || 'dashboard').toLowerCase();
    document.querySelectorAll('#sidebarNav a[data-route]').forEach((el) => {
      (el as HTMLElement).dataset.active =
        (el as HTMLAnchorElement).dataset.route === hash ? 'true' : 'false';
    });
  };
  window.addEventListener('hashchange', syncActive);
  syncActive();
});
