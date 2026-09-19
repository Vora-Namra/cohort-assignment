# mongo-prac - Express & MongoDB Todo API

A clean RESTful API for user authentication and todo management built with Express, MongoDB (Mongoose), and JSON Web Tokens (JWT).

---

## Features

- **User Authentication**: Secure signup and signin with JWT token generation and validation.
- **Todo CRUD**:
  - `POST /todos`: Create pending or completed todos tied to the authenticated user.
  - `GET /todos`: Retrieve all todos belonging to the user.
  - `GET /todos?done=false` / `GET /todos?done=true`: Filter todos by completion status using query parameters.
  - `PUT /todos/:id`: Update todo title and/or status.
  - `DELETE /todos/:id`: Delete todo by ID.
- **Route Security**: `authCheck` middleware supporting both `Authorization: Bearer <token>` and raw token headers with proper error handling.
- **Dual Database Modes**:
  - **Atlas MongoDB**: Connects to MongoDB Atlas via connection string in `.env`.
  - **Offline/Test Mock Mode**: Set `MOCK_DB=true` in `.env` to run completely offline or in automated test pipelines without requiring MongoDB Atlas IP whitelisting.
- **Postman Collection (v2.1.0)**: Ready-to-import Postman collection with dynamic environment variables, pre-request scripts, test assertions, and example responses for all routes.

---

## API Endpoints Reference

| Method | Endpoint | Auth Required | Request Body / Query | Expected Status | Description |
|---|---|---|---|---|---|
| `GET` | `/` | No | None | `200 OK` | Health check route |
| `POST` | `/signup` | No | `{ "name": "...", "email": "...", "password": "..." }` | `201 Created` | Registers a new user |
| `POST` | `/signup` (Missing fields) | No | `{ "name": "..." }` | `400 Bad Request` | Validation failure |
| `POST` | `/signup` (Duplicate) | No | `{ "email": "existing@example.com", ... }` | `409 Conflict` | Duplicate email rejection |
| `POST` | `/signin` | No | `{ "email": "...", "password": "..." }` | `200 OK` | Authenticates and returns JWT token |
| `POST` | `/signin` (Wrong pass) | No | `{ "email": "...", "password": "wrong" }` | `403 Forbidden` | Invalid credentials |
| `POST` | `/todos` | **Yes** | `{ "title": "Buy groceries", "done": false }` | `201 Created` | Creates a new todo |
| `GET` | `/todos` | **Yes** | None | `200 OK` | Retrieves all todos for authenticated user |
| `GET` | `/todos?done=false` | **Yes** | Query: `done=false` | `200 OK` | Filters only pending todos |
| `GET` | `/todos?done=true` | **Yes** | Query: `done=true` | `200 OK` | Filters only completed todos |
| `PUT` | `/todos/:id` | **Yes** | `{ "title": "Updated title", "done": true }` | `200 OK` | Updates todo by ID |
| `DELETE` | `/todos/:id` | **Yes** | None | `200 OK` | Deletes todo by ID |
| `GET` | `/todos` (No token) | No | None | `403 Forbidden` | Security rejection for missing token |
| `GET` | `/todos` (Bad token) | No | Header: `Authorization: Bearer invalid` | `403 Forbidden` | Security rejection for invalid JWT |


## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
The `.env` file includes:
```env
DATABASE_URL="mongodb+srv://voranamra625_db_user:Rdik5VxGyVR0zTmO@cluster0.dwplyov.mongodb.net"
JWT_SECRET="Abc@12345"
PORT=3000
```

> **Note on MongoDB Atlas Connection**:
> If your MongoDB Atlas cluster rejects connections due to IP restrictions, either:
> 1. Whitelist your current IP address (or `0.0.0.0/0`) in MongoDB Atlas under **Security -> Network Access**.
> 2. Or set `MOCK_DB=true` in `.env` to test immediately with the in-memory storage engine.

### 3. Start the Server
```bash
npm start
# or for development
npm run dev
```

### 4. Run Automated Route Tests
To execute all 18 automated route tests:
```bash
npm test
```

---

## Using the Postman Collection

Two files are provided in the root directory:
1. `mongo-prac.postman_collection.json`: Complete collection containing all endpoints, bodies, queries, test scripts, and desired response examples.
2. `mongo-prac.postman_environment.json`: Environment file with `base_url`, `auth_token`, etc.

### How to Import into Postman
1. Open **Postman**.
2. Click the **Import** button in the top left.
3. Drag and drop (or select) both `mongo-prac.postman_collection.json` and `mongo-prac.postman_environment.json`.
4. In the top-right environment dropdown, select **mongo-prac Local Environment**.

### How Automated Authentication & Testing Works in Postman
- **Pre-request Dynamic Email**: When running `Signup - Success`, a pre-request script generates a unique email (e.g. `user_123456@example.com`) and updates the collection variable `user_email`. This allows you to run the collection repeatedly without duplicate email conflicts.
- **Automatic Token Saving**: When running `Signin - Success`, the test script automatically extracts `response.token` and stores it into `auth_token`. Subsequent todo requests automatically inherit this token.
- **Automatic Todo ID Saving**: When running `Create Todo - Pending`, the test script extracts `todo._id` and stores it into `created_todo_id`, which is then used by the `Update Todo` and `Delete Todo` requests.

### Running with Postman Collection Runner
1. Right-click the imported **mongo-prac Todo API** collection in Postman.
2. Select **Run collection**.
3. Choose the requests to run (or run all in sequence).
4. Click **Run mongo-prac Todo API**.
5. All test assertions will execute and report green checkmarks!
