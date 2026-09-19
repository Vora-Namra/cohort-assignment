const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const User = new Schema({
    email: { type: String, unique: true },
    password: String,
    name: String
})

const Todo = new Schema({
    title: String,
    done: Boolean,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const UserModel = mongoose.model('users', User);
const TodoModel = mongoose.model('todo', Todo);

module.exports = { UserModel, TodoModel };