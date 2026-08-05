'use client';

import { useRef, useState, useTransition, type KeyboardEvent } from 'react';
import { login } from './actions';

type Role = 'azienda' | 'consulente' | 'interno';

const ROLE_ORDER: Role[] = ['azienda', 'consulente', 'interno'];

const ROLE_SUBS: Record<Role, string> = {
  azienda: 'Entra con la Partita IVA della tua azienda',
  consulente: 'Entra con il tuo Codice Fiscale personale',
  interno: 'Team Time Vision — accesso con account Google',
};

const GENERIC_TOAST = 'Funzione non disponibile — accesso riservato al team interno';

let toastSeq = 0;

export default function LoginForm() {
  const [role, setRole] = useState<Role>('azienda');

  const [piva, setPiva] = useState('');
  const [passAz, setPassAz] = useState('');
  const [showPassAz, setShowPassAz] = useState(false);

  const [cf, setCf] = useState('');
  const [passCo, setPassCo] = useState('');
  const [showPassCo, setShowPassCo] = useState(false);

  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [, startTransition] = useTransition();

  const tabAziendaRef = useRef<HTMLButtonElement>(null);
  const tabConsulenteRef = useRef<HTMLButtonElement>(null);
  const tabInternoRef = useRef<HTMLButtonElement>(null);
  const tabRefsByRole: Record<Role, typeof tabAziendaRef> = {
    azienda: tabAziendaRef,
    consulente: tabConsulenteRef,
    interno: tabInternoRef,
  };

  function pushToast(msg: string) {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2600);
  }

  function switchRole(next: Role) {
    setRole(next);
  }

  function handleTabKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = ROLE_ORDER.indexOf(role);
    let j: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % ROLE_ORDER.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + ROLE_ORDER.length) % ROLE_ORDER.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = ROLE_ORDER.length - 1;
    if (j === null) return;
    e.preventDefault();
    const next = ROLE_ORDER[j];
    setRole(next);
    tabRefsByRole[next].current?.focus();
  }

  function submitRole(activeRole: Role) {
    const identifier = activeRole === 'azienda' ? piva : activeRole === 'consulente' ? cf : '';
    const password = activeRole === 'azienda' ? passAz : activeRole === 'consulente' ? passCo : '';
    const fd = new FormData();
    fd.set('email', identifier);
    fd.set('password', password);
    startTransition(async () => {
      const res = await login(fd);
      if (res?.error) pushToast(res.error);
    });
  }

  return (
    <div className="login" id="login">
      <button className="signin-pill" onClick={() => submitRole(role)}>Accedi</button>
      <div className="mock-float mock-badge"><span className="dot"></span> Mockup · dati fittizi</div>

      <div className="login-card">
        <div className="login-left">
          <div className="l-copy">
            <div className="l-brand"><span className="wd">FAD MANAGER</span></div>
            <p className="hello">Bentornato!</p>
            <h2>È un piacere rivederti!</h2>
          </div>
          <div className="l-bottom">
            <div className="feat-list">
              <div className="feat">
                <div className="f-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6M9 17h4"/></svg>
                </div>
                <div><div className="f-t">Documenti</div><div className="f-s">Raccolta e notifiche automatiche</div></div>
              </div>
              <div className="feat">
                <div className="f-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <div><div className="f-t">Sicurezza</div><div className="f-s">Protezione di livello enterprise</div></div>
              </div>
              <div className="feat">
                <div className="f-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>
                </div>
                <div><div className="f-t">Velocità</div><div className="f-s">Dal corso al documento in 30 secondi</div></div>
              </div>
            </div>

            <div className="l-foot">
              <img src="/assets/timevision-logo.svg" alt="Time Vision" width={663} height={107} />
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form">
            <div className="lock-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/></svg>
            </div>
            <h1>Accedi al tuo account</h1>
            <p className="sub" id="roleSub">{ROLE_SUBS[role]}</p>

            <div className="role-tabs" role="tablist" aria-label="Tipo di accesso" onKeyDown={handleTabKeyDown}>
              <button
                ref={tabAziendaRef}
                className={`rtab${role === 'azienda' ? ' active' : ''}`}
                id="tab-azienda"
                role="tab"
                aria-selected={role === 'azienda'}
                tabIndex={role === 'azienda' ? 0 : -1}
                aria-controls="pane-azienda"
                onClick={() => switchRole('azienda')}
              >
                Azienda
              </button>
              <button
                ref={tabConsulenteRef}
                className={`rtab${role === 'consulente' ? ' active' : ''}`}
                id="tab-consulente"
                role="tab"
                aria-selected={role === 'consulente'}
                tabIndex={role === 'consulente' ? 0 : -1}
                aria-controls="pane-consulente"
                onClick={() => switchRole('consulente')}
              >
                Consulente
              </button>
              <button
                ref={tabInternoRef}
                className={`rtab${role === 'interno' ? ' active' : ''}`}
                id="tab-interno"
                role="tab"
                aria-selected={role === 'interno'}
                tabIndex={role === 'interno' ? 0 : -1}
                aria-controls="pane-interno"
                onClick={() => switchRole('interno')}
              >
                Interno
              </button>
            </div>

            <div className="rpane" id="pane-azienda" role="tabpanel" aria-labelledby="tab-azienda" hidden={role !== 'azienda'}>
              <label htmlFor="l-piva">Partita IVA</label>
              <div className="inp-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M6 21V7l6-4 6 4v14M10 21v-6h4v6M9 10h.01M9 13h.01M15 10h.01M15 13h.01"/></svg>
                <input
                  className="inp"
                  id="l-piva"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="Es. 02894410727"
                  autoComplete="off"
                  value={piva}
                  onChange={(e) => setPiva(e.target.value)}
                />
              </div>
              <label htmlFor="l-pass-az">Password</label>
              <div className="inp-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                <input
                  className="inp"
                  id="l-pass-az"
                  type={showPassAz ? 'text' : 'password'}
                  placeholder="Inserisci la tua password"
                  autoComplete="current-password"
                  value={passAz}
                  onChange={(e) => setPassAz(e.target.value)}
                />
                <button
                  className="trail"
                  type="button"
                  title={showPassAz ? 'Nascondi password' : 'Mostra password'}
                  onClick={() => setShowPassAz((v) => !v)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div className="aux">
                <label><input type="checkbox" /> Ricordami</label>
                <a href="#">Password dimenticata?</a>
              </div>
              <button className="continue-btn" onClick={() => submitRole('azienda')}>Accedi come Azienda</button>
            </div>

            <div className="rpane" id="pane-consulente" role="tabpanel" aria-labelledby="tab-consulente" hidden={role !== 'consulente'}>
              <label htmlFor="l-cf">Codice Fiscale</label>
              <div className="inp-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></svg>
                <input
                  className="inp cf"
                  id="l-cf"
                  maxLength={16}
                  placeholder="Es. RSSMRC80A01F839X"
                  autoComplete="off"
                  value={cf}
                  onChange={(e) => setCf(e.target.value)}
                />
              </div>
              <label htmlFor="l-pass-co">Password</label>
              <div className="inp-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                <input
                  className="inp"
                  id="l-pass-co"
                  type={showPassCo ? 'text' : 'password'}
                  placeholder="Inserisci la tua password"
                  autoComplete="current-password"
                  value={passCo}
                  onChange={(e) => setPassCo(e.target.value)}
                />
                <button
                  className="trail"
                  type="button"
                  title={showPassCo ? 'Nascondi password' : 'Mostra password'}
                  onClick={() => setShowPassCo((v) => !v)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div className="aux">
                <label><input type="checkbox" /> Ricordami</label>
                <a href="#">Password dimenticata?</a>
              </div>
              <button className="continue-btn" onClick={() => submitRole('consulente')}>Accedi come Consulente</button>
            </div>

            <div className="rpane" id="pane-interno" role="tabpanel" aria-labelledby="tab-interno" hidden={role !== 'interno'}>
              <p className="int-note">Accesso riservato al team Time Vision<br />con account Google aziendale.</p>
              <button className="google-btn" onClick={() => pushToast(GENERIC_TOAST)}>
                <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                Continua con Google
              </button>
            </div>

            <div className="login-help">Serve aiuto? <a href="#" onClick={(e) => { e.preventDefault(); pushToast(GENERIC_TOAST); }}>Contatta l&apos;amministratore</a></div>
          </div>
        </div>
        <div className="deco3d" aria-hidden="true">
          <span className="ball ball-1"></span>
          <span className="ball ball-2"></span>
          <span className="ball ball-3"></span>
          <span className="ball ball-4"></span>
          <span className="ball ball-5"></span>
          <span className="ball ball-6"></span>
        </div>
      </div>

      <div className="toast-wrap" id="toasts">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <div className="ti">✓</div>
            <div>{t.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
