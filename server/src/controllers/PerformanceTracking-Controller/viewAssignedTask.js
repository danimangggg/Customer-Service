
const db = require("../../models");
const assignedTask = db.assignedTask;
const express = require('express')
const app = express()
app.use(express.json())

const retriveAssignedTasks = (req, res) => {

    assignedTask.findAll({
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
  retriveAssignedTasks
};