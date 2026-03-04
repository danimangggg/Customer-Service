const db = require("../models");
const Picklist = db.picklist;

const uploadPicklist = async (req, res) => {
    try {
      if (req.file == undefined) {
        return res.status(400).send({ message: `You must select a file.` });
      }
      
      // Construct the full URL path for the file
      const fileUrl = `/picklists/${req.file.filename}`;
      
      const result = await Picklist.create({
        odn: req.body.odn,
        url: fileUrl,
        process_id: req.body.process_id,
        store: req.body.store,
        status: req.body.status || 'pending',
        operator_id: req.body.operator_id,
      });
      
      if(result){
        res.status(200).send({
          message: "Picklist created successfully",
          picklist: result
        });
      }
    } catch (error) {
      console.error('Error uploading picklist:', error);
      res.status(500).send({
        message: "Failed to upload picklist",
        error: error.message
      });
    }
}

module.exports = {
  uploadPicklist,
};
