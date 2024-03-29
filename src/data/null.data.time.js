/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/data/null.data

nul.data.time = new JS.Class(nul.obj.node, /** @lends nul.data.time# */{
	/**
	 * @extends nul.obj.node
	 * @class The DateTime object as a node with attributes
	 * @param {Date} dto
	 * @constructs
	 */
	initialize: function(dto) {
		if(nul.debugged) nul.assert(dto.setFullYear, 'Expected a date as argument');
		this.dto = dto;
		this.callSuper('DateTime', map(nul.data.time.nul2js, function() { return function(klg, anm) {
			anm = nul.data.time.nul2js[anm];
			return new nul.obj.litteral.number(this.dto[anm].apply(this.dto));
		}; }));
	}
});

/**
 * The NUL properties are JS methods
 * @constant
 */
nul.data.time.nul2js = {
	year: 'getFullYear',
	month: 'getMonth',
	day: 'getDate',
	hours: 'getHours',
	minutes: 'getMinutes',
	seconds: 'getSeconds',
	milliseconds: 'getMilliseconds',
	dof: 'getDay',
	stamp: 'getTime'
};

/**
 * Creates the 'time' global
 */
nul.load.time = function() {
	/**
	 * Singleton
	 * @class The 'time' global
	 * @extends nul.obj.hc
	 */
	nul.globals.time = new nul.obj.hc(/** @lends nul.globals.time# */{
		/**
		 * Try to accept the value if the object is 'Now' data. If not, use the regular behaviour
		 * @param {nul.xpr.object} obj
		 * @param {nul.xpr.object[]} att
		 * @return {nul.xpr.object[]|nul.xpr.possible[]}
		 */
		subHas: function(obj, att) {
			if(nul.obj.data.def(obj) && 
					['now'].include(obj.source.index) &&
					obj.source.context == nul.data.context.local )
				return [obj];
			return nul.obj.hc.prototype.subHas.apply(this,[obj, att]);
		},
		/**
		 * Try to build a time object if we have enough specifications in attributes
		 * @param {nul.xpr.object} obj
		 * @param {nul.xpr.object[]} att
		 * @return {nul.xpr.object[]|nul.xpr.possible[]}
		 */
		select: function(obj, att) {
			if(nul.data.time.def(obj)) return [obj];
			if(nul.obj.defined.def(obj)) return [];
			//TODO 3: try to see with the attributes if we can discover the date. If yes, return [built date]
		},
		/**
		 * dateTime.parse(key)
		 * @param {nul.obj.litteral.string} key
		 */
		seek: function(key) {
			if('string'!= key.expression) nul.ex.semantic('Time', 'Time element can only be retrieved from a string', key);
			var t = Date.parse(key.value);
			if(isNaN(t)) return [];
			return new nul.data.time(new Date(t));
		},
		/**
		 * @constant
		 * @name nul.globals.time#attributes
		 */
		attributes: {
			/**
			 * Singleton
			 * @class The 'time.now' global
			 * @name nul.globals.time#attributes.now
			 * @extends nul.data
			 */
			now: new nul.data(nul.data.context.local, 'now', /** @lends nul.globals.time#attributes.now# */{
				/**
				 * Get the time when queried
				 */
				extract: function() {
					return new nul.data.time(new Date());
				}
			}).object
		},
		/** @constant */
		expression: 'time'
	});
};
