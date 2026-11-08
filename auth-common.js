const D = {
  es: {
    "back": "Volver a Spottrack",
    "v.loading.t": "Verificando tu correo…", "v.loading.p": "Un momento, estamos confirmando tu dirección.",
    "v.ok.t": "¡Correo verificado!", "v.ok.p": "Tu cuenta ya está lista. Volvé a Spottrack e iniciá sesión.",
    "v.err.t": "Enlace vencido o inválido", "v.err.p": "El enlace ya fue usado o venció. Pedí uno nuevo desde la app.",
    "r.start.t": "Restablecer contraseña", "r.start.p": "Tocá el botón para confirmar el enlace y elegir una nueva contraseña.",
    "r.start.cta": "Continuar",
    "r.new.t": "Creá tu nueva contraseña", "r.new.p": "Elegí una contraseña segura que no uses en otros sitios.",
    "r.pw": "Nueva contraseña", "r.pw2": "Repetir contraseña", "r.save": "Guardar contraseña",
    "r.short": "Debe tener al menos 6 caracteres.", "r.match": "Las contraseñas no coinciden.",
    "r.generic": "No se pudo guardar. Intentá de nuevo.",
    "r.ok.t": "¡Contraseña actualizada!", "r.ok.p": "Ya podés iniciar sesión en Spottrack con tu nueva contraseña.",
    "r.bad.t": "Enlace vencido o inválido", "r.bad.p": "Este enlace ya fue usado o venció. Pedí uno nuevo desde la app."
  },
  en: {
    "back": "Back to Spottrack",
    "v.loading.t": "Verifying your email…", "v.loading.p": "One moment, we're confirming your address.",
    "v.ok.t": "Email verified!", "v.ok.p": "Your account is ready. Go back to Spottrack and sign in.",
    "v.err.t": "Link expired or invalid", "v.err.p": "This link was already used or has expired. Request a new one from the app.",
    "r.start.t": "Reset password", "r.start.p": "Tap the button to confirm the link and choose a new password.",
    "r.start.cta": "Continue",
    "r.new.t": "Create your new password", "r.new.p": "Pick a strong password you don't use elsewhere.",
    "r.pw": "New password", "r.pw2": "Repeat password", "r.save": "Save password",
    "r.short": "Must be at least 6 characters.", "r.match": "Passwords don't match.",
    "r.generic": "Couldn't save. Please try again.",
    "r.ok.t": "Password updated!", "r.ok.p": "You can now sign in to Spottrack with your new password.",
    "r.bad.t": "Link expired or invalid", "r.bad.p": "This link was already used or has expired. Request a new one from the app."
  },
  pt: {
    "back": "Voltar ao Spottrack",
    "v.loading.t": "Verificando seu e-mail…", "v.loading.p": "Um momento, estamos confirmando seu endereço.",
    "v.ok.t": "E-mail verificado!", "v.ok.p": "Sua conta está pronta. Volte ao Spottrack e faça login.",
    "v.err.t": "Link expirado ou inválido", "v.err.p": "Este link já foi usado ou expirou. Peça um novo pelo app.",
    "r.start.t": "Redefinir senha", "r.start.p": "Toque no botão para confirmar o link e escolher uma nova senha.",
    "r.start.cta": "Continuar",
    "r.new.t": "Crie sua nova senha", "r.new.p": "Escolha uma senha segura que você não use em outros sites.",
    "r.pw": "Nova senha", "r.pw2": "Repetir senha", "r.save": "Salvar senha",
    "r.short": "Deve ter pelo menos 6 caracteres.", "r.match": "As senhas não coincidem.",
    "r.generic": "Não foi possível salvar. Tente novamente.",
    "r.ok.t": "Senha atualizada!", "r.ok.p": "Agora você pode entrar no Spottrack com sua nova senha.",
    "r.bad.t": "Link expirado ou inválido", "r.bad.p": "Este link já foi usado ou expirou. Peça um novo pelo app."
  },
  fr: {
    "back": "Retour à Spottrack",
    "v.loading.t": "Vérification de votre e-mail…", "v.loading.p": "Un instant, nous confirmons votre adresse.",
    "v.ok.t": "E-mail vérifié !", "v.ok.p": "Votre compte est prêt. Retournez sur Spottrack et connectez-vous.",
    "v.err.t": "Lien expiré ou invalide", "v.err.p": "Ce lien a déjà été utilisé ou a expiré. Demandez-en un nouveau depuis l'appli.",
    "r.start.t": "Réinitialiser le mot de passe", "r.start.p": "Appuyez sur le bouton pour confirmer le lien et choisir un nouveau mot de passe.",
    "r.start.cta": "Continuer",
    "r.new.t": "Créez votre nouveau mot de passe", "r.new.p": "Choisissez un mot de passe sécurisé que vous n'utilisez pas ailleurs.",
    "r.pw": "Nouveau mot de passe", "r.pw2": "Répéter le mot de passe", "r.save": "Enregistrer",
    "r.short": "Au moins 6 caractères.", "r.match": "Les mots de passe ne correspondent pas.",
    "r.generic": "Échec de l'enregistrement. Réessayez.",
    "r.ok.t": "Mot de passe mis à jour !", "r.ok.p": "Vous pouvez maintenant vous connecter à Spottrack avec votre nouveau mot de passe.",
    "r.bad.t": "Lien expiré ou invalide", "r.bad.p": "Ce lien a déjà été utilisé ou a expiré. Demandez-en un nouveau depuis l'appli."
  }
};

export function getParams() {
  const q = new URLSearchParams(location.search);
  return { mode: q.get("mode"), code: q.get("oobCode"), lang: q.get("lang") };
}

const pick = () => {
  const fromUrl = (getParams().lang || "").slice(0, 2).toLowerCase();
  const saved = localStorage.getItem("spottrackLang");
  const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
  return [fromUrl, saved, nav].find(l => D[l]) || "es";
};
const LANG = pick();

export const t = k => D[LANG][k] ?? D.es[k] ?? k;

export function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}

export function showStep(id) {
  document.querySelectorAll(".step").forEach(s => { s.hidden = s.id !== id; });
}