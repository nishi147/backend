const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        console.warn(`[AUTH] Missing token for request: ${req.method} ${req.originalUrl} from ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Account no longer exists' });
        }
        
        next();
      } catch (err) {
    console.error("JWT Verification Error: ", err.message);
    return res.status(401).json({ success: false, message: 'Session expired or invalid, please login again' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied: Role '${req.user.role}' is not authorized for this action`
            });
        }
        next();
    };
};
