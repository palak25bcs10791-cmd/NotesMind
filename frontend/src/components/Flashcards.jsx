import { useState } from "react";

export default function Flashcards({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const go = (dir) => {
    setFlipped(false);
    setIndex((index + dir + cards.length) % cards.length);
  };

  const card = cards[index];

  return (
    <div className="center">
      <div
        className={`flash ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(!flipped)}
      >
        {flipped ? card.back : card.front}
        <small className="muted hint">
          {flipped ? "answer" : "click to flip"}
        </small>
      </div>
      <div className="row">
        <button className="btn small ghost" onClick={() => go(-1)}>← Prev</button>
        <span className="muted">{index + 1} / {cards.length}</span>
        <button className="btn small ghost" onClick={() => go(1)}>Next →</button>
      </div>
    </div>
  );
}
