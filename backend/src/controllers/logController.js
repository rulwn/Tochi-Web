import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

const loginController = {};

loginController.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar si es el admin hardcodeado
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jsonwebtoken.sign(
        { id: "Administrador", role: "Administrador" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );

      res.cookie("authToken", token, { httpOnly: true });
      return res.json({ message: "Login successful", token });
    }

    const userFound = await User.findOne({ email });

    if (!userFound) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Password en base de datos:", userFound.password);
    console.log("Password ingresada:", password);

    const isMatch = await bcryptjs.compare(password, userFound.password);
    console.log("Coincide:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

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