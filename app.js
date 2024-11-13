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



// sign in user code logic 

app.post("/signIn", async(request,response) => {
    const {user_id,name,email,password} = request.body;
    const checkUsernameAvailability = `
    SELECT name
    FROM user_details
    WHERE name = '${name}';
    `;
    const queryResults = await db.get(checkUsernameAvailability);
    if (queryResults === undefined) {
        const addNewUser = `
        INSERT INTO user_details(user_id,name,email,password)
        values (
            ${user_id},
            '${name}',
            '${email}',
            '${password}'
    )`;
        await db.run(addNewUser)
        response.send("New User Added")

    }
    else {
        response.status(400);
        response.send("user already exists");
    }
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

// change user name code logic 

app.put("/changeUsername", async(request,response) => {
    const {name,newUsername} = request.body
    const checkUser = `
        select *
        from user_details
        where name = '${name}'
    `;
    const queryResults = await db.get(checkUser)
    if (queryResults !== undefined) {
        const updateUsername = `
        update user_details
        set name = '${newUsername}'
        where name = '${name}'
    `;
    await db.run(updateUsername)
    response.send("Username updated successfully")
    }
    else {
        response.status = 400;
        response.send("Username not in records")
    }
})

// 

initializeTheDbAndServer()