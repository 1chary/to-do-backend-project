const express = require("express");
const app = express();
const path = require("path")
const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")

const dbPath = path.join(__dirname,"userdata.db")

let db = null;
app.use(bodyParser.json());

const initializeTheDbAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(3002, () => {
            console.log("Server is running at http://localhost:3002/")
        })
    }
    catch(e) {
        console.log(`DB ERROR: ${e.message}`)
        process.exit(1)
    }
}


app.get("/check",async (request,response) => {
    const result = `
        select *
        from user_details
    `;
    const run = await db.all(result)
    response.send(run)
})


// log in user code logic

app.post("/login",async(request,response) => {
    const {name,password} = request.body;
    console.log(name)
    const checkUserAvailability = `
        select *
        from user_details
        where name = '${name}'
    `;
    const queryResult = await db.get(checkUserAvailability);
    if (queryResult === undefined) {
        response.status(400);
        response.send("User Not Available in Our Records Please SignIn")
    }
    else {
        if (password === queryResult.password) {
            const payload = {
                name: '${name}'
            }
            const jwtToken = jwt.sign(payload,"my_token")
            response.send({jwtToken})
        }
        else {
            response.status(400);
            response.send("Invalid Password")
        }
    }
})

initializeTheDbAndServer()