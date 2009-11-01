/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO D

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
		else if(o.defined || !isEmpty(attrs)) return this.select(o, attrs);
	},
	
	expression: 'container'
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
	},
	
	expression: 'container.local'
});

nul.data.container.local.filter = function(objs, exp, att, wrp) {
	if(!isArray(objs)) objs = [objs];
	return maf(objs, function(n, orv) {
		try {
			if(nul.data.is(orv)) orv = orv.object;
			var klg = new nul.xpr.knowledge();
			var vl = klg.unify(orv, exp);
			vl = klg.attributed(vl, att);
			if(wrp) vl = wrp(vl);
			return klg.wrap(vl);
		} catch(e) { nul.failed(e); }
	});
};

/**
 * Retrieve a file from url
 * @param {String} url
 * @param {function(transport) {nul.xpr.object}} objFct
 * @return {nul.xpr.object} The result of objFct (or a temporary object to keep on until the file is loaded)
 */
nul.data.container.extern = function(url, objFct) {
	var rq = new Ajax.Request(url, {
		method: 'get',
		asynchronous: false,
		onException: function(rq, x) {
			switch(x.code) {
				case 1012: throw nul.semanticException('AJAX', 'Ajax failure : Not respecting the <a href="http://en.wikipedia.org/wiki/Same_origin_policy">Same Origin Policy</a>');
				default: throw nul.semanticException('AJAX', 'Ajax failure : '+x);
			}
		}
	});
	return objFct(rq.transport);
};

nul.load.containers = function() {
	nul.globals.library = new nul.obj.node('#library', {
		file: new nul.data.container.local(/** @lends nul.globals.library.file# */{
			retrieve: function(pnt, img) {
				if('string'!= pnt.expression) throw nul.semanticException('LIB', 'Libraries files are retrieved from a string URL');
				var libSet = nul.data.container.extern(pnt.value,
					function(t) { return new nul.subRead(t.responseText, pnt.value); } );
				var klg = new nul.xpr.knowledge();
				klg.belong(img, libSet);
				return [klg.wrap(new nul.obj.lambda(pnt,img))];
			},
			expression: 'fileLib'
		})
	});
};
