const { rejects } = require("assert");
const fs = require("fs");
const { resolve } = require("path");

function fsReadFilePromisified(path,encoding){
    return new Promise((resolve,rejects)=>{
        fs.readFile(path,encoding,function(err,data){
            if(err){
                rejects(err);
            }
            resolve(data);
        })
    })
}



/* Ugly way to use the promise-based function */

// async function main() {
//     fsReadFilePromisified("a.txt","utf8")
//         .then(function(data){
//             console.log(data);
//             fsReadFilePromisified("b.txt","utf8")
//                 .then(function(data2){
//                     console.log(data2);
//                 })
//         })
// }


/* new, modern way of writing/calling promise
it is just a syntactical sugar of calling promise which makes the code easy to read */

async function main() {
    const p1 =await fsReadFilePromisified("a.txt","utf8");

    const p2 = await fsReadFilePromisified("b.txt","utf8");

    console.log(p1);
    console.log(p2);
}
main();