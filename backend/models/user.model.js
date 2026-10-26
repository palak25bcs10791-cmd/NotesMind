import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    // stored lowercase so login is case-insensitive
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash only, never plain text
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
