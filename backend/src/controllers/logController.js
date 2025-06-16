// controllers/loginController.js
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

const loginController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      // Buscar usuario en la base de datos (incluyendo al admin)
      const userFound = await User.findOne({ email });

      if (!userFound) {
        return res.status(404).json({ message: "User not found" });
      }

      // Comparar contraseñas
      const isMatch = await bcryptjs.compare(password, userFound.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Generar token con los datos del usuario REAL
      const token = jsonwebtoken.sign(
        { id: userFound._id, role: userFound.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );

      res.cookie("authToken", token, { httpOnly: true });
      res.json({ 
        message: "Login successful", 
        token,
        user: {
          name: userFound.name,
          email: userFound.email,
          avatar: userFound.imgUrl // Asegúrate de tener este campo en tu modelo
        }
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export default loginController;