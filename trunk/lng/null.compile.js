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
	atom: function(token) {
		return { type: token.type, value: token.value, understand: nul.understanding.atom };
	},
	definition: function(decl, value, type) {
		return { type: type, decl: decl, value: value, understand: nul.understanding.definition };
	},
	selfed: function(decl, value) {
		return { decl: decl, value: value, understand: nul.understanding.selfed };
	},
	exists: function(decl, value) {
		return { decl: decl,
			value: nul.compiled.expression(
				';', [
					value,
					nul.compiled.atom({type:'alphanum', value: decl})
				]),
				understand: nul.understanding.definition };
	},
	set: function(content) {
		return { content: content, understand: nul.understanding.set };
	},
	xml: function(node, attrs, content) {
		return { node: node, attributes: attrs, content: content, understand: nul.understanding.xml };
	},
	prototype: function(appl, name, value) {
		return { applied: appl, name: name, value:value, understand: nul.understanding.prototype };
	},
	objectivity: function(appl, lcls, value) {
		if(!value) {
			value = nul.compiled.atom({value: lcls, type: 'alphanum'});
			lcls = [lcls];
		}
		return { applied: appl, lcls: lcls, value: value, understand: nul.understanding.objectivity };
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
	[',','m'], [',','p'],					//list
	['=','m'],								//unify
	[':','m'],								//booleans:meta XOR
	['?','l'],								//a?b ==> if(a) then b else fail (shortcut)
	['?','p'],								//?b ==> b if b nor false nor null
	['&&','m'], ['||','m'],					//booleans:conditionals
	['!','p'],
	['<','m'], ['>','m'], ['<=','m'], ['>=','m'],
	['<<=','l'],
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
				if(this.tknzr.take('[')) rv = nul.compiled.application(rv, this.tknzr.rawExpect(']',this.expression()));
				else if(this.tknzr.take('::')) rv = this.prototype(rv);
				else if(this.tknzr.take('->')) rv = nul.compiled.objectivity(rv, this.alphanum()); 
				else if('alphanum'== this.tknzr.token.type)
					rv = nul.compiled.definition(this.alphanum(), this.expression(), rv);
				else return rv;
			} while(true);
		},
		prototype: function(appl) {
			return nul.compiled.prototype(appl, this.alphanum(), this.tknzr.expect('.', this.expression()));
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
		item: function() {
			if(this.tknzr.take('\\/'))
				return nul.compiled.definition(this.alphanum(), this.expression());
			if(this.tknzr.take('{')) {
				if(this.tknzr.take('}')) return nul.compiled.set();
				return this.tknzr.expect('}', nul.compiled.set(this.expression()));
			}
			if(this.tknzr.take('::')) return this.prototype();
			if(this.tknzr.take('<')) return this.xml();
			if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
			if(this.tknzr.take(']')) return nul.compiled.exists(this.alphanum(), this.applied());
			if(this.tknzr.take('['))
				return this.tknzr.rawExpect(']', nul.compiled.selfed(this.alphanum(), this.expression()));
			for(var p= 0; p<nul.operators.length; ++p)
			{
				var oprtr = nul.operators[p];
				if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
					return nul.compiled.preceded(oprtr[0], this.expression(1+p));
			}
			return nul.compiled.atom(this.tknzr.pop());
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
