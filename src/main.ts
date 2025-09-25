// src/main.ts
import './styles.css';
import { registerSW } from './pwa/registerSW';
import { login, logout } from './sp/auth';
import './ui/dashboard';
import './ui/metas';
import './ui/form';

registerSW();

window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', login);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // marca link ativo (exemplo simples)
  const hash = location.hash || '#dashboard';
  document.querySelectorAll('aside nav a').forEach(a => {
    (a as HTMLElement).dataset.active = (a as HTMLAnchorElement).getAttribute('href') === hash ? 'true' : 'false';
  });
});
