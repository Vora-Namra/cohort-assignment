require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { UserModel: RealUserModel, TodoModel: RealTodoModel } = require("./database/todo");

const JWT_SECRET = process.env.JWT_SECRET || "Abc@12345";
const DATABASE_URL = process.env.DATABASE_URL || "mongodb+srv://voranamra625_db_user:Rdik5VxGyVR0zTmO@cluster0.dwplyov.mongodb.net";
const PORT = process.env.PORT || 3000;
const useMock = process.env.MOCK_DB === "true";

class MockStore {
    constructor() {
        this.users = [];
        this.todos = [];
    }

    createId() {
        return new mongoose.Types.ObjectId().toString();
    }

    get UserModel() {
        const store = this;
        return {
            async findOne(query) {
                if (query.email && query.password) {
                    return store.users.find(u => u.email === query.email && u.password === query.password) || null;
                }
                if (query.email) {
                    return store.users.find(u => u.email === query.email) || null;
                }
                if (query._id) {
                    return store.users.find(u => u._id === query._id.toString()) || null;
                }
                return null;
            },
            async create(data) {
                const id = store.createId();
                const user = {
                    _id: id,
                    name: data.name,
                    email: data.email,
                    password: data.password
                };
                store.users.push(user);
                return user;
            }
        };
    }

    get TodoModel() {
        const store = this;
        return {
            async create(data) {
                const todo = {
                    _id: store.createId(),
                    title: data.title,
                    done: Boolean(data.done),
                    userId: data.userId?.toString(),
                    __v: 0
                };
                store.todos.push(todo);
                return todo;
            },
            async find(filter = {}) {
                let results = [...store.todos];
                if (filter.userId) {
                    results = results.filter(t => t.userId === filter.userId.toString());
                }
                if (filter.done !== undefined) {
                    results = results.filter(t => t.done === filter.done);
                }
                return results;
            },
            async findOneAndUpdate(query, updateData, options) {
                const todo = store.todos.find(t =>
                    t._id === query._id?.toString() &&
                    (!query.userId || t.userId === query.userId.toString())
                );
                if (!todo) return null;
                if (updateData.title !== undefined) todo.title = updateData.title;
                if (updateData.done !== undefined) todo.done = Boolean(updateData.done);
                return { ...todo };
            },
            async findOneAndDelete(query) {
                const index = store.todos.findIndex(t =>
                    t._id === query._id?.toString() &&
                    (!query.userId || t.userId === query.userId.toString())
                );
                if (index === -1) return null;
                const [deleted] = store.todos.splice(index, 1);
                return deleted;
            }
        };
    }
}

const mockStore = useMock ? new MockStore() : null;
const UserModel = useMock ? mockStore.UserModel : RealUserModel;
const TodoModel = useMock ? mockStore.TodoModel : RealTodoModel;

async function connectDB() {
    if (useMock) {
        console.log("Running with MOCK_DB=true (in-memory storage for offline / testing).");
        return;
    }
    try {
        await mongoose.connect(DATABASE_URL, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.warn("MongoDB connection warning:", error.message);
        console.warn("Hint: Ensure your IP is whitelisted in Atlas Network Access, or set MOCK_DB=true in .env to run offline.");
    }
}
connectDB();

const app = express();
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to mongo-prac Todo API",
        status: "Running"
    });
});

// Authentication Routes
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Missing required fields: name, email, and password are required"
            });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "User with this email already exists"
            });
        }

        const user = await UserModel.create({
            name,
            password,
            email
        });

        return res.status(201).json({
            message: "You are signed up successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error signing up user",
            error: err.message
        });
    }
});

app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await UserModel.findOne({
            email,
            password
        });

        if (!user) {
            return res.status(403).json({
                message: "Invalid credentials!!!"
            });
        }

        const token = jwt.sign({ id: user._id.toString(), email }, JWT_SECRET);
        return res.status(200).json({
            message: "Signin successful",
            token
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error signing in",
            error: err.message
        });
    }
});

// Auth Middleware
function authCheck(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(403).json({
                message: "Authorization token required"
            });
        }

        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
        const decodedData = jwt.verify(token, JWT_SECRET);

        if (decodedData && decodedData.id) {
            req.userId = decodedData.id;
            next();
        } else {
            return res.status(403).json({
                message: "Incorrect credentials"
            });
        }
    } catch (err) {
        return res.status(403).json({
            message: "Invalid or expired token",
            error: err.message
        });
    }
}

// Todo Routes
app.post("/todos", authCheck, async (req, res) => {
    try {
        const { title, done = false } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        const todo = await TodoModel.create({
            title: title.trim(),
            done: Boolean(done),
            userId: req.userId
        });

        return res.status(201).json({
            message: "Todo created successfully",
            todo
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to create todo",
            error: err.message
        });
    }
});

app.get("/todos", authCheck, async (req, res) => {
    try {
        const filter = { userId: req.userId };
        if (req.query.done !== undefined) {
            filter.done = req.query.done === "true";
        }

        const todos = await TodoModel.find(filter);
        return res.status(200).json({
            message: "Todos retrieved successfully",
            count: todos.length,
            todos
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to fetch todos",
            error: err.message
        });
    }
});

app.put("/todos/:id", authCheck, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, done } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (done !== undefined) updateData.done = Boolean(done);

        const updatedTodo = await TodoModel.findOneAndUpdate(
            { _id: id, userId: req.userId },
            updateData,
            { new: true }
        );

        if (!updatedTodo) {
            return res.status(404).json({
                message: "Todo not found or unauthorized"
            });
        }

        return res.status(200).json({
            message: "Todo updated successfully",
            todo: updatedTodo
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to update todo",
            error: err.message
        });
    }
});

app.delete("/todos/:id", authCheck, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTodo = await TodoModel.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!deletedTodo) {
            return res.status(404).json({
                message: "Todo not found or unauthorized"
            });
        }

        return res.status(200).json({
            message: "Todo deleted successfully",
            todo: deletedTodo
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to delete todo",
            error: err.message
        });
    }
});

// Backward compatibility fallback routes
app.delete("/todos", authCheck, async (req, res) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
        return res.status(400).json({ message: "Todo id is required in query (?id=...) or body" });
    }
    const deletedTodo = await TodoModel.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deletedTodo) return res.status(404).json({ message: "Todo not found or unauthorized" });
    return res.status(200).json({ message: "Todo deleted successfully", todo: deletedTodo });
});

app.delete("/", authCheck, async (req, res) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
        return res.status(400).json({ message: "Todo id is required in query (?id=...) or body" });
    }
    const deletedTodo = await TodoModel.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deletedTodo) return res.status(404).json({ message: "Todo not found or unauthorized" });
    return res.status(200).json({ message: "Todo deleted successfully", todo: deletedTodo });
});

let server;
if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT}`);
    });
}

module.exports = { app, connectDB };