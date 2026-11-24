import { CheckCircle2 } from 'lucide-react';
import Brand from './Brand.jsx';

export default function AuthShell({ children }) {
  return (
    <div className="login">
      <section className="login-intro">
        <Brand />
        <div className="intro-copy">
          <small>YOUR LEARNING, IN ONE PLACE</small>
          <h1>
            Make progress
            <br />
            that <em>matters.</em>
          </h1>
          <p>
            A shared learning space for curious students, inspiring teachers and the people
            building better education.
          </p>
          <ul>
            <li>
              <CheckCircle2 /> Learn at your own pace
            </li>
            <li>
              <CheckCircle2 /> See your progress clearly
            </li>
            <li>
              <CheckCircle2 /> Keep every subject organised
            </li>
          </ul>
        </div>
        <span className="copyright">© 2026 Learn Hunt</span>
      </section>
      <section className="login-panel">
        <div className="login-card">{children}</div>
      </section>
    </div>
  );
}
