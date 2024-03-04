import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

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

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true });
});

export { router as EmployeeRouter };
