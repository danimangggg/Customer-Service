 
const bcrypt = require('bcryptjs');
const db = require("../../models");
const jwt = require('jsonwebtoken');
const User = db.employee;

const login =  async (req, res) => {

        const { user_name, password } = req.body;
        const user = await User.findOne({ where: { user_name } });
        if (!user) {
          return res.status(400).json({ error: 'Invalid username or password' });
        }
        console.log(user.password)
        const isMatch = await bcrypt.compare(password, user.password);
       
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid username or password' });
        }
        
        // Get store name from stores table if store_id exists
        let storeName = null;
        if (user.store_id) {
          const [storeResult] = await db.sequelize.query(
            'SELECT store_name FROM stores WHERE id = ?',
            { replacements: [user.store_id] }
          );
          if (storeResult && storeResult.length > 0) {
            storeName = storeResult[0].store_name;
          }
        }
        
        const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ 
          message: 'Login successful', 
          token, 
          UserId: user.id, 
          FullName: user.full_name, 
          AccountType: user.account_type, 
          JobTitle: user.jobTitle, 
          store: storeName
        });
     
}

module.exports = {
    login
  };