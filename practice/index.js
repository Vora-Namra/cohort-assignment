function setTimeOutPromisified(ms){
    return new Promise(res => setTimeout(res,ms));
}

function callback(){
    console.log("callback")
}


const p = setTimeOutPromisified(3000).then(callback)
console.log(p)