import User from "../models/User.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const registerUserController = {};

registerUserController.register = async (req, res) => {
  // Obtenemos los datos del cuerpo de la petición
  const { name, email, password, phone, role, address, imgUrl } = req.body;

  try {
    // Verificamos si el usuario ya existe
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hashear la contraseña
    const passwordHash = await bcryptjs.hash(password, 10);

    // Guardamos el nuevo usuario en la base de datos
    const newUser = new User({
      name,
      email,
      password: passwordHash,
      phone,
      role,
      address,
      imgUrl,
    });

    await newUser.save();

    // Generar token para autenticar al usuario recién registrado
    jsonwebtoken.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (error, token) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: "Error generating token" });
        }

        res.cookie("authToken", token, { httpOnly: true });
        res.json({ message: "User registered successfully", token });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error registering user" });
  }
};

export default registerUserController;