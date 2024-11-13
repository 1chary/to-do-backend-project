const express = require("express");
const app = express();
const path = require("path")
const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const cors = require("cors")


const dbPath = path.join(__dirname,"userdata.db")

let db = null;
app.use(bodyParser.json());
app.use(cors());


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
    SELECT 
        name
    FROM 
        user_details
    WHERE 
        name = '${name}';
    `;
    const queryResults = await db.get(checkUsernameAvailability);
    if (queryResults === undefined) {
        const addNewUser = `
        INSERT INTO 
            user_details(user_id,name,email,password)
        VALUES (
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
        SELECT 
            *
        FROM 
            user_details
        WHERE
            name = '${name}'
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

// middle ware function logic 
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid Access Token");
  } else {
    jwt.verify(jwtToken, "my_token", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid Jwt Token");
      } else {
        request.name = payload.name;
        next();
      }
    });
  }
};

// change profile details code logic 

app.put("/updateProfileDetails", authenticateToken, async(request,response) => {
    const {name} = request.query
    const {newUsername,email,password} = request.body;
    const updateUserDetails = `
        UPDATE 
            user_details
        SET 
            name ='${newUsername}',
            email='${email}',
            password='${password}'
        WHERE
            name = '${name}'
    `;
    await db.run(updateUserDetails)
    response.send("user details updated successfully")
})

// get the all the list of todo's of specific user

app.get("/todo/list/:name",async(request,response) => {
    const {name} = request.params;
    const getAllTheToDos = `
        SELECT 
            *
        FROM
            to_do_table
        WHERE
            name = '${name}';
    `;
    const queryResult = await db.all(getAllTheToDos)
    response.send(queryResult)
})

// create a new todo

app.post("/newToDo/:name",async(request,response) => {
    const {name} = request.params;
    const {to_do_id,description,status} = request.body
    const addToDo = `
        INSERT INTO 
            to_do_table(to_do_id,description,status,name)
        VALUES (
            ${to_do_id},
            '${description}',
            '${status}',
            '${name}'
        )
    `;
    await db.run(addToDo)
    response.send("New To Do Added Successfully")
})

// update todo 

app.put("/updateToDo/:todoId", async(request,response) => {
    const {todoId} = request.params;
    const {description,status} = request.body;
    const updateToDo = `
        UPDATE 
            to_do_table
        SET 
            description = '${description}',
            status = '${status}'
        WHERE 
            to_do_id = ${todoId}
    `;
    await db.run(updateToDo);
    response.send("To do upated successfully");
})

// delete a to do
app.delete("/delete/todo/:todoId",async(request,response) => {
    const {todoId} = request.params
    const deleteToDo = `
        DELETE FROM 
            to_do_table
        WHERE
            to_do_id = ${todoId}
    `;
    await db.run(deleteToDo)
    response.send("To Do Deleted Successfully")
})


initializeTheDbAndServer()
