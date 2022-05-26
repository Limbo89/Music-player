const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const nunjucks = require("nunjucks");
const urlencodedParser = express.urlencoded({ extended: false });
const session = require('express-session');
const fileUpload = require('express-fileupload');

app.use(fileUpload({}));
app.use(urlencodedParser);

nunjucks.configure('static/templates', {
    autoescape: true,
    express: app
});

app.use(express.static(__dirname + "/static"));
app.use(
    session({
        secret: abc(),
        resave: true,
        saveUninitialized: true,
    })
)

function abc() {
    var abc = "qwertyuiop[]\asdfghjkl;'zxcvbnm,./!@#$%^&*()_+1234567890-=`~*";
    var rs = "";
    while (rs.length < 100) {
        rs += abc[Math.floor(Math.random() * abc.length)];
    };
    return rs;
}
// search__playlists: `SELECT * FROM Playlist WHERE author =  ?`,

async function getdata(query, login, pass) {
    let dataq = {
        authorization: `SELECT * FROM users WHERE username = ? and password = ?`,
        search: `SELECT * FROM Compositions`,
    }
    let db = new sqlite3.Database('music-player.db');
    var promise = new Promise(function (resolve, reject) {
        db.all(dataq[query], [login, pass], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    let rows = await promise;
    db.close();
    return rows
};
async function playlists_in_player(query, author) {
    let dataq = {
        search__playlists: `SELECT * FROM Playlist WHERE author =  ?`,
    }
    let db = new sqlite3.Database('music-player.db');
    var promise = new Promise(function (resolve, reject) {
        db.all(dataq[query], [author], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    let rows = await promise;
    db.close();
    return rows
};
async function mapping(id_composition, id_playlist) {
    let dataq = {
        mapping: `INSERT INTO Mapping (id, id_composition, id_playlist) VALUES (NULL, ?, ?)`,
        search__playlists: `SELECT * FROM Playlist WHERE author =  ?`,
    }
    let db = new sqlite3.Database('music-player.db');
    var promise = new Promise(function (resolve, reject) {
        db.all(dataq["mapping"], [id_composition, id_playlist], function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    let rows = await promise;
    db.close();
    return rows
};
async function create_playlist(query, author, avatar, description, name) {
    let dataq = {
        create: `INSERT INTO Playlist (id, author, avatar_path, description, name) VALUES (NULL, ?, ?, ?, ?)`,
        search: `SELECT * FROM Playlist WHERE author = ? AND avatar_path = ? AND description = ? AND name = ?`,
    }
    let db = new sqlite3.Database('music-player.db');
    var promise_playlist = new Promise(function (resolve, reject) {
        db.run(dataq[query], [author, avatar, description, name], function (err) {
            if (err) {
                reject(err);
            } else {
                db.all(dataq['search'], [author, avatar, description, name], function (err, row) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            }
        });
    });
    let result = await promise_playlist;
    db.close();
    return result
};
async function registration(query, login, password, email) {
    let dataq = {
        registration: `INSERT INTO users (id, username, password, email) VALUES (NULL, ?, ?, ?)`,
        search: `SELECT * FROM users WHERE username = ?`,
    }
    let db = new sqlite3.Database('music-player.db');
    var promise_reg = new Promise(function (resolve, reject) {
        db.all(dataq['search'], [login], function (err, row) {
            if (err) {
                reject(err)
            }
            else if (row.length > 0) {
                resolve("Такой пользоваетель уже существунет")
            } else {
                db.run(dataq[query], [login, password, email], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve("OK");
                    }
                });
            }
        });
    });
    let result = await promise_reg;
    db.close();
    return result
};
// z = "insert into table values (?, ?, ?, ?)"
// m = [ [1,1], [1,2] ]
// for (item of m) {
//     db.run(z, item, () => )
// }
// async function create_playlist(query, author, avatar, description, name) {
//     let dataq = {
//         create: `INSERT INTO Mapping (id, author, avatar_path, description, name) VALUES (NULL, ?, ?, ?, ?)`,
//     }
//     let db = new sqlite3.Database('music-player.db');
//     var promise_playlist = new Promise(function (resolve, reject) {
//         db.run(dataq[query], [author, avatar, description, name], function (err) {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve("OK");
//             }
//         });
//     });
//     let result = await promise_playlist;
//     db.close();
//     return result
// };
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/auth", (req, res) => {
    let password = req.body.pass;
    let username = req.body.username;
    let body__req = "authorization";
    getdata(body__req, username, password).then((rows) => {
        if (rows.length > 0) {
            req.session.auth = true;
            req.session.username = username;
            res.redirect("player");
        } else if (rows.length == 0) {
            res.send('Ошибо4ка');
        }
    }, (err) => {
        console.log(err + " ТАКОГО ПОЛЬЗОВАТЕЛЯ НЕТ");
    });
});
app.post("/register", (req, res) => {
    let username = req.body.username;
    let password = req.body.pass;
    let password_confirm = req.body.pass_confirm;
    let email = req.body.email;
    let body__req = "registration";
    if (password === password_confirm) {
        console.log("Пароли совподают");
        registration(body__req, username, password, email).then((result) => {
            res.redirect("/");
        }, (err) => {
            res.send(err)
        })
    } else {
        res.send("Пароли не совподают");
    }
});

app.get("/registration", (req, res) => {
    res.sendFile(__dirname + "/registration.html");
});

app.use((req, res, next) => {
    if (req.session.auth) {
        next();
    } else {
        res.redirect("/");
    }
});

app.get("/player", (req, res) => {
    let body__req = "search";
    let username = req.session.username;
    getdata(body__req).then((rows) => {
        let body__req = "search__playlists";
        playlists_in_player(body__req, username).then((playlists) => {
            let datatemplate = {
                "tracks": rows,
                "playlists":playlists,
            };
            res.render("player.njk", datatemplate);
        }, (err) => {
            console.log(err + " Ошибка при получении плейлистов");
        });
        // res.render("player.njk", datatemplate);
    }, (err) => {
        console.log(err + " Ошибка при получении композиций");
    });
});

app.get("/logout", (req, res) => {
    if (req.session.auth) {
        delete req.session.auth;
        res.redirect("/");
    } else {
        res.send("Вы не авторизованны");
    }
});

app.get("/create__playlist", (req, res) => {
    let body__req = "search";
    getdata(body__req).then((rows) => {
        let datatemplate = {
            "data": rows
        }
        res.render("create__playlist.njk", datatemplate);
    }, (err) => {
        console.log(err + " Ошибка при получении композиций");
    });
});

app.post("/create__playlist__serv", (req, res) => {
    let body__req = "create";
    if (req.files) {
        req.files.avatar_playlist.mv('static/images/' + req.files.avatar_playlist.name);
        var avatar_path = "/static/images/" + req.files.avatar_playlist.name;
    } else {
        var avatar_path = "/static/images/default.jpg";
    }
    let name_playlist = req.body.name_playlist;
    let description = req.body.description;
    let author = req.session.username;
    create_playlist(body__req, author, avatar_path, description, name_playlist).then((result) => {
        let id_playlist = result[0]['id'];
        res.redirect("/playlist/" + id_playlist);
    }, (err) => {
        res.send(err)
    });
});

app.get("/playlist/:id", (req, res) => {
    let id = req.params["id"];
    let body__req = "search";
    getdata(body__req).then((rows) => {
        let datatemplate = {
            "data": rows,
            "id":id,
        }
        res.render("playlist.njk", datatemplate);
    }, (err) => {
        console.log(err + " Ошибка при получении композиций");
    });
});

app.post("/mapping", (req, res) => {
    let track = req.body.track;
    let id = req.body.id;
    for(i=0; i<track.length; i++){
        mapping(track[i], id).then((rows) => {
            res.redirect("/player");
        }, (err) => {
            res.send(err)
        });
    }
});

app.listen(5000, () => {
    console.log('Server started');
});