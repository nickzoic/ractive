import runloop from '../../global/runloop';
import { warnIfDebug } from '../../utils/log';
import { ANCHOR, ATTRIBUTE, BINDING_FLAG, COMPONENT, DECORATOR, EVENT, TRANSITION, YIELDER } from '../../config/types';
import Item from './shared/Item';
import ConditionalAttribute from './element/ConditionalAttribute';
import construct from '../../Ractive/construct';
import initialise from '../../Ractive/initialise';
import render from '../../Ractive/render';
import { create, extend } from '../../utils/object';
import { createDocumentFragment } from '../../utils/dom';
import createItem from './createItem';
import { removeFromArray } from '../../utils/array';
import { bind, render as callRender, unbind, unrender, update } from '../../shared/methodCallers';
import updateLiveQueries from './component/updateLiveQueries';
import { updateAnchors } from '../../shared/anchors';
import { teardown } from '../../Ractive/prototype/teardown';

function makeDirty ( query ) {
	query.makeDirty();
}

export default class Component extends Item {
	constructor ( options, ComponentConstructor ) {
		super( options );
		this.isAnchor = this._template.t === ANCHOR;
		this.type = this.isAnchor ? ANCHOR : COMPONENT; // override ELEMENT from super

		const partials = options._template.p || {};
		if ( !( 'content' in partials ) ) partials.content = options._template.f || [];
		this._partials = partials; // TEMP

		if ( this.isAnchor ) {
			this.name = options._template.n;

			this.addChild = addChild;
			this.removeChild = removeChild;
		} else {
			const instance = create( ComponentConstructor.prototype );

			this.instance = instance;
			this.name = options._template.e;

			if ( instance.el ) {
				warnIfDebug( `The <${this.name}> component has a default 'el' property; it has been disregarded` );
			}

			this.__liveQueries = [];

			// find container
			let fragment = options._parentFragment;
			let container;
			while ( fragment ) {
				if ( fragment.owner.type === YIELDER ) {
					container = fragment.owner.container;
					break;
				}

				fragment = fragment.parent;
			}

			// add component-instance-specific properties
			instance.parent = this._parentFragment.ractive;
			instance.container = container || null;
			instance.root = instance.parent.root;
			instance.component = this;

			construct( this.instance, { partials });

			// for hackability, this could be an open option
			// for any ractive instance, but for now, just
			// for components and just for ractive...
			instance._inlinePartials = partials;
		}

		this._attributeByName = {};

		this.events = [];
		this.attributes = [];
		const leftovers = [];
		( this._template.m || [] ).forEach( template => {
			switch ( template.t ) {
				case ATTRIBUTE:
				case EVENT:
					this.attributes.push( createItem({
						owner: this,
						_parentFragment: this._parentFragment,
						_template: template
					}) );
					break;

				case TRANSITION:
				case BINDING_FLAG:
				case DECORATOR:
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

		this.eventHandlers = [];
	}

	bind () {
		if ( !this.isAnchor ) {
			this.attributes.forEach( bind );

			initialise( this.instance, {
				partials: this._partials
			}, {
				cssIds: this._parentFragment.cssIds
			});

			this.eventHandlers.forEach( bind );

			this.bound = true;
		}
	}

	bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this._parentFragment.bubble();
		}
	}

	destroyed () {
		if ( !this.isAnchor && this.instance._fragment ) this.instance._fragment.destroyed();
	}

	detach () {
		if ( this.isAnchor ) {
			if ( this.instance ) return this.instance._fragment.detach();
			return createDocumentFragment();
		}

		return this.instance._fragment.detach();
	}

	find ( selector, options ) {
		if ( this.instance ) return this.instance._fragment.find( selector, options );
	}

	findAll ( selector, query ) {
		if ( this.instance ) this.instance._fragment.findAll( selector, query );
	}

	findComponent ( name, options ) {
		if ( !name || this.name === name ) return this.instance;

		if ( this.instance._fragment ) {
			return this.instance._fragment.findComponent( name, options );
		}
	}

	findAllComponents ( name, query ) {
		if ( this.instance && query.test( this ) ) {
			query.add( this.instance );

			if ( query.live ) {
				this.__liveQueries.push( query );
			}
		}

		if ( this.instance ) this.instance.findAllComponents( name, { _query: query } );
	}

	firstNode ( skipParent ) {
		if ( this.instance ) return this.instance._fragment.firstNode( skipParent );
	}

	removeFromQuery ( query ) {
		if ( this.instance ) query.remove( this.instance );
		removeFromArray( this.__liveQueries, query );
	}

	render ( target, occupants ) {
		if ( this.isAnchor ) {
			this.target = target;
			if ( !checking.length ) {
				checking.push( this.ractive );
				runloop.scheduleTask( checkAnchors, true );
			}
		} else {
			render( this.instance, target, null, occupants );

			this.attributes.forEach( callRender );
			this.eventHandlers.forEach( callRender );
			updateLiveQueries( this );
		}
		this.rendered = true;
	}

	shuffled () {
		if ( this.instance ) this.__liveQueries.forEach( makeDirty );
		super.shuffled();
	}

	toString () {
		if ( this.instance ) return this.instance.toHTML();
	}

	unbind () {
		if ( !this.isAnchor ) {
			this.bound = false;

			this.attributes.forEach( unbind );

			teardown( this.instance, () => runloop.promise() );
		}
	}

	unrender ( shouldDestroy ) {
		this.shouldDestroy = shouldDestroy;

		if ( this.isAnchor ) {
			if ( this.item ) unrenderItem( this, this.item );
			this.target = null;
			if ( !checking.length ) {
				checking.push( this.ractive );
				runloop.scheduleTask( checkAnchors, true );
			}
		} else {
			this.instance.unrender();
			this.instance.el = this.instance.target = null;
			this.attributes.forEach( unrender );
			this.eventHandlers.forEach( unrender );

			this.__liveQueries.forEach( query => query.remove( this.instance ) );
			this.__liveQueries = [];
		}

		this.rendered = false;
	}

	update () {
		this.dirty = false;
		if ( this.instance ) {
			this.instance._fragment.update();
			this.attributes.forEach( update );
			this.eventHandlers.forEach( update );
		}
	}
}

function addChild ( meta ) {
	if ( this.item ) this.removeChild( this.item );

	const child = meta.instance;
	meta.anchor = this;

	meta._parentFragment = this._parentFragment;
	meta.name = meta.nameOption || this.name;
	this.name = meta.name;


	if ( !child.isolated ) child._viewmodel.attached( this._parentFragment );

	// render as necessary
	if ( this.rendered ) {
		renderItem( this, meta );
	}
}

function removeChild ( meta ) {
	// unrender as necessary
	if ( this.item === meta ) {
		unrenderItem( this, meta );
		this.name = this._template.n;
	}
}

function renderItem ( anchor, meta ) {
	if ( !anchor.rendered ) return;

	meta.shouldDestroy = false;
	meta._parentFragment = anchor._parentFragment;

	anchor.item = meta;
	anchor.instance = meta.instance;
	anchor.__liveQueries = meta.__liveQueries;
	const nextNode = anchor._parentFragment.findNextNode( anchor );

	if ( meta.instance._fragment.rendered ) {
		meta.instance.unrender();
	}

	meta.partials = meta.instance.partials;
	meta.instance.partials = extend( {}, meta.partials, anchor._partials );

	meta.instance._fragment.unbind();
	meta.instance._fragment.bind( meta.instance._viewmodel );

	anchor.attributes.forEach( bind );
	anchor.eventHandlers.forEach( bind );
	anchor.attributes.forEach( callRender );
	anchor.eventHandlers.forEach( callRender );

	const target = anchor._parentFragment.findParentNode();
	render( meta.instance, target, target.contains( nextNode ) ? nextNode : null );

	if ( meta.lastBound !== anchor ) {
		meta.lastBound = anchor;
	}

	updateLiveQueries( meta );
}

function unrenderItem ( anchor, meta ) {
	if ( !anchor.rendered ) return;

	meta.shouldDestroy = true;
	meta.instance.unrender();

	anchor.eventHandlers.forEach( unrender );
	anchor.attributes.forEach( unrender );
	anchor.eventHandlers.forEach( unbind );
	anchor.attributes.forEach( unbind );

	meta.instance.el = meta.instance.anchor = null;
	meta._parentFragment = null;
	meta.anchor = null;
	anchor.item = null;
	anchor.instance = null;

	meta.__liveQueries.forEach( q => q.remove( meta.instance ) );
	meta.__liveQueries = [];
	anchor.__liveQueries = null;
}

let checking = [];
export function checkAnchors () {
	const list = checking;
	checking = [];

	list.forEach( updateAnchors );
}
