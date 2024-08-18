const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./databaseStructure/user.modal')

class jwtAuthendication{
    constructor(){}
    user = []
    refreshTokens = []

    async findUser(userData){
        return await User.findAll({
          where: {
            phNo : userData
          }
        });
    }

    async updateUser(userData){
      return await User.update(userData,{
        where: {
         phNo : userData.phNo
        }
      })
    }

    // async addUser(userCred){
    //     let {email,password} = userCred
    //     const hashedPassword = await bcrypt.hash(password, 10);
    //     const newUser = { email, password: hashedPassword };
    //     this.user.push(newUser)
    //     return {
    //         status :"sucessfully created",
    //         users : this.user
    //     }
    // }


    async createUser(userCred){
      return await User.create(userData)
    }

    generateAccessToken(user) {
        return jwt.sign({ phNo: user.phNo }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
    }

    async autendicate(userCred){
        try{
          
            const accessToken = this.generateAccessToken(userCred);
            console.log(accessToken,"accessToken")
            const refreshToken = jwt.sign({ phNo: userCred.phNo }, process?.env?.REFRESH_TOKEN_SECRET); 
            this.refreshTokens.push(refreshToken)
            console.log({ accessToken: accessToken,refreshToken : refreshToken, status :200 })        
            return { accessToken: accessToken,refreshToken : refreshToken, status :200 };
             }catch{(e)=>{
            console.log(e,"eerror")
            return e
        }}
     
  
    }

    async refreshAccessToken(token){
       return  await jwt.verify(token,  process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
              return {status: 403}
            }
            const accessToken = this.generateAccessToken(user);
             return {accessToken : accessToken }
          });

    }


    async  authenticateAccessToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
      
        if (!token) {
          return res.sendStatus(401);
        }
      
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
          if (err) {
            return res.sendStatus(403);
          }
          req.user = user;
          next();
        });
      }

   

}

module.exports = jwtAuthendication
