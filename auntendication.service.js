const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./databaseStructure/user.modal')
const { v4: uuidv4 } = require('uuid'); 
class jwtAuthendication{
    constructor(){}
    user = []
    refreshTokens = []

    async findUser(userData){
    try{
      return await User.findAll({
        where: {
          phNo : userData
        }
      });
    }catch{()=>{
      return 
    }}
       
    }

    async updateUser(userData){

      try{
        return await User.update(userData,{
          where: {
           phNo : userData.phNo
          }
        })
      }catch(e){
        return e
      }
      
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
      console.log(userCred,"usercred")
      try{
        userCred.uuid = uuidv4()
        delete userCred['token']
        userCred.updatedAt = Date.now()
        userCred.createdAt =  Date.now()
       
        let data = await User.create(userCred)
        return data
      }catch(e){
        console.log(e)
        return e
      }
      
    }

    generateAccessToken(user) {
      console.log(user,"userData")
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
