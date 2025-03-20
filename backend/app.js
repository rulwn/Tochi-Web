import express from 'express';
import routeEmployee from './src/routes/productsRoute.js';
import routeReviews from './src/routes/reviewsRoute.js';
import routeCart from './src/routes/cartRoute.js';
import routCategories from './src/routes/categoriesRoute.js'
import routOrder from './src/routes/orderRoute.js'


const app = express();
app.use(express.json());
app.use("/api/products", routeEmployee);
app.use("/api/reviews", routeReviews);
app.use("/api/cart",routeCart);
app.use('/api/categories', routCategories);
app.use('/api/order', routOrder)

export default app;