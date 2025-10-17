const db = require("../../../models");
const Facility = db.facility;
const express = require('express')
const app = express()


app.use(express.json())
const retriveFacility = (req, res) => {

    Facility.findAll({
    }).then(data => {
      var jsonArray = [];
          data.forEach((element)=>{
            jsonArray.push(element.toJSON());
          });
          console.log(jsonArray);
          res.send(jsonArray)
          }).catch ((error) => {
    console.log(error);
    return res.send(`Error when trying fetchin regions: ${error}`);
          })
      }

module.exports = {
  retriveFacility
};