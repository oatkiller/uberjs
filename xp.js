var C = function () {};
C.prototype = {constructor : C};
var c = new C();
console.debug(c.constructor === C);

