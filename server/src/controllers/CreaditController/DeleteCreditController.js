
const db = require("../../models");
const Creadit = db.creadit;
const fs = require('fs');
const path = require('path');

const deleteFiles = async (req, res) => {

  const file = await Creadit.findOne({
  where:{
    id:  req.params.id
  }
  });
    
  const deletePdf = () =>{
    const filePath = path.join(__basedir + "/resources/static/assets/uploads/", file.image);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`File does not exist: ${filePath}`);
        return;
      }
      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
          return;
        }
        console.log(`File deleted successfully: ${filePath}`);
      });
    });
  }
  
  deletePdf()
 
    const result = await Creadit.destroy({
      where:{
        id:  req.params.id
      }
      });
      if (result) {
        res.status(200).send({ message: 'Item deleted successfully' });
      } else {
        res.status(404).send({ message: 'Item not found' });
      }
        }

module.exports = {
  deleteFiles,
};
