/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data.container = Class.create(nul.obj.defined, /** @lends nul.data.container# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
	 * @constructs
	 * @extends nul.obj.defined
	 */
	initialize: function($super, singleton) {
		if(singleton) merge(this, singleton);
		this.alreadyBuilt();
		return $super();
	},
	
	retrieve: function(pnt, img, att) { throw nul.semanticException('CNT', this.expression+' cannot retrieve items'); },
	select: function(obj, att) { throw nul.semanticException('CNT', this.expression+' cannot select items'); },
	
	subHas: function(o, attrs) {
		if('lambda'== o.expression && isEmpty(o.point.dependance().usages)) return this.retrieve(o.point, o.image, attrs);
		else if(!isEmpty(attrs)) return this.select(o, attrs);
	}
});

/**
 * The data-source filters on the local computer
 * @class
 * @extends nul.data.container
 */
nul.data.container.local = Class.create(nul.data.container, /** @lends nul.data.container.local# */{
	seek: function(key) { throw nul.semanticException('CNT', this.expression+' cannot retrieve items'); },
	list: function() { throw nul.semanticException('CNT', this.expression+' cannot select items'); },
	
	retrieve: function(pnt, img, att) {
		return nul.data.container.local.filter(
				this.seek(pnt),
				img, att,
				function(v) { return new nul.obj.lambda(pnt, v); }
			);
	},
	select: function(obj, att) {
		return nul.data.container.local.filter(this.list(), obj, att);
	}
});

nul.data.container.local.filter = function(objs, exp, att, wrp) {
	if(!isArray(objs)) objs = [objs];
	return maf(objs, function(n, orv) {
		try {
			if(nul.data.is(orv)) orv = new nul.obj.data(orv);
			var klg = new nul.xpr.knowledge();
			var vl = klg.unify(orv, exp);
			vl = klg.attributed(vl, att);
			if(wrp) vl = wrp(vl);
			return klg.wrap(vl);
		} catch(e) { nul.failed(e); }
	});
};

nul.data.container.extern = Class.create(nul.data.container.local, /** @lends nul.data.container# */{
	/**
	 * Make an expression out of a transport response
	 * @param {Ajax.Response} transport
	 * @return {nul.xpr.object} 
	 */
	wrap: function(transport) { throw 'abstract'; },
	seek: function(key) {
		if('string'!= key.expression) throw nul.semanticException('AJAX', 'Ajax retrieve XML documents from a string URL');
		var rq = new Ajax.Request(nul.rootPath+key.value, {
			method: 'get',
			asynchronous: false,
			onException: function(rq, x) {
				switch(x.code) {
					case 1012: throw nul.semanticException('AJAX', 'Ajax failure : Not respecting the <a href="http://en.wikipedia.org/wiki/Same_origin_policy">Same Origin Policy</a>');
					default: throw nul.semanticException('AJAX', 'Ajax failure : '+x);
				}
			}
		});
		return [this.wrap(rq.transport)];
	},
	expression: 'ajax'
});

nul.load.containers = function() {
	nul.globals.library = new nul.obj.node('nul.globals.library', {
		file: new nul.data.container.extern(/** @lends nul.globals.xml */{
			wrap: function(transport) {
				return new nul.subRead(transport.responseText, 'letBM');
			}
		})
	});
};
