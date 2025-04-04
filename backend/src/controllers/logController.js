import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

const loginController = {};

loginController.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      userFound = { _id: "Admin", role: "admin" };
    } else {
      const isMatch = await bcryptjs.compare(password, userFound.password);
console.log("Password ingresada:", password);
console.log("Password almacenada:", userFound.password);
console.log("Coincide:", isMatch);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    // Generar token
    const token = jsonwebtoken.sign(
      { id: userFound._id, role: userFound.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.cookie("authToken", token, { httpOnly: true });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default loginController;
