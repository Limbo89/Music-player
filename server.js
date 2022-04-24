const sqlite3 = require('sqlite3').verbose();
const { request } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const app = express();
const urlencodedParser = express.urlencoded({ extended: false });
const session = require('express-session')

app.use(express.static(__dirname + "/public"));
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
    while (rs.length < 100){
        rs += abc[Math.floor(Math.random() * abc.length)];
    };
    return rs;
}
console.log(abc());
async function getdata(query, login, pass) {
    let dataq = {
        authorization: `SELECT * FROM users WHERE username = "${login}" and password = "${pass}"`,
        registration: `INSERT INTO users (id, username, password, email) VALUES (NULL, ?, ?, ?)`,
    }
    let db = new sqlite3.Database('music-player.db');
    var promise = new Promise(function (resolve, reject) {
        db.all(dataq[query], function (err, row) {
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
            res.send('Привет, admin');
        } else if (rows.length == 0) {
            res.send('Ошибо4ка');
        }
    }, (err) => {
        console.log(err + "ТАКОГО ПОЛЬЗОВАТЕЛЯ НЕТ");
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
app.listen(5000, urlencodedParser, () => {
    console.log('Server started');
});
// body = "";
// getdata(body).then((rows) => {
// });