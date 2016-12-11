/* global console, navigator */
/* eslint no-console:"off" */

const win = typeof window !== 'undefined' ? window : null;
const doc = win ? document : null;

const isClient = !!doc;
const isJsdom = ( typeof navigator !== 'undefined' && /jsDom/.test( navigator.appName ) );
const hasConsole = ( typeof console !== 'undefined' && typeof console.warn === 'function' && typeof console.warn.apply === 'function' );

const svg = doc ?
	doc.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' ) :
	false;

const vendors = [ 'o', 'ms', 'moz', 'webkit' ];

export { win, doc, isClient, isJsdom, hasConsole, svg, vendors };
