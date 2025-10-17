
const db = require("../../models");
const Pod = db.pod;
const express = require('express')
const app = express()

app.use(express.json())

const retrivePods = (req, res) => {

    Pod.findAll({
    }).then(data => {
      var jsonArray = [];
          data.forEach((element)=>{
            jsonArray.push(element.toJSON());
          });
          console.log(jsonArray);
          res.send(jsonArray)
          }).catch ((error) => {
    console.log(error);
    return res.send(`Error when trying fetchin images: ${error}`);
          })
      }

module.exports = {
  retrivePods
};