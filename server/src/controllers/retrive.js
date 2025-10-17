
const db = require("../models");
const Creadit = db.creadit;
const path = require('path')
const express = require('express')
const app = express()


app.use(express.json())
const retriveFiles = (req, res) => {

    Creadit.findAll({
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
  retriveFiles
};