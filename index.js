import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; 


dotenv.config();

const db = new pg.Client({
    user: process.env.db_user,
    host: process.env.db_host,
    database: process.env.db_database,
    password: process.env.db_password,
    port: process.env.db_port, 
});

db.connect((err) => {
    if (err) {
        console.error('Failed to connect to the database:', err);
    } else {
        console.log('Connected to the database successfully');
    }
});

const app = express();
const API_URL = "https://covers.openlibrary.org/b/isbn/";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

let book_notes = [], isbn;

async function allnotes() {
    let result = await db.query("SELECT * FROM books_read ORDER BY id ASC");
    result = result.rows;
    book_notes = result;
    return result;
}

// Root Page
app.get("/posts", async (req, res) => {
    book_notes = await allnotes();
    res.json(book_notes);
});

// Create new notes
app.get("/new", async (req, res) => {
    res.render("new_notes.ejs", { notes: book_notes });
});

// Get Notes By specific id
app.get("/posts/:id", async (req, res) => {
    const id = req.params.id;
    const result = book_notes.find((note) => id == note.id);
    res.json(result);
});

// Creating New Notes using post
app.post("/api/new", async (req, res) => {
    let objectDate = new Date();
    let day = objectDate.getDate();
    let month = objectDate.getMonth() + 1;
    let year = objectDate.getFullYear();
    let format3 = month + "-" + day + "-" + year;

    const book_notes = {
        image: API_URL + req.body["cover-page"] + "-M.jpg",
        title: req.body["b_name"],
        date_t: format3,
        notes: req.body["notes"],
        reviews: req.body["reviews"],
        books_intro: req.body["books_intro"],
    };

    const result = await db.query("INSERT INTO books_read(image,title,date_t,notes,reviews,books_intro) VALUES($1,$2,$3,$4,$5,$6)",
        [book_notes.image, book_notes.title, book_notes.date_t, book_notes.notes, book_notes.reviews, book_notes.books_intro]);

    res.status(200).json({ status: "success" });
});

// SignUp Form
app.post("/api/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedpassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (username, email, password) VALUES($1, $2, $3)",
            [username, email, hashedpassword]);

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.log(error);
        res.status(409).json({ message: "User creation failed", error: error.message });
    }
});

// Login Form
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Received login request for email:", email);

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log("Database query result:", result.rows);

        if (result.rows.length === 0) {
            console.log("User not found");
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log("Invalid password");
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Edit the notes
app.patch("/api/posts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let posts = await allnotes();
        const existingpost = posts.find((post) => post.id === id);

        const notes = {
            image: req.body["cover-page"],
            title: req.body["b_name"],
            date_t: existingpost.date_t,
            notes: req.body["notes"],
            reviews: req.body["reviews"],
            books_intro: req.body["books_intro"],
        };

        await db.query("UPDATE books_read SET image= $1, title= $2, date_t= $3, notes= $4, reviews= $5, books_intro= $6 WHERE id=$7",
            [notes.image, notes.title, notes.date_t, notes.notes, notes.reviews, notes.books_intro, id]);

        res.status(200).json({ status: "Updates" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Update failed", error: error.message });
    }
});

// Delete the notes
app.delete("/api/delete/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.query("DELETE FROM books_read WHERE id = $1", [id]);
        res.status(200).json({ status: "success" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});

app.listen(process.env.PORT || 4000, () => {
    console.log("Server is running on port 4000");
});
