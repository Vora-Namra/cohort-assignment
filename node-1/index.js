import express from "express";


const app = express();

function IsRideAge(req,res,next){
    const age = req.query.age;
    if(age>=18){
        next();
    }
    else{
        res.json({msg:"Ride not booked successfully"})
    }
}

app.get("/ride1",IsRideAge,(req,res)=>{
    res.json({msg:"Ride booked successfully"})
})


app.listen(3000,()=>{
    console.log("Server started on port "+ 3000)
});