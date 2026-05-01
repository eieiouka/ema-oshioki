import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import easyWords from "./data/easyWords";
import normalWords from "./data/normalWords";
import hardWords from "./data/hardWords";

const GAME_TIME = 28.3;
const CLEAR_COUNT = 10;

const wordGroups = {
  easy: easyWords,
  normal: normalWords,
  hard: hardWords,
};

function getRandomQuestion(words, usedKanjis = []) {
  const pool = words.filter((q) => !usedKanjis.includes(q.kanji));
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeHiragana(value) {
  return value.replace(/[^ぁ-んー]/g, "");
}

export default function App() {
  const videoRef = useRef(null);

  const [difficulty, setDifficulty] = useState("normal");

  const [question, setQuestion] = useState(null);
  const [usedKanjis, setUsedKanjis] = useState([]);
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
    const words = wordGroups[difficulty];
    const firstQuestion = getRandomQuestion(words);

    setQuestion(firstQuestion);
    setUsedKanjis([firstQuestion.kanji]);
    setAnswer("");
    setIsComposing(false);
    setCorrectCount(0);
    setTimeLeft(GAME_TIME);
    setStatus("playing");

    setTimeout(() => {
      playVideoFromStart();
    }, 0);
  }

  // ★ 追加：リセット（難易度選択に戻る）
  function resetGame() {
    setStatus("ready");
    setQuestion(null);
    setUsedKanjis([]);
    setAnswer("");
    setCorrectCount(0);
    setTimeLeft(GAME_TIME);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }

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

  useEffect(() => {
    if (isComposing) return;
    if (status !== "playing") return;
    if (!question) return;

    if (answer === question.yomi) {
      const nextCount = correctCount + 1;

      setCorrectCount(nextCount);
      setAnswer("");

      if (nextCount >= CLEAR_COUNT) {
        setStatus("clear");

        const video = videoRef.current;
        if (video) video.pause();

        return;
      }

      const words = wordGroups[difficulty];
      const nextQuestion = getRandomQuestion(words, usedKanjis);

      if (nextQuestion) {
        setQuestion(nextQuestion);
        setUsedKanjis((prev) => [...prev, nextQuestion.kanji]);
      }
    }
  }, [answer, question, correctCount, isComposing, status, usedKanjis, difficulty]);

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
        <div className="quiz-box">
          <p className="message">{message}</p>

          {/* スタート前（難易度選択） */}
          {status === "ready" && (
            <>
              <div className="difficulty-buttons">
                <button
                  className={difficulty === "easy" ? "active" : ""}
                  onClick={() => setDifficulty("easy")}
                >
                  易
                </button>

                <button
                  className={difficulty === "normal" ? "active" : ""}
                  onClick={() => setDifficulty("normal")}
                >
                  普通
                </button>

                <button
                  className={difficulty === "hard" ? "active" : ""}
                  onClick={() => setDifficulty("hard")}
                >
                  難
                </button>
              </div>

              <button className="restart-button" onClick={startGame}>
                スタート
              </button>
            </>
          )}

          {/* プレイ中 */}
          {isPlaying && question && (
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
                onCompositionStart={() => setIsComposing(true)}
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

          {/* 終了 → 難易度選択へ戻る */}
          {isFinished && (
            <button className="restart-button" onClick={resetGame}>
              もう一度
            </button>
          )}
        </div>
      </div>
    </div>
  );
}