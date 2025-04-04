import express from 'express';
import logController from '../controllers/logController.js';
const router = express.Router();
router.route("/").post(logController.login)

export default router;