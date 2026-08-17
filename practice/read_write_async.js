const fs = require("fs");

async function read_clean_write(readFilePath, writeFilePath, enc) {
    fs.readFile(readFilePath, enc, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }

        console.log(data);

        const cleaned_data = data.trim();

        fs.writeFile(writeFilePath, cleaned_data, (err) => {
            if (err) {
                console.log(err);
                return;
            }

            console.log("File written successfully");
        });
    });
}

read_clean_write("a.txt", "b.txt", "utf8");