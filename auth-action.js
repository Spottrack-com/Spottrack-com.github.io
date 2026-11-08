import { applyActionCode } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { getParams, applyI18n, showStep } from "./auth-common.js";

applyI18n();

const { mode, code } = getParams();

if (mode === "resetPassword") {
  // Respaldo: si la plantilla de contraseña apunta acá, se manda a su página
  location.replace("restablecer.html" + location.search);
} else if (mode === "verifyEmail" && code) {
  applyActionCode(auth, code)
    .then(() => showStep("s-ok"))
    .catch(() => showStep("s-err"));
} else {
  showStep("s-err");
}