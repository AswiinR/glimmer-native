import { precompile } from '@glimmer/compiler';

export default precompile(`<page ...attributes>{{yield}}</page>`);
