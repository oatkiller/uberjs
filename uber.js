(function () {
	// gets the next prototype up the chain
	/**
	 * @private
	 * @param {Object} prototype
	 * @returns {Object} prototype's prototype
	 */
	var getNextPrototype = function (prototype) {
		var constructor = prototype.constructor;
		delete prototype.constructor;
		var nextPrototype = prototype.constructor.prototype;
		prototype.constructor = constructor;
		return nextPrototype;
	},
	/**
	 * @private
	 * @param {Object} obj An object
	 * @param {Object} property Anything that should be referenced as a property of obj
	 * @returns {String} the property name that references property on obj
	 */
	getPropertyName = function (obj,property) {		
		// constructor is not iteratable in ie
		if (obj.constructor === property) {
			return 'constructor';
		}

		for (var propertyName in obj) {
			if (obj[propertyName] === property) {
				return propertyName;
			}
		}
		return undefined;
	},
	// get a super method by its sub method
	// pass arguments
	// requires prototype's to have a reference to their constructor
	// use Function.prototype.subclass and Function.prototype.subclasses
	getUber = function (args) {
		var method = args.callee,
			prototype = this.constructor.prototype,
			// check if the called method is a property of this
			methodName = getPropertyName(this,method),
			constructor,
			uberMethod;
		
		for (; prototype !== Object; prototype = getNextPrototype(prototype)) {
			// if the called method was not an instance property,
			if (methodName === undefined) {
				// check if the called method is a property of this prototype
				methodName = getPropertyName(prototype,method);
			}
			// if the method belongs to this prototype
			if (methodName !== undefined && prototype.hasOwnProperty(methodName)) {
				// dereference the called method
				delete prototype[methodName];

				// check for its uber
				uberMethod = prototype[methodName];

				// reference the called method again
				prototype[methodName] = method;

				// if no uber was found
				if (uberMethod === undefined) {
					throw new Error('no uber method found');
				}

				// return the found uber
				return uberMethod;
			}
		}
		// if the called method itself could not be found on this
		throw new Error('method not found');
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

		// give the prototype an explicit reference to its constructor
		// this is used to transverse the prototypal chain
		// prototypes in javascript have a reference to their constructor by default, so maintain it
		prototype.constructor = constructor;

		// if uber isnt in the prototype chain, add it now
		if (!('uber' in prototype)) {

			// add uber and get uber
			// this only needs to exist once in the chain
			// without this, all classes would have to inherit from a Class class
			// instead, they all have 2 methods in common
			prototype.uber = uber;
			prototype.getUber = getUber;

			// since this class's class has to super class, these werent set for it yet

			// need this to be set so that we can traverse stuff
			// TODO, assert that this is not needed before removing it
			superclass.prototype.constructor = superclass;
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
		// if the properties object didnt define a constructor, use a generic one that just calls its uber
		var constructor = properties && properties.hasOwnProperty('constructor') ? properties.constructor : function () {
			this.uber(arguments);
		};

		// return the constructor after setting up inheritance
		return setupInheritance(this,constructor,properties);
	};

	Function.klass = function (properties) {
		var constructor = properties.hasOwnProperty('constructor') ? properties.constructor : function () {};
		properties.constructor = constructor;
		constructor.prototype = properties;
		return constructor;
	};

})();
