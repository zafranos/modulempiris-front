import "../common.js";
import * as api from "../api.js";
import * as auth from "../auth.js";
import * as session from "../session.js";
import { enrollmentBadge, h, setBusy, showFormError, toast } from "../ui.js";

if (auth.requireLogin()) {
  const form = document.getElementById("form");
  const errBox = document.getElementById("form-error");
  const btn = document.getElementById("submit");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError(errBox, "");
    const body = { name: form.name.value.trim(), affiliation: form.affiliation.value.trim() };
    if (body.name.length < 2) return showFormError(errBox, "Nama minimal 2 karakter.");
    if (body.affiliation.length < 2) return showFormError(errBox, "Afiliasi atau institusi wajib diisi.");
    setBusy(btn, true, "Menyimpan...");
    try {
      const res = await api.post("/me/profile", body);
      session.setUser(res.user);
      toast("Profil disimpan.");
    } catch (err) {
      showFormError(errBox, err.message);
    }
    setBusy(btn, false);
  });

  const pwForm = document.getElementById("pw-form");
  const pwErr = document.getElementById("pw-error");
  const pwBtn = document.getElementById("pw-submit");
  let punyaSandi = true;
  pwForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError(pwErr, "");
    const current = pwForm.current_password.value, next = pwForm.new_password.value;
    if (punyaSandi && !current) return showFormError(pwErr, "Isi kata sandi saat ini.");
    if (next.length < 8 || next.length > 72) return showFormError(pwErr, "Kata sandi baru harus 8 sampai 72 karakter.");
    if (next !== pwForm.new_password2.value) return showFormError(pwErr, "Kedua kata sandi baru tidak sama.");
    setBusy(pwBtn, true, "Menyimpan...");
    try {
      const res = await api.post("/me/password", punyaSandi ? { current_password: current, new_password: next } : { new_password: next });
      session.setSession(res.token, res.user);
      pwForm.reset();
      setPunyaSandi(true);
      toast("Kata sandi diganti.");
    } catch (err) {
      showFormError(pwErr, err.message);
    }
    setBusy(pwBtn, false);
  });
  function setPunyaSandi(v) {
    punyaSandi = v;
    document.getElementById("pw-current-row").classList.toggle("hidden", !v);
    document.getElementById("pw-intro").classList.toggle("hidden", v);
    pwBtn.textContent = pwBtn.dataset.label = v ? "Ganti kata sandi" : "Pasang kata sandi"; // setBusy memulihkan dari data-label
  }

  // Listener di atas dipasang sebelum await apa pun (lihat catatan di login.js); data dimuat setelahnya.
  try {
    const me = await auth.loadMe();
    document.getElementById("email").textContent = me.user.email;
    form.name.value = me.user.name || "";
    form.affiliation.value = me.user.affiliation || "";
    setPunyaSandi((me.auth_methods || ["password"]).includes("password"));
    document.getElementById("enrollments").replaceChildren(
      ...(me.enrollments.length
        ? me.enrollments.map((e) =>
          h("li", { class: "card flex flex-wrap items-center justify-between gap-3 px-5 py-4" },
            h("span", { class: "font-display text-xl font-medium", text: "Track riset empiris" }), enrollmentBadge(e)))
        : [h("li", { class: "card px-5 py-4 text-[15px] text-muted-foreground-1" },
            h("span", { text: "Akun Anda belum terdaftar. " }),
            h("a", { href: api.withBase("/enroll/"), class: "link", text: "Daftar sekarang" }))]),
    );
  } catch (err) {
    showFormError(errBox, err.message);
  }
}
