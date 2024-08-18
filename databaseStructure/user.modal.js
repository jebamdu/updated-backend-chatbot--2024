const { sequelize } = require('./dbconnection');
const { DataTypes } = require("sequelize");
const User = sequelize.define("user", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID if not provided
        primaryKey: true,
        allowNull: false,
    },
    mobDeviceId:{
        type : DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
    },
    phNo: {
        type: DataTypes.STRING,
        unique: true,
    },
    profile: {
        type: DataTypes.INTEGER,
    },
    professionalStatus: {
        type: DataTypes.INTEGER,
    },
    workExperience: {
        type: DataTypes.INTEGER,
    },
    course: {
        type: DataTypes.INTEGER,
    },
    state: {
        type: DataTypes.INTEGER,
    },
    district: {
        type: DataTypes.INTEGER,
    },
    name: {
        type: DataTypes.STRING,
    },
    yob: {
        type: DataTypes.INTEGER,
    },
    gender: {
        type: DataTypes.INTEGER,
    },
    
},{
    timestamps: true, // Enables `createdAt` and `updatedAt` automatically
    createdAt: 'created_at', // Custom column name for `createdAt`
    updatedAt: 'updated_at', // Custom column name for `updatedAt`
  }
);

User.sync()
    .then(async () => {
        console.log("User Model synced");
    })
    .catch(err => console.error("Error syncing User model:", err));

module.exports = User;
