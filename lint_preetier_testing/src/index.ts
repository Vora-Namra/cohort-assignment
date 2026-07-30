import express from "express";

const app = express();


app.get("/", (req, res) => {
  res.json({
    message: "Hello there!",
  });
});

app.listen(3000, (err) => {
  console.log(err);
});
