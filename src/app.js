require('dotenv').config()
require('express-async-errors');

// database
const connectDB = require('./db/connect.js')

// error handler
const notFoundMiddleware = require('./middleware/not-found.js')
const errorHandlerMiddleware = require('./middleware/error-handler.js')

// rest of packages
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const cookieParser = require('cookie-parser');

// route files
const authRoutes = require('./modules/auth/auth.routes');
const uploadRoutes = require('./modules/upload/upload.routes'); // Added upload routes
const matchingRoutes = require('./modules/matching/matching.routes');
// express 
const app = express()

// middleware
app.use(helmet())
app.use(cors()) 
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.JWT_SECRET));

// routes
app.get('/',(req,res)=>{
    res.send('API is running')  
})

// route mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/upload', uploadRoutes); // Mount upload routes
app.use('/api/v1/matching', matchingRoutes);


app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 5000
const start = async () =>{
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port,console.log(`Server is listening on port ${port}`))
    } catch (error) {
        console.log(error);
    }
} 
start()