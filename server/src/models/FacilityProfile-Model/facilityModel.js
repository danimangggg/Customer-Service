module.exports = (sequelize, DataTypes) => {
    const Facility = sequelize.define("Facilities", {
      region_name: {
        type: DataTypes.STRING,
      },
      zone_name: {
        type: DataTypes.STRING,
      },
      woreda_name: {
        type: DataTypes.STRING,
      },
      facility_name: {
        type: DataTypes.STRING,
      }, 
      facility_type: {
        type: DataTypes.STRING,
      },
    })
  
    return Facility;
  };