
const db = require("../../models");
const User = db.user;
const express = require('express')
const app = express()
app.use(express.json())

const retriveUsers = (req, res) => {

    User.findAll({
    }).then(data => {
      var jsonArray = [];
          data.forEach((element)=>{
            jsonArray.push(element.toJSON());
          });
          console.log(jsonArray);
          res.send(jsonArray)
          }).catch ((error) => {
    console.log(error);
    return res.send(`Error when trying fetchin users`);
          })
      }

module.exports = {
  retriveUsers
};