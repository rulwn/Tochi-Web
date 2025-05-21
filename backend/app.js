import express from 'express';
import routeEmployee from './src/routes/productsRoute.js';
import routeReviews from './src/routes/reviewsRoute.js';
import routeCart from './src/routes/cartRoute.js';
import routCategories from './src/routes/categoriesRoute.js'
import routOrder from './src/routes/orderRoute.js'
import routeUser from './src/routes/userRoute.js';
import routeLog from './src/routes/logRoute.js';
import routeTochiireg from './src/routes/regtochiiRoute.js';
import routeLogout from './src/routes/logoutRoute.js'

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const app = express();
app.use(express.json());
app.use("/api/products", routeEmployee);
app.use("/api/reviews", routeReviews);
app.use("/api/cart",routeCart);
app.use('/api/categories', routCategories);
app.use('/api/order', routOrder)
app.use('/api/users', routeUser);
app.use('/api/login',routeLog );
app.use('/api/register', routeTochiireg);
app.use('/api/logout',routeLogout );

export default app;