import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

// only send safe fields to the client — never expose the password hash
const safe = (u) => ({ _id: u._id, fullName: u.fullName, email: u.email });

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({
      fullName,
      email,
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({ success: true, message: "Registered successfully", user: safe(user) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = email && (await User.findOne({ email: email.toLowerCase() }));

    // same error message for wrong email or wrong password — avoids user enumeration
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    generateToken(res, user._id);
    res.json({ success: true, message: "Login successful", user: safe(user) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const me = (req, res) => {
  res.json(safe(req.user));
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
};
