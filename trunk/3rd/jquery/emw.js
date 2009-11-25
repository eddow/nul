/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

(function($) {
	$.fn.extend({
		//TABLE / TBODY extension
		nbrRows: function() {
			return this.length?(this[0].rows?this[0].rows.length:0):0;
		},
		clearRows: function() {
			while(this.nbrRows()) this[0].deleteRow(0);
		},
		completeRowsFrom: function(src) {
			for(var r = this.nbrRows(); r<src.nbrRows(); ++r) {
				var drw = this[0].insertRow(-1);
				var srw = src[0].rows[r];
				for(var a=0; srw.attributes[a]; ++a) $j(drw).attr(srw.attributes[a].name, srw.attributes[a].value);
				for(var c = 0; c < srw.cells.length; ++c)
					drw.insertCell(-1).innerHTML = srw.cells[c].innerHTML;
			}
		},
		copyRowsFrom: function(src) {
			this.clearRows();
			this.completeRowsFrom(src);
		}
	});
	$.extend({
		keys: function(obj) {
			var a = [];
			$j.each(obj, function(k) {a.push(k); });
			return a;
		}
		
	});
})(jQuery);
