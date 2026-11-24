import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setErrors([]);
    setBusy(true);
    try {
      const user = await signup({ name: name.trim(), email: email.trim(), password });
      navigate(`/${user.role}/overview`, { replace: true });
    } catch (failure) {
      setError(failure.message || 'Could not create your account.');
      setErrors(failure.errors || []);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <small>GET STARTED</small>
      <h2>Create your account</h2>
      <p>One account for the subjects you study and the progress you track.</p>
      <form onSubmit={submit} noValidate>
        <label>
          Full name
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={event => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
          <span className="hint">At least 8 characters with uppercase, lowercase and a number.</span>
        </label>
        {error && (
          <div className="error" role="alert">
            {error}
            {errors.length > 0 && (
              <ul className="field-error">
                {errors.map(detail => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button className="btn primary full" disabled={busy}>
          {busy ? 'Creating account…' : (
            <>
              Create account <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <div className="demo-note">
        <b>Already registered?</b>
        <span>
          <Link to="/login">Sign in</Link> to pick up where you left off.
        </span>
      </div>
      <small className="fine-print">
        New accounts start as students. Teacher and developer roles are assigned on the server.
      </small>
    </AuthShell>
  );
}
