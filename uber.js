(function () {
	// get a super method by its sub method
	// argsOrMethod is a reference to arguments or arguments.callee
	// requires prototype's to have a reference to their constructor and a reference to themselves as .prototype
	// use Function.prototype.subclass and Function.prototype.subclasses
	var getUber = function (argsOrMethod) {

		// get the sub method that we are interested in. either it was passed, or arguments was passed in which case use arguments.callee
		var method = typeof argsOrMethod === 'function' ? argsOrMethod : argsOrMethod.callee;

		// recurse the prototypal chain looking for the method that was called. return the next property in the chain by the same property name
		return (function (prototype) {

			// for each property in the prototype
			for (var methodName in prototype) {

				// if the property exists on this prototype, and is the method we are looking for
				if (prototype[methodName] === method && prototype.hasOwnProperty(methodName)) {

					// delete the circular reference from the prototype
					delete prototype.prototype;

					// get a reference to the next property in the prototypal chain by the same property name
					// prototype.prototype points to the next prototype in the chain because we just deleted the current prototype's circular reference, thereby revealing its internal prototype's circular reference
					var superMethod = prototype.prototype[methodName];

					// restore the circular reference
					prototype.prototype = prototype;

					// return whatever we found
					return superMethod;
				}
			}

			// we didnt find what we were looking for

			// delete this prototype's circular reference
			delete prototype.prototype;

			// get its parent prototype by its parents prototypes now revealed circular reference
			var nextPrototype = prototype.prototype;

			// restore the circular reference
			prototype.prototype = prototype;

			// if there was another prototype in our circular reference chain, call this method on that one, otherwise, return undefined
			return nextPrototype ? arguments.callee(nextPrototype) : undefined;

		})(this.prototype); // call the anon fn with this.prototype
	},

	// pass arguments and optionally an array of args
	// if you pass only args, the super method (or constructor) will be called with arguments
	// if you pass optional arguments, those will be used to call the uber instead
	uber = function (args,optionalArgs) {
		return this.getUber(args).apply(this,optionalArgs || args);
	},

	// used by .subclass and .subclasses
	setupInheritance = function (superclass,constructor,oldPrototype) {

		// create an empty constructor, used to get an object that inherits from the superclass proto
		var C = function () {};

		C.prototype = superclass.prototype;

		// prototype now inherits from superclass.prototype
		var prototype = new C();

		// for any properties on oldPrototype, copy them to new prototype
		// this will occur if the implementor added properties to the prototype before calling an subclass method
		for (var property in oldPrototype) {
			// only copy properties that are dircetly on the oldPrototype.
			// any old inheritance will be lost.
			if (oldPrototype.hasOwnProperty(property)) {
				prototype[property] = oldPrototype[property];
			}
		}

		// set the prototype on the constructor
		constructor.prototype = prototype;

		// give the prototype a circular reference
		// this is used to transverse the prototypal chain
		prototype.prototype = prototype;

		// give the prototype an explicit reference to its constructor
		// this is used to identify constructors for the sake of allowing uber constructors
		prototype.constructor = constructor;

		// if uber isnt in the prototype chain, add it now
		if (!prototype.uber) {

			// add uber and get uber
			// this only needs to exist once in the chain
			// without this, all classes would have to inherit from a Class class
			// instead, they all have 2 methods in common
			prototype.uber = uber;
			prototype.getUber = getUber;

			// since this class's class has to super class, these werent set for it yet

			// set the superclass's prototype's constructor so that we can call it with this.uber from the constructor function
			superclass.prototype.constructor = superclass;

			// set the superclass's prototype's circular reference so that we can look for uber methods on it in our prototype transversing routine
			superclass.prototype.prototype = superclass.prototype;
		}

		// return the constructor
		return constructor;
	};

	// SubClass.subclasses(SuperClass); // setup a dynamic inheritance
	Function.prototype.subclasses = function (superclass) {
		return setupInheritance(superclass,this,this.prototype);
	};

	// 	var SubClass = SuperClass.subclass({ // returns a constructor with a prototype formed from the object you pass. if your object has a constructor property, that will be returned.
	//  	// optional
	// 		constructor : function () {
	//			...
	//			this.uber(arguments);
	//			...
	// 		},
	// 		...
	//	});
	Function.prototype.subclass = function (properties) {
		properties = typeof properties === 'undefined' ? {} : properties;

		// if the properties object didnt define a constructor, use a generic one that just calls its uber
		var constructor = properties.hasOwnProperty('constructor') ? properties.constructor : function () {
			this.uber(arguments);
		};

		// return the constructor after setting up inheritance
		return setupInheritance(this,constructor,properties);
	};

	// just incase you want to create a class without a special constructor. if you dont want this pollution, delete it.
	Function.klass = function (prototype) {
		// if a constructor wasnt passed, add one
		prototype.constructor = prototype.hasOwnProperty('constructor') ? prototype.constructor : function () {};

		// set the constructors prototype
		prototype.constructor.prototype = prototype;

		// return the constructor
		return prototype.constructor;
	};

})();
