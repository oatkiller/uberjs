this['git://github.com/oatkiller/testingjs.git']();

var runner = new Runner();

var suite = new Suite({
	runner : runner,

	setUp : function () {
	},

	tearDown : function () {
	},

	'getUber gets the right superclass method when inheritance is setup with vanilla js' : function () {
		// make a uber class
		var UberClass = function () {};

		// give it a method
		UberClass.prototype.derp = function () {
			return 'a';
		};

		// give it a reference to getUber. this is usually done by Function.prototype.subclass, but I'm not testing that in this test
		UberClass.prototype.getUber = Function.getUber;

		// make a sub class
		var SubClass = function () {};

		// setup inheritance, vanilla js style

		// make a constructor that will create a prototype that inherits from UberClass.prototype
		var C = function () {};

		// make the new constructor inherit from UberClass's prototype
		C.prototype = UberClass.prototype;

		// create Sub's prototype, which inherits from UberClass's prototype
		SubClass.prototype = new C();

		// set Sub's prototype's constructor to SubClass, otherwise it will inherit UberClass.prototype's constructor property which points to UberClass
		SubClass.prototype.constructor = SubClass;

		// give SubClass a derp method
		SubClass.prototype.derp = function () {
			// assert that getUber gets the right method
			Assert(this.getUber(arguments) === UberClass.prototype.derp,'getUber didnt work');
		};

		// create a subclass instance
		var subClass = new SubClass();

		// call derp on the subclass
		subClass.derp();

	},

	'getUber works when there is a subclass thats also a super and doesnt have the submethod' : function () {
		// make a super class
		var UberClass = function () {
		};
		// give it a uber method
		UberClass.prototype.derp = function () {
			return 'a';
		};

		// put getUber in the prototype. this is usually handled by .subclass, but we aren't testing that here
		UberClass.prototype.getUber = Function.getUber;

		// make a subclass
		var SubClass = function () {
		};

		// make a prototype constructor
		var C = function () {};

		// it will inherit from UberClass
		C.prototype = UberClass.prototype;

		// create the new prototype
		SubClass.prototype = new C();

		// overwrite the constructor property
		SubClass.prototype.constructor = SubClass;

		// make a sub sub class
	 	var SubSubClass = function () {};

		// make a function to create its constructor
		var CC = function () {};

		// it will inherit from subclass
		CC.prototype = SubClass.prototype;

		// create the new constructor
		SubSubClass.prototype = new CC();

		// update its constructor property
		SubSubClass.prototype.constructor = SubSubClass;

		// give it a derp method
		SubSubClass.prototype.derp = function () {
			// assert that getUber gets the top level class's derp method
			Assert(this.getUber(arguments) === UberClass.prototype.derp,'getUber didnt work');
		};

		// create the sub sub class
		var subSubClass = new SubSubClass();

		// call its derp
		subSubClass.derp();

	},

	'Function.prototype.subclass takes an initializer and uses the constructor to make a subclass of this' : function () {

		// create an uber class
		var UberClass = function () {
		};

		// set a property: b on its prototype
		UberClass.prototype.b = 2;

		// set another property
		UberClass.prototype.c = 2;

		// create a subclass using the subclass method
		var SubClass = UberClass.subclass({
			// the subclass will have a property b set to 1
			b : 1
		});

		// create a new subclass
		var subClass = new SubClass();

		// assert that is returns instanceof properly
		Assert(subClass instanceof SubClass,'subClass isnt an instance of SubClass');

		// assert that is returns instanceof properly for its uber
		Assert(subClass instanceof UberClass,'subClass isnt an instance of UberClass');

		// assert that the subclass overwrites the uber
		Assert(subClass.b === 1,'property wasnt overridden');

		// assert that the subclass can access properties on the UberClass's prototype
		Assert(subClass.c === 2,'property not accessible');
	},

	'Function.prototype.subclass will assign a default constructor if none is provided. this constructor calls its uber' : function () {
		// create an uber with a constructor that sets an instance property
		var UberClass = function () {
			this.a = 1;
		};

		// create an identity subclass
		var SubClass = UberClass.subclass({});

		// create an instnace of the subclass
		var subClass = new SubClass();

		// assert that its constructor was called, and that it had access to 'this'
		Assert(subClass.a === 1,'uber constructor wasnt called');
	},

	'Function.prototype.subclasses will force an existing class to inherit from the passed class.' : function () {
		var SubClass = function (payload) {
			this.a = this.getUber(arguments).apply(this,arguments) + ',suba: ' + payload;
		};
		SubClass.prototype = {
			b : 2
		};
		var UberClass = function (payload) {
			this.a = 'ubera: ' + payload;
		};
		UberClass.prototype = {
			b : 1
		};
		
		SubClass.subclasses(UberClass);

		var SubSubClass = SubClass.subclass({
			constructor : function (payload) {
				this.a = this.getUber(arguments).apply(this,arguments) + ',subsuba: ' + payload;
			},
			b : 3
		});

		var payload = '!';

		var uberClass = new UberClass(payload);
		Assert(uberClass.b === 1,'property didnt set right to begin with');
		Assert(uberClass.a === 'ubera: !');

		var subClass = new SubClass(payload);
		Assert(subClass.b === 2,'property from prototype didnt overwrite');
		Assert(subClass.a === 'ubera: !,suba: !','constructor didnt call uber constructor properly');

		var subSubClass = new SubSubClass(payload);
		Assert(subSubClass.b === 3,'property from prototype didnt overwrite');
		Assert(subSubClass.a === 'ubera: !,suba: !,subsuba: !','constructor didnt call uber constructor properly');
	},

	'Function.prototype.subclasses will throw an error if you try to break an existing inheritance' : function () {
		Assert(false,'not implemented');
	}

});

suite.run();
