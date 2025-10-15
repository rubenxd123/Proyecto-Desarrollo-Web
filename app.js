// ==== CONFIGURA AQUI TU API ====
const BASE_URL = "https://aduanas-duca-api.onrender.com"; // cámbialo si hace falta

const $ = (q) => document.querySelector(q);
const msg = $("#msg");
const after = $("#afterLogin");
const rolSpan = $("#rol");
const out = $("#out");

function setMsg(text, type = "info") {
  msg.textContent = text;
  msg.className = "msg " + type;
}

function getToken() {
  return localStorage.getItem("jwt");
}
function setToken(t) {
  localStorage.setItem("jwt", t);
}
function clearToken() {
  localStorage.removeItem("jwt");
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = Object.assign(
    { "Content-Type": "application/json" },
    options.headers || {},
    token ? { Authorization: "Bearer " + token } : {}
  );
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

async function login(email, password) {
  const res = await fetch(BASE_URL + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Login failed");
  }
  return res.json();
}

function showAfterLogin(rol) {
  after.classList.remove("hidden");
  rolSpan.textContent = rol;
}

function hideAfterLogin() {
  after.classList.add("hidden");
  rolSpan.textContent = "";
  out.textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay token, muestra acciones
  if (getToken()) {
    showAfterLogin("(desconocido)");
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");
    const email = $("#email").value.trim();
    const password = $("#password").value;
    $("#loginBtn").disabled = true;

    try {
      const { token, rol } = await login(email, password);
      setToken(token);
      setMsg("Inicio de sesión exitoso", "success");
      showAfterLogin(rol || "(sin rol)");
    } catch (err) {
      setMsg("Error: " + err.message, "error");
    } finally {
      $("#loginBtn").disabled = false;
    }
  });

  $("#btnUsuarios").addEventListener("click", async () => {
    setMsg("Consultando usuarios…");
    try {
      const data = await api("/usuarios", { method: "GET" });
      out.textContent = JSON.stringify(data, null, 2);
      setMsg("OK", "success");
    } catch (err) {
      setMsg("Error: " + err.message, "error");
    }
  });

  $("#btnLogout").addEventListener("click", () => {
    clearToken();
    hideAfterLogin();
    setMsg("Sesión cerrada", "info");
  });
});
