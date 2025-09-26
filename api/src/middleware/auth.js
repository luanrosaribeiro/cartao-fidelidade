const requireLogin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Acesso não autorizado. É necessário fazer login.' });
  }
};

module.exports = {
  requireLogin
};
