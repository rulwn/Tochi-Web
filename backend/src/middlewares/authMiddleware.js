import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (req, res, next) => {
  // Obtener token del header, cookie o body
  const token = req.header('x-auth-token') || req.cookies.authToken || req.body.token;
  
  if (!token) {
    return res.status(401).json({ message: "No hay token, autorización denegada" });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Añadir usuario al request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    console.error("Error en el token:", err);
    res.status(401).json({ message: "Token no válido" });
  }
};

export default authMiddleware;