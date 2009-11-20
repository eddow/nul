/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/** @namespace */
nul.data.ajax = {
	/**
	 * Load a file from an URL and build an object through objFct
	 * @param {URL} url
	 * @param {function(transport) nul.xpr.object} objFct
	 * @return {nul.xpr.object} as objFct returned it
	 * @return {nul.xpr.object} An undefined object, meaning "Not yet loaded" that will be replaced later. [TODO O]
	 */
	load: function(url, objFct) {
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
	},
	loadNul : function(url, id) {
		return nul.data.ajax.load(url,
			function(t) { return nul.read(t.responseText, id || url); } );
	}
};

/**
 * Creates the 'library' global
 */
nul.load.ajax = function() {
	/**
	 * The 'library' global
	 * @class Singleton
	 * @extends nul.obj.node
	 */
	nul.globals.library = new nul.obj.hc(/** @lends nul.globals.library */{
		
		attributes: {
			/**
			 * AJAX library loader
			 * @class Singleton
			 * @extends nul.obj.hc
			 * @name attributes.file
			 * @memberOf nul.globals.library
			 */
			file: new nul.obj.hc(/** @lends nul.globals.library.attributes.file# */{
				/**
				 * Load the 'pnt' library' value into 'img'
				 * @param {nul.obj.litteral.string} pnt
				 * @param {nul.xpr.object} img
				 * @return {nul.xpr.possible}
				 */
				retrieve: function(pnt, img) {
					if('string'!= pnt.expression) throw nul.semanticException('LIB', 'Libraries files are retrieved from a string URL');
					var libSet = nul.data.ajax.loadNul(pnt.value);
					var klg = new nul.xpr.knowledge();
					klg.belong(img, libSet);
					return [klg.wrap(new nul.obj.lambda(pnt,img))];
				},
				/** @constant */
				expression: 'library.file'
			})
		},
		expression: 'library'
	});
};
nul.load.ajax.provide = ['nul.globals'];