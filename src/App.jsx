import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const questions = [
  { kanji: "桜", yomi: "さくら" },
  { kanji: "羽", yomi: "はね" },
  { kanji: "裁判", yomi: "さいばん" },
  { kanji: "魔女", yomi: "まじょ" },
  { kanji: "処刑", yomi: "しょけい" },
];

const GAME_TIME = 28.3;
const CLEAR_COUNT = 3;

function getRandomQuestion(excludeKanji = "") {
  const pool = questions.filter((q) => q.kanji !== excludeKanji);
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeHiragana(value) {
  return value.replace(/[^ぁ-んー]/g, "");
}

export default function App() {
  const videoRef = useRef(null);

  const [question, setQuestion] = useState(() => getRandomQuestion());
  const [answer, setAnswer] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [status, setStatus] = useState("ready");

  const isFinished = status === "clear" || status === "gameover";
  const isPlaying = status === "playing";

  function playVideoFromStart() {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;

    video.play().catch(() => {
      console.log("動画の自動再生がブロックされました");
    });
  }

  function startGame() {
    setQuestion(getRandomQuestion());
    setAnswer("");
    setIsComposing(false);
    setCorrectCount(0);
    setTimeLeft(GAME_TIME);
    setStatus("playing");

    setTimeout(() => {
      playVideoFromStart();
    }, 0);
  }

  // ▼ タイマー（0.1秒刻み）
  useEffect(() => {
    if (status !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 0.1;

        if (next <= 0) {
          setStatus("gameover");
          return 0;
        }

        return Number(next.toFixed(1));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [status]);

  // ▼ 正解判定
  useEffect(() => {
    if (isComposing) return;
    if (status !== "playing") return;

    if (answer === question.yomi) {
      const nextCount = correctCount + 1;

      setCorrectCount(nextCount);
      setAnswer("");

      if (nextCount >= CLEAR_COUNT) {
        setStatus("clear");

        // ★ クリア時だけ動画停止
        const video = videoRef.current;
        if (video) {
          video.pause();
        }
      } else {
        setQuestion(getRandomQuestion(question.kanji));
      }
    }
  }, [answer, question, correctCount, isComposing, status]);

  const message = useMemo(() => {
    if (status === "ready") return "スタートを押して開始";
    if (status === "clear") return "クリア！";
    if (status === "gameover") return "ゲームオーバー";
    return "正しい読みをひらがなで入力";
  }, [status]);

  return (
    <div className="game">
      <video
        ref={videoRef}
        className="chase-video"
        src="/chase.mp4"
        playsInline
        preload="auto"
      />

      <div className="overlay">
        <div className="top-ui">
          <div>残り時間：{timeLeft.toFixed(1)}</div>
          <div>
            正解：{correctCount} / {CLEAR_COUNT}
          </div>
        </div>

        <div className="quiz-box">
          <p className="message">{message}</p>

          {status === "ready" && (
            <button className="restart-button" onClick={startGame}>
              スタート
            </button>
          )}

          {isPlaying && (
            <>
              <div className="kanji">{question.kanji}</div>

              <input
                className="answer-input"
                value={answer}
                onChange={(e) => {
                  const value = e.target.value;

                  if (isComposing) {
                    setAnswer(value);
                    return;
                  }

                  setAnswer(normalizeHiragana(value));
                }}
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(e) => {
                  setIsComposing(false);
                  setAnswer(normalizeHiragana(e.currentTarget.value));
                }}
                placeholder="ひらがなで入力"
                autoFocus
                inputMode="kana"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </>
          )}

          {isFinished && (
            <button className="restart-button" onClick={startGame}>
              もう一度
            </button>
          )}
        </div>
      </div>
    </div>
  );
}