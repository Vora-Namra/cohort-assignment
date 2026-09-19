// Automated Test Runner for mongo-prac Todo API Routes
// Tests all endpoints with proper body, query parameters, auth headers, and expected response validations.

process.env.PORT = "3001";
process.env.MOCK_DB = "true"; // Run tests in-memory to verify routes without external network delays

const { app } = require("./src/index");

async function runTests() {
    console.log("==================================================");
    console.log("   Running Automated Route Tests for mongo-prac   ");
    console.log("==================================================\n");

    const server = app.listen(3001);
    const BASE_URL = "http://localhost:3001";
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`\x1b[32m✔ PASS\x1b[0m: ${name}`);
            passed++;
        } catch (err) {
            console.error(`\x1b[31m✘ FAIL\x1b[0m: ${name}`);
            console.error(`   Error: ${err.message}`);
            failed++;
        }
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || "Assertion failed");
        }
    }

    let authToken = "";
    let testEmail = `test_${Date.now()}@example.com`;
    let createdTodoId = "";

    try {
        // 1. Health check
        await test("GET / -> Health check returns status Running", async () => {
            const res = await fetch(`${BASE_URL}/`);
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(data.status === "Running", `Expected status "Running", got ${data.status}`);
        });

        // 2. Signup validation failure (missing fields)
        await test("POST /signup -> Missing fields returns 400 Bad Request", async () => {
            const res = await fetch(`${BASE_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Incomplete User" })
            });
            assert(res.status === 400, `Expected 400, got ${res.status}`);
            const data = await res.json();
            assert(data.message.includes("Missing required fields"), "Message should note missing fields");
        });

        // 3. Signup success
        await test("POST /signup -> Valid body registers user with 201 Created", async () => {
            const res = await fetch(`${BASE_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Namra Vora",
                    email: testEmail,
                    password: "Password@123"
                })
            });
            assert(res.status === 201, `Expected 201, got ${res.status}`);
            const data = await res.json();
            assert(data.user && data.user.id, "User object with id should be returned");
            assert(data.user.email === testEmail, "Returned email matches test email");
        });

        // 4. Duplicate email signup
        await test("POST /signup -> Duplicate email returns 409 Conflict", async () => {
            const res = await fetch(`${BASE_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Duplicate User",
                    email: testEmail,
                    password: "Password@123"
                })
            });
            assert(res.status === 409, `Expected 409, got ${res.status}`);
            const data = await res.json();
            assert(data.message.includes("already exists"), "Message should mention user already exists");
        });

        // 5. Signin invalid credentials
        await test("POST /signin -> Invalid password returns 403 Forbidden", async () => {
            const res = await fetch(`${BASE_URL}/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testEmail,
                    password: "WrongPassword"
                })
            });
            assert(res.status === 403, `Expected 403, got ${res.status}`);
            const data = await res.json();
            assert(data.message === "Invalid credentials!!!", "Message should note invalid credentials");
        });

        // 6. Signin success
        await test("POST /signin -> Valid credentials returns 200 OK with JWT token", async () => {
            const res = await fetch(`${BASE_URL}/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testEmail,
                    password: "Password@123"
                })
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(data.token && typeof data.token === "string", "Token string should be present in response");
            authToken = data.token;
        });

        // 7. Security: Missing auth token
        await test("GET /todos -> Missing token returns 403 Forbidden", async () => {
            const res = await fetch(`${BASE_URL}/todos`);
            assert(res.status === 403, `Expected 403, got ${res.status}`);
            const data = await res.json();
            assert(data.message.includes("Authorization token required"), "Message should note token required");
        });

        // 8. Security: Invalid auth token
        await test("GET /todos -> Corrupted token returns 403 Forbidden", async () => {
            const res = await fetch(`${BASE_URL}/todos`, {
                headers: { "Authorization": "Bearer malformed.token.value" }
            });
            assert(res.status === 403, `Expected 403, got ${res.status}`);
            const data = await res.json();
            assert(data.message.includes("Invalid or expired token"), "Message should note invalid/expired token");
        });

        // 9. Create Todo: Empty title validation
        await test("POST /todos -> Empty title returns 400 Bad Request", async () => {
            const res = await fetch(`${BASE_URL}/todos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ title: "   " })
            });
            assert(res.status === 400, `Expected 400, got ${res.status}`);
            const data = await res.json();
            assert(data.message.includes("Title is required"), "Message should require title");
        });

        // 10. Create Todo 1 (Pending)
        await test("POST /todos -> Creates pending todo with 201 Created", async () => {
            const res = await fetch(`${BASE_URL}/todos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    title: "Learn MongoDB and Mongoose",
                    done: false
                })
            });
            assert(res.status === 201, `Expected 201, got ${res.status}`);
            const data = await res.json();
            assert(data.todo && data.todo._id, "Todo object with _id must exist");
            assert(data.todo.title === "Learn MongoDB and Mongoose", "Title should match");
            assert(data.todo.done === false, "Done should be false");
            createdTodoId = data.todo._id;
        });

        // 11. Create Todo 2 (Completed)
        await test("POST /todos -> Creates completed todo with 201 Created", async () => {
            const res = await fetch(`${BASE_URL}/todos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    title: "Setup Express JWT Middleware",
                    done: true
                })
            });
            assert(res.status === 201, `Expected 201, got ${res.status}`);
            const data = await res.json();
            assert(data.todo.done === true, "Done should be true");
        });

        // 12. Get All Todos
        await test("GET /todos -> Retrieves all user todos with count", async () => {
            const res = await fetch(`${BASE_URL}/todos`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(Array.isArray(data.todos), "Todos property should be an array");
            assert(data.count === 2, `Expected count 2, got ${data.count}`);
        });

        // 13. Query filter: done=false
        await test("GET /todos?done=false -> Filters only pending todos", async () => {
            const res = await fetch(`${BASE_URL}/todos?done=false`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(data.count === 1, `Expected 1 pending todo, got ${data.count}`);
            assert(data.todos[0].done === false, "Item done status must be false");
        });

        // 14. Query filter: done=true
        await test("GET /todos?done=true -> Filters only completed todos", async () => {
            const res = await fetch(`${BASE_URL}/todos?done=true`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(data.count === 1, `Expected 1 completed todo, got ${data.count}`);
            assert(data.todos[0].done === true, "Item done status must be true");
        });

        // 15. Update Todo (PUT /todos/:id)
        await test("PUT /todos/:id -> Updates title and sets done to true", async () => {
            const res = await fetch(`${BASE_URL}/todos/${createdTodoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    title: "Learn MongoDB and Mongoose (Mastered)",
                    done: true
                })
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(data.todo.done === true, "Done status should now be true");
            assert(data.todo.title === "Learn MongoDB and Mongoose (Mastered)", "Title should be updated");
        });

        // 16. Update non-existent Todo
        await test("PUT /todos/:id -> Non-existent ID returns 404 Not Found", async () => {
            const res = await fetch(`${BASE_URL}/todos/nonexistentid123`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ done: true })
            });
            assert(res.status === 404, `Expected 404, got ${res.status}`);
        });

        // 17. Delete Todo (DELETE /todos/:id)
        await test("DELETE /todos/:id -> Deletes todo with 200 OK", async () => {
            const res = await fetch(`${BASE_URL}/todos/${createdTodoId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            const data = await res.json();
            assert(data.message.includes("deleted successfully"), "Message should confirm deletion");
        });

        // 18. Verify count after delete
        await test("GET /todos -> Count decreases to 1 after deletion", async () => {
            const res = await fetch(`${BASE_URL}/todos`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            const data = await res.json();
            assert(data.count === 1, `Expected count 1 after deletion, got ${data.count}`);
        });

    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    console.log("\n==================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================\n");

    if (failed > 0) {
        process.exitCode = 1;
    } else {
        process.exitCode = 0;
    }
}

runTests();
