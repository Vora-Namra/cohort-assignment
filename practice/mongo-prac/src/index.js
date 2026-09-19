const express = require("express");
const { UserModel } = require("./database/todo");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

async function testConn() {
    await mongoose.connect("mongodb+srv://voranamra625_db_user:Rdik5VxGyVR0zTmO@cluster0.dwplyov.mongodb.net");
}
testConn();

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    const users = await UserModel.create({
        name: name,
        password: password,
        email: email
    })
    return res.status(200).json(users);
})

app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({
        email: email,
        password: password
    });

    if (!user) res.status(403).json({ message: "Invalid credentials!!!" });

    const token = jwt.sign({ id: user._id.toString(), email }, "Abc@12345");
    res.status(200).json(token);

})

app.post("/todos", authCheck, (req, res) => {
    res.status(200).send("ok");
})

app.delete("/", authCheck, (req, res) => {

})


function authCheck(req, res, next) {
    const token = req.headers["authorization"];

    const decodedData = jwt.verify(token, "Abc@12345");

    if (decodedData) {
        req.userId = decodedData.id;
        next();
    } else {
        res.status(403).json({
            message: "Incorrect credentials"
        })
    } ś
}

app.listen(3000, () => console.log("Server started!!!ś"));