nul.compiled = {
		node: new JS.Class ({
			initialize: function(props) {
				this.extend(props);
			}
		}),
			
		factory: new JS.Class ({
			/**
			 * @param {String} oprtr
			 * @param {nul.compiled[]} oprnds
			 * @return {nul.compiled}
			 */
			expression: function(oprtr, oprnds) {
				return new nul.compiled.node.expression({ operator: oprtr, operands: oprnds});
			},
			/**
			 * @param {String} oprtr
			 * @param {nul.compiled} oprnd
			 * @return {nul.compiled}
			 */
			preceded: function(oprtr, oprnd) {
				return new nul.compiled.node.preceded({ operator: oprtr, operands: oprnds});
			},
			/**
			 * @param {String} oprtr
			 * @param {nul.compiled} oprnd
			 * @return {nul.compiled}
			 */
			postceded: function(oprtr, oprnd) {
				return new nul.compiled.node.postceded({ operator: oprtr, operands: oprnds});
			},
			/**
			 * @param {nul.compiled} item
			 * @param {nul.compiled} applied
			 * @return {nul.compiled}
			 */
			application: function(item, applied) {
				return new nul.compiled.node.application({ item: item, applied: applied});
			},
			/**
			 * @param {nul.compiled} item
			 * @param {nul.compiled} token
			 * @return {nul.compiled}
			 */
			taking: function(item, token) {
				return new nul.compiled.node.taking({ item: item, token: token});
			},
			/**
			 * @param {String} type
			 * @param {Litteral} value
			 * @return {nul.compiled}
			 */
			atom: function(type, value) {
				return new nul.compiled.node.atom({ type: type, value: value});
			},
			/**
			 * @param {String} decl
			 * @param {nul.compiled} value
			 * @return {nul.compiled}
			 */
			definition: function(decl, value) {
				return new nul.compiled.node.definition({ decl: decl, value: value});
			},
			/**
			 * @param {nul.compiled} content
			 * @param {String} selfRef
			 * @return {nul.compiled}
			 */
			set: function(content, selfRef) {
				return new nul.compiled.node.set({ content: content, selfRef: selfRef});
			},
			/**
			 * @param {String} node
			 * @param {nul.compiled[String]} attrs
			 * @param {nul.compiled[]} content
			 * @return {nul.compiled}
			 */
			xml: function(node, attrs, content) {
				return new nul.compiled.node.xml({ node: node, attributes: attrs, content: content});
			},
			/**
			 * @param {nul.compiled} obj
			 * @param {String} anm
			 * @param {nul.compiled} v
			 * @return {nul.compiled}
			 */
			composed: function(obj, anm, val) {
				return new nul.compiled.node.composed({ object: obj, aName: anm, value: val});
			},
			/**
			 * @param {nul.compiled} appl
			 * @param {String} lcl
			 * @return {nul.compiled}
			 */
			objectivity: function(appl, lcl) {
				return new nul.compiled.node.objectivity({ applied: appl, lcl: lcl});
			},
			/**
			 * @param {nul.xpr.object} val
			 * @return {nul.compiled}
			 */
			hardcode: function(val) {
				return new nul.compiled.node.hardcode({ value: val});
			}
		})
}; 