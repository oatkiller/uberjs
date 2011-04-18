this['git://github.com/oatkiller/testingjs.git']();

var runner = new Runner();

var suite = new Suite({
	runner : runner,

	setUp : function () {
	},

	tearDown : function () {
	},

	// subclass
	'subclass creates a sub class' : function () {
		var Uber = function () {
		};
		var Sub = Uber.subclass();
		Assert((new Sub()) instanceof Uber,'subclass didnt work');
	},

	// subclass subclass
	'subclass works on a subclass' : function () {
		var Uber = function () {
			this.a = 'a';
		};
		var Sub = Uber.subclass();
		var SubSub = Sub.subclass();
		var instance = new SubSub();
		Assert(instance instanceof Sub && instance instanceof Uber,'subclass didnt work');
		Assert(instance.a === 'a','subclass didnt work');
	},

	// subclasses
	'subclasses forces an existing class to inherit from an uber class. existing methods are preserved' : function () {
		var Sub = function () {
		};
		Sub.prototype.derp = function () {
		};
		var Uber = function () {
		};
		Sub.subclasses(Uber);
		var instance = new Sub();
		Assert(instance instanceof Uber,'subclasses didnt work');
		Assert('derp' in instance,'subclasses didnt preserve existing prototype');
	},

	// uber on first uber
	'uber calls the uber version of a method, passing all the same arguments' : function () {
		var Uber = function () {
			this.a = 'a';
		};
		Uber.prototype.derp = function () {
			return this.a;
		};
		var Sub = Uber.subclass({
			b : 'b',
			derp : function () {
				return this.b + this.uber(arguments);;
			}
		});
		var instance = new Sub();
		Assert(instance.derp() === 'ba','uber didnt work well');
	},

	// uber that calls uber
	'uber can work two levels deep' : function () {
		var Uber = function () {
			this.a = 'a';
		};
		Uber.prototype.derp = function () {
			return this.a;
		};
		var Sub = function () {
			this.uber(arguments);
		};
		Sub.prototype = {
			constructor : Sub,
			b : 'b',
			derp : function () {
				return this.b + this.uber(arguments);
			}
		};
		Sub.subclasses(Uber);
		var SubSub = Sub.subclass({
			c : 'c',
			derp : function () {
				return this.c + this.uber(arguments);
			}
		});
		var instance = new SubSub();
		Assert(instance.derp() === 'cba','didnt work');

	},

	// uber that skips a uber class
	'uber can find a uber method thats not it its prototypes prototype' : function () {
		var Uber = function () {
			this.a = 'a';
		};
		Uber.prototype.derp = function () {
			return this.a;
		};
		var Sub = Uber.subclass();
		var SubSub = Sub.subclass({
			b : 'b',
			derp : function () {
				return this.b + this.uber(arguments);
			}
		});

		var instance = new SubSub();
		Assert(instance.derp() === 'ba','nopes');
	},

	// uber can call a constructor
	'uber works with constructors' : function () {
		var Uber = function () {
			this.a = 'a';
		};
		var Sub = function () {
			this.uber(arguments);
		};
		Sub.subclasses(Uber);
		var instance = new Sub();
		Assert(instance.a === 'a','no');
	},

	// getUber works
	'getUber works too' : function () {
		var uberDerp = function () {
		};

		var Uber = function () {
		};
		Uber.prototype.derp = uberDerp;
		var Sub = function () {
		};
		Sub.subclasses(Uber);
		Sub.prototype.derp = function () {
			return this.getUber(arguments);;
		};
		var instance = new Sub();
		Assert(instance.derp() === uberDerp,'no');
	},

	// getUber can get a constructor
	'getUber can resolve a constructor' : function () {
		var subConstructorRan = false;
		var Uber = function () {
		};
		var Sub = Uber.subclass({
			constructor : function () {
				subConstructorRan = true;
				Assert(this.getUber(arguments) === Uber,'no');
			}
		});
		var instance = new Sub();
		Assert(subConstructorRan === true,'noo');
	},

	// klass works
	'klass creates a constructor' : function () {
		var Uber = Function.klass({
			constructor : function () {
				this.a = 'a';
			},
			derp : function () {
				return this.a + 'b';
			}
		});
		var instance = new Uber();
		Assert(instance instanceof Uber,'no');
		Assert(instance.derp() === 'ab','no');
	}
});

suite.run();
