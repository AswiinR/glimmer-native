import { RadListView } from 'nativescript-ui-listview';
import ViewNode from '../nodes/ViewNode';
import NativeViewElementNode from './NativeViewElementNode';
export default class RadListViewElement extends NativeViewElementNode<RadListView> {
    lastItemSelected: any;
    component: any;
    items: any[];
    templates: {};
    constructor();
    private loadView;
    private getComponentForView;
    private updateViewWithProps;
    private updateInternalItem;
    private updateListItem;
    nativeView: RadListView;
    onInsertedChild(childNode: ViewNode, index: number): void;
    onRemovedChild(childNode: ViewNode): void;
}
