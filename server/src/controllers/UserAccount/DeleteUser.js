
const db = require("../../models");
const User = db.user;

const deleteUser = async (req, res) => {
 
    const result = await User.destroy({
      where:{
        id:  req.params.id
      }
      });
      if (result) {
        res.status(200).send({ message: 'User deleted successfully' });
      } else {
        res.status(404).send({ message: 'User not found' });
      }
        }

module.exports = {
  deleteUser
};
