//load mudules
const http = require("http");
const path = require("path");
const express = require("express");
const hbs = require("hbs");
const session = require("express-session");
const uploadFIles = require("./middlewares/uploadFIles");

// Load Databse
const mysqldb = require("./connection/db");

//create express server
const app = express();
const PORT = 5000;

//create a server for listen
const server = http.createServer(app);

// get data from html
app.use(express.json());
//get data from client side
app.use(express.urlencoded({ extended: false }));
//set app to use handlebarJS
app.set("view engine", "hbs");
//make public and uploads folder can read
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//register partial mode
hbs.registerPartials(__dirname + "/views/partials");

// Create Session
app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
    },
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: true,
    secret: "arishem",
  })
);

// Save to local Message
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

let isLogin = true;
var pathFile = "http://localhost:5000/uploads/";

// Get Data
// Dashboard
app.get("/", (req, res) => {
  let sql = `SELECT G.id AS id_genre,G.name AS genre,M.*,A.name FROM tb_music M JOIN tb_artis A ON M.artis_id = A.id JOIN tb_genre G ON M.genre_id = G.id ORDER BY id DESC`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      //   validation match
      let musics = [];

      for (let i of result) {
        musics.push({
          id: i.id,
          genreId: i.id_genre,
          title: i.title,
          music: i.music,
          name: i.name,
          cover_music: pathFile + i.cover_music || i.cover_music,
          genre_name: i.genre,
        });
      }

      sql = `SELECT * FROM tb_playlist ORDER BY id DESC`;
      con.query(sql, (err, results) => {
        if (err) throw err;
        //   validation match
        let playlists = [];

        for (let i of results) {
          playlists.push({
            id: i.id,
            name: i.name,
          });
        }
        sql = `SELECT * FROM tb_genre ORDER BY id DESC`;
        con.query(sql, (err, results) => {
          if (err) throw err;
          let genre = [];

          for (let i of results) {
            genre.push({
              id: i.id,
              name: i.name,
            });
          }
          sql = `SELECT * FROM tb_artis ORDER BY id DESC`;
          con.query(sql, (err, results) => {
            if (err) throw err;
            let artis = [];

            for (let i of results) {
              artis.push({
                id: i.id,
                name: i.name,
                photo: i.photo,
              });
            }
            res.render("index", {
              isLoginAdmin: req.session.isLoginAdmin,
              isLoginUser: req.session.isLoginUser,
              user: req.session.users,
              musics,
              artis,
              genre,
              playlists,
            });
          });
        });
      });
    });
  });
});
// Playlist
app.get("/playlist/:id", (req, res) => {
  const id = req.params.id;
  let sql = `SELECT * FROM tb_playlist WHERE id = ${id}`;

  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      sql = `SELECT P.id,M.id,M.title,M.cover_music,A.name FROM tb_music M
      JOIN tb_playlists_song PS ON M.id = PS.music_id
      JOIN tb_artis A ON M.artis_id = A.id
      JOIN tb_playlist P ON PS.playlist_id = P.id
      WHERE P.id = ${id}
      ORDER BY M.id DESC;`;
      con.query(sql, (err, result) => {
        if (err) throw err;
        let playlists = [];
        for (let i of result) {
          playlists.push({
            id: i.id,
            title: i.title,
            cover_music: i.cover_music,
            name: i.name,
          });
        }
        res.render("playlistSection", {
          isLogin: req.session.isLogin,
          playlists,
          isLoginAdmin: req.session.isLoginAdmin,
          isLoginUser: req.session.isLoginUser,
          user: req.session.users,
        });
      });
    });
  });
});
// playlist input
app.get("/playlistInput", (req, res) => {
  const sql = `SELECT M.*,A.name FROM tb_music M JOIN tb_artis A ON M.artis_id = A.id ORDER BY id DESC;`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      //   validation match
      let musics = [];

      for (let i of result) {
        musics.push({
          id: i.id,
          title: i.title,
          music: i.music,
          name: i.name,
          cover_music: i.cover_music,
        });
      }

      res.render("playlistInput", {
        isLogin,
        musics,
        isLoginAdmin: req.session.isLoginAdmin,
        isLoginUser: req.session.isLoginUser,
        user: req.session.users,
      });
    });
  });
});

app.get("/music/:id", (req, res) => {
  const id = req.params.id;
  let sql = `SELECT G.id AS id_genre,G.name AS genre,M.*,A.name FROM tb_music M JOIN tb_artis A ON M.artis_id = A.id JOIN tb_genre G ON M.genre_id = G.id WHERE M.id = ${id};`;

  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      const musicData = {
        id: result[0].id,
        cover: pathFile + result[0].cover_music,
        title: result[0].title,
        music: result[0].music,
        genre: result[0].genre,
        artis: result[0].name,
      };
      res.render("musicDetail", {
        isLogin: req.session.isLogin,
        musicData,
        isLoginAdmin: req.session.isLoginAdmin,
        isLoginUser: req.session.isLoginUser,
        user: req.session.users,
      });
    });
  });
});

app.get("/editPlaylist/:id", (req, res) => {
  const id = req.params.id;

  let sql = `SELECT * FROM tb_article WHERE id = ${id}`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      const playlistD = {
        ...result[0],
      };
      res.render("playlistSection", {
        isLogin: req.session.isLogin,
        playlistD,
        isLoginAdmin: req.session.isLoginAdmin,
        isLoginUser: req.session.isLoginUser,
        user: req.session.users,
      });
    });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM tb_music WHERE id = ${id}`;

  mysqldb.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(sql, function (err, results) {
      if (err) throw err;
      res.redirect("/");
    });
  });
});

app.get("/edit/:id", (req, res) => {
  const { id } = request.params;

  const sql = `SELECT G.id AS id_genre,G.name AS genre,M.*,A.name FROM tb_music M JOIN tb_artis A ON M.artis_id = A.id JOIN tb_genre G ON M.genre_id = G.id WHERE M.id = ${id};`;

  mysqldb.getConnection((err, conn) => {
    if (err) throw err;
    conn.query(sql, (err, result) => {
      if (err) throw err;

      const DataMusic = {
        id: result[0].id,
        title: result[0].title,
        music: result[0].music,
        cover: pathFile + result[0].cover_music,
      };

      console.log(DataMusic.id);

      res.render("musicDetail", {
        isLogin: req.session.isLogin,
        DataMusic,
        isLoginAdmin: req.session.isLoginAdmin,
        isLoginUser: req.session.isLoginUser,
        user: req.session.users,
      });
    });
  });
});

// Handler function
// Register
app.post("/regist", (req, res) => {
  const { email, password, status } = req.body;
  // validation input
  if (!email || !password || !status) {
    req.session.message = {
      type: "danger",
      message: "Be sure insert all field",
    };
    return res.redirect("/");
  }
  const sql = `INSERT INTO tb_user (email,password,status) VALUES ('${email}','${password}','${status}')`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      req.session.message = {
        type: "success",
        message: "Register has successfully",
      };

      res.redirect("/");
    });
  });
});
// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.message = {
      type: "danger",
      message: "Be sure insert all field",
    };
    return res.redirect("/");
  }
  const sql = `SELECT *, MD5(password) as password FROM tb_user WHERE email='${email}' AND password='${password}'`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      //   validation match
      if (result.length == 0) {
        req.session.message = {
          type: "danger",
          message: "Email and password dont match!",
        };
        return res.redirect("/");
      } else {
        req.session.message = {
          type: "success",
          message: "Login has successfully!",
        };
        if (result[0].status == 1) {
          req.session.isLoginAdmin = result[0].status;
        } else if (result[0].status == 2) {
          req.session.isLoginUser = result[0].status;
        }

        req.session.users = result[0].email;
        req.session.user = {
          id: result[0].id,
          email: result[0].email,
          status: result[0].status,
        };
      }
      res.redirect("/");
    });
  });
});
// Add Playlist
app.post("/addPlaylist", (req, res) => {
  const { name } = req.body;
  let user_id = req.session.user.id;
  console.log(req.session.user.email);

  if (!name) {
    req.session.message = {
      type: "danger",
      message: "Be sure insert all field",
    };
    return res.redirect("/");
  }

  const sql = `INSERT INTO tb_playlist (name,user_id) VALUES ('${name}','${user_id}')`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      req.session.message = {
        type: "success",
        message: "Playlist has successfully added",
      };
      res.redirect(`/playlist/:${user_id}`);
    });
  });
});
// Add Music
app.post("/addMusic", uploadFIles("image"), (req, res) => {
  const { title, music, genre, artis } = req.body;
  let cover = req.file.filename;

  if (!title || !music || !genre || !artis) {
    req.session.message = {
      type: "danger",
      message: "Be sure insert all field",
    };
    return res.redirect("/");
  }

  let sql = `INSERT INTO tb_music (title,cover_music,music,genre_id,artis_id) VALUES ('${title}','${cover}','${music}','${genre}','${artis}')`;
  mysqldb.getConnection((err, con) => {
    if (err) throw err;
    con.query(sql, (err, result) => {
      if (err) throw err;
      req.session.message = {
        type: "success",
        message: "Music has successfully added",
      };
      res.redirect(`/`);
    });
  });
});
app.post("/edit", uploadFIles("image"), (req, res) => {
  let { id, title, cover, music, genre, artis } = req.body;

  let image = cover.replace(pathFile, "");

  if (req.file) {
    image = req.file.filename;
  }

  let sql = `UPDATE tb_music SET cover_music = "${image}", title = "${title}", music = "${music}",genre_id = "${genre}",artis_id = "${artis}" WHERE id = ${id}`;

  mysqldb.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(sql, function (err, results) {
      if (err) throw err;

      res.redirect(`/music/${id}`);
    });
  });
});

server.listen(PORT, console.log("server listening on port " + PORT));
