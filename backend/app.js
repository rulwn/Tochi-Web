import express from 'express';
import routeEmployee from './src/routes/productsRoute.js';
import routeReviews from './src/routes/reviewsRoute.js'



const app = express();
app.use(express.json());
app.use("/api/products", routeEmployee);
app.use("/api/reviews", routeReviews)

export default app;