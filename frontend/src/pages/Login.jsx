import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

async function onSubmit(e) {
  e.preventDefault();

  console.log('EMAIL =', email);
  console.log('PASSWORD =', password);

  setError('');
  setSubmitting(true);

  try {
    const result = await login(email, password);

    console.log('LOGIN RESULT =', result);
    console.log('TOKEN =', localStorage.getItem('token'));

  } catch (err) {
    console.error('LOGIN ERROR =', err);
    setError(err.message || 'Login failed');
  } finally {
    setSubmitting(false);
  }
}
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Quotify Login</h1>
<p className="text-sm text-slate-500">
  Please enter your credentials to continue
</p>
        <div className="mt-4 space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border p-2" placeholder="Email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-lg border p-2" placeholder="Password" />
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <button disabled={submitting} type="submit" className="mt-4 w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-70">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
