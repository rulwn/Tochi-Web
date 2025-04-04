import express from "express";
import registerTochiiController from "../controllers/registerController.js";
const router = express.Router();

router.route("/").post(registerTochiiController.register);

export default router;