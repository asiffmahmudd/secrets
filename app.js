//jshint esversion:6
const mongoose = require("mongoose")
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
require('dotenv').config()

const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

// const encrypt  = require("mongoose-encryption")
// const md5 = require("md5")
// const bcrypt = require("bcrypt")
// const saltRounds = 10

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session())

// mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a3ov0.mongodb.net/wikiDB?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
mongoose.set("useCreateIndex", true)

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

// const secret = process.env.SECRET
// userSchema.plugin(encrypt, {secret:secret, encryptedFields: ["password"]})
const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {

        return done(err, user);
        });
    }
));


app.get("/", (req,res) => {
    res.render("home")
})

app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

// app.post("/register", (req,res) => {

//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         })
        
//         newUser.save((err) => {
//             if(err){
//                 res.send(err)
//             }
//             else{
//                 res.render("secrets")
//             }
//         })
//     });
    
// })

// app.post("/login", (req,res) => {
//     User.findOne(
//         {email: req.body.username},
//         (err, foundUser) => {
//             if(foundUser){
//                 bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
//                     if(result === true){
//                         res.render("secrets")
//                     }
//                     else{
//                         res.send("Email or password doesn't match")
//                     }
//                 });
//             }
//             else if(err){
//                 res.send(err)
//             }
//             else{
//                 res.send("User doesn't exist")
//             }
//         }
//     )
// })

app.get("/secrets", (req,res) => {
    if(req.isAuthenticated()){
        res.render("secrets")
    }
    else{
        res.redirect("/login")
    }
})

app.post("/register", (req,res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err)
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req,res, () => {
                res.redirect("/secrets")
            })
        }
    })
})


app.post("/login", (req,res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err) => {
        if(err){
            console.log(err)
        }
        else{
            passport.authenticate("local")(req,res, () => {
                res.redirect("/secrets")
            })
        }
    })
})

app.get("/logout", (req,res) => {
    req.logout()
    res.redirect("/")
})

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
});
  