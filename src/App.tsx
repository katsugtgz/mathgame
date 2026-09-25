import { useCallback, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Cat, Flame, Star, Trophy, Play, Check, X, RotateCcw, Settings } from "lucide-react";
import { SKILLS } from "./engine/content";
import { SEED_BANK } from "./engine/seed";
import { gradeAnswer, mapXp, nextQuestion } from "./engine/engine";
import { applyResult, todayString, updateStreak, emptyProfile } from "./engine/session";
import { createStorage } from "./engine/storage";
import type { Profile, Question } from "./engine/types";
import { StageBadge, TenFrame } from "./components/TenFrame";

const skillsForGrade = (g: 4 | 5 | 6) => SKILLS.filter((s) => s.grade === g);

const storage = createStorage(
  typeof window !== "undefined"
    ? window.localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
);

const SESSION_SIZE = 10;

type Phase = "home" | "question" | "feedback" | "done";
type Feedback = { correct: boolean; expected: string } | null;

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => storage.load() ?? emptyProfile(todayString(Date.now())));
  const [phase, setPhase] = useState<Phase>("home");
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [count, setCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [masteredNow, setMasteredNow] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const askedAt = useRef(0);

  const level = useMemo(() => mapXp(profile.xp), [profile.xp]);

  const persist = useCallback((p: Profile) => {
    setProfile(p);
    storage.save(p);
  }, []);

  const startSession = useCallback(() => {
    const today = todayString(Date.now());
    persist(updateStreak(profile, today));
    setCount(0);
    setCorrectCount(0);
    nextQ(true);
  }, [profile, persist]);

  const nextQ = useCallback(
    (first = false) => {
      const result = nextQuestion(profile, SKILLS, Math.random, first, SEED_BANK);
      setQuestion(result.question);
      setAnswer("");
      setFeedback(null);
      setPhase("question");
      askedAt.current = Date.now();
    },
    [profile],
  );

  const submit = useCallback(
    (value: string) => {
      if (!question || phase !== "question") return;
      const result = gradeAnswer(question, value);
      const elapsed = Date.now() - askedAt.current;
      const updated = applyResult(profile, question, result, elapsed, new Date().toISOString());
      const wasMastered = profile.skills[question.skill]?.mastery ?? 0;
      persist(updated);
      setFeedback(result);
      setPhase("feedback");
      setCount((c) => c + 1);
      if (result.correct) setCorrectCount((c) => c + 1);
      if (result.correct && wasMastered === 0 && updated.skills[question.skill]?.mastery === 1) {
        setMasteredNow(question.skill);
      }
    },
    [question, phase, profile, persist],
  );

  const advance = useCallback(() => {
    if (masteredNow) setMasteredNow(null);
    if (count >= SESSION_SIZE) {
      setPhase("done");
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
      return;
    }
    nextQ();
  }, [count, masteredNow, nextQ]);

  // pilih jawaban pilihan ganda langsung kirim
  const pickChoice = useCallback(
    (c: string) => {
      setAnswer(c);
      submit(c);
    },
    [submit],
  );

  function changeGrade(grade: 4 | 5 | 6) {
    persist({ ...profile, settings: { ...profile.settings, grade } });
  }

  const skills = skillsForGrade(profile.settings.grade);
  const masteredCount = skills.filter((s) => (profile.skills[s.id]?.mastery ?? 0) === 1).length;

  // ---------- render ----------

  if (showSettings) {
    return (
      <main className="app">
        <header className="topbar">
          <h1>Pengaturan</h1>
          <button className="btn-icon" onClick={() => setShowSettings(false)} aria-label="Tutup pengaturan">
            <X size={22} />
          </button>
        </header>
        <section className="card">
          <h2>Kelas</h2>
          <div className="row">
            {([4, 5, 6] as const).map((g) => (
              <button
                key={g}
                className={`chip ${profile.settings.grade === g ? "chip-on" : ""}`}
                onClick={() => changeGrade(g)}
              >
                Kelas {g}
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Progres</h2>
          <p>
            {masteredCount} dari {skills.length} skill dikuasai
          </p>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm("Hapus semua progres? Tidak bisa dikembalikan.")) {
                storage.clear();
                setProfile(emptyProfile(todayString(Date.now())));
                setShowSettings(false);
              }
            }}
          >
            Hapus semua progres
          </button>
        </section>
      </main>
    );
  }

  if (phase === "home") {
    return (
      <main className="app">
        <header className="topbar">
          <h1 className="logo">
            <Cat size={26} aria-hidden /> MathGame
          </h1>
          <button className="btn-icon" onClick={() => setShowSettings(true)} aria-label="Pengaturan">
            <Settings size={22} />
          </button>
        </header>

        <section className="stats">
          <div className="stat" aria-label={`Level ${level.level}, ${level.title}`}>
            <Star size={20} aria-hidden />
            <strong>Lv {level.level}</strong>
            <span>{level.title}</span>
          </div>
          <div className="stat" aria-label={`Streak ${profile.streakDays} hari`}>
            <Flame size={20} aria-hidden />
            <strong>{profile.streakDays}</strong>
            <span>hari beruntun</span>
          </div>
          <div className="stat" aria-label={`${masteredCount} skill dikuasai`}>
            <Trophy size={20} aria-hidden />
            <strong>
              {masteredCount}/{skills.length}
            </strong>
            <span>skill</span>
          </div>
        </section>

        <div className="xpbar" role="progressbar" aria-valuenow={level.into} aria-valuemin={0} aria-valuemax={level.needed} aria-label="Progres XP">
          <div className="xpbar-fill" style={{ width: `${Math.min(100, (level.into / level.needed) * 100)}%` }} />
          <span className="xpbar-text">
            {level.into}/{level.needed} XP
          </span>
        </div>

        <button className="btn btn-primary btn-big" onClick={startSession}>
          <Play size={24} aria-hidden /> Mulai Latihan Hari Ini
        </button>

        <p className="hint-text">15 menit sehari. Kerjakan pelan-pelan, yang penting tepat.</p>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="app center">
        <div className="card done-card">
          <Trophy size={48} aria-hidden className="done-trophy" />
          <h1>Sesi Selesai!</h1>
          <p>
            {correctCount} benar dari {count} soal.
          </p>
          <p className="hint-text">{cheer(correctCount, count)}</p>
          <button className="btn btn-primary" onClick={() => setPhase("home")}>
            <RotateCcw size={20} aria-hidden /> Kembali ke Beranda
          </button>
        </div>
      </main>
    );
  }

  // question / feedback
  return (
    <main className="app">
      <header className="topbar">
        <span className="counter">
          Soal {Math.min(count + 1, SESSION_SIZE)}/{SESSION_SIZE}
        </span>
        <span className="counter">✓ {correctCount}</span>
      </header>

      {question && (
        <section className="card q-card" key={question.id}>
          <div className="q-head">
            <StageBadge stage={question.cpaStage} />
          </div>
          {question.visual && <TenFrame visual={question.visual} />}
          <p className="prompt">{question.prompt}</p>

          {question.choices ? (
            <div className="choices">
              {question.choices.map((c) => (
                <button
                  key={c}
                  className={`btn btn-choice ${phase === "feedback" && c === question.answer ? (feedback?.correct ? "choice-correct" : "choice-reveal") : ""} ${phase === "feedback" && c !== question.answer ? "choice-dim" : ""}`}
                  disabled={phase === "feedback"}
                  onClick={() => pickChoice(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <form
              className="answer-row"
              onSubmit={(e) => {
                e.preventDefault();
                submit(answer);
              }}
            >
              <input
                className="answer-input"
                inputMode="text"
                autoComplete="off"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Jawaban…"
                disabled={phase === "feedback"}
                aria-label="Jawaban"
              />
              <button className="btn btn-primary" type="submit" disabled={phase === "feedback" || answer.trim() === ""}>
                Kirim
              </button>
            </form>
          )}

          {phase === "feedback" && feedback && (
            <div className={`feedback ${feedback.correct ? "fb-correct" : "fb-wrong"}`} role="status">
              {feedback.correct ? (
                <>
                  <Check size={22} aria-hidden /> <strong>Benar!</strong> +XP
                </>
              ) : (
                <>
                  <X size={22} aria-hidden /> <strong>Belum tepat.</strong> Jawaban: {feedback.expected}
                  {question.hint && <span className="fb-hint"> {question.hint}</span>}
                </>
              )}
            </div>
          )}

          {phase === "feedback" && (
            <button className="btn btn-primary btn-big" onClick={advance} autoFocus>
              Lanjut
            </button>
          )}
        </section>
      )}

      {masteredNow && (
        <div className="mastery-overlay" role="alert">
          <div className="mastery-card">
            <Trophy size={44} aria-hidden />
            <h2>Skill Dikuasai!</h2>
            <p>{SKILLS.find((s) => s.id === masteredNow)?.title}</p>
          </div>
        </div>
      )}
    </main>
  );
}

function cheer(correct: number, total: number): string {
  if (correct === total) return "Sempurna! Semua benar.";
  if (correct >= total * 0.7) return "Bagus sekali, terus berlatih!";
  return "Tidak apa-apa, besok coba lagi. Latihan bikin jago.";
}
