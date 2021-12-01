import registerAuth from "@/handlers/auth";
import registerPost from "@/handlers/post";

export default function register() {
  registerAuth();
  registerPost();
}
