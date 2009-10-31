/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data.time = new nul.data.context('Time');

/** @constant */
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

nul.data.time.node = Class.create(nul.obj.node, /** @lends nul.data.time.node# */{
	/**
	 * DateTime object
	 * @extends nul.obj.node
	 * @constructs
	 * @param {Date} dto
	 */
	initialize: function($super, dto) {
		if(nul.debug.assert) assert(dto.setFullYear, 'Expected a date as argument');
		this.dto = dto;
		$super('DateTime', map(nul.data.time.nul2js, function(ndx, jsf) {
			return new nul.data.computer.able(function() {
				return new nul.obj.litteral.number(dto[jsf].apply(dto));
			}).object;
		}));
	}
});

nul.load.Timing = function() {
	nul.globals.time = new nul.data.container.local({
		subHas: function(obj, att) {
			if((nul.obj.data.is(obj) && obj.source.context == nul.data.time) ||
					nul.data.time.node.is(obj)) return [obj];
			return nul.data.container.local.prototype.subHas.apply(this,[obj, att]);
		},
		select: function(obj, att) {
			//TODO 3: try to see with the attributes if we can discover the date. If yes, return [built date]
		},
		seek: function(key) {
			if('string'!= key.expression) throw nul.semanticException('Time', 'Time element can only be retrieved from a string');
			var t = Date.parse(key.value);
			if(isNaN(t)) return [];
			return new nul.data.time.node(new Date(t));
		},
		attributes: {
			now: new nul.data(nul.data.time, 'now', /** @lends nul.data.time.now# */{
				extract: function() {
					return new nul.data.time.node(new Date());
				}
			}).object
		},
		expression: 'moment'
	});
};
