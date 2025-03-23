const checkRole = (roles) => {
    return (req, res, next) => {
      // Make sure that the auth middleware ran first and req.user exists
      if (!req.user) {
        return res.status(401).json({ msg: "Authorization required" });
      }
  
      // Check if user has the required role
      if (roles.includes(req.user.role)) {
        // User has one of the required roles, allow access
        next();
      } else {
        // User doesn't have the required role
        return res.status(403).json({ 
          msg: "Access denied. Insufficient permissions." 
        });
      }
    };
  };
  
  module.exports = checkRole;