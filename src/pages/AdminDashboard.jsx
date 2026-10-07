import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, ReferenceLine } from "recharts";
import { Users, ClipboardCheck, Percent, Trophy, HelpCircle, UserCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../api.js";

const fmt = (d) => (d ? new Date(d).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const tone = (p) => (p >= 60 ? "ok" : p >= 40 ? "" : "weak");

function Stat({ icon: I, label, value, sub, color }) {
  return (
    <div className="card stat">
      <div className="stat-ic" style={{ background: color + "22", color }}><I size={18} /></div>
      <div className="score">{value}</div>
      <div className="muted">{label}</div>
      {sub && <div className="muted" style={{ fontSize: ".78rem" }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const load = () => { setErr(""); api("/api/admin/dashboard").then(setD).catch((e) => setErr(e.message)); };
  useEffect(load, []);

  if (err) return <div className="err">{err}</div>;
  if (!d) return <div className="card muted">Loading dashboard…</div>;
  const t = d.totals;
  const weakest = d.topics.find((x) => x.attempted >= 5 && x.accuracy < 60);
  const strongest = [...d.topics].reverse().find((x) => x.attempted >= 5);
  const best = d.exams.filter((e) => e.attempts > 0).sort((a, b) => b.avgPct - a.avgPct)[0];

  return (
    <>
      <div className="row sp" style={{ marginBottom: 12 }}>
        <div><h2 style={{ margin: 0 }}>Overview</h2><div className="muted">Live results from all submitted tests</div></div>
        <button onClick={load}><RefreshCw size={14} style={{ verticalAlign: "middle" }} /> Refresh</button>
      </div>

      <div className="row stats">
        <Stat icon={Users} label="Registered students" value={t.students} color="#4f46e5" />
        <Stat icon={ClipboardCheck} label="Tests taken" value={t.testsTaken} sub={t.practiceTests + " practice tests extra"} color="#16a34a" />
        <Stat icon={UserCheck} label="Active students" value={t.activeStudents} sub={t.students ? Math.round((t.activeStudents * 100) / t.students) + "% have taken a test" : ""} color="#0891b2" />
        <Stat icon={Percent} label="Average score" value={t.avgPct + "%"} color="#7c3aed" />
        <Stat icon={Trophy} label="Pass rate (≥50%)" value={t.passRate + "%"} color="#d97706" />
        <Stat icon={HelpCircle} label="Question bank" value={t.questions} sub={t.exams + " exams · " + t.topics + " topics"} color="#db2777" />
      </div>

      {t.testsTaken === 0 ? (
        <div className="card"><h2>No tests taken yet</h2>
          <p className="muted">Once students submit an exam, the analysis (scores, weak topics, hardest questions, leaderboard) will appear here.</p></div>
      ) : (
        <>
          <div className="card insight">
            <b>Quick insights</b>
            <ul>
              <li><b>{t.testsTaken}</b> test{t.testsTaken > 1 ? "s" : ""} submitted by <b>{t.activeStudents}</b> student{t.activeStudents > 1 ? "s" : ""}; class average is <b>{t.avgPct}%</b>.</li>
              {weakest && <li><AlertTriangle size={14} style={{ verticalAlign: "middle", color: "var(--red)" }} /> Weakest topic overall: <b>{weakest.topicName}</b> ({weakest.accuracy}% accuracy) — consider adding easier practice questions.</li>}
              {strongest && <li>Strongest topic: <b>{strongest.topicName}</b> ({strongest.accuracy}%).</li>}
              {best && <li>Best-performing exam: <b>{best.title}</b> (avg {best.avgPct}%).</li>}
              {t.students - t.activeStudents > 0 && <li><b>{t.students - t.activeStudents}</b> registered student(s) have not attempted any test yet.</li>}
            </ul>
          </div>

          <div className="grid2">
            <div className="card"><h2>Tests taken (last 14 days)</h2>
              <ResponsiveContainer width="100%" height={210}><LineChart data={d.perDay}><CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip />
                <Line dataKey="count" name="Tests" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
            <div className="card"><h2>Score distribution</h2>
              <ResponsiveContainer width="100%" height={210}><BarChart data={d.distribution}>
                <XAxis dataKey="range" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="count" name="Attempts" radius={[4, 4, 0, 0]} minPointSize={3}>
                  {d.distribution.map((b, i) => <Cell key={b.range} fill={i < 2 ? "#dc2626" : i === 2 ? "#f59e0b" : "#16a34a"} />)}</Bar></BarChart></ResponsiveContainer></div>
          </div>

          <div className="card"><h2>Topic-wise accuracy (all students)</h2>
            {d.topics.length === 0 ? <div className="muted">No answers recorded yet.</div> :
              <ResponsiveContainer width="100%" height={240}><BarChart data={d.topics}>
                <XAxis dataKey="topicName" /><YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(x, n, p) => [x + "% (" + p.payload.correct + "/" + p.payload.attempted + " correct)", "Accuracy"]} />
                <ReferenceLine y={60} stroke="#999" strokeDasharray="4 4" />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} minPointSize={3}>
                  {d.topics.map((s) => <Cell key={s.topicId} fill={s.accuracy < 60 ? "#dc2626" : "#4f46e5"} />)}</Bar></BarChart></ResponsiveContainer>}
          </div>

          <div className="card"><h2>Exam-wise analysis</h2>
            <div className="tbl"><table><thead><tr><th>Exam</th><th>Attempts</th><th>Average</th><th>Highest</th><th>Lowest</th><th>Pass rate</th></tr></thead>
              <tbody>{d.exams.map((e) => <tr key={e.examId}><td>{e.title}</td><td>{e.attempts}</td>
                <td><div className="row" style={{ flexWrap: "nowrap" }}><div className="bar"><div style={{ width: e.avgPct + "%", background: e.avgPct < 40 ? "#dc2626" : e.avgPct < 60 ? "#f59e0b" : "#16a34a" }} /></div>{e.attempts ? e.avgPct + "%" : "—"}</div></td>
                <td>{e.attempts ? e.highestPct + "%" : "—"}</td><td>{e.attempts ? e.lowestPct + "%" : "—"}</td>
                <td>{e.attempts ? <span className={"tag " + tone(e.passRate)}>{e.passRate}%</span> : "—"}</td></tr>)}</tbody></table></div>
          </div>

          <div className="grid2">
            <div className="card"><h2>Hardest questions</h2>
              {d.hardest.length === 0 ? <div className="muted">Nothing yet.</div> : d.hardest.map((q) =>
                <div key={q.questionId} style={{ padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                  <div><span className="tag">{q.topic}</span> {q.text}</div>
                  <div className="muted">{q.wrong} of {q.attempted} answered wrong · <b style={{ color: "var(--red)" }}>{q.wrongRate}%</b></div></div>)}</div>
            <div className="card"><h2>Top students</h2>
              {d.students.filter((s) => s.tests > 0).slice(0, 5).map((s, i) =>
                <div key={s.email} className="row sp" style={{ padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                  <span><b>{i + 1}.</b> {s.name} <span className="muted">· {s.tests} test{s.tests > 1 ? "s" : ""}</span></span>
                  <span className={"tag " + tone(s.avgPct)}>{s.avgPct}%</span></div>)}</div>
          </div>

          <div className="card"><h2>Recent submissions</h2>
            <div className="tbl"><table><thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>%</th><th>Submitted</th></tr></thead>
              <tbody>{d.recent.map((r) => <tr key={r.id}><td>{r.student}</td><td>{r.exam}</td><td>{r.score}/{r.total}</td>
                <td><span className={"tag " + tone(r.pct)}>{r.pct}%</span></td><td className="muted">{fmt(r.submittedAt)}</td></tr>)}</tbody></table></div>
          </div>
        </>
      )}
    </>
  );
}

export function Students() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => { api("/api/admin/dashboard").then((d) => setRows(d.students)); }, []);
  if (!rows) return <div className="card muted">Loading…</div>;
  const list = rows.filter((s) => (s.name + s.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="card"><div className="row sp"><h2>Students ({rows.length})</h2>
      <input style={{ maxWidth: 240 }} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="tbl"><table><thead><tr><th>Name</th><th>Email</th><th>Tests</th><th>Average</th><th>Best</th><th>Last active</th></tr></thead>
        <tbody>{list.map((s) => <tr key={s.email}><td>{s.name}</td><td className="muted">{s.email}</td><td>{s.tests}</td>
          <td>{s.tests ? <span className={"tag " + tone(s.avgPct)}>{s.avgPct}%</span> : "—"}</td>
          <td>{s.tests ? s.bestPct + "%" : "—"}</td><td className="muted">{fmt(s.lastActive)}</td></tr>)}</tbody></table></div>
      {list.length === 0 && <div className="muted" style={{ padding: 10 }}>No students found.</div>}
    </div>
  );
}
