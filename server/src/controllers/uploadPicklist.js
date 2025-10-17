 
const db = require("../models");
const Picklist = db.picklist;

const uploadPicklist = (req, res) => {
    if (req.file == undefined) {
      return res.send(`You must select a file.`);
    }
    
    const result = Picklist.create({
      odn: req.body.odn,
      url: req.file.filename,
      process_id: req.body.process_id,
      store: req.body.store
      });
      if(result){
        res.status(200).send({message:"picklist created"})
      }
        }

module.exports = {
  uploadPicklist,
};
