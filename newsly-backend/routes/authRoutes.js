const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mode: user.mode,
  interests: user.interests,
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (
      typeof confirmPassword !== "undefined" &&
      password !== confirmPassword
    ) {
      return res.status(400).json({
        message: "Password and confirm password do not match",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({
      message: "Server error during signup",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Server error during login",
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("/auth/me error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch user profile",
    });
  }
});

router.put("/mode", authMiddleware, async (req, res) => {
  try {
    const { mode } = req.body;

    if (!["general", "student", "local"].includes(mode)) {
      return res.status(400).json({
        message: "Invalid mode selected",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { mode },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Mode updated successfully",
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Mode update error:", error.message);
    return res.status(500).json({
      message: "Failed to update mode",
    });
  }
});

router.put("/interests", authMiddleware, async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        message: "Interests must be an array",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { interests },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Interests updated successfully",
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Interests update error:", error.message);
    return res.status(500).json({
      message: "Failed to update interests",
    });
  }
});

router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Please fill all password fields",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({
      message: "Failed to change password",
    });
  }
});

module.exports = router;