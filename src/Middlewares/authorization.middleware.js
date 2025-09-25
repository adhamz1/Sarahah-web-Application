

   export const authorizationMiddle =(allowedRoles)=>{
      return (req,res,next)=>{

      const {user:{role}} = req.loggedInUser

      if(!allowedRoles.includes(role)) return res.status(400).json({message:"Unauthorized"})
      next()
      }
   }