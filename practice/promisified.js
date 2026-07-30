const fs = require("fs");

function promisifiedFn(){
    console.log("Promisified Function called");

    return new Promise((resolve, reject) => {
        fs.readFile("a.txt", "utf8", (err, data) => {
            if (err) {
                reject(err);
            } else {
                syncFn("sync called using promisified function")
                resolve(data);
            }
        });

    })
}


function syncFn(data){
    console.log("sync function called",data)
}


function setTimeoutFn(){
    console.log("SetTimeout Function Called");

    setTimeout(()=>syncFn("setTimeout called"),4000)
}

syncFn()
setTimeoutFn()
promisifiedFn()