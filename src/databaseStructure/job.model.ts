import { sequelize } from './dbconnection.js';
import { DataTypes } from "sequelize";
const Job = sequelize.define("jobs", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID if not provided
        primaryKey: true,
        allowNull: false,
    },
    source: {
        type: DataTypes.ENUM("linkedin", "naukri"),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING
    },
    company: {
        type: DataTypes.STRING,
    },
    location: {
        type: DataTypes.STRING,
    },
    companyLogoURL: {
        type: DataTypes.STRING,
    },
    postDate: {
        type: DataTypes.STRING,
    },
    applylink: {
        type: DataTypes.STRING,
    },
    jobid: {
        type: DataTypes.STRING,
    },
    skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
    },
    experience: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    jobDesc: {
        type: DataTypes.STRING
    },
    scrapedDate: {
        type: DataTypes.DATE,
        defaultValue: new Date().getTime(),
        allowNull:false
    }


}, {
    timestamps: true, // Enables `createdAt` and `updatedAt` automatically
    createdAt: 'createdAt', // Custom column name for `createdAt`
    updatedAt: 'updatedAt', // Custom column name for `updatedAt`
}
);

Job.sync({ alter: true })
    .then(async () => {
        console.log("Job Model synced");
    })
    .catch(err => console.error("Error syncing Job model:", err));

export default Job;
