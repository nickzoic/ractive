import { createDocumentFragment } from '../../utils/dom';
import { SECTION_EACH, SECTION_IF, SECTION_IF_WITH, SECTION_UNLESS, SECTION_WITH } from '../../config/types';
import { isArray, isObject } from '../../utils/is';
import Fragment from '../Fragment';
import RepeatedFragment from '../RepeatedFragment';
import { MustacheContainer } from './shared/Mustache';

function isEmpty ( value ) {
	return !value ||
	       ( isArray( value ) && value.length === 0 ) ||
		   ( isObject( value ) && Object.keys( value ).length === 0 );
}

function getType ( value, hasIndexRef ) {
	if ( hasIndexRef || isArray( value ) ) return SECTION_EACH;
	if ( isObject( value ) || typeof value === 'function' ) return SECTION_IF_WITH;
	if ( value === undefined ) return null;
	return SECTION_IF;
}

export default class Section extends MustacheContainer {
	constructor ( options ) {
		super( options );

		this.sectionType = options._template.n || null;
		this.templateSectionType = this.sectionType;
		this.subordinate = options._template.l === 1;
		this._fragment = null;
	}

	bind () {
		super.bind();

		if ( this.subordinate ) {
			this.sibling = this._parentFragment.items[ this._parentFragment.items.indexOf( this ) - 1 ];
			this.sibling.nextSibling = this;
		}

		// if we managed to bind, we need to create children
		if ( this.model ) {
			this.dirty = true;
			this.update();
		} else if ( this.sectionType && this.sectionType === SECTION_UNLESS && ( !this.sibling || !this.sibling.isTruthy() ) ) {
			this._fragment = new Fragment({
				owner: this,
				_template: this._template.f
			}).bind();
		}
	}

	isTruthy () {
		if ( this.subordinate && this.sibling.isTruthy() ) return true;
		const value = !this.model ? undefined : this.model.isRoot ? this.model.value : this.model.get();
		return !!value && ( this.templateSectionType === SECTION_IF_WITH || !isEmpty( value ) );
	}

	rebind ( next, previous, safe ) {
		if ( super.rebind( next, previous, safe ) ) {
			if ( this._fragment && this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ) {
				this._fragment.rebinding( next );
			}
		}
	}

	render ( target, occupants ) {
		this.rendered = true;
		if ( this._fragment ) this._fragment.render( target, occupants );
	}

	shuffle ( newIndices ) {
		if ( this._fragment && this.sectionType === SECTION_EACH ) {
			this._fragment.shuffle( newIndices );
		}
	}

	unbind () {
		super.unbind();
		if ( this._fragment ) this._fragment.unbind();
	}

	unrender ( shouldDestroy ) {
		if ( this.rendered && this._fragment ) this._fragment.unrender( shouldDestroy );
		this.rendered = false;
	}

	update () {
		if ( !this.dirty ) return;

		if ( this._fragment && this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ) {
			this._fragment.context = this.model;
		}

		if ( !this.model && this.sectionType !== SECTION_UNLESS ) return;

		this.dirty = false;

		const value = !this.model ? undefined : this.model.isRoot ? this.model.value : this.model.get();
		const siblingFalsey = !this.subordinate || !this.sibling.isTruthy();
		const lastType = this.sectionType;

		// watch for switching section types
		if ( this.sectionType === null || this.templateSectionType === null ) this.sectionType = getType( value, this._template.i );
		if ( lastType && lastType !== this.sectionType && this._fragment ) {
			if ( this.rendered ) {
				this._fragment.unbind().unrender( true );
			}

			this._fragment = null;
		}

		let newFragment;

		const fragmentShouldExist = this.sectionType === SECTION_EACH || // each always gets a fragment, which may have no iterations
		                            this.sectionType === SECTION_WITH || // with (partial context) always gets a fragment
		                            ( siblingFalsey && ( this.sectionType === SECTION_UNLESS ? !this.isTruthy() : this.isTruthy() ) ); // if, unless, and if-with depend on siblings and the condition

		if ( fragmentShouldExist ) {
			if ( this._fragment ) {
				this._fragment.update();
			} else {
				if ( this.sectionType === SECTION_EACH ) {
					newFragment = new RepeatedFragment({
						owner: this,
						_template: this._template.f,
						indexRef: this._template.i
					}).bind( this.model );
				} else {
					// only with and if-with provide context - if and unless do not
					const context = this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ? this.model : null;
					newFragment = new Fragment({
						owner: this,
						_template: this._template.f
					}).bind( context );
				}
			}
		} else {
			if ( this._fragment && this.rendered ) {
				this._fragment.unbind().unrender( true );
			}

			this._fragment = null;
		}

		if ( newFragment ) {
			if ( this.rendered ) {
				const parentNode = this._parentFragment.findParentNode();
				const anchor = this._parentFragment.findNextNode( this );

				if ( anchor ) {
					const docFrag = createDocumentFragment();
					newFragment.render( docFrag );

					// we use anchor.parentNode, not parentNode, because the sibling
					// may be temporarily detached as a result of a shuffle
					anchor.parentNode.insertBefore( docFrag, anchor );
				} else {
					newFragment.render( parentNode );
				}
			}

			this._fragment = newFragment;
		}

		if ( this.nextSibling ) {
			this.nextSibling.dirty = true;
			this.nextSibling.update();
		}
	}
}
