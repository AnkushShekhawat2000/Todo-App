const isLoggedIn = (req, res, next)=> {
    if(req.session.isLoggedIn){
        next();
    }
    else{
        return res.status(401).json("Session expired please login again");
    }
}

module.exports = isLoggedIn;