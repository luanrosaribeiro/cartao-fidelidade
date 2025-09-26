export const requireLogin = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    next();
  } else {
    res.redirect('/');
  }
};
