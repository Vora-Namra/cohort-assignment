const fs = require("fs");

fs.readFile("a.txt", "utf8", printData);

function printData(err, data) {
    if (err) {
        console.error("Error:", err);
        return;
    }

    console.log(data);
}