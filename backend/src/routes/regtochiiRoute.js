import express from "express";
import multer from "multer";
import registerUserController from "../controllers/registerController.js"; 

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.route("/").post(upload.single('imageUrl'), registerUserController.register);

export default router;