import LogInWithGoogle from "components/LogInWithGoogle";
import "./View.Login.scss";

/** Reusable Login View with continue-with-google button */
export default function LoginView() {
  const pageTitle = "Please Log in";
  return (
    <section className="view--login centered" data-medium>
      <h4 className="legendary" title={pageTitle}>
        {pageTitle}
      </h4>

      <LogInWithGoogle />

      <div className="hint">
        Create an account to access cloud features. You can use the platform
        without this, although it may become unresponsive with very large files.
      </div>
    </section>
  );
}
