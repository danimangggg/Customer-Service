
const db = require("../../models");
const Task = db.task;
const express = require('express')
const app = express()
app.use(express.json())

const retriveTasks = (req, res) => {

    Task.findAll({
    }).then(data => {
      var jsonArray = [];
          data.forEach((element)=>{
            jsonArray.push(element.toJSON());
          });
          console.log(jsonArray);
          res.send(jsonArray)
          }).catch ((error) => {
    console.log(error);
    return res.send(`Error when trying fetchin tasks`);
          })
      }

module.exports = {
  retriveTasks
};