import { Dict } from '@glimmer/interfaces';
export default class onModifier<NativeModifierInstance> {
    element: any;
    eventName: any;
    callback: any;
    params: any;
    didInsertElement(element: any, _params: unknown[], _hash: Dict<unknown>): void;
    didUpdate(element: any, _params: unknown[], _hash: Dict<unknown>): void;
    willDestroyElement(element: any): void;
}
