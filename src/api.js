const BASE = import.meta.env.VITE_API ?? "";
export const auth = {
  get: () => JSON.parse(sessionStorage.getItem("auth") || "null"),
  set: (a) => sessionStorage.setItem("auth", JSON.stringify(a)),
  clear: () => sessionStorage.removeItem("auth"),
};
export async function api(path, method = "GET", body) {
  const a = auth.get();
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(a ? { Authorization: "Bearer " + a.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && a) { auth.clear(); location.reload(); }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || data?.error || "Request failed (" + res.status + ")");
  return data;
}
export const emailOf = () => { try { return JSON.parse(atob(auth.get().token.split(".")[1])).sub; } catch { return ""; } };
export const getProfile = (e) => JSON.parse(localStorage.getItem("profile:" + e) || "{}");
export const setProfile = (e, p) => localStorage.setItem("profile:" + e, JSON.stringify(p));
