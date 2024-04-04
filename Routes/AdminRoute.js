import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

const router = express.Router();

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * from admin Where email = ?";
  const { email, password } = req.body;
  con.query(sql, [email], async (err, result) => {
    if (err) {
      return res.status(400).json({ err });
    }
    if (result.length === 0) {
      return res.status(400).json({ message: "User Not Found" });
    }
    const comparepassword = await bcrypt.compare(password, result[0].password);
    if (!comparepassword) {
      return res.status(403).json({ Error: "Invalid Password" });
    }
    const token = jwt.sign(
      { role: "admin", email: email, id: result[0].id },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );
    res.cookie("token", token);
    return res.json({
      loginStatus: true,
      id: result[0].id,
      Name: result[0].Name,
      email: result[0].email,
    });
  });
});

router.post("/add_admin", async (req, res) => {
  const sql = "INSERT INTO admin (Name,email,password) VALUES (?,?,?)";
  const { name, email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashpassword = await bcrypt.hash(password, salt);
  con.query(sql, [name, email, hashpassword], (err, result) => {
    if (err) {
      return res.status(400).json({ error: err });
    }
    return res.status(200).json({ message: "Admin added", result });
  });
});

router.get("/category", (req, res) => {
  const sql = "SELECT * FROM category";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    return res.json({ Status: true, Result: result });
  });
});

router.post("/add_category", (req, res) => {
  const sql = "INSERT INTO category (`name`) VALUES (?)";
  con.query(sql, [req.body.category], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    return res.json({ Status: true });
  });
});

// image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Public/Images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
});
// end imag eupload

router.post("/add_employee", upload.single("image"), (req, res) => {
  const sql = `INSERT INTO employee 
                (name,email,password, address, salary,image, category_id) 
                VALUES (?)`;
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err)
      return res.status(400).json({ Status: false, Error: "Query Error" });
    const values = [
      req.body.name,
      req.body.email,
      hash,
      req.body.address,
      req.body.salary,
      req.file.filename,
      +req.body.category_id,
    ];
    con.query(sql, [values], (err, result) => {
      if (err) return res.status(400).json({ Status: false, Error: err });
      return res.json({ Status: true });
    });
  });
});

router.get("/employee", (req, res) => {
  const sql = `SELECT employee.name , employee.id,
              employee.email ,employee.salary,employee.image ,category.name as role 
              FROM employee 
              join category 
              on category.id = employee.category_id`;
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/employee/:id", (req, res) => {
  const id = req.params.id;
  const sql = `SELECT employee.name , employee.id,
                employee.email ,employee.salary,employee.address,employee.image,employee.category_id ,category.name as role 
                FROM employee 
                join category 
                on category.id = employee.category_id 
                where employee.id = ?`;
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    return res.json({ Status: true, Result: result });
  });
});

router.put("/edit_employee/:id", (req, res) => {
  const id = req.params.id;
  const sql = `UPDATE employee 
        set name = ?, email = ?, salary = ?, address = ?, category_id = ? 
        Where id = ?`;
  const values = [
    req.body.name,
    req.body.email,
    req.body.salary,
    req.body.address,
    req.body.category_id,
  ];
  con.query(sql, [...values, id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.delete("/delete_employee/:id", (req, res) => {
  const id = req.params.id;
  const sql = "delete from employee where id = ?";
  const leave_sql = "delete from leave_table where employee_id=?";
  con.query(leave_sql, [id], (err) => {
    if (err) {
      return res.status(400).json({ message: "DELETE EMPLOYEE QUERY ERROR" });
    }
  });
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/admin_count", (req, res) => {
  const sql = "select count(id) as admin from admin";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/employee_count", (req, res) => {
  const sql = "select count(id) as employee from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/salary_count", (req, res) => {
  const sql = "select sum(salary) as salaryOFEmp from employee";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/admin_records", (req, res) => {
  const sql = "select id,Name,email from admin";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.put("/edit_admin/:id", (req, res) => {
  try {
    const id = req.params.id;
    const sql = `update admin set Name = ?, email = ? where id = ?`;
    con.query(sql, [req.body.name, req.body.email, +id], (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ Status: false, Error: "Query Error" + err });
      }
      return res.json({ Status: true, Result: result });
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/create_announcement", (req, res) => {
  const sql = `INSERT INTO announcements (Title,message,created_by,important) VALUES (?,?,?,?)`;
  var { id, title, message, important } = req.body;
  important = important ? 1 : 0;
  con.query(sql, [title, message, id, important], (err, result) => {
    if (err) {
      return res.status(400).json({
        Error: err.message,
        message: "CREATE ANNOUNCEMENT QUERY ERROR",
      });
    }
    res
      .status(200)
      .json({ message: "Announcement Created Successfully", result });
  });
});

router.get("/getAnnouncement/:id", (req, res) => {
  const sql = `SELECT * FROM announcements WHERE created_by = ? ORDER BY created_at DESC`;
  const { id } = req.params;
  con.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(400).json({
        Error: err.message,
        message: "FETCH ANNOUNCEMENT QUERY ERROR",
      });
    }
    res.status(200).json({ announcements: result });
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true });
});

router.get("/pending_leave", (req, res) => {
  const sql = `SELECT employee.name,leave_table.id,
    leave_table.type, leave_table.From,leave_table.To, 
    leave_table.Reason FROM leave_table 
    join employee on employee.id = leave_table.employee_id where Status="Pending"`;
  con.query(sql, (err, result) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "PENDING LEAVE FETCH ERROR", error: err });
    }
    res.status(200).json({ pending_leave: result });
  });
});

router.put("/edit_announcement", (req, res) => {
  const sql = `UPDATE announcements SET Title =?, message =?, important =? WHERE id =?`;
  const getsql = `SELECT * FROM announcements WHERE id =?`;
  var { id, title, message, important } = req.body;
  con.query(sql, [title, message, important, +id], (err) => {
    if (err) {
      return res.status(400).json({
        Error: err.message,
        message: "EDIT ANNOUNCEMENT QUERY ERROR",
      });
    }
  });
  con.query(getsql, [id], (err, result) => {
    if (err) {
      return res.status(400).json({
        Error: err.message,
        message: "GET ANNOUNCEMENT QUERY ERROR",
      });
    }
    res.status(200).json({ result });
  });
});

router.delete("/delete_announcement/:id", (req, res) => {
  const sql = `DELETE FROM announcements WHERE id =?`;
  var { id } = req.params;
  con.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(400).json({
        Error: err.message,
        message: "DELETE ANNOUNCEMENT QUERY ERROR",
      });
    }
    res
      .status(200)
      .json({ message: "Announcement Deleted Successfully", result });
  });
});

export { router as adminRouter };
