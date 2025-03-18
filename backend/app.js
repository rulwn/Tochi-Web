import express from 'express';
import routeEmployee from './src/routes/productsRoute.js';

const app = express();
app.use(express.json());
app.use("/api/products", routeEmployee);

export default app;