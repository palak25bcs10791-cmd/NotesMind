import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>Create account</h2>
      {error && <p className="error">{error}</p>}
      <input
        name="fullName"
        placeholder="Full name"
        value={form.fullName}
        onChange={change}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={change}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password (min 6 characters)"
        value={form.password}
        onChange={change}
        required
      />
      <button className="btn">Register</button>
      <p className="muted">
        Have an account? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
