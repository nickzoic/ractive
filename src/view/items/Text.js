import { doc } from '../../config/environment';
import { TEXT } from '../../config/types';
import { escapeHtml } from '../../utils/html';
import Item from './shared/Item';
import { detachNode } from '../../utils/dom';
import { inAttributes } from './element/ConditionalAttribute';
import noop from '../../utils/noop';

export default class Text extends Item {
	constructor ( options ) {
		super( options );
		this.type = TEXT;
	}

	detach () {
		return detachNode( this.node );
	}

	firstNode () {
		return this.node;
	}

	render ( target, occupants ) {
		if ( inAttributes() ) return;
		this.rendered = true;

		if ( occupants ) {
			let n = occupants[0];
			if ( n && n.nodeType === 3 ) {
				occupants.shift();
				if ( n.nodeValue !== this._template ) {
					n.nodeValue = this._template;
				}
			} else {
				n = this.node = doc.createTextNode( this._template );
				if ( occupants[0] ) {
					target.insertBefore( n, occupants[0] );
				} else {
					target.appendChild( n );
				}
			}

			this.node = n;
		} else {
			this.node = doc.createTextNode( this._template );
			target.appendChild( this.node );
		}
	}

	toString ( escape ) {
		return escape ? escapeHtml( this._template ) : this._template;
	}

	unrender ( shouldDestroy ) {
		if ( this.rendered && shouldDestroy ) this.detach();
		this.rendered = false;
	}

	valueOf () {
		return this._template;
	}
}

const proto = Text.prototype;
proto.bind = proto.unbind = proto.update = noop;
