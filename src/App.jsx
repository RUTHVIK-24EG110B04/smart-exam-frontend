import { useState } from "react";
import { LayoutDashboard, FileText, BarChart3, LogOut, User, GraduationCap } from "lucide-react";
import { auth, emailOf, getProfile, setProfile } from "./api.js";
import Login from "./pages/Login.jsx";
import Student from "./pages/Student.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  const [user, setUser] = useState(auth.get());
  const [tab, setTab] = useState("dashboard");
  const [menu, setMenu] = useState(false), [prof, setProf] = useState(false);
  if (!user) return <Login onAuth={(a) => { auth.set(a); setUser(a); }} />;
  const logout = () => { auth.clear(); setUser(null); };
  const tabs = [["dashboard", "Dashboard", LayoutDashboard], ["tests", "Take Test", FileText], ["analytics", "Analytics", BarChart3]];
  return (
    <>
      <div className="nav">
        <span className="logo"><i><GraduationCap size={18} /></i>Smart Exam Prep</span>
        {user.role === "STUDENT" && tabs.map(([k, l, I]) => <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}><I size={16} />{l}</button>)}
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <button className="avatar" onClick={() => setMenu(!menu)}>{user.name?.[0]?.toUpperCase()}</button>
          {menu && <div className="menu"><div className="muted" style={{ padding: 8 }}>{user.name} · {user.role}</div>
            <button onClick={() => { setProf(true); setMenu(false); }}><User size={14} /> My profile</button>
            <button onClick={logout}><LogOut size={14} /> Sign out</button></div>}
        </div>
      </div>
      <div className="wrap">{user.role === "ADMIN" ? <Admin /> : <Student tab={tab} />}</div>
      {prof && <Profile user={user} close={() => setProf(false)} />}
    </>
  );
}

function Profile({ user, close }) {
  const email = emailOf();
  const [p, setP] = useState({ rollNo: "", department: "", semester: "", ...getProfile(email) });
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  return (
    <div className="modal" onClick={close}><div className="card" onClick={(e) => e.stopPropagation()}>
      <div className="row" style={{ marginBottom: 14 }}><div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
        <div><h2 style={{ margin: 0 }}>{user.name}</h2><div className="muted">{email} · {user.role}</div></div></div>
      <label className="muted">Roll number</label><input value={p.rollNo} onChange={set("rollNo")} />
      <label className="muted">Department</label><input value={p.department} onChange={set("department")} />
      <label className="muted">Semester</label><input value={p.semester} onChange={set("semester")} />
      <div className="row sp"><button className="p" onClick={() => { setProfile(email, p); close(); }}>Save profile</button><button onClick={close}>Close</button></div>
    </div></div>
  );
}
