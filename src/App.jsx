import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const questions = [
  { kanji: "拷問", yomi: "ごうもん" },
  { kanji: "吐血", yomi: "とけつ" },
  { kanji: "虐げる", yomi: "しいたげる" },
  { kanji: "小聡明い", yomi: "あざとい" },
  { kanji: "小童", yomi: "こわっぱ" },
  { kanji: "命乞い", yomi: "いのちごい" },
  { kanji: "足掻く", yomi: "あがく" },
  { kanji: "鏖殺", yomi: "おうさつ" },
  { kanji: "拘留", yomi: "こうりゅう" },
  { kanji: "吼える", yomi: "ほえる" },
  { kanji: "嫌悪", yomi: "けんお" },
  { kanji: "屑", yomi: "くず" },
  { kanji: "罵詈雑言", yomi: "ばりぞうごん" },
  { kanji: "喚く", yomi: "わめく" },
  { kanji: "煩い", yomi: "うるさい" },

  { kanji: "小賢しい", yomi: "こざかしい" },
  { kanji: "慟哭", yomi: "どうこく" },
  { kanji: "希う", yomi: "こいねがう" },
  { kanji: "殺める", yomi: "あやめる" },
  { kanji: "潰える", yomi: "ついえる" },
  { kanji: "天誅", yomi: "てんちゅう" },
  { kanji: "讐", yomi: "あだ" },
  { kanji: "計える", yomi: "かぞえる" },
  { kanji: "訃報", yomi: "ふほう" },
  { kanji: "報いる", yomi: "むくいる" },
  { kanji: "抹消", yomi: "まっしょう" },
  { kanji: "虐待", yomi: "ぎゃくたい" },
  { kanji: "害う", yomi: "そこなう" },
  { kanji: "交尾む", yomi: "つるむ" },
  { kanji: "愚鈍", yomi: "ぐどん" },
];

const GAME_TIME = 28.3;
const CLEAR_COUNT = 10;

function getRandomQuestion(usedKanjis = []) {
  const pool = questions.filter((q) => !usedKanjis.includes(q.kanji));
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeHiragana(value) {
  return value.replace(/[^ぁ-んー]/g, "");
}

export default function App() {
  const videoRef = useRef(null);

  const [question, setQuestion] = useState(() => getRandomQuestion());
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
    const firstQuestion = getRandomQuestion();

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

    if (answer === question.yomi) {
      const nextCount = correctCount + 1;

      setCorrectCount(nextCount);
      setAnswer("");

      if (nextCount >= CLEAR_COUNT) {
        setStatus("clear");

        const video = videoRef.current;
        if (video) {
          video.pause();
        }

        return;
      }

      const nextQuestion = getRandomQuestion(usedKanjis);

      if (nextQuestion) {
        setQuestion(nextQuestion);
        setUsedKanjis((prev) => [...prev, nextQuestion.kanji]);
      }
    }
  }, [answer, question, correctCount, isComposing, status, usedKanjis]);

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