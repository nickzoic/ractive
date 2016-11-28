import { ATTRIBUTE, BINDING_FLAG, DECORATOR, EVENT, TRANSITION } from '../../config/types';
import runloop from '../../global/runloop';
import { ContainerItem } from './shared/Item';
import Fragment from '../Fragment';
import ConditionalAttribute from './element/ConditionalAttribute';
import updateLiveQueries from './element/updateLiveQueries';
import { removeFromArray, toArray } from '../../utils/array';
import { escapeHtml, voidElementNames } from '../../utils/html';
import { bind, destroyed, render, unbind, update } from '../../shared/methodCallers';
import { createElement, detachNode, matches, safeAttributeString, decamelize } from '../../utils/dom';
import createItem from './createItem';
import { html, svg } from '../../config/namespaces';
import findElement from './shared/findElement';
import { defineProperty } from '../../utils/object';
import selectBinding from './element/binding/selectBinding';

function makeDirty ( query ) {
	query.makeDirty();
}

const endsWithSemi = /;\s*$/;

export default class Element extends ContainerItem {
	constructor ( options ) {
		super( options );

		this.__liveQueries = []; // TODO rare case. can we handle differently?

		this.name = options._template.e.toLowerCase();
		this.isVoid = voidElementNames.test( this.name );

		// find parent element
		this.parent = findElement( this._parentFragment, false );

		if ( this.parent && this.parent.name === 'option' ) {
			throw new Error( `An <option> element cannot contain other elements (encountered <${this.name}>)` );
		}

		this.decorators = [];
		this.events = [];

		// create attributes
		this._attributeByName = {};

		this.attributes = [];
		const leftovers = [];
		( this._template.m || [] ).forEach( template => {
			switch ( template.t ) {
				case ATTRIBUTE:
				case BINDING_FLAG:
				case DECORATOR:
				case EVENT:
				case TRANSITION:
					this.attributes.push( createItem({
						owner: this,
						_parentFragment: this._parentFragment,
						_template: template
					}) );
					break;

				default:
					leftovers.push( template );
					break;
			}
		});

		if ( leftovers.length ) {
			this.attributes.push( new ConditionalAttribute({
				owner: this,
				_parentFragment: this._parentFragment,
				_template: leftovers
			}) );
		}

		this.attributes.sort( sortAttributes );

		// create children
		if ( options._template.f && !options.deferContent ) {
			this._fragment = new Fragment({
				_template: options._template.f,
				owner: this,
				cssIds: null
			});
		}

		this.binding = null; // filled in later
	}

	bind () {
		this.attributes.binding = true;
		this.attributes.forEach( bind );
		this.attributes.binding = false;

		if ( this._fragment ) this._fragment.bind();

		// create two-way binding if necessary
		if ( !this.binding ) this.recreateTwowayBinding();
	}

	createTwowayBinding () {
		if ( 'twoway' in this ? this.twoway : this.ractive.twoway ) {
			const Binding = selectBinding( this );
			if ( Binding ) {
				const binding = new Binding( this );
				if ( binding && binding.model ) return binding;
			}
		}
	}

	destroyed () {
		this.attributes.forEach( destroyed );
		if ( this._fragment ) this._fragment.destroyed();
	}

	detach () {
		// if this element is no longer rendered, the transitions are complete and the attributes can be torn down
		if ( !this.rendered ) this.destroyed();

		return detachNode( this.node );
	}

	find ( selector, options ) {
		if ( this.node && matches( this.node, selector ) ) return this.node;
		if ( this._fragment ) {
			return this._fragment.find( selector, options );
		}
	}

	findAll ( selector, query ) {
		// Add this node to the query, if applicable, and register the
		// query on this element
		const matches = query.test( this.node );
		if ( matches ) {
			query.add( this.node );
			if ( query.live ) this.__liveQueries.push( query );
		}

		if ( this._fragment ) {
			this._fragment.findAll( selector, query );
		}
	}

	findNextNode () {
		return null;
	}

	firstNode () {
		return this.node;
	}

	getAttribute ( name ) {
		const attribute = this._attributeByName[ name ];
		return attribute ? attribute.getValue() : undefined;
	}

	recreateTwowayBinding () {
		if ( this.binding ) {
			this.binding.unbind();
			this.binding.unrender();
		}

		if ( this.binding = this.createTwowayBinding() ) {
			this.binding.bind();
			if ( this.rendered ) this.binding.render();
		}
	}

	removeFromQuery ( query ) {
		query.remove( this.node );
		removeFromArray( this.__liveQueries, query );
	}

	render ( target, occupants ) {
		// TODO determine correct namespace
		this.namespace = getNamespace( this );

		let node;
		let existing = false;

		if ( occupants ) {
			let n;
			while ( ( n = occupants.shift() ) ) {
				if ( n.nodeName.toUpperCase() === this._template.e.toUpperCase() && n.namespaceURI === this.namespace ) {
					this.node = node = n;
					existing = true;
					break;
				} else {
					detachNode( n );
				}
			}
		}

		if ( !node ) {
			node = createElement( this._template.e, this.namespace, this.getAttribute( 'is' ) );
			this.node = node;
		}

		// tie the node to this vdom element
		defineProperty( node, '_ractive', {
			value: {
				proxy: this
			}
		});

		// Is this a top-level node of a component? If so, we may need to add
		// a data-ractive-css attribute, for CSS encapsulation
		if ( this._parentFragment.cssIds ) {
			node.setAttribute( 'data-ractive-css', this._parentFragment.cssIds.map( x => `{${x}}` ).join( ' ' ) );
		}

		if ( existing && this.foundNode ) this.foundNode( node );

		// register intro before rendering content so children can find the intro
		const intro = this.intro;
		if ( intro && intro.shouldFire( 'intro' ) ) {
			intro.isIntro = true;
			runloop.registerTransition( intro );
		}

		if ( this._fragment ) {
			const children = existing ? toArray( node.childNodes ) : undefined;

			this._fragment.render( node, children );

			// clean up leftover children
			if ( children ) {
				children.forEach( detachNode );
			}
		}

		if ( existing ) {
			// store initial values for two-way binding
			if ( this.binding && this.binding.wasUndefined ) this.binding.setFromNode( node );
			// remove unused attributes
			let i = node.attributes.length;
			while ( i-- ) {
				const name = node.attributes[i].name;
				if ( !( name in this._attributeByName ) ) node.removeAttribute( name );
			}
		}

		this.attributes.forEach( render );

		if ( this.binding ) this.binding.render();

		updateLiveQueries( this );

		if ( !existing ) {
			target.appendChild( node );
		}

		this.rendered = true;
	}

	shuffled () {
		this.__liveQueries.forEach( makeDirty );
		super.shuffled();
	}

	toString () {
		const tagName = this._template.e;

		let attrs = this.attributes.map( stringifyAttribute ).join( '' );

		// Special case - selected options
		if ( this.name === 'option' && this.isSelected() ) {
			attrs += ' selected';
		}

		// Special case - two-way radio name bindings
		if ( this.name === 'input' && inputIsCheckedRadio( this ) ) {
			attrs += ' checked';
		}

		// Special case style and class attributes and directives
		let style, cls;
		this.attributes.forEach( attr => {
			if ( attr.name === 'class' ) {
				cls = ( cls || '' ) + ( cls ? ' ' : '' ) + safeAttributeString( attr.getString() );
			} else if ( attr.name === 'style' ) {
				style = ( style || '' ) + ( style ? ' ' : '' ) + safeAttributeString( attr.getString() );
				if ( style && !endsWithSemi.test( style ) ) style += ';';
			} else if ( attr.styleName ) {
				style = ( style || '' ) + ( style ? ' ' : '' ) +  `${decamelize( attr.styleName )}: ${safeAttributeString( attr.getString() )};`;
			} else if ( attr.inlineClass && attr.getValue() ) {
				cls = ( cls || '' ) + ( cls ? ' ' : '' ) + attr.inlineClass;
			}
		});
		// put classes first, then inline style
		if ( style !== undefined ) attrs = ' style' + ( style ? `="${style}"` : '' ) + attrs;
		if ( cls !== undefined ) attrs = ' class' + (cls ? `="${cls}"` : '') + attrs;

		let str = `<${tagName}${attrs}>`;

		if ( this.isVoid ) return str;

		// Special case - textarea
		if ( this.name === 'textarea' && this.getAttribute( 'value' ) !== undefined ) {
			str += escapeHtml( this.getAttribute( 'value' ) );
		}

		// Special case - contenteditable
		else if ( this.getAttribute( 'contenteditable' ) !== undefined ) {
			str += ( this.getAttribute( 'value' ) || '' );
		}

		if ( this._fragment ) {
			str += this._fragment.toString( !/^(?:script|style)$/i.test( this._template.e ) ); // escape text unless script/style
		}

		str += `</${tagName}>`;
		return str;
	}

	unbind () {
		this.attributes.forEach( unbind );

		if ( this.binding ) this.binding.unbind();
		if ( this._fragment ) this._fragment.unbind();
	}

	unrender ( shouldDestroy ) {
		if ( !this.rendered ) return;
		this.rendered = false;

		// unrendering before intro completed? complete it now
		// TODO should be an API for aborting transitions
		const transition = this.intro;
		if ( transition && transition.complete ) transition.complete();

		// Detach as soon as we can
		if ( this.name === 'option' ) {
			// <option> elements detach immediately, so that
			// their parent <select> element syncs correctly, and
			// since option elements can't have transitions anyway
			this.detach();
		} else if ( shouldDestroy ) {
			runloop.detachWhenReady( this );
		}

		// outro transition
		const outro = this.outro;
		if ( outro && outro.shouldFire( 'outro' ) ) {
			outro.isIntro = false;
			runloop.registerTransition( outro );
		}

		if ( this._fragment ) this._fragment.unrender();

		if ( this.binding ) this.binding.unrender();

		this.__liveQueries.forEach( query => query.remove( this.node ) );
		this.__liveQueries = [];
		// TODO forms are a special case
	}

	update () {
		if ( this.dirty ) {
			this.dirty = false;

			this.attributes.forEach( update );

			if ( this._fragment ) this._fragment.update();
		}
	}
}

const toFront = [ 'min', 'max', 'class', 'type' ];
function sortAttributes ( left, right ) {
	left = left.name;
	right = right.name;
	const l = left === 'value' ? 1 : ~toFront.indexOf( left );
	const r = right === 'value' ? 1 : ~toFront.indexOf( right );
	return l < r ? -1 : l > r ? 1 : 0;
}

function inputIsCheckedRadio ( element ) {
	const nameAttr = element._attributeByName.name;
	return element.getAttribute( 'type' ) === 'radio' &&
		( nameAttr || {} ).interpolator &&
		element.getAttribute( 'value' ) === nameAttr.interpolator.model.get();
}

function stringifyAttribute ( attribute ) {
	const str = attribute.toString();
	return str ? ' ' + str : '';
}

function getNamespace ( element ) {
	// Use specified namespace...
	const xmlns = element.getAttribute( 'xmlns' );
	if ( xmlns ) return xmlns;

	// ...or SVG namespace, if this is an <svg> element
	if ( element.name === 'svg' ) return svg;

	const parent = element.parent;

	if ( parent ) {
		// ...or HTML, if the parent is a <foreignObject>
		if ( parent.name === 'foreignobject' ) return html;

		// ...or inherit from the parent node
		return parent.node.namespaceURI;
	}

	return element.ractive.el.namespaceURI;
}
