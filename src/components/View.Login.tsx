import LogInWithGoogle from "components/LogInWithGoogle";
import "./View.Login.scss";

/** Reusable Login View with continue-with-google button */
export default function LoginView() {
  const pageTitle = "Sign Up/Log in";

  return (
    <section className="view--login centered" data-medium>
      <h4 className="legendary" title={pageTitle}>
        {pageTitle}
      </h4>

      <LogInWithGoogle />

      <div className="hint center">
        Create an account to access cloud features and manage subscriptions.
      </div>
    </section>
  );
}
