import { SECTION, SECTION_WITH, YIELDER } from '../../config/types';
import { warnOnceIfDebug, warnIfDebug } from '../../utils/log';
import { MustacheContainer } from './shared/Mustache';
import Fragment from '../Fragment';
import getPartialTemplate from './partial/getPartialTemplate';
import { isArray } from '../../utils/is';
import parser from '../../Ractive/config/runtime-parser';
import { doInAttributes } from './element/ConditionalAttribute';
import { resolveAliases } from './Alias';

export default class Partial extends MustacheContainer {
	constructor ( options ) {
		super( options );

		this.yielder = options._template.t === YIELDER;

		if ( this.yielder ) {
			this.container = options._parentFragment.ractive;
			this.component = this.container.component;

			this.containerFragment = options._parentFragment;
			this._parentFragment = this.component._parentFragment;

			// {{yield}} is equivalent to {{yield content}}
			if ( !options._template.r && !options._template.rx && !options._template.x ) options._template.r = 'content';
		}
	}

	bind () {
		// keep track of the reference name for future resets
		this.refName = this._template.r;

		// name matches take priority over expressions
		const template = this.refName ? getPartialTemplate( this.ractive, this.refName, this._parentFragment ) || null : null;
		let templateObj;

		if ( template ) {
			this.named = true;
			this.setTemplate( this._template.r, template );
		}

		if ( !template ) {
			super.bind();
			if ( this.model && ( templateObj = this.model.get() ) && typeof templateObj === 'object' && ( typeof templateObj.template === 'string' || isArray( templateObj.t ) ) ) {
				if ( templateObj.template ) {
					this.source = templateObj.template;
					templateObj = parsePartial( this._template.r, templateObj.template, this.ractive );
				} else {
					this.source = templateObj.t;
				}
				this.setTemplate( this._template.r, templateObj.t );
			} else if ( ( !this.model || typeof this.model.get() !== 'string' ) && this.refName ) {
				this.setTemplate( this.refName, template );
			} else {
				this.setTemplate( this.model.get() );
			}
		}

		const options = {
			owner: this,
			_template: this.partialTemplate
		};

		if ( this._template.c ) {
			options._template = [{ t: SECTION, n: SECTION_WITH, f: options._template }];
			for ( const k in this._template.c ) {
				options._template[0][k] = this._template.c[k];
			}
		}

		if ( this.yielder ) {
			options.ractive = this.container.parent;
		}

		this._fragment = new Fragment(options);
		if ( this._template.z ) {
			this._fragment.aliases = resolveAliases( this._template.z, this.yielder ? this.containerFragment : this._parentFragment );
		}
		this._fragment.bind();
	}

	bubble () {
		if ( this.yielder && !this.dirty ) {
			this.containerFragment.bubble();
			this.dirty = true;
		} else {
			super.bubble();
		}
	}

	findNextNode() {
		return this.yielder ? this.containerFragment.findNextNode( this ) : super.findNextNode();
	}

	forceResetTemplate () {
		this.partialTemplate = undefined;

		// on reset, check for the reference name first
		if ( this.refName ) {
			this.partialTemplate = getPartialTemplate( this.ractive, this.refName, this._parentFragment );
		}

		// then look for the resolved name
		if ( !this.partialTemplate ) {
			this.partialTemplate = getPartialTemplate( this.ractive, this.name, this._parentFragment );
		}

		if ( !this.partialTemplate ) {
			warnOnceIfDebug( `Could not find template for partial '${this.name}'` );
			this.partialTemplate = [];
		}

		if ( this.inAttribute ) {
			doInAttributes( () => this._fragment.resetTemplate( this.partialTemplate ) );
		} else {
			this._fragment.resetTemplate( this.partialTemplate );
		}

		this.bubble();
	}

	render ( target, occupants ) {
		return this._fragment.render( target, occupants );
	}

	setTemplate ( name, template ) {
		this.name = name;

		if ( !template && template !== null ) template = getPartialTemplate( this.ractive, name, this._parentFragment );

		if ( !template ) {
			warnOnceIfDebug( `Could not find template for partial '${name}'` );
		}

		this.partialTemplate = template || [];
	}

	unbind () {
		super.unbind();
		this._fragment.aliases = {};
		this._fragment.unbind();
	}

	unrender ( shouldDestroy ) {
		this._fragment.unrender( shouldDestroy );
	}

	update () {
		let template;

		if ( this.dirty ) {
			this.dirty = false;

			if ( !this.named ) {
				if ( this.model ) {
					template = this.model.get();
				}

				if ( template && typeof template === 'string' && template !== this.name ) {
					this.setTemplate( template );
					this._fragment.resetTemplate( this.partialTemplate );
				} else if ( template && typeof template === 'object' && ( typeof template.template === 'string' || isArray( template.t ) ) ) {
					if ( template.t !== this.source && template.template !== this.source ) {
						if ( template.template ) {
							this.source = template.template;
							template = parsePartial( this.name, template.template, this.ractive );
						} else {
							this.source = template.t;
						}
						this.setTemplate( this.name, template.t );
						this._fragment.resetTemplate( this.partialTemplate );
					}
				}
			}

			this._fragment.update();
		}
	}
}

function parsePartial( name, partial, ractive ) {
	let parsed;

	try {
		parsed = parser.parse( partial, parser.getParseOptions( ractive ) );
	} catch (e) {
		warnIfDebug( `Could not parse partial from expression '${name}'\n${e.message}` );
	}

	return parsed || { t: [] };
}
