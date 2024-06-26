import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

/**
 * @swagger
 * components :
 *  schemas : 
 *    Employee:
 *       type : object
 *       required :
 *         - email
 *         - password
 *          
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

router.post("/employee_login", (req, res) => {
  const sql = "SELECT * from employee Where email = ?";
  const category_sql = `SELECT name from category where id=?`;
  con.query(sql, [req.body.email], (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Query error" });
    if (result.length > 0) {
      let category;
      con.query(category_sql, [result[0].category_id], (err, cat_result) => {
        if (err) {
          return res
            .status(400)
            .json({ Error: err.message, message: "CATEGORY FETCH ERROR" });
        }
        category = cat_result[0].name;
      });
      bcrypt.compare(req.body.password, result[0].password, (err, response) => {
        if (err)
          return res.json({ loginStatus: false, Error: "Wrong Password" });
        if (response) {
          const email = result[0].email;
          const token = jwt.sign(
            { role: "employee", email: email, id: result[0].id },
            "jwt_secret_key",
            { expiresIn: "1d" }
          );
          res.cookie("token", token);
          const { id, name, address, salary, image } = result[0];
          return res.json({
            loginStatus: true,
            id,
            name,
            address,
            email,
            salary,
            image,
            category,
          });
        }
      });
    } else {
      return res.json({ loginStatus: false, Error: "wrong email or password" });
    }
  });
});

router.get("/detail/:id", (req, res) => {
  const id = req.params.id;
  const sql = `SELECT employee.name , employee.id,
                employee.email ,employee.salary,employee.address,employee.image ,category.name as role 
                FROM employee join category 
                on category.id = employee.category_id
                where employee.id = ?`;
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false });
    return res.json(result);
  });
});

router.post("/apply_leave", (req, res) => {
  const sql = `INSERT INTO leave_table (type, \`From\`, \`To\`, Reason, Contact, employee_id) VALUES(?,?,?,?,?,?)`;
  const { type, From, To, Reason, Contact, employee_id } = req.body;
  con.query(
    sql,
    [type, From, To, Reason, Contact, employee_id],
    (err, result) => {
      if (err) {
        return res
          .status(400)
          .json({ Error: err, message: "INSERT LEAVE FETCH ERROR" });
      }
      res.status(200).json({ message: "Leave Applied Successfully" });
    }
  );
});

router.get("/leave_history/:id", (req, res) => {
  const sql = `SELECT * FROM leave_table WHERE employee_id=?`;
  const { id } = req.params;
  con.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(400).json({ message: "LEAVE HISTORY FETCH ERROR" });
    }
    res.status(200).json({ leave_history: result });
  });
});

router.post("/update_leave", (req, res) => {
  const sql = `update leave_table set status=?,approved_by=? where id=?`;
  const { status_msg, id, admin_id } = req.body;
  con.query(sql, [status_msg, admin_id, id], (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "UPDATE LEAVE SET ERROR", error: err });
    }
    res.status(200).json({ message: "Status Updated" });
  });
});

router.get("/get_announcement", (req, res) => {
  const sql = `SELECT announcements.Title,announcements.message,announcements.important,created_at,admin.Name as created_by
                FROM announcements 
                JOIN admin ON announcements.created_by = admin.id ORDER BY created_at DESC`;
  con.query(sql, (err, results) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "GET ANNOUNCEMENT QUERY ERROR", error: err.message });
    }
    res.status(200).json({ announcements: results });
  });
});

router.post("/create_todo", (req, res) => {
  const sql = `INSERT INTO task (name,description,createdby,duedate,priority,assigning_date) VALUES(?,?,?,?,?,?)`;
  const {
    name,
    description,
    createdby,
    duedate,
    priority,
    assigning_date,
    tags,
  } = req.body;
  let task_id;
  con.query(
    sql,
    [name, description, createdby, duedate, priority, assigning_date],
    (err, result) => {
      if (err) {
        return res
          .status(400)
          .json({ Error: err, message: "CREATE TODO FETCH ERROR" });
      }
      task_id = result.insertId;
      if (tags && tags.length > 0) {
        const tagQueries = tags.map((tag) => {
          return `INSERT INTO tags_with_task (tag_id,task_id) VALUES (${tag},${task_id})`;
        });

        // Execute each tag insertion query separately
        tagQueries.forEach((tagQuery) => {
          con.query(tagQuery, (err) => {
            if (err) {
              return res.status(400).json({
                Error: err,
                message: "INSERT TAGS_WITH_TASK QUERY ERROR",
              });
            }
          });
        });
      }
      res.status(200).json({ message: "Task Created Successfully" });
    }
  );
});

router.get("/task/completed/:id", (req, res) => {
  const sql = `SELECT COUNT(*) as completed_task FROM task WHERE status = 'Completed' and createdby = ?`;
  const { id } = req.params;
  con.query(sql, [id], (err, results) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "GET TASK QUERY ERROR", error: err.message });
    }
    res.status(200).json({ count: results[0] });
  });
});
router.get("/task/pending/:id", (req, res) => {
  const sql = `SELECT COUNT(*) as pending_task FROM task WHERE status = 'Pending' and createdby = ?`;
  const { id } = req.params;
  con.query(sql, [id], (err, results) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "GET TASK QUERY ERROR", error: err.message });
    }
    res.status(200).json({ count: results[0] });
  });
});
router.get("/task/notcompleted/:id", (req, res) => {
  const sql = `SELECT COUNT(*) as not_completed_task FROM task WHERE status = 'Not Completed' and createdby = ?`;
  const { id } = req.params;
  con.query(sql, [id], (err, results) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "GET TASK QUERY ERROR", error: err.message });
    }
    res.status(200).json({ count: results[0] });
  });
});

router.get("/task/:id", (req, res) => {
  const sql = `SELECT * FROM task WHERE createdby =?`;
  const { id } = req.params;
  con.query(sql, [id], (err, results) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "GET TASK QUERY ERROR", error: err.message });
    }
    res.status(200).json({ results });
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true });
});

export { router as EmployeeRouter };
