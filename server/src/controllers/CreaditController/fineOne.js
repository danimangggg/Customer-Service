
const db = require("../../models");
const Creadit = db.creadit;

const findFiles = async (req, res) => {
 
    const result = await Creadit.findOne({
      where:{
        id:  req.params.id
      }
      });
      if (result) {
        res.send(result);
      } else {
        res.status(404).send({ message: 'Item not found' });
      }
        }

module.exports = {
  findFiles,
};
