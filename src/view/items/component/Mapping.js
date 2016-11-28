import { INTERPOLATOR } from '../../../config/types';
import Item from '../shared/Item';
import { warnOnceIfDebug } from '../../../utils/log';
import Fragment from '../../Fragment';
import findElement from '../shared/findElement';
import parseJSON from '../../../utils/parseJSON';
import resolve from '../../resolvers/resolve';
import { isArray } from '../../../utils/is';
import runloop from '../../../global/runloop';

export default class Mapping extends Item {
	constructor ( options ) {
		super( options );

		this.name = options._template.n;

		this.owner = options.owner || options._parentFragment.owner || options._element || findElement( options._parentFragment );
		this._element = options._element || (this.owner._attributeByName ? this.owner : findElement( options._parentFragment ) );
		this._parentFragment = this._element._parentFragment; // shared
		this.ractive = this._parentFragment.ractive;

		this._fragment = null;

		this._element._attributeByName[ this.name ] = this;

		this.value = options._template.f;
	}

	bind () {
		if ( this._fragment ) {
			this._fragment.bind();
		}

		const template = this._template.f;
		const viewmodel = this._element.instance._viewmodel;

		if ( template === 0 ) {
			// empty attributes are `true`
			viewmodel.joinKey( this.name ).set( true );
		}

		else if ( typeof template === 'string' ) {
			const parsed = parseJSON( template );
			viewmodel.joinKey( this.name ).set( parsed ? parsed.value : template );
		}

		else if ( isArray( template ) ) {
			createMapping( this, true );
		}
	}

	render () {}

	unbind () {
		if ( this._fragment ) this._fragment.unbind();
		if ( this.boundFragment ) this.boundFragment.unbind();

		if ( this._element.bound ) {
			if ( this.link.target === this.model ) this.link.owner.unlink();
		}
	}

	unrender () {}

	update () {
		if ( this.dirty ) {
			this.dirty = false;
			if ( this._fragment ) this._fragment.update();
			if ( this.boundFragment ) this.boundFragment.update();
			if ( this.rendered ) this.updateDelegate();
		}
	}
}

function createMapping ( item ) {
	const template = item._template.f;
	const viewmodel = item._element.instance._viewmodel;
	const childData = viewmodel.value;

	if ( template.length === 1 && template[0].t === INTERPOLATOR ) {
		item.model = resolve( item._parentFragment, template[0] );

		if ( !item.model ) {
			warnOnceIfDebug( `The ${item.name}='{{${template[0].r}}}' mapping is ambiguous, and may cause unexpected results. Consider initialising your data to eliminate the ambiguity`, { ractive: item._element.instance }); // TODO add docs page explaining item
			item._parentFragment.ractive.get( item.name ); // side-effect: create mappings as necessary
			item.model = item._parentFragment.findContext().joinKey( item.name );
		}

		item.link = viewmodel.createLink( item.name, item.model, template[0].r );

		if ( item.model.get() === undefined && item.name in childData ) {
			item.model.set( childData[ item.name ] );
		}
	}

	else {
		item.boundFragment = new Fragment({
			owner: item,
			_template: template
		}).bind();

		item.model = viewmodel.joinKey( item.name );
		item.model.set( item.boundFragment.valueOf() );

		// item is a *bit* of a hack
		item.boundFragment.bubble = () => {
			Fragment.prototype.bubble.call( item.boundFragment );
			// defer this to avoid mucking around model deps if there happens to be an expression involved
			runloop.scheduleTask(() => {
				item.boundFragment.update();
				item.model.set( item.boundFragment.valueOf() );
			});
		};
	}
}
