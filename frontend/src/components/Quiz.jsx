import { useState } from "react";

export default function Quiz({ quiz }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = quiz.filter((q, i) => answers[i] === q.answerIndex).length;

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div>
      {quiz.map((q, i) => (
        <div key={i} className="card">
          <b>{i + 1}. {q.question}</b>
          {q.options.map((option, j) => {
            let cls = "option";
            if (answers[i] === j) cls += " selected";
            if (submitted && j === q.answerIndex) cls += " correct";
            if (submitted && answers[i] === j && j !== q.answerIndex) cls += " wrong";

            return (
              <label key={j} className={cls}>
                <input
                  type="radio"
                  name={`q${i}`}
                  disabled={submitted}
                  checked={answers[i] === j}
                  onChange={() => setAnswers({ ...answers, [i]: j })}
                />
                {option}
              </label>
            );
          })}
          {submitted && q.explanation && (
            <p className="muted">💡 {q.explanation}</p>
          )}
        </div>
      ))}

      {submitted ? (
        <div className="row">
          <h3>Score: {score} / {quiz.length}</h3>
          <button className="btn" onClick={reset}>Retry</button>
        </div>
      ) : (
        <button
          className="btn"
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < quiz.length}
        >
          Submit
        </button>
      )}
    </div>
  );
}
