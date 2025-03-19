import express from 'express';
import routeEmployee from './src/routes/productsRoute.js';

const app = express();
app.use(express.json());
app.use("/api/product", routeEmployee);

export default app;