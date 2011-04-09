(function () {
	var getMethodName = function (callee,prototype) {
						
		// find the name of the method we are calling
		for (var propertyName in prototype) {
			if (prototype[propertyName] === callee) {
				return propertyName;
			}
		}
	};

	Function.getUber = function (args) {

		var methodName = getMethodName(args.callee,this.constructor.prototype);

		// if we dont find it, throw an error
		if (typeof methodName === 'undefined') {
			throw new Error('couldn\'t find this method');
		}

		// look on this prototype
		return (function (constructor) {
			var prototype = constructor.prototype;

			// if you find it
			if (prototype.hasOwnProperty(methodName)) {
				// get the next thing beneath it

				// temporarily remove the method
				delete prototype[methodName];

				// look underneath
				var superMethod = prototype[methodName];

				// put the method back
				prototype[methodName] = args.callee;

				// is it defined?
				if (typeof superMethod === 'undefined') {
					// if not, throw an error
					throw new Error('couldn\'t find a uber method by the name of: ' + methodName);
				} else {
					// if so, return it
					return superMethod;
				}
			} else {
				// if not, is there another prototype?
				delete constructor.prototype.constructor;
				var nextConstructor = constructor.prototype.constructor;
				constructor.prototype.constructor = constructor;

				if (typeof nextConstructor === 'undefined') {
					// if constructor isnt defined, throw an error
					throw new Error('couldn\'t navigate prototype using constructor property.');
				} else if (constructor === Object) {
					// if constructor is Object, throw an error
					throw new Error('walked all the way back to Object without finding your method');
				} else {
					// if so, look there
					return arguments.callee(nextConstructor);
				}
			}
		})(this.constructor);
	};
})();

Function.prototype.subclass = function (initializer) {
	if (!('getUber' in this.prototype)) {
		this.prototype.getUber = Function.getUber;
	}

	// get the passed constructor, or create a default one that just calls its uber
	var constructor = 'constructor' in initializer && initializer.constructor !== Object ? initializer.constructor : function () {
		this.getUber(arguments).apply(this,arguments);
	};

	// create a throw away function that will construct the new prototype
	var PrototypeConstructor = function () {};

	// set this prototype to the PrototypeConstructor's prototype so that the new prototype will inherit from this
	PrototypeConstructor.prototype = this.prototype;

	// create the new prototype
	var prototype = new PrototypeConstructor();

	// set the new prototype on the new constructor
	constructor.prototype = prototype;

	// set the new prototype's constructor to the new constructor. otherwise, it will point to this
	prototype.constructor = constructor;

	// copy properties to new constructor
	for (var propertyName in initializer) {
		// dont worry about ignoring constructor, if thats there. just rewrite it. doing that should be faster than doing a bunch of false ifs
		prototype[propertyName] = initializer[propertyName];
	}

	// return the new fancy constructor
	return constructor;
};

/*
(function () {
	// get a super method by its sub method
	// argsOrMethod is a reference to arguments or arguments.callee
	// requires prototype's to have a reference to their constructor and a reference to themselves as .prototype
	// use Function.prototype.subclass and Function.prototype.subclasses
	var getUber = function (argsOrMethod) {

		// get the sub method that we are interested in. either it was passed, or arguments was passed in which case use arguments.callee
		var method = typeof argsOrMethod === 'function' ? argsOrMethod : argsOrMethod.callee;

		// recurse the prototypal chain looking for the method that was called. return the next property in the chain by the same property name
		return (function (constructor) {

			var prototype = constructor.prototype;

			// for each property in the prototype
			for (var methodName in prototype) {

				// if the property exists on this prototype, and is the method we are looking for
				if (prototype[methodName] === method && prototype.hasOwnProperty(methodName)) {

					// delete the circular reference from the prototype
					delete prototype.constructor;

					// get a reference to the next property in the prototypal chain by the same property name
					// prototype.prototype points to the next prototype in the chain because we just deleted the current prototype's circular reference, thereby revealing its internal prototype's circular reference
					var superMethod = prototype.constructor.prototype[methodName];

					// restore the circular reference
					prototype.constructor = constructor;

					// TODO throw an error is superMethod is undefined

					// return whatever we found
					return superMethod;
				}
			}

			// we didnt find what we were looking for

			// delete this prototype's circular reference
			delete prototype.constructor;

			// get its parent prototype by its parents prototypes now revealed circular reference
			var nextConstructor = prototype.constructor;

			// restore the circular reference
			prototype.constructor = constructor;

			// if there was another prototype in our circular reference chain, call this method on that one, otherwise, return undefined
			return typeof nextConstructor === 'function' && nextConstructor !== Object ? arguments.callee(nextConstructor) : undefined;

		})(this.constructor); // call the anon fn with this.constructor
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
*/
