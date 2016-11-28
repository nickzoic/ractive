import { ATTRIBUTE } from '../../../../config/types';
import Input from './Input';
import { isBindable } from '../binding/selectBinding';
import runloop from '../../../../global/runloop';
import createItem from '../../createItem';
import Fragment from '../../../Fragment';

export default class Textarea extends Input {
	constructor( options ) {
		const template = options._template;

		options.deferContent = true;

		super( options );

		// check for single interpolator binding
		if ( !this._attributeByName.value ) {
			if ( template.f && isBindable( { _template: template } ) ) {
				this.attributes.push( createItem( {
					owner: this,
					_template: { t: ATTRIBUTE, f: template.f, n: 'value' },
					_parentFragment: this._parentFragment
				} ) );
			} else {
				this._fragment = new Fragment({ owner: this, cssIds: null, _template: template.f });
			}
		}
	}

	bubble () {
		if ( !this.dirty ) {
			this.dirty = true;

			if ( this.rendered && !this.binding && this._fragment ) {
				runloop.scheduleTask( () => {
					this.dirty = false;
					this.node.value = this._fragment.toString();
				});
			}

			this._parentFragment.bubble(); // default behaviour
		}
	}
}
