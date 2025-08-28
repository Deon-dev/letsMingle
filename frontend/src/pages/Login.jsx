import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try { await login(form.email, form.password); nav('/'); }
    catch (e) { setErr(e?.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full grid place-items-center p-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {err && <div className="text-red-500">{err}</div>}
        <input className="input" placeholder="Email" type="email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input className="input" placeholder="Password" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button className="btn w-full" disabled={loading}>{loading ? '...' : 'Login'}</button>
        <div className="text-sm">No account? <Link className="text-brand-500" to="/register">Create one</Link></div>
      </form>
    </div>
  );
}
