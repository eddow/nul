//TODO indents management
//TODO XML sub-parse
//TODO Javascript sub-parse?
var NULParser = Editor.Parser = (function() {
	  var tokenizeNUL = (function() {
		function inText(source, setState) {
			var ch = source.peek();
			if(source.lookAhead('//', true))
				return setState(inBlock('comment'));
			if(source.lookAhead('/*', true))
				return setState(inBlock('comment', '*/'));

			if(source.applies(isWhiteSpace)) {
				source.nextWhile(isWhiteSpace);
				return 'whitespace';
			}
			var ops =  [",..", "[]", "=>", "!=", "<=", ">=", "..", ",.", "\\/", ";", ",", "!", "?", "=", "<", ">", "+", "-", "-", "#", "*", "/", "%"];
			for(var o=0; ops[o]; ++o) if(source.lookAhead(ops[o], true)) return 'operator'
			if(source.lookAhead('::', true) || source.lookAhead('.', true)) {
				setState(inAlphabet(/^\w$/,'attribute'))
				return 'attributer';
			}
			if(source.matches(/^\d$/)) {
				source.nextWhileMatches(/^\d$/);
				return 'number';
			}
			if(source.matches(/^[A-Za-z0-9_@]$/)) {
				source.nextWhileMatches(/^\w$/);
				return 'local';
			}
			if(source.lookAhead('{}', true))
				return 'reserved';

			var ops =  ['{', '}', '[', ']', '(', ')'];
			for(var o=0; ops[o]; ++o) if(source.lookAhead(ops[o], true)) return 'surrounder'

			source.next();
			return 'text';
		}

		function inAlphabet(alphabet, style) {
			return function(source, setState) {
				source.nextWhileMatches(alphabet);
				setState(inText);
				return style;
			};
		}

		function inBlock(style, terminator) {
			return function(source, setState) {
				while (!source.endOfLine()) {
					if (terminator && source.lookAhead(terminator, true)) {
						setState(inText);
						break;
					}
					source.next();
				}
				if(!terminator) setState(inText);
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
