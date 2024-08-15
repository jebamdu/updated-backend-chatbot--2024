const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class jwtAuthendication{
    constructor(){}
    user = []
    refreshTokens = []

    async findUser(userData){
        return await this.user.find((userVal)=>(userVal.email == userData))
    }

    async addUser(userCred){
        let {email,password} = userCred
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { email, password: hashedPassword };
        this.user.push(newUser)
        return {
            status :"sucessfully created",
            users : this.user
        }
    }

    generateAccessToken(user) {
        return jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    }

    async autendicate(userCred,res){
        try{
            let {email,password} = userCred
            let userData = await this.findUser(email)
            if(!userData){
                return new Error({status : "wrong cred"})
            }
            console.log(userData.password,"userData.password",password,"password")
            const isPasswordValid = await bcrypt.compare(password, userData.password);
            console.log(isPasswordValid,"isPasswordValid")
            if (!isPasswordValid) {
                return new Error({status :"Invalid Cred"})
            }
            const accessToken = this.generateAccessToken(userCred);
            console.log(accessToken,"accessToken")
            const refreshToken = jwt.sign({ email: userCred.email }, process?.env?.REFRESH_TOKEN_SECRET); 
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
