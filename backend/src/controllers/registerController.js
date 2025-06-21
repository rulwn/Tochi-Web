import User from "../models/User.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import config from '../config.js';

dotenv.config();

cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret
});

const registerUserController = {};

registerUserController.register = async (req, res) => {
  const { name, email, password, phone, role, address } = req.body;

  console.log("Datos recibidos:", req.body);

  try {
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    let imgUrl = null; // Por defecto null
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'tochi/users',
        allowed_formats: ['jpg', 'png', 'jpeg']
      });
      imgUrl = result.secure_url;
    }

    const newUser = new User({
      name,
      email,
      password: passwordHash,
      phone,
      role,
      address,
      imgUrl, // Será null si no hay imagen
    });

    await newUser.save();

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