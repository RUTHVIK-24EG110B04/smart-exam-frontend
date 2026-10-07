import { useEffect, useState } from "react";
import { api } from "../api.js";
import AdminDashboard, { Students } from "./AdminDashboard.jsx";

export default function Admin() {
  const [tab, setTab] = useState("dashboard");
  const [topics, setTopics] = useState([]);
  const [qs, setQs] = useState([]);
  const [exams, setExams] = useState([]);
  const [err, setErr] = useState("");
  const load = () => {
    api("/api/admin/topics").then(setTopics); api("/api/admin/questions").then(setQs); api("/api/admin/exams").then(setExams);
  };
  useEffect(() => { load(); }, []);
  const run = async (fn) => { try { setErr(""); await fn(); load(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        {[["dashboard", "Dashboard"], ["students", "Students"], ["topics", "Topics"], ["questions", "Questions"], ["exams", "Exams"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {err && <div className="err">{err}</div>}
      {tab === "dashboard" && <AdminDashboard />}
      {tab === "students" && <Students />}
      {tab === "topics" && <Topics topics={topics} run={run} />}
      {tab === "questions" && <Questions topics={topics} qs={qs} run={run} />}
      {tab === "exams" && <Exams qs={qs} exams={exams} run={run} />}
    </>
  );
}

function Topics({ topics, run }) {
  const [name, setName] = useState("");
  return (
    <div className="card"><h2>Topics</h2>
      <div className="row"><input style={{ flex: 1, marginBottom: 0 }} placeholder="New topic" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="p" onClick={() => run(async () => { await api("/api/admin/topics", "POST", { name }); setName(""); })}>Add</button></div>
      {topics.map((t) => <div key={t.id} className="row sp" style={{ padding: "6px 0" }}>{t.name}
        <button onClick={() => run(() => api("/api/admin/topics/" + t.id, "DELETE"))}>Delete</button></div>)}
    </div>
  );
}

const blank = { topicId: "", text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", difficulty: "MEDIUM" };
function Questions({ topics, qs, run }) {
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <div className="card"><h2>Add question</h2>
        <select value={f.topicId} onChange={set("topicId")}><option value="">Select topic</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <textarea placeholder="Question text" value={f.text} onChange={set("text")} />
        {["A", "B", "C", "D"].map((o) => <input key={o} placeholder={"Option " + o} value={f["option" + o]} onChange={set("option" + o)} />)}
        <div className="row">
          <select value={f.correctOption} onChange={set("correctOption")}>{["A", "B", "C", "D"].map((o) => <option key={o}>{o}</option>)}</select>
          <select value={f.difficulty} onChange={set("difficulty")}>{["EASY", "MEDIUM", "HARD"].map((o) => <option key={o}>{o}</option>)}</select>
          <button className="p" onClick={() => run(async () => { await api("/api/admin/questions", "POST", { ...f, topicId: Number(f.topicId) }); setF(blank); })}>Save</button>
        </div>
      </div>
      <div className="card"><h2>All questions ({qs.length})</h2>
        {qs.map((q) => <div key={q.id} className="row sp" style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
          <span><span className="tag">{q.topic?.name}</span> {q.text} <span className="muted">· ans {q.correctOption}</span></span>
          <button onClick={() => run(() => api("/api/admin/questions/" + q.id, "DELETE"))}>Delete</button></div>)}
      </div>
    </>
  );
}

function Exams({ qs, exams, run }) {
  const [title, setTitle] = useState("");
  const [dur, setDur] = useState(30);
  const [sel, setSel] = useState([]);
  const toggle = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  return (
    <>
      <div className="card"><h2>Create exam</h2>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="number" placeholder="Duration (minutes)" value={dur} onChange={(e) => setDur(e.target.value)} />
        <div style={{ maxHeight: 220, overflow: "auto", marginBottom: 10 }}>
          {qs.map((q) => <label key={q.id} style={{ display: "block", padding: 3 }}>
            <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={sel.includes(q.id)} onChange={() => toggle(q.id)} />
            [{q.topic?.name}] {q.text}</label>)}</div>
        <button className="p" onClick={() => run(async () => { await api("/api/admin/exams", "POST", { title, durationMinutes: Number(dur), questionIds: sel }); setTitle(""); setSel([]); })}>
          Create ({sel.length} selected)</button>
      </div>
      <div className="card"><h2>Exams</h2>
        {exams.map((e) => <div key={e.id} className="row sp" style={{ padding: "6px 0" }}>
          <span>{e.title} <span className="muted">· {e.questionCount} Qs · {e.durationMinutes} min</span></span>
          <button onClick={() => run(() => api("/api/admin/exams/" + e.id, "DELETE"))}>Delete</button></div>)}
      </div>
    </>
  );
}
