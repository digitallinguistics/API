// validates an email and returns true or false
exports.validateEmail = function (email) {
  var regexp = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$', 'i');
  return regexp.test(email);
};
