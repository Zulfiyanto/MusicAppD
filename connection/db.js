const mysql = require("mysql2");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Istyanto12",
  database: "db_musicapp",
});

module.exports = connection;
