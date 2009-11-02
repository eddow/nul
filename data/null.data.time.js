/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data.time = Class.create(nul.obj.node, /** @lends nul.data.time# */{
	/**
	 * The DateTime object as a node with attributes
	 * @extends nul.obj.node
	 * @constructs
	 * @param {Date} dto
	 */
	initialize: function($super, dto) {
		if(nul.debug.assert) assert(dto.setFullYear, 'Expected a date as argument');
		this.dto = dto;
		$super('DateTime', map(nul.data.time.nul2js, function() { return function(klg, anm) {
			anm = nul.data.time.nul2js[anm];
			return new nul.obj.litteral.number(this.dto[anm].apply(this.dto))
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
	 * The 'time' global
	 * @class Singleton
	 * @extends nul.obj.hc
	 */
	nul.globals.time = new nul.obj.hc(/** @lends nul.globals.time# */{
		subHas: function(obj, att) {
			if(nul.obj.data.is(obj) && 
					['now'].include(obj.source.index) &&
					obj.source.context == nul.data.context.local )
				return [obj];
			return nul.obj.hc.prototype.subHas.apply(this,[obj, att]);
		},
		select: function(obj, att) {
			if(nul.data.time.is(obj)) return [obj];
			if(obj.defined) return [];
			//TODO 3: try to see with the attributes if we can discover the date. If yes, return [built date]
		},
		/**
		 * dateTime.parse(key)
		 * @param {nul.obj.litteral.string} key
		 */
		seek: function(key) {
			if('string'!= key.expression) throw nul.semanticException('Time', 'Time element can only be retrieved from a string');
			var t = Date.parse(key.value);
			if(isNaN(t)) return [];
			return new nul.data.time(new Date(t));
		},
		/**
		 * @constant
		 * @name nul.globals.time.attributes
		 */
		attributes: {
			/**
			 * The 'time.now' global
			 * @class Singleton
			 * @name nul.globals.time.attributes.now
			 * @extends nul.data
			 */
			now: new nul.data(nul.data.context.local, 'now', /** @lends nul.globals.time.attributes.now# */{
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
