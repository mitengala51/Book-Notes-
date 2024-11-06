import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const API_URL = "https://covers.openlibrary.org/b/isbn/";
const API_URL_2 = "http://localhost:4000";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let book_notes = [],
  isbn,
  id;

// Root Page
app.get("/", async (req, res) => {
  try {
    res.render("SignUp.ejs");
  } catch (error) {
    console.log(error);
  }
});

app.get("/Home", async (req,res)=>{
  try{
    const response = await axios.get(API_URL_2 + "/posts");
    book_notes = await response.data;
    res.render("index.ejs",{notes: book_notes});
    }catch(error){
        console.log(error)
  
  }
})

// Create new notes
app.get("/new", async (req, res) => {
  res.render("new_notes.ejs");
});

// Creating New Notes using post
app.post("/posts", async (req, res) => {
  console.log(req.body["notes"]);
  await axios.post(API_URL_2 + "/api/new", req.body);

  res.redirect("/Home");
});

// Get Notes By specific id
app.get("/posts/:id", async (req, res) => {
  id = req.params.id;
  const result = await axios.get(API_URL_2 + "/posts/" + id);
  res.render("edit.ejs", { notes: result.data });
});

// Sign Up page
app.get("/signup", (req, res) => {
  res.render("SignUp.ejs");
});

// Login Page
app.get("/login", async (req, res) => {
  res.render("Login.ejs");
});

// Edit the notes
app.post("/posts/:id", async (req, res) => {
  try {
    id = req.params.id;
    const result = id.slice(1, 2);
    const response = await axios.patch(
      API_URL_2 + `/api/posts/${result}`,
      req.body
    );
    if (response.status === 200) {
      res.redirect("/Home");
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/submit-signup", async (req, res) => {
  try {
    //   const {username, email, password} = req.body;

    const response = await axios.post(API_URL_2 + "/api/signup", req.body);

    if (response.status == 201) {
      res.redirect("/Home");
    } 
  } catch (error) {
    console.log(error);
  }
});

app.post("/submit-login", async (req, res) => {
  try {

    const response = await axios.post(API_URL_2 + "/api/login", req.body);

    if (response.status == 200) {
      res.redirect("/Home");
    } else if (response.status == 500) {
      console.log(message)
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/delete/:id", async (req, res) => {
  try {
    id = req.params.id;
    console.log(id);
    const response = await axios.delete(API_URL_2 + "/api/delete/" + id);
    if (response.status === 200) {
      res.redirect("/Home");
    }
  } catch (error) {}
});

app.listen("3000", () => {
  console.log("Server is running on port 3000");
});
