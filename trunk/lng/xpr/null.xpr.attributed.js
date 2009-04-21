/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.attributed = Class.create(nul.xpr.forward(nul.xpr.composed,''), {
	charact: '::',
	//failable: function() { return false; },	//TODO: should fail if root not finished?
	initialize: function($super, value, atn, attr, kb) {
		var comps = {}
		comps[''] = value;
		comps[atn] = attr;
		$super(comps);
	},
	attribute: function(atn, kb) {
		return this.components[atn] || this.components[''].attribute(atn, kb);
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
	operate: function(kb) {
		if('::'== this.component[''].charact)
			return this.compose(merge(components[''].components, components,
				function(a, b, i) {
					if(''== i) return b;
					if(a && b) return kb.affect([comps[atn], attr]);
					return a || b;
				}));
		for(var i in this.component)
			if(this.component[''].attribute(i, kb))
				nul.fail('Attribute dont match.');
		return this;
	}
	.describe(function(kb) { return ['Attributing', this]; }),
});