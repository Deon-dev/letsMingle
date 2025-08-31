import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    console.log(form);
    e.preventDefault();
    setErr(''); setLoading(true);
    try { await register(form.name, form.email, form.password); nav('/'); }
    catch (e) { setErr(e?.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full grid place-items-center p-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Create account</h1>
        {err && <div className="text-red-500">{err}</div>}
        <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
        <input className="input" placeholder="Email" type="email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input className="input" placeholder="Password" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button className="btn w-full" disabled={loading}>{loading ? '...' : 'Register'}</button>
        <div className="text-sm">Have an account? <Link className="text-brand-500" to="/login">Sign in</Link></div>
      </form>
    </div>
  );
}
