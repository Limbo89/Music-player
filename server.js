const sqlite3 = require('sqlite3').verbose();
const { request } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const app = express();
const nunjucks = require("nunjucks");
const urlencodedParser = express.urlencoded({ extended: false });
const session = require('express-session');
const res = require('express/lib/response');

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
                console.log(row)
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
}
app.get("/", urlencodedParser, (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
app.post("/auth", urlencodedParser, (req, res) => {
    password = req.body.pass;
    username = req.body.username;
    body__req = "authorization";
    getdata(body__req, username, password).then((rows) => {
        if (rows.length > 0) {
            req.session.user_auth = true;
            res.redirect("player");
        } else if (rows.length == 0) {
            res.send('Ошибо4ка');
        }
    }, (err) => {
        console.log(err + " ТАКОГО ПОЛЬЗОВАТЕЛЯ НЕТ");
    });
});
app.post("/register", urlencodedParser, (req, res) => {
    username = req.body.username;
    password = req.body.pass;
    password_confirm = req.body.pass_confirm;
    email = req.body.email;
    body__req = "registration";
    if (password === password_confirm) {
        console.log("Пароли совподают");
        registration(body__req, username, password, email).then((result) => {
            res.send(result)
        }, (err) => {
            res.send(err)
        })
    } else {
        res.send("Пароли не совподают");
    }
});
app.get("/registration", urlencodedParser, (req, res) => {
    res.sendFile(__dirname + "/registration.html");
});
app.use((req, res, next) => {
    if (req.session.user_auth) {
        next();
    } else {
        res.redirect("/");
    }
});
app.get("/player", urlencodedParser, (req, res) => {
    body__req = "search";
    getdata(body__req).then((rows) => {
        console.log(rows);
        let datatemplate = {
            "data": rows
        }
        console.log();
        res.render("player.njk", datatemplate);
    }, (err) => {
        console.log(err + " Ошибка при получении композиций");
    });
});
app.get("/logout", (req, res) => {
    if (req.session.user_auth) {
        delete req.session.user_auth;
        res.redirect("/");
    } else {
        res.send("Вы не авторизованны");
    }
});

// app.get("/test", urlencodedParser, (req, res) => {
//     res.send('<a href="/logout">Выйти</a>');
// });

app.listen(5000, urlencodedParser, () => {
    console.log('Server started');
});

// body = "";
// getdata(body).then((rows) => {
// });