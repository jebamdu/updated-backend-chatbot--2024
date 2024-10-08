import jwt from 'jsonwebtoken';
import User from './databaseStructure/user.modal.js'
import uuidv4 from 'uuidv4';
import redisCon from './DBConnections/redisConnection.js';
export default class JWTAuthendication {

  static async findUser(userData) {
    try {
      return await User.findAll({
        where: {
          phNo: userData
        }
      });
    } catch {
      () => {
        return
      }
    }

  }

  static async updateUser(userData) {

    try {
      return await User.update(userData, {
        where: {
          phNo: userData.phNo
        }
      })
    } catch (e) {
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


  static async createUser(userCred) {
    console.log(userCred, "usercred")
    try {
      userCred.uuid = uuidv4()
      delete userCred['token']
      userCred.updatedAt = Date.now()
      userCred.createdAt = Date.now()

      let data = await User.create(userCred)
      return data
    } catch (e) {
      console.log(e)
      return e
    }

  }

  static generateAccessToken(user) {
    console.log(user, "userData")
    return jwt.sign({ phNo: user.phNo }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
  }

  static async autendicate(userCred) {
    try {

      const accessToken = this.generateAccessToken(userCred);
      console.log(accessToken, "accessToken")
      const refreshToken = jwt.sign({ phNo: userCred.phNo }, process?.env?.REFRESH_TOKEN_SECRET);
      // this.refreshTokens.push(refreshToken)
      redisCon.lpush('refreshTokens', refreshToken)
      console.log({ accessToken: accessToken, refreshToken: refreshToken, status: 200 })
      return { accessToken: accessToken, refreshToken: refreshToken, status: 200 };
    } catch {
      (e) => {
        console.log(e, "eerror")
        return e
      }
    }


  }

  static async genarateAccessToken(token) {
    return await jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return { status: 403 }
      }
      const accessToken = this.generateAccessToken(user);
      return { accessToken: accessToken }
    });

  }


  static async authenticateAccessToken(req, res, next) {
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

