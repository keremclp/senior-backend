
require('dotenv').config()


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


// express 
const app = express()

// middleware
app.use(helmet())
app.use(cors()) 
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// routes
app.get('/',(req,res)=>{
    res.send('API is running')  
})

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