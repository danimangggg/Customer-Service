
const db = require("../../models");
const measure = db.measurement;
const express = require('express')
const app = express()
app.use(express.json())

const retriveMeasurements = (req, res) => {

    measure.findAll({
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
  retriveMeasurements
};