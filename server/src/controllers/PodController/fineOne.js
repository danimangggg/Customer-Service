
const db = require("../../models");
const Pod = db.pod;

const findPod = async (req, res) => {
 
    const result = await Pod.findOne({
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
  findPod,
};
