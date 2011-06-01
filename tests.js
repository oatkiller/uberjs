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
			return this.getUber(arguments);
		};
		var instance = new Sub();
		Assert(instance.derp() === uberDerp,'no');
	},

	'getUber works when there is a property called undefined' : function () {
		var uberUberUberUberCount = 0,
			uberUberUberCount = 0,
			uberUberCount = 0,
			uberCount = 0;

		var UberUberUberUber = Function.klass({
			herp : function () {
				uberUberUberUberCount++;
			}
		});

		var UberUberUber = UberUberUberUber.subclass({
			herp : function () {
				this.uber(arguments);
				uberUberUberCount++;
			}
		});

		var UberUber = UberUberUber.subclass();

		var Uber = UberUber.subclass();

		var Sub = Uber.subclass({
			undefined : true
		});

		var sub = new Sub();
		sub.herp();
		Assert(uberUberUberUberCount === 1);
		Assert(uberUberUberCount === 1);
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

	'' : function () {
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
	},

	// documentation examples
	'derp' : function () {
		// Create a 'class' using plain JavaScript
		var Widget = function (id) {
			this.id = id;
		};
		Widget.prototype = {
			set : function (value) {
				this.value = value;
			},
			get : function () {
				return this.value;
			},
			toString : function () {
				return 'Widget: ' + this.id;
			}
		};

		// Or create a 'class' using the .klass shortcut
		var Widget = Function.klass({
			constructor : function (id) {
				this.id = id;
			},
			set : function (value) {
				this.value = value;
			},
			get : function () {
				return this.value;
			},
			toString : function () {
				return 'Widget: ' + this.id;
			}
		});

		// make a subclass with .subclass
		var ValidatingWidget = Widget.subclass({
			validator : function () {
				throw new Error('must be overridden');
			},
			set : function (value) {
				if (this.validator(value)) {
					// call the overridden method with this.uber(arguments);
					this.uber(arguments);
				} else {
					throw new Error('validation failed');
				}
			}
		});

		// .subclass works on subclasses
		var NumberWidget = ValidatingWidget.subclass({
			validator : function (value) {
				// must be a number and not Not a Number
				return typeof value === 'number' && !isNaN(value);
			}
		});

		// You can set inheritance on an existing class using .subclasses
		// how you create a class is not important
		var StringWidget = function () {};
		StringWidget.prototype.validator = function (value) {
			return typeof value === 'string';
		};
		// .subclasses takes a super class
		StringWidget.subclasses(ValidatingWidget);

		// this.uber can take a second optional array of arguments
		var Person = Function.klass({
			setInfo : function (name,age) {
				this.name = name;
				this.age = age;
			}
		});

		// call the overridden method with name, age, instead of the arguments that this was called with
		var Employee = Person.subclass({
			setInfo : function (title,name,age) {
				this.title = title;

				this.uber(arguments,[name,age]);
			}
		});

		// getUber can be used to get the overridden method
		var Employee = Person.subclass({
			setInfo : function (title,name,age) {
				this.title = title;

				this.getUber(arguments).call(this,name,age);
			}
		});

	}
});

suite.run();
