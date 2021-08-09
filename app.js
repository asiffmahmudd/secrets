//jshint esversion:6
const mongoose = require("mongoose")
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
require('dotenv').config()
const app = express();
const encrypt  = require("mongoose-encryption")

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a3ov0.mongodb.net/wikiDB?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const secret = "Thisisourlittlesecret."
userSchema.plugin(encrypt, {secret:secret, encryptedFields: ["password"]})
const User = mongoose.model("User", userSchema)

app.get("/", (req,res) => {
    res.render("home")
})

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

app.post("/register", (req,res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save((err) => {
        if(err){
            res.send(err)
        }
        else{
            res.render("secrets")
        }
    })
})

app.post("/login", (req,res) => {
    User.findOne(
        {email: req.body.username},
        (err, foundUser) => {
            if(foundUser){
                if(foundUser.password === req.body.password){
                    res.render("secrets")
                }
                else{
                    res.send("Email or password doesn't match")
                }
            }
            else if(err){
                res.send(err)
            }
        }
    )
})


app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
});
  