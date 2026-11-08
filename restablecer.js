import { verifyPasswordResetCode, confirmPasswordReset }
  from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { getParams, applyI18n, showStep, t } from "./auth-common.js";

applyI18n();

const { code } = getParams();
const $ = id => document.getElementById(id);

if (!code) {
  showStep("s-bad");
} else {
  showStep("s-start");
}

// Paso 1: el botón valida el código y muestra la cuenta
$("btn-start").addEventListener("click", async () => {
  const btn = $("btn-start");
  btn.disabled = true;
  try {
    const email = await verifyPasswordResetCode(auth, code);
    $("acc-email").textContent = email;
    showStep("s-form");
    $("pw").focus();
  } catch {
    showStep("s-bad");
  }
});

// Mostrar / ocultar contraseña
document.querySelectorAll("[data-eye]").forEach(b => {
  b.addEventListener("click", () => {
    const input = $(b.dataset.eye);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    b.firstElementChild.className = show ? "fas fa-eye-slash" : "fas fa-eye";
  });
});

// Paso 2: guardar
async function save() {
  const pw = $("pw").value, pw2 = $("pw2").value, err = $("form-error");
  err.textContent = "";
  if (pw.length < 6) { err.textContent = t("r.short"); return; }
  if (pw !== pw2)    { err.textContent = t("r.match"); return; }

  const btn = $("btn-save");
  btn.disabled = true;
  try {
    await confirmPasswordReset(auth, code, pw);
    showStep("s-ok");
  } catch (e) {
    btn.disabled = false;
    if (e.code === "auth/weak-password") err.textContent = t("r.short");
    else if (e.code === "auth/expired-action-code" || e.code === "auth/invalid-action-code") showStep("s-bad");
    else err.textContent = t("r.generic");
  }
}
$("btn-save").addEventListener("click", save);
["pw", "pw2"].forEach(id => $(id).addEventListener("keydown", e => { if (e.key === "Enter") save(); }));