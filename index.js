const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require("dotenv").config();  // import dotenc pakg
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mongodbSession = require("connect-mongodb-session")(session);
const todoModel = require("./models/todoModel");


// file-import
const {userDataValidation, isEmailValidator, generateToken, sendEmailVerificationMail } = require('./utils/authUtil');
const userModel = require("./models/userModel");
const isLoggedIn = require('./middlewares/isAuthMiddleware');
const todoDataValidation = require('./utils/todoUtils');

// console.log(process.env);
// console.log(process.env.key);


// contants
const app = express();
const PORT = process.env.PORT || 8001;
const store = new mongodbSession(({
    uri: process.env.MONGO_URI,
    collection: "sessions",
}))

// db connection
// this is severside request this take some time that why this give promise
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDb connected successfully");
})
.catch((err) => console.log(err));



// middlewares
                                  
app.set("view engine", "ejs");  
app.use(express.urlencoded({ extended: true }));  
app.use(express.json()); 
app.use(session({
   secret: process.env.SECRET_KEY,
   store: store,
   resave: false,
   saveUninitialized: false,
}))

app.use(express.static("public"));  



// api
app.get("/", (req,res)=>{
    return res.render("homepage");
})

app.get('/test', (req, res)=>{
    return res.render('test');
})


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
    
    }

 
    
    // check user already registered with this email or not

     try{

         const userEmailExist = await userModel.findOne({email});

         //console.log("user find with this email already", userEmailExist);
    
         if(userEmailExist) {
            return res.status(400).json("User Email already exists");
         }

         const userNameExist = await userModel.findOne({username}); 
         console.log("user with this userName already", userNameExist);
         if(userNameExist) {
            return res.status(400).json("Username already exists");
         }
     

    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT));
    console.log("hassedpassword", hashedPassword);   

    // 2nd way
     const userObj = new userModel(
        {
            name: name,
            email: email,
            username: username,
            password: hashedPassword,
        }
     )


     // generate the token 
     const token = generateToken(email);
                                           console.log("token", token);

     // and send to the user gmail
     sendEmailVerificationMail({token, email});
   




                                                      console.log("before save", userObj);
      const userDb = await userObj.save();
                                                      console.log("after save in db", userDb);
       return res.redirect("/login");
    
     }
     catch(error){
       return res.send({
        status : 500,
        message: "Interal server error",
        error: error,
       })
     }


} )


// email verify api
app.get("/verify/:token", async (req, res)=> {
   

    const token = req.params.token;

    const email = jwt.verify(token, process.env.SECRET_KEY);
    console.log("verified email", email);


    try{
       await  userModel.findOneAndUpdate( {email: email}, {isEmailVerified: true});
          
        return res.redirect('/login');
    }
    catch(error){
        return res.status(500).json(error);
    }
})


// login
app.get('/login', (req, res)=>{
    return res.render('loginPage');
})


app.post('/login-user', async (req, res)=>{
    console.log("all ok", req.body);
   
    const {loginId, password} = req.body;

    if(!loginId || !password) {
        return res.status(400).json("Missing login details");
    }

    //find the user with this loginID(email or username) in db
   try{
        let userDb;

        if(isEmailValidator({key:loginId})){
            userDb = await userModel.findOne({email: loginId});
                                  
         }
       else{
            userDb = await userModel.findOne({username: loginId});
                                   
        }
                                
       console.log("line 169", userDb);

        if(!userDb){
            return res.status(400).json("User not found, please register first");
        }


        console.log("Client side password: ",password  , "dppassword: ", userDb.password);    //Client side password:  123456 dppassword:  $2a$10$lRwSvu0Pgv7zVUqtBhL5s.3puoeaQA2xxGZoXH.lMx29u5QfqPHdq

        // check if email is verified or not
        if(!userDb.isEmailVerified){
            return res.status(400).json("Please verify your email before login");
        }



       const isMatched = await bcrypt.compare(password, userDb.password)  // true or false
        console.log(isMatched);  // -> true or  false

        if(!isMatched)  return res.status(400).json("Incorrect password");


     
        console.log(req.session) 
        req.session.isLoggedIn = true;  
        req.session.user = {
            userId : userDb._id,
            username : userDb.username,
            email : userDb.email,
        };

        return res.redirect("/dashboard");
    
    }
    catch(error){
        return res.status(500).json(error);
    }
  
 }
)



// dashboard api
// using session here
app.get("/dashboard", isLoggedIn, (req, res) => {
  
    return res.render("dashboardPage");
})



// logout api
app.post('/logout', isLoggedIn, (req, res)=> {
                                           //console.log(req.session.id);
    req.session.destroy((err)=> {
        if(err) return res.status(400).json("Logout unsuccesfull");
        
        return res.status(200).json("Logout succesfull");
    });
  
})


// logout from all devices
app.post("/logout-out-from-all", async (req, res)=> {
    
   

    const username = req.session.user.username;

    //create a schema
    const sessionSchema = new mongoose.Schema({id: String}, {strict: false});

    // convert into a model
    const sessionModel = mongoose.model("session", sessionSchema);

    // Db query to delete session

    try{
        const deleteDb = await sessionModel.deleteMany({
            "session.user.username": username,
        })

        console.log(deleteDb);

        return res.redirect("/login");
    }catch (error){
        return res.status(500).json(error);
    }
})


// todos api

// create todo api
app.post("/create-item", isLoggedIn, async (req, res) =>{
 
    const username = req.session.user.username;
    const todo = req.body.todo;

    console.log(req.body);

    try{
        await todoDataValidation({todo});
    }
    catch(error){
        return res.send({
            status : 400,
            error : error,
        });
    }
    
    const todoObj = new todoModel({
      todo,
      username,
    });

   try{
   const savedTodo = await todoObj.save();

        return res.send({
            status: 201,
            message: "Todo created successfully",
            data: savedTodo,
        })
   }
   catch(err){
        return res.send({
            status: 500,
            message: "Internal server error",
            error: err,
        })
   }
   
})



// read api
// /read-item?skip=5
app.get('/read-item', isLoggedIn, async (req,res) => {

    const username = req.session.user.username;
    
    console.log(req.query);   //{ skip: '5' }

    const SKIP = Number(req.query.skip || 0);
    const LIMIT = 5;

    try{


    // pagination query (only limit data will will we getting in the db and send to the client side)
    //match , skip, limit 
       const todoDb = await  todoModel.aggregate([
        { $match : {username : username} },
        { $skip : SKIP },
        { $limit : LIMIT },
       ]);
       
        // no todo with this username
        if(todoDb.length == 0){
            return res.send({
                status: 204,   //  no content code // but response is successfull
                message: "No todos found",
            })
        }

        return res.send({
            status: 200,
            message : "Read success",
            data : todoDb,
        })

    } catch(error) {

      return res.send({
            status: 500,
            message: "Internal server error",
            error: error,
      })
    }
})


// Edit todo api
app.post("/edit-item", isLoggedIn, async (req, res) => {

    const {todoId, newData} = req.body;

    const username = req.session.user.username;
    
    console.log("line 367",req.body);

    try{
        await todoDataValidation({todo : newData});
    }catch(error){
        return res.send({
            status : 400,
            error : error,
        });

    }


    // find the todo
    try{
        // find todo with todoId
        const todoDb = await todoModel.findOne({_id : todoId});
        console.log("line 383",username, todoDb);

        //ownership check
        if(username !== todoDb.username){
            return res.send({
                status : 403,
                message : "You are not authorized to edit this todo",
            })
        }


    }catch(error){
        return res.send({
            status: 404,
            message: "Todo not found",
            error: error,
        })

    }


    try{
       const todoDbNew = await todoModel.findOneAndUpdate({_id: todoId}, {todo:newData},{new:true}); // new property se updated hone ke bad ka data milta h

       console.log(todoDbNew);

       return res.send({
        status: 200,
        message: "Todo edited successfully",
        data: todoDbNew,

       });
    } catch(error) {
        return res.send({
            status: 500,
            message: "Internal server error",
            error: error,
        })
    }


})



// delte todo api
app.post("/delete-item", isLoggedIn, async (req, res) => {

    const {todoId} = req.body;

    const username = req.session.user.username;
    
    console.log("line 357",req.body);

 
    // find the todo
    try{
        // find todo with todoId
        const todoDb = await todoModel.findOne({_id : todoId});
        console.log("line 443",username, todoDb);

        //ownership check
        if(username !== todoDb.username){
            return res.send({
                status : 403,
                message : "You are not allow to delete this todo",
            })
        }


    }catch(error){
        return res.send({
            status: 404,
            message: "No Todo Found",
            error: error,
        })

    }


    // find todo and delete
    try{
       const todoDeletedDb = await todoModel.findOneAndDelete({_id: todoId}); // delted data retrun krega
       console.log(todoDeletedDb);

       return res.send({
        status: 200,
        message: "Todo deleted successfully",
        data: todoDeletedDb,
       });

    } catch(error) {
        return res.send({
            status: 500,
            message: "Internal server error",
            error: error,
        })
    }


})


app.listen(PORT, ()=>{
    console.log(`Server is running at: http://localhost:${PORT}`);
    console.log(`http://localhost:${PORT}`);
})
