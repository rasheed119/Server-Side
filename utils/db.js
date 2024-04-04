import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.PASS,
  database: "employee_management_system",
  multipleStatements: true,
});

con.connect(function (err) {
  if (err) {
    console.log("connection error");
  } else {
    console.log("Connected");
  }
});

export default con;
