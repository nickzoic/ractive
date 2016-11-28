import Fragment from '../Fragment';
import { ContainerItem } from './shared/Item';
import resolve from '../resolvers/resolve';

export function resolveAliases( aliases, fragment ) {
	const resolved = {};

	for ( let i = 0; i < aliases.length; i++ ) {
		resolved[ aliases[i].n ] = resolve( fragment, aliases[i].x );
	}

	return resolved;
}

export default class Alias extends ContainerItem {
	constructor ( options ) {
		super( options );

		this._fragment = null;
	}

	bind () {
		this._fragment = new Fragment({
			owner: this,
			_template: this._template.f
		});

		this._fragment.aliases = resolveAliases( this._template.z, this._parentFragment );
		this._fragment.bind();
	}

	render ( target ) {
		this.rendered = true;
		if ( this._fragment ) this._fragment.render( target );
	}

	unbind () {
		this._fragment.aliases = {};
		if ( this._fragment ) this._fragment.unbind();
	}

	unrender ( shouldDestroy ) {
		if ( this.rendered && this._fragment ) this._fragment.unrender( shouldDestroy );
		this.rendered = false;
	}

	update () {
		if ( this.dirty ) {
			this.dirty = false;
			this._fragment.update();
		}
	}
}
