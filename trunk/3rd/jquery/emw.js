/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

(function($) {
	$.extend({
		keys: function(obj) {
			var a = [];
			$.each(obj, function(k) {a.push(k); });
			return a;
		}
		
	});
})(jQuery);
