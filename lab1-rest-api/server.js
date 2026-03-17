const express = require("express");
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// In-memory array of students
let students = [
    { id: 1, name: "Олександр Іванов", group: "ІО-31" },
    { id: 2, name: "Марія Петренко", group: "ІО-32" }
];

// Завдання 2 – Basic hello
app.get("/", (req, res) => {
    res.send("Hello from Node.js server");
});

// Завдання 3 – GET /students
app.get("/students", (req, res) => {
    res.json(students);
});

// Завдання 4 – POST /students
app.post("/students", (req, res) => {
    const newStudent = {
        id: students.length + 1,
        name: req.body.name,
        group: req.body.group
    };
    students.push(newStudent);
    res.status(201).json(newStudent);
});

// Завдання 5 – PUT /students/:id
app.put("/students/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const student = students.find(s => s.id === id);
    if (student) {
        student.name = req.body.name || student.name;
        student.group = req.body.group || student.group;
        res.json(student);
    } else {
        res.status(404).json({ message: "Student not found" });
    }
});

// Завдання 5 – DELETE /students/:id
app.delete("/students/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
        students.splice(index, 1);
        res.json({ message: "Student deleted" });
    } else {
        res.status(404).json({ message: "Student not found" });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});