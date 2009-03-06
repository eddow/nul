/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
 //TODO: un opérateur qui dit "est spécifié". Style une varialbe laissée libre à jamais renvoie faux ou fail
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
	atom: function(token, decl) {
		return { type: token.type, value: token.value, declared: decl, understand: nul.understanding.atom };
	},
	definition: function(decl, value) {
		return { decl: decl, value: value, understand: nul.understanding.definition };
	},
	set: function(content) {
		return { content: content, understand: nul.understanding.set };
	},
	xml: function(node, attrs, content) {
		return { node: node, attributes: attrs, content: content, understand: nul.understanding.xml };
	},
	attributed: function(appl, name, value) {
		return { applied: appl, name: name, value:value, understand: nul.understanding.attributed };
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
nul.operators = [
	['!','s'],								//extraction
	['[]','m'],								//booleans:meta OR
	[';','m'],								//booleans:meta AND
	[':-','r'],								//lambda
	[',..','r'], [',','m'],	 				//list
	['=','m'], [':=','m'],					//unify
	[':','m'],								//booleans:meta XOR
	['?','l'],								//a?b ==> if(a) then b else fail (shortcut)
	['?','p'],								//?b ==> b if b nor false nor null
	['&&','m'], ['||','m'],					//booleans:conditionals
	['!','p'],
	['<','m'], ['>','m'], ['<=','m'], ['>=','m'],
	['<<+','l'],
	['+','m'], ['-','l'],
	['-','p'],
	['*','m'], ['/','l'], ['%','l'],
	['&','m'], ['|','m'], ['^','m'],		//booleans:value
];

nul.compiler = function(txt)
{
	return {
		tknzr: nul.tokenizer(txt),
		alphanum: function() {
			var rv = this.tknzr.pop(['alphanum']);
			if(!rv)
				throw nul.syntaxException('Identifier expected');
			return rv.value;
		},
		list: function(firstOp, oprtr, oprtrLvl) {
			var rv = [firstOp];
			switch(oprtr[1])
			{
				case 'm':
					while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl))
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
				if(1== rv.length) return rv[0];
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
/*				if(this.tknzr.take('[')) rv = nul.compiled.application(rv, this.tknzr.rawExpect(']',this.expression()));
				else*/ if(this.tknzr.take('::')) rv = this.attributed(rv);
				else if(this.tknzr.take('->')) rv = nul.compiled.objectivity(rv, this.alphanum()); 
/*				else if('alphanum'== this.tknzr.token.type)
					rv = nul.compiled.definition(this.alphanum(), rv);*/
				else if(tst = this.item('lax')) rv = nul.compiled.application(rv, tst);
				else return rv;
			} while(true);
		},
		attributed: function(appl) {
			return nul.compiled.attributed(appl, this.alphanum(), this.tknzr.expect('.', this.expression()));
		},
		innerXML: function() {
			var comps = [];
			do
			{
				var aTxt = this.tknzr.fly('<');
				if(null=== aTxt) throw nul.syntaxException('XML node not closed');
				if(''!== aTxt) comps.push(nul.compiled.atom({type:'string', value: aTxt}));
				if(this.tknzr.rawTake('<(')) comps.push(this.tknzr.rawExpect(')>',this.expression()));
				else if(this.tknzr.rawTake('</')) return comps;
				else if(this.tknzr.rawTake('<')) comps.push(this.xml());
				else throw nul.syntaxException("Don't know what to do with '"+this.tknzr.token.value+"'");
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
					return this.tknzr.expect('}', nul.compiled.set(this.expression()));
				}
				if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
				//if(this.tknzr.take('['))	TODO: on a un crochet de libre dans la syntaxe XD
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
			if(!rv && !lax) throw nul.syntaxException("Item expected");
			if(rv) return nul.compiled.atom(rv);
		}
	};
}
nul.compile = function(txt)
{
	var rv = nul.compiler(txt);
	var ev = rv.expression();
	if(rv.tknzr.token.type != 'eof') throw nul.syntaxException('Unexpected: "'+rv.tknzr.token.value+"'.");
	return ev;
};
