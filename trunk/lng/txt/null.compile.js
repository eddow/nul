/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.compiled = {
	//Compiled just have pure data: operators, operands, stuffs, ...
	expression: function(oprtr, oprnds) {
		return { operator: oprtr, operands: oprnds, understand: nul.understanding.expression };
	},
	preceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.preceded };
	},
	postceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.postceded };
	},
	application: function(item, applied) {
		return { item: item, applied: applied, understand: nul.understanding.application };
	},
	taking: function(item, token) {
		return { item: item, token: token, understand: nul.understanding.taking };
	},
	range: function(lwr, upr) {
		return { lower: lwr, upper: upr, understand: nul.understanding.range };
	},
	atom: function(token, decl) {
		return { type: token.type, value: token.value, declared: decl, understand: nul.understanding.atom };
	},
	definition: function(decl, value) {
		return { decl: decl, value: value, understand: nul.understanding.definition };
	},
	set: function(content, selfRef) {
		return { content: content, selfRef: selfRef, understand: nul.understanding.set };
	},
	xml: function(node, attrs, content) {
		return { node: node, attributes: attrs, content: content, understand: nul.understanding.xml };
	},
	composed: function(vals) {
		return { values: vals, understand: nul.understanding.composed };
	},
	objectivity: function(appl, lcl) {
		return { applied: appl, lcl: lcl, understand: nul.understanding.objectivity };
	}
};

//l => left built ((a . b) . c)
//r => right built (a . (b . c))
//m => multi (a , b , c)
//p => preceder (- a)
//s => postceder (a !)
//k => kept (a , b , c ,.. d)
nul.operators = [
	['[]','m'],								//booleans:meta OR
	[';','m'],								//booleans:meta AND
	[',','k'],				 				//list
	[':-','r'],								//lambda
	['!','p'],
	['=','m'], [':=','m'],					//unify
	[':','m'],								//booleans:meta XOR
	['?','m'],								//booleans:meta XOR
	['<','r'], ['>','r'], ['<=','r'], ['>=','r'],
	['<<+','l'],
	['+','m'], ['-','l'],
	['-','p'], ['#','p'],
	['*','m'], ['/','l'], ['%','l'],
	['$','p'],
];

nul.compiler = function(txt)
{
	return {
		tknzr: nul.tokenizer(txt),
		alphanum: function() {
			var rv = this.tknzr.pop(['alphanum']);
			if(!rv)
				throw nul.syntaxException('IDE', 'Identifier expected');
			return rv.value;
		},
		list: function(firstOp, oprtr, oprtrLvl) {
			var rv = [firstOp];
			switch(oprtr[1])
			{
				case 'k':
					while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
					if(this.tknzr.take(oprtr[0]+'..')) rv.follow = this.expression(oprtrLvl);
					break;
				case 'm':
					while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
					break;
				case 'l':
					if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
					break;
				case 'r':
					if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl-1));
					break;
				case 's':
					if( this.tknzr.take(oprtr[0]) ) rv.push('ceded');
					break;
				default: throw nul.internalException('Bad operator type');
			}
			return rv;
		},
		expression: function(oprtrLvl) {
			if('undefined'== typeof oprtrLvl) oprtrLvl = 0; 
			if(nul.operators.length <= oprtrLvl) return this.applied();
			var oprtr = nul.operators[oprtrLvl];
			var firstOp = this.expression(1+oprtrLvl);
			if('p'== oprtr[1]) return firstOp;	//don't manage preceders here but in .item
			var rv = [firstOp];
			do
			{
				rv = this.list(firstOp, oprtr, 1+oprtrLvl);
				if(0== rv.length) throw nul.internalException('No components and an operator');
				if(1== rv.length && !rv.follow) return rv[0];
				if('ceded'== rv[1]) firstOp = nul.compiled.postceded(oprtr[0], rv[0]);
				else firstOp = nul.compiled.expression(oprtr[0], rv);
			} while('l'== oprtr[1]);
			return firstOp;
		},
		applied: function() {
			var rv = this.item();
			do
			{
				var tst;
				if(this.tknzr.take('.')) rv = nul.compiled.objectivity(rv, this.alphanum()); 
				else if(this.tknzr.take('['))
					rv = nul.compiled.taking(rv, this.tknzr.expect(']', this.expression())); 				
				else if(tst = this.item('lax')) rv = nul.compiled.application(rv, tst);
				else return rv;
			} while(true);
		},
		innerXML: function() {
			var comps = [];
			do
			{
				var aTxt = this.tknzr.fly('<');
				if(null=== aTxt) throw nul.syntaxException('XML', 'XML node not closed');
				if(''!== aTxt) comps.push(nul.compiled.atom({type:'string', value: aTxt}));
				if(this.tknzr.rawTake('<(')) comps.push(this.tknzr.rawExpect(')>',this.expression()));
				else if(this.tknzr.rawTake('</')) return comps;
				else if(this.tknzr.rawTake('<')) comps.push(this.xml());
				else throw nul.syntaxException('UEI', "Don't know what to do with '"+this.tknzr.token.value+"'");
			} while(true);
		},
		xml: function() {
			var node = this.alphanum(), attr, attrs = {};
			while(attr = this.tknzr.pop(['alphanum']))
			{
				this.tknzr.expect('=');
				attrs[attr.value] = this.item();
			}
			if(this.tknzr.rawTake('/>')) return nul.compiled.xml(node, attrs, []);
			this.tknzr.rawExpect('>');
			var comps = this.innerXML();
			this.tknzr.expect(node);
			return this.tknzr.rawExpect('>', nul.compiled.xml(node, attrs, comps));
		},
		item: function(lax) {
			var rv;
			if('eof'!= this.tknzr.token.type) {
				if(this.tknzr.take('\\/')) return nul.compiled.definition(this.alphanum(), this.expression());
				if(this.tknzr.take('{')) {
					if(this.tknzr.take('}')) return nul.compiled.set();
					var sr;
					if(this.tknzr.take(':')) sr = this.alphanum();
					return this.tknzr.expect('}', nul.compiled.set(this.expression(), sr));
				}
				if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
				if(this.tknzr.take('[')) {
					var lwr, upr;
					if(this.tknzr.rawTake('..')) lwr = nul.compiled.atom('number', ninf);
					else lwr = this.rawExpect('..',this.expression());
					if(this.tknzr.take(']')) upr = nul.compiled.atom('number', pinf);
					else upr = this.expect(']',this.expression());
					return nul.compiled.range(lwr, upr);
				}
				if(this.tknzr.take('::')) {
					var vals = {};
					do {
						vals[this.tknzr.rawTake('(') ?
							this.tokenizer.rawExpect(')', this.tokenizer.fly(')')) :
							this.alphanum()] =  this.item();
					} while(this.tknzr.take('::'));
					return nul.compiled.composed(vals);					
				}
				if(!lax) {
					if(this.tknzr.take('<')) return this.xml();
					for(var p= 0; p<nul.operators.length; ++p) {
						var oprtr = nul.operators[p];
						if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
							return nul.compiled.preceded(oprtr[0], this.expression(1+p));
					}
				}
				rv = this.tknzr.pop(['alphanum', 'number', 'string']);
			}
			if(!rv && !lax) throw nul.syntaxException('ITE', 'Item expected');
			if(rv) return nul.compiled.atom(rv);
		}
	};
}
nul.compile = function(txt)
{
	var rv = nul.compiler(txt);
	var ev = rv.expression();
	if(rv.tknzr.token.type != 'eof') throw nul.syntaxException('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.");
	return ev;
};