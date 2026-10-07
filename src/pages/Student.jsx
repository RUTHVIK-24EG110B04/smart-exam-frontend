import { useEffect, useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line, CartesianGrid } from "recharts";
import { api, auth } from "../api.js";

const pct = (s, t) => (t ? Math.round((s / t) * 1000) / 10 : 0);
const level = (p) => (p >= 80 ? "Excellent" : p >= 60 ? "Good" : p >= 40 ? "Needs improvement" : "Weak");

export default function Student({ tab }) {
  const [v, setV] = useState({ n: "home" });
  const go = (n, x = {}) => setV({ n, ...x });
  useEffect(() => go(tab === "analytics" ? "analytics" : tab === "tests" ? "subjects" : "home"), [tab]);
  if (v.n === "analytics") return <Analytics go={go} />;
  if (v.n === "subjects") return <Subjects go={go} />;
  if (v.n === "tests") return <Tests s={v.s} go={go} />;
  if (v.n === "exam") return <Exam exam={v.exam} onDone={(r) => go("result", { r })} />;
  if (v.n === "result") return <Result r={v.r} go={go} />;
  return <Home go={go} />;
}

function Back({ go, to = "home", label = "← Dashboard" }) { return <button onClick={() => go(to)}>{label}</button>; }

function Home({ go }) {
  const a = auth.get();
  const email = (() => { try { return JSON.parse(atob(a.token.split(".")[1])).sub; } catch { return ""; } })();
  const [stats, setStats] = useState([]), [hist, setHist] = useState([]), [err, setErr] = useState("");
  useEffect(() => {
    api("/api/student/analytics").then(setStats).catch((e) => setErr(e.message));
    api("/api/student/attempts").then(setHist).catch((e) => setErr(e.message));
  }, []);
  const done = hist.filter((h) => h.submittedAt).sort((x, y) => new Date(x.submittedAt) - new Date(y.submittedAt));
  const trend = done.map((h, i) => ({ name: "#" + (i + 1), score: pct(h.score, h.total) }));
  const avg = trend.length ? Math.round(trend.reduce((s, x) => s + x.score, 0) / trend.length) : 0;
  const best = trend.length ? Math.max(...trend.map((x) => x.score)) : 0;
  const weak = stats.filter((s) => s.weak);
  const practice = async () => {
    try { const ex = (await api("/api/student/exams")).find((x) => x.practice) || (await api("/api/student/practice", "POST")); go("exam", { exam: ex }); }
    catch (e) { setErr(e.message); }
  };
  const open = async (id) => go("result", { r: await api("/api/student/attempts/" + id) });
  return (
    <>
      <div className="row sp" style={{ marginBottom: 16 }}><div><h1>Welcome back, {a.name?.split(" ")[0]}</h1><div className="muted">Your performance overview</div></div>
        <button className="p" onClick={() => go("subjects")}>Start a test →</button></div>
      {err && <div className="err">{err}</div>}
      <div className="row stats">
        {[["Tests taken", done.length], ["Average", avg + "%"], ["Best", best + "%"], ["Weak topics", weak.length]].map(([k, x]) => (
          <div key={k} className="card stat"><div className="score" style={{ fontSize: "2rem" }}>{x}</div><div className="muted">{k}</div></div>))}
      </div>
      <div className="card"><div className="row sp"><h2>Topic performance</h2>
        <button className="r" onClick={practice} disabled={!weak.length}>Practice weak topics</button></div>
        {!stats.length ? <p className="muted">Take a test to see topic accuracy.</p> : (
          <ResponsiveContainer width="100%" height={240}><BarChart data={stats}><XAxis dataKey="topicName" /><YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(x) => x + "%"} /><ReferenceLine y={60} stroke="#999" strokeDasharray="4 4" />
            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} minPointSize={3}>{stats.map((s) => <Cell key={s.topicId} fill={s.weak ? "#c8372d" : "#1d2a44"} />)}</Bar></BarChart></ResponsiveContainer>)}
        <div className="row">{weak.map((s) => <span key={s.topicId} className="tag weak">Weak: {s.topicName} ({s.accuracy}%)</span>)}</div></div>
      {trend.length > 1 && <div className="card"><h2>Progress over time</h2>
        <ResponsiveContainer width="100%" height={200}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" />
          <Tooltip formatter={(x) => x + "%"} /><Line dataKey="score" stroke="#c8372d" strokeWidth={2} /></LineChart></ResponsiveContainer></div>}
      <div className="card"><h2>History</h2>
        {[...done].reverse().map((h) => (
          <div key={h.id} className="row sp" style={{ padding: "6px 0" }}>
            <span>{h.examTitle} <span className="muted">· {new Date(h.submittedAt).toLocaleString()}</span></span>
            <button onClick={() => open(h.id)}>{h.score}/{h.total} · Review</button></div>))}
        {!done.length && <p className="muted">No attempts yet.</p>}</div>
    </>
  );
}

function Subjects({ go }) {
  const [s, setS] = useState(null), [err, setErr] = useState("");
  useEffect(() => { api("/api/student/subjects").then(setS).catch((e) => setErr(e.message)); }, []);
  return (
    <>
      <Back go={go} /><h1 style={{ marginTop: 14 }}>Choose a subject</h1>
      {err && <div className="err">{err}</div>}
      <div className="subj">{(s || []).map((x) => (
        <button key={x.id} className="card subj-c" onClick={() => go("tests", { s: x })}>
          <h2>{x.name}</h2><div className="muted">{x.questionCount} questions · {x.testCount} tests</div></button>))}</div>
    </>
  );
}

function Tests({ s, go }) {
  const [t, setT] = useState([]);
  useEffect(() => { api("/api/student/subjects/" + s.id + "/tests").then(setT); }, []);
  return (
    <>
      <Back go={go} to="subjects" label="← Subjects" /><h1 style={{ marginTop: 14 }}>{s.name} tests</h1>
      {t.map((e) => (
        <div key={e.id} className="card row sp"><span><b>{e.title}</b><span className="muted"> · {e.questionCount} Qs · {e.durationMinutes} min</span></span>
          <button className="p" onClick={() => go("exam", { exam: e })}>Start</button></div>))}
      {!t.length && <p className="muted">No tests for this subject yet.</p>}
    </>
  );
}

function Exam({ exam, onDone }) {
  const [d, setD] = useState(null), [ans, setAns] = useState({}), [flag, setFlag] = useState({});
  const [i, setI] = useState(0), [left, setLeft] = useState(0), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { api("/api/student/exams/" + exam.id + "/start", "POST").then((r) => { setD(r); setLeft(r.durationMinutes * 60); }).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { if (!d) return; const t = setInterval(() => setLeft((s) => s - 1), 1000); return () => clearInterval(t); }, [d]);
  useEffect(() => { if (d && left <= 0 && !busy) submit(); }, [left]);
  const submit = async () => {
    setBusy(true);
    try { onDone(await api("/api/student/attempts/" + d.attemptId + "/submit", "POST", { answers: ans })); } catch (e) { setErr(e.message); setBusy(false); }
  };
  if (err) return <div className="err">{err}</div>;
  if (!d) return <p>Starting test…</p>;
  const q = d.questions[i], m = Math.max(0, Math.floor(left / 60)), s = Math.max(0, left % 60);
  return (
    <>
      <div className="row sp"><h2>{d.examTitle}</h2><span className={"timer" + (left < 60 ? " low" : "")}>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span></div>
      <div className="card"><div className="row sp"><span className="tag">{q.topic}</span>
        <button className={flag[q.id] ? "on" : ""} onClick={() => setFlag({ ...flag, [q.id]: !flag[q.id] })}>⚑ Mark for review</button></div>
        <h3 style={{ marginTop: 10 }}>{i + 1}. {q.text}</h3>
        {["A", "B", "C", "D"].map((o) => <button key={o} className={"opt" + (ans[q.id] === o ? " sel" : "")} onClick={() => setAns({ ...ans, [q.id]: o })}>{o}. {q["option" + o]}</button>)}
        <div className="row sp"><button disabled={!i} onClick={() => setI(i - 1)}>Previous</button>
          {i < d.questions.length - 1 ? <button className="p" onClick={() => setI(i + 1)}>Next</button>
            : <button className="r" disabled={busy} onClick={() => confirm(`Submit? ${Object.keys(ans).length}/${d.questions.length} answered.`) && submit()}>Submit test</button>}</div></div>
      <div className="card"><div className="muted" style={{ marginBottom: 8 }}>{Object.keys(ans).length}/{d.questions.length} answered · ⚑ = marked</div>
        <div className="grid">{d.questions.map((x, n) => <button key={x.id} className={(n === i ? "on " : "") + (ans[x.id] ? "done" : "")} onClick={() => setI(n)}>{flag[x.id] ? "⚑" : n + 1}</button>)}</div></div>
    </>
  );
}

function Result({ r, go }) {
  const [wrongOnly, setWrongOnly] = useState(false);
  const by = {};
  r.review.forEach((x) => { const b = (by[x.topic] ||= { topic: x.topic, correct: 0, total: 0 }); b.total++; if (x.correct) b.correct++; });
  const rows = Object.values(by).map((b) => ({ ...b, accuracy: pct(b.correct, b.total) }));
  const weak = rows.filter((b) => b.accuracy < 60), strong = rows.filter((b) => b.accuracy >= 80);
  const skipped = r.review.filter((x) => !x.selected).length;
  const list = r.review.filter((x) => !wrongOnly || !x.correct);
  return (
    <>
      <Back go={go} />
      <div className="card" style={{ marginTop: 14 }}><h2>{r.examTitle}</h2>
        <div className="row sp"><div><div className="score">{r.score}<span style={{ fontSize: "1.6rem", color: "var(--muted)" }}>/{r.total}</span></div>
          <p className="muted">{r.percentage}% · <b>{level(r.percentage)}</b> · {skipped} skipped</p></div>
          <div className="tip">{weak.length ? <>Focus next on <b>{weak.map((w) => w.topic).join(", ")}</b>. Review the wrong answers below, then take a practice test.</>
            : <>Great work! Every topic is at 60% or above{strong.length ? ` and ${strong.map((s) => s.topic).join(", ")} is a clear strength` : ""}.</>}</div></div></div>
      <div className="card"><h2>Topic analysis</h2>
        <ResponsiveContainer width="100%" height={200}><BarChart data={rows}><XAxis dataKey="topic" /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(x) => x + "%"} />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} minPointSize={3}>{rows.map((b) => <Cell key={b.topic} fill={b.accuracy < 60 ? "#c8372d" : "#2f7d4f"} />)}</Bar></BarChart></ResponsiveContainer>
        <div className="row">{rows.map((b) => <span key={b.topic} className={"tag " + (b.accuracy < 60 ? "weak" : "ok")}>{b.topic}: {b.correct}/{b.total}</span>)}</div></div>
      <div className="row sp" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>Answer review</h2>
        <button className={wrongOnly ? "on" : ""} onClick={() => setWrongOnly(!wrongOnly)}>{wrongOnly ? "Showing wrong only" : "Show wrong only"}</button></div>
      {list.map((x) => (
        <div key={x.questionId} className={"card " + (x.correct ? "good" : "bad")}><span className="tag">{x.topic}</span> <span className={"tag " + (x.correct ? "ok" : "weak")}>{x.correct ? "Correct" : "Wrong"}</span>
          <p><b>{x.text}</b></p><div className="muted">Your answer: {x.selected || "—"} · Correct: {x.correctOption}</div></div>))}
      <div className="row"><button className="p" onClick={() => go("subjects")}>Take another test</button><button onClick={() => window.print()}>Print scorecard</button><button onClick={() => go("home")}>Dashboard</button></div>
    </>
  );
}

function Analytics({ go }) {
  const [st, setSt] = useState([]), [err, setErr] = useState("");
  useEffect(() => { api("/api/student/analytics").then(setSt).catch((e) => setErr(e.message)); }, []);
  const weak = st.filter((x) => x.weak);
  const practice = async () => {
    try { const ex = (await api("/api/student/exams")).find((x) => x.practice) || (await api("/api/student/practice", "POST")); go("exam", { exam: ex }); }
    catch (e) { setErr(e.message); }
  };
  return (
    <>
      <div className="row sp"><h1>Topic mastery</h1><button className="p" disabled={!weak.length} onClick={practice}>Adaptive practice on weak topics</button></div>
      {err && <div className="err">{err}</div>}
      <div className="card"><h2>Radar matrix</h2>
        {st.length < 3 ? <p className="muted">Radar appears once you have 3 or more topics attempted.</p> :
          <ResponsiveContainer width="100%" height={300}><RadarChart data={st}><PolarGrid /><PolarAngleAxis dataKey="topicName" />
            <Radar dataKey="accuracy" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} /><Tooltip formatter={(x) => x + "%"} /></RadarChart></ResponsiveContainer>}</div>
      <div className="card"><h2>Syllabus topic status</h2>
        {st.map((x) => (
          <div key={x.topicId} className="row" style={{ padding: "8px 0" }}><b style={{ width: 120 }}>{x.topicName}</b>
            <div className="bar"><div style={{ width: x.accuracy + "%", background: x.weak ? "#dc2626" : "#16a34a" }} /></div>
            <span className="muted" style={{ width: 90 }}>{x.correct}/{x.attempted} · {x.accuracy}%</span>
            <span className={"tag " + (x.weak ? "weak" : "ok")}>{x.weak ? "Needs work" : "Strong"}</span></div>))}
        {!st.length && <p className="muted">Take a test to unlock analytics.</p>}</div>
    </>
  );
}
