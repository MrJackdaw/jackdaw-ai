import LoginView from "components/View.Login";
import "./Route.Login.scss";

/** Login Route */
export default function LoginRoute() {
  return <section className="route route--login">{<LoginView />}</section>;
}
