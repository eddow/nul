//TODO indents management
//TODO XML sub-parse
//TODO Javascript sub-parse?
var NULParser = Editor.Parser = (function() {
	var tokenizeNUL = (function() {
		var untokenisable = "Untokenisable";
		function anywhere(source, setState, thisState) {
			if(source.lookAhead('//', true))
				return setState(inBlock('comment', null, thisState));
			if(source.lookAhead('/*', true))
				return setState(inBlock('comment', '*/', thisState));
			if(source.applies(isWhiteSpace)) {
				source.nextWhile(isWhiteSpace);
				return 'whitespace';
			}
			throw untokenisable;
		}

		function afterItem(source, setState) {
			try { return anywhere(source, setState, afterItem); }
			catch(e) { if(untokenisable!=e) throw e; }

			var ops =  [",..", "[]", "=>", "!=", "<=", ">=", "..", ',.', ";", ",", "?", "=", "<", ">", "+", "-", "*", "/", "%"];
			for(var o=0; ops[o]; ++o) if(source.lookAhead(ops[o], true)) {
				if(',.'!= ops[o]) setState(inText);	//postceders
				return 'operator';
			}

			if(source.lookAhead(']', true)) return 'surrounder';
			if(source.lookAhead('[', true)) {
				setState(inText);
				return 'surrounder';
			}

			return setState(inText);
		}
		
		function inText(source, setState) {
			try { return anywhere(source,setState, inText); }
			catch(e) { if(untokenisable!=e) throw e; }

			if(source.lookAhead('::', true)) {
				setState(inAlphabet(/^[\w@]$/, 'attribute', inText));
				return 'attributer';
			}
			if(source.lookAhead('.', true)) {
				setState(inAlphabet(/^[\w@]$/, 'attribute', afterItem));
				return 'attributer';
			}

			if(source.lookAhead('\\/', true)) {
				source.nextWhile(isWhiteSpace);
				setState(inAlphabet(/^[\w@]$/, 'declare', inText));
				return 'operator';
			}

			var ops =  ["!", "#", "-"];
			for(var o=0; ops[o]; ++o) if(source.lookAhead(ops[o], true)) return 'operator';

			if(source.matches(/^\d$/)) {
				source.nextWhileMatches(/^\d$/);
				if(source.lookAhead('.', true)) source.nextWhileMatches(/^\d$/);
				setState(afterItem);
				if(!source.matches(/^\w$/)) return 'number';
				source.nextWhileMatches(/^\w$/);
				return 'error';
			}

			if(source.lookAhead('_', true) && !source.matches(/^[\w@]$/)) {
				setState(afterItem);
				return 'reserved';
			}
			
			if(source.matches(/^[\w@]$/)) {
				source.nextWhileMatches(/^[\w@]$/);
				setState(afterItem);
				return 'local';
			}
			if(source.lookAhead('"', true)) {
				source.nextWhileMatches(/^[^\"\n]$/);
				if(source.lookAhead('"', true))
					setState(afterItem);
				return 'string';
			}
			if(source.lookAhead('{}', true, 'skipSpaces')) {
				setState(afterItem);
				return 'reserved';
			}

			if(source.lookAhead('{:', true)) {
				source.nextWhile(isWhiteSpace);
				setState(inAlphabet(/^[\w@]$/, 'declare', inText));
				return 'surrounder'
			}

			var ops =  ['{', '('];
			for(var o=0; ops[o]; ++o) if(source.lookAhead(ops[o], true)) return 'surrounder';
			var ops =  ['}', ')'];
			for(var o=0; ops[o]; ++o) if(source.lookAhead(ops[o], true)) {
				setState(afterItem);
				return 'surrounder';
			}

			source.next();
			return 'error';
		}

		function inAlphabet(alphabet, style, nextState) {
			return function(source, setState) {
				source.nextWhileMatches(alphabet);
				setState(nextState || inText);
				return style;
			};
		}

		function inBlock(style, terminator, nextState) {
			return function(source, setState) {
				while (!source.endOfLine()) {
					if (terminator && source.lookAhead(terminator, true)) {
						setState(nextState || inText);
						break;
					}
					source.next();
				}
				if(!terminator) setState(nextState || inText);
				return style;
			};
		}

		return function(source, startState) {
			return tokenizer(source, startState || inText);
		};
	})();

	function parseNUL(source) {
		function indentTo(n) {return function() {return n;}}
		source = tokenizeNUL(source);
		var space = 0;

		var iter = {
			next: function() {
				var tok = source.next();
				if (tok.type == "whitespace") {
					if (tok.value == "\n") tok.indentation = indentTo(space);
					else space = tok.value.length;
				}
				return tok;
			},
			copy: function() {
				var _space = space, _tokenState = source.state;
				return function(_source) {
					space = _space;
					source = tokenizeNUL(_source, _tokenState);
					return iter;
				};
			}
		};
		return iter;
	}
	return {make: parseNUL};
})();
