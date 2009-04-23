/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.attributed = Class.create(nul.xpr.forward(nul.xpr.composed,''), {
	charact: '::',
	failable: function() {
		return !this.components[''].finalRoot();
	},
	initialize: function($super, value, atn, attr) {
		var comps = {}
		comps[''] = value;
		comps[atn] = attr;
		$super(comps);
	},
	attribute: function(atn, klg) {
		return this.components[atn] || this.components[''].attribute(atn, klg);
	},
	finalRoot: function() {
		return this.components[''].finalRoot();
	},
/////// String
	expressionHTML:  function() {
            var rv = '<tr><td colspan="2" class="objhd">'+
            	this.components[''].toHTML()+
            	'</td></tr>';
            for(var i in this.components) if(''!= i) rv +=
                    '<tr><th>'+i+'</th><td>'+this.components[i].toHTML()+'</td></tr>';
            return '<table class="object">'+rv+'</table>';
    },
	expressionString: function() { 
            var rv = this.components[''].toString();
            for(var i in this.components) if(''!= i) rv +=
                    '::'+i+' '+this.components[i].toString()+' ';
            return '('+rv+')';
    },
/////// Attributed specific
	operate: function(klg) {
		if('::'== this.component[''].charact)
			return this.compose(merge(components[''].components, components,
				function(a, b, i) {
					if(''== i) return b;
					if(a && b) return klg.affect([comps[atn], attr]);
					return a || b;
				}));
		for(var i in this.component)
			if(this.component[''].attribute(i, klg))
				nul.fail('Attribute dont match.');
		return this;
	}
	.describe(function(klg) { return ['Attributing', this]; }),
});