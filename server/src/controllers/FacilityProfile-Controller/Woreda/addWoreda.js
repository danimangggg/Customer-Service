const db = require("../../../models");
const Woreda = db.woreda;

const addWoreda = (req, res) => {
    const result = Woreda.create({
      region_name: req.body.region,
      zone_name: req.body.zone,
      woreda_name: req.body.woreda,
      })
        if(result){
        res.status(200).send({message:'woreda created successfully'})
          }
        }

module.exports = {
  addWoreda
};