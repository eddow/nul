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
		var rq = $.ajax({
			type: "get",
			url: url,
			async: false,
			error: function(rq, x) {
				switch(x.code) {
					case 1012: alert('AJAX', 'Ajax failure : Not respecting the <a href="http://en.wikipedia.org/wiki/Same_origin_policy">Same Origin Policy</a>');
					default: alert('AJAX', 'Ajax failure : '+x);
				}
			}
		});
		return objFct(rq);
	},
	
	/**
	 * Load a NUL library (written in NUL) from an URL
	 * @param {String} url
	 * @param {String} id optional : url is used if no id is provided.
	 */
	loadNul : function(url, id) {
		nul.data.ajax.load(url,
			function(t) { return nul.read(t.responseText, id || url); } );
	}
};

/**
 * Creates the 'library' global
 */
nul.load.ajax = function() {
	/**
	 * Singleton
	 * @class The 'library' global
	 * @extends nul.obj.node
	 */
	nul.globals.library = new nul.obj.hc(/** @lends nul.globals.library */{
		
		attributes: {
			/**
			 * Singleton
			 * @class AJAX library loader
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
					if('string'!= pnt.expression) nul.ex.semantic('LIB', 'Libraries files are retrieved from a string URL', pnt);
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