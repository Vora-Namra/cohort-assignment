function callbackHell() {
    setTimeout(() => {
        console.log("after 1 second");

        setTimeout(() => {
            console.log("after 3 seconds");

            setTimeout(() => {
                console.log("after 5 seconds");
            }, 5000);

        }, 3000);

    }, 1000);
}

callbackHell();

function setTimeoutPromisified(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

setTimeoutPromisified(1000)
    .then(() => {
        console.log("after 1 second");
        return setTimeoutPromisified(3000);
    })
    .then(() => {
        console.log("after 3 seconds");
        return setTimeoutPromisified(5000);
    })
    .then(() => {
        console.log("after 5 seconds");
    })
    .catch((err) => {
        console.error(err);
    });