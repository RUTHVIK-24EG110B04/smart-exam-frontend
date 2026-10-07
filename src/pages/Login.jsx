import { useState } from "react";
import { GraduationCap, Target, Brain, TrendingUp } from "lucide-react";
import { api, setProfile } from "../api.js";

export default function Login({ onAuth }) {
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", rollNo: "", department: "", semester: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    try {
      setErr("");
      const a = await api(reg ? "/api/auth/register" : "/api/auth/login", "POST", f);
      if (reg) setProfile(f.email, { rollNo: f.rollNo, department: f.department, semester: f.semester });
      onAuth(a);
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="auth">
      <div className="brand">
        <h1 style={{ fontSize: "2.4rem" }}><GraduationCap size={34} style={{ verticalAlign: "middle" }} /> Smart Exam Prep</h1>
        <p>An adaptive mock-test platform that shows you exactly where you lose marks.</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Target size={16} /> Subject-wise timed mock tests</li>
          <li><Brain size={16} /> Weak topics detected automatically</li>
          <li><TrendingUp size={16} /> Progress charts and instant analysis</li></ul>
      </div>
      <div className="form"><div className="card">
        <h1>{reg ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{reg ? "Register as a student" : "Sign in to continue"}</p>
        {reg && <><input placeholder="Full name" value={f.name} onChange={set("name")} />
          <div className="row"><input style={{ flex: 1 }} placeholder="Roll no" value={f.rollNo} onChange={set("rollNo")} />
            <input style={{ flex: 1 }} placeholder="Semester" value={f.semester} onChange={set("semester")} /></div>
          <input placeholder="Department" value={f.department} onChange={set("department")} /></>}
        <input placeholder="Email" value={f.email} onChange={set("email")} />
        <input type="password" placeholder="Password (min 6)" value={f.password} onChange={set("password")} onKeyDown={(e) => e.key === "Enter" && go()} />
        {err && <div className="err">{err}</div>}
        <button className="p" style={{ width: "100%", padding: 11 }} onClick={go}>{reg ? "Sign up" : "Sign in"}</button>
        <p className="muted" style={{ textAlign: "center" }}>{reg ? "Have an account?" : "New here?"} <a href="#" onClick={(e) => { e.preventDefault(); setReg(!reg); }}>{reg ? "Sign in" : "Create account"}</a></p>
      </div></div>
    </div>
  );
}
