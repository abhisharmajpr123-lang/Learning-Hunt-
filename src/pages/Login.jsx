import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      const from = location.state?.from;
      const destination = from && from.startsWith(`/${user.role}`) ? from : `/${user.role}/overview`;
      navigate(destination, { replace: true });
    } catch (failure) {
      setError(failure.message || 'Sign in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <small>WELCOME BACK</small>
      <h2>Sign in to Learn Hunt</h2>
      <p>Use the email and password for your account.</p>
      <form onSubmit={submit} noValidate>
        <label>
          Email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={event => {
              setEmail(event.target.value);
              setMessage('');
            }}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
        </label>
        {message && <div className="notice">{message}</div>}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn primary full" disabled={busy}>
          {busy ? 'Signing in…' : (
            <>
              Sign in <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <div className="demo-note">
        <b>New to Learn Hunt?</b>
        <span>
          <Link to="/signup">Create an account</Link> and start in the student portal.
        </span>
      </div>
      <small className="fine-print">
        Your password is checked by the API and your session is a server-signed token.
      </small>
    </AuthShell>
  );
}
