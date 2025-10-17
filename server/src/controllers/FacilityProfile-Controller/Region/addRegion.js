
const db = require("../../../models");
const Region = db.region;

const addRegion = (req, res) => {
   const result = Region.create({
            region_name: req.body.region,
          });
          if(result){
            res.status(200).send({message:'Region created'})
          }
          
        }

module.exports = {
  addRegion
};
