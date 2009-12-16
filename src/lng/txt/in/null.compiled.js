/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//# uses: src/lng/txt/in/null.understand

nul.compiled = new JS.Class (/** @lends nul.compiled# */{
		/**
		 * @constructs
		 * @class Compiled expression tree node
		 * @param {Object} props Properties of the node
		 */
		initialize: function(props) {
			this.extend(props);
		},
		
		extend: /** @lends nul.compiled */{
			/**
			 * @class Nodes factory : as {@link nul.compile#compiled}
			 */
			factory: new JS.Class (/** @lends nul.compiled.factory# */{
				/**
				 * @param {String} oprtr
				 * @param {nul.compiled[]} oprnds
				 * @return {nul.compiled}
				 */
				expression: function(oprtr, oprnds) {
					return new nul.compiled.expression({ operator: oprtr, operands: oprnds});
				},
				/**
				 * @param {String} oprtr
				 * @param {nul.compiled} oprnd
				 * @return {nul.compiled}
				 */
				preceded: function(oprtr, oprnd) {
					return new nul.compiled.preceded({ operator: oprtr, operand: oprnd});
				},
				/**
				 * @param {String} oprtr
				 * @param {nul.compiled} oprnd
				 * @return {nul.compiled}
				 */
				postceded: function(oprtr, oprnd) {
					return new nul.compiled.postceded({ operator: oprtr, operand: oprnd});
				},
				/**
				 * @param {nul.compiled} item
				 * @param {nul.compiled} applied
				 * @return {nul.compiled}
				 */
				application: function(item, applied) {
					return new nul.compiled.application({ item: item, applied: applied});
				},
				/**
				 * @param {nul.compiled} item
				 * @param {nul.compiled} token
				 * @return {nul.compiled}
				 */
				taking: function(item, token) {
					return new nul.compiled.taking({ item: item, token: token});
				},
				/**
				 * @param {String} type
				 * @param {Litteral} value
				 * @return {nul.compiled}
				 */
				atom: function(type, value) {
					return new nul.compiled.atom({ type: type, value: value});
				},
				/**
				 * @param {String} decl
				 * @param {nul.compiled} value
				 * @return {nul.compiled}
				 */
				definition: function(decl, value) {
					return new nul.compiled.definition({ decl: decl, value: value});
				},
				/**
				 * @param {nul.compiled} content
				 * @param {String} selfRef
				 * @return {nul.compiled}
				 */
				set: function(content, selfRef) {
					return new nul.compiled.set({ content: content, selfRef: selfRef});
				},
				/**
				 * @param {String} node
				 * @param {nul.compiled[String]} attrs
				 * @param {nul.compiled[]} content
				 * @return {nul.compiled}
				 */
				xml: function(node, attrs, content) {
					return new nul.compiled.xml({ node: node, attributes: attrs, content: content});
				},
				/**
				 * @param {nul.compiled} obj
				 * @param {String} anm
				 * @param {nul.compiled} v
				 * @return {nul.compiled}
				 */
				composed: function(obj, anm, val) {
					return new nul.compiled.composed({ object: obj, aName: anm, value: val});
				},
				/**
				 * @param {nul.compiled} appl
				 * @param {String} lcl
				 * @return {nul.compiled}
				 */
				objectivity: function(appl, lcl) {
					return new nul.compiled.objectivity({ applied: appl, lcl: lcl});
				},
				/**
				 * @param {nul.xpr.object} val
				 * @return {nul.compiled}
				 */
				hardcode: function(val) {
					return new nul.compiled.hardcode({ value: val});
				}
			})
	}
});
