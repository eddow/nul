/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.subset = Class.create(nul.xpr.listed, {
 	charact: 'set',
	failable: function() { return false; },
	initialize: function($super, ops, cards) {
		this.cards = cards;
		return $super(ops);
	},
/////// Strings
	expressionHTML: function() {
		var cards = this.cards;
		var cps = map(this.components, function(i) {
			return this.toHTML() + cards[i];
		});
		return cps.join('<span class="op">, </span>');
	},
	expressionString: function() {
		var cards = this.cards;
		var cps = map(this.components, function(i) {
			return this.toString() + cards[i];
		});
		return cps.join('<span class="op">, </span>');
	}
});

nul.xpr.intersection = Class.create(nul.xpr.associative.listed, {
 	charact: '&#x2229;',
	composed: function($super) {
		var allSets = {};	//ndx : { xpr: expression, deduc: bool }
		function countSet(s, d) {
			if(allSets[s.ndx]) {
				if(d) allSets[s.ndx].deduc = d;
				return;
			}
			allSets[s.ndx] = { xpr: s, deduc: d };
			var cntnrs = s.belongs();
			for(var i=0; i<cntnrs.length; ++i)
				if('set'== cntnrs[i].charact) {
					//TODO: quand sub-set a plus d'une spéc, on fait un "PGCD"
					var sets = '&#x2229;'== cntnrs[i].components[0].charact ?
						cntnrs[i].components[0].components :
						[ cntnrs[i].components[0] ] ;
					map(sets, function() { countSet(this, true); });
				}
		}
		
		for(var i=0; i<this.components.length; ++i)
			countSet(this.components[i]);
		var directSets = this.components = [], deducedSets = this.deducedSets = [];
		var elementPrimitive;
		if(trys(allSets, function() {
			if(this.deduc) deducedSets.push(this.xpr);
			else {
				if(this.xpr.elementPrimitive) {
					if(elementPrimitive) {
						//If we have already an elementPrimitive and get a new one
						var chk;
						if(elementPrimitive[''].length < this.xpr.elementPrimitive[''].length) {
							chk = elementPrimitive;	//Get the most specified one
							elementPrimitive = this.xpr.elementPrimitive;
						} else chk = this.xpr.elementPrimitive;
						var chkDlt = elementPrimitive[''].length - chk[''].length;
						for(var i=0; i<chk[''].length; ++i)
							if(chk[''][i] != elementPrimitive[''][i+chkDlt])
								return true;	//Primitive don't fit. Set is empty.
					}
					else elementPrimitive = this.xpr.elementPrimitive;
				}
				directSets.push(this.xpr);
			}
		})) return new nul.xpr.set();
		return $super();
	},
/////// Strings
	expressionHTML: function() {
		switch(this.components.length) {
			case 0: return '<span class="native">&Xi;</span>'
			case 1: return this.components[0].toHTML(); 
		}
		return nul.text.expressionHTML('<span class="op">&#x2229;</span>', this.components);
	},
	expressionString: function() {
		switch(this.components.length) {
			case 0: return '&Xi;'
			case 1: return this.components[0].toString(); 
		}
		return '('+nul.text.expressionString('&#x2229;', this.components)+')';
	}
});
