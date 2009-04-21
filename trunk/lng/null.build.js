/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul. build = {
	lambda: function(parms, value) {
		return this.nmdOp(nul.behav.lambda, ':-', {handle:parms, value:value}, '&rArr;');
	},
	object: function(cs) {
		return this.listOp(nul.behav.object, '[.]', cs||[], [
			function() {
				var rv = '';
				for(var i=0; i<this.components.length; ++i) rv +=
					'<tr><th>'+i+'</th><td>'+this.components[i].toHTML()+'</td></tr>';
				if(0>=this.components.length) rv = '<tr><td>&nbsp;</td></tr>';
				return '<table class="object">'+rv+'</table>';
			},
			function() { 
				var rv = '';
				for(var i=0; i<this.components.length; ++i) rv +=
					'::'+i+' '+this.components[i].toString()+' ';
				if(0>=this.components.length) rv = '[Object]';
				return '('+rv+')';
			}]
		);
	},
	composed: function(applied, name, value) {
		applied.x[name] = value;
		return applied.summarised();
	},
	objectivity: function(oprnd, comp) {
		return this.post({cname: comp},'.', oprnd, '.'+comp);
	}

};
nul. build.htmlPlace.expressed = [];
nul. build.dataTable.expressed = [];
