const express = require('express');
const mongoose = require('mongoose');
require("dotenv").config();

// file-import
const {userDataValidation} = require('./utils/authUtil');
const userModel = require("./models/userModel");

// console.log(process.env);
// console.log(process.env.key);


// contants
const app = express();
const PORT = process.env.PORT || 8000;


// middlewares
app.set("view engine", "ejs");   // setting a view engine to expres ejs
app.use(express.urlencoded({ extended: true }));   // encoded data form
app.use(express.json()); //encoded the json data

// db connection
// this is severside request this take some time that why this give promise
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDb connected successfully");
})
.catch((err) => console.log(err));


// api
app.get("/", (req,res)=>{
    return res.send("Server is running");
})

app.get('/test', (req, res)=>{
    return res.render('test');
})


// register
app.get('/register', (req, res)=>{
    return res.render('registerPage');
})

app.post('/register-user', async(req, res)=>{
    console.log("all ok", req.body);
    const{name, email,username, password} = req.body;

    // data validation
    try{
     await  userDataValidation({name, email, username, password});
    }catch(error){
       return res.status(400).json(error);
    //    return res.send(
    //     {status: 400,
    //         message: "Data invalid",
    //         error: error,
    //     }
    //    )    
    }

    // store the data in the Db

    // const userDb = await userModel.create({
    //     name: name,
    //     email: email,
    //     username: username,
    //     password: password,
    // })

     const userObj = new userModel(
        {
            name: name,
            email: email,
            username: username,
            password: password,
        }
     )
     console.log("before save", userObj);

     try{
      const userDb = await userObj.save();
      console.log(userDb);
        return res.send({
            status: 201,
            message: "Register successfully",
            data: userDb,
        })

        // return res.status(200).json({message : "", data: userDb})
     }
     catch(error){
       return res.send({
        status : 500,
        message: "Interal server error",
        error: error,
       })
     }


} )

// login
app.get('/login', (req, res)=>{
    return res.render('loginPage');
})



app.listen(PORT, ()=>{
    console.log(`Server is running at:`);
    console.log(`http://localhost:${PORT}`);
})