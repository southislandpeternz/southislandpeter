'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { DEMO_OPERATOR, isDemoSignedIn, signInDemo } from '../../lib/demo-session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(DEMO_OPERATOR.email);
  const [password, setPassword] = useState<string>('demo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoSignedIn()) {
      router.replace('/dashboard');
    }
  }, [router]);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (email.trim().length === 0 || password.trim().length === 0) {
      setError('Enter the demo email and password.');
      return;
    }
    signInDemo();
    router.push('/dashboard');
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand-mark">SP</div>
        <h1>SP2036 Admin</h1>
        <p className="muted">South Island shuttle operations · UI prototype</p>
        <div className="hint">
          Demo login only. This is not DP01 authentication. Any non-empty password signs in locally.
          <br />
          Email: {DEMO_OPERATOR.email}
          <br />
          Password: demo
        </div>
        <label className="field">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="muted">{error}</p> : null}
        <button className="btn" type="submit" style={{ width: '100%', height: 42 }}>
          Sign in to dashboard
        </button>
      </form>
    </div>
  );
}
