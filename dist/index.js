var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { precompile } from '@glimmer/compiler';
import { Context } from '@glimmer/opcode-compiler';
import { artifacts } from '@glimmer/program';
import { State } from '@glimmer/reference';
import { AotRuntime, renderAot, renderSync, TEMPLATE_ONLY_COMPONENT } from '@glimmer/runtime';
import { launchEvent, on, run } from 'tns-core-modules/application';
import { createElement, registerElement } from './src/dom/element-registry';
import { registerGlimmerElements } from './src/dom/glimmer-elements';
import NativeViewElementNode from './src/dom/native/NativeViewElementNode';
import { registerNativeElements } from './src/dom/nativescript-elements';
import DocumentNode from './src/dom/nodes/DocumentNode';
import GlimmerResolverDelegate, { Compilable, ResolverDelegate } from './src/glimmer/context';
import { navigate } from './src/glimmer/navigation';
import buildUserHelper from './src/glimmer/references/helper-reference';
import Resolver from './src/glimmer/resolver';
import NativeComponentResult from './src/glimmer/result';
import setupGlimmer from './src/glimmer/setup';
//Exports
export { ResolverDelegate } from './src/glimmer/context';
export { createElement } from './src/dom/element-registry';
export { action } from './src/glimmer/decorators/action';
export { default as Navigation } from './src/glimmer/navigation';
export { default as DocumentNode } from './src/dom/nodes/DocumentNode';
export { default as ElementNode } from './src/dom/nodes/ElementNode';
export { default as NativeElementNode } from './src/dom/native/NativeElementNode';
export { default as Resolver } from './src/glimmer/resolver';
export { default as NativeCapabilities } from './src/glimmer/native-capabilities';
export { NativeModifier, NativeModifierDefinitionState } from './src/glimmer/native-modifier-manager';
export default class Application {
    constructor(appFolder, components, helpers) {
        registerNativeElements();
        registerGlimmerElements();
        const resolverDelegate = new ResolverDelegate();
        const resolver = new Resolver();
        Application.resolver = resolver;
        Application.resolverDelegate = resolverDelegate;
        //Order here is important due to handle's being generated by plugin
        this.parseTemplates(appFolder);
        // this.parseComponents(appFolder);
        this.registerState(components);
        setupGlimmer(resolverDelegate, resolver);
        this.registerHelpers(helpers);
        //-----------------------------------------------------------------
        Application.document = new DocumentNode();
        Application.rootFrame = createElement('Frame');
        Application.rootFrame.setAttribute('id', 'root');
        Application.document.appendChild(Application.rootFrame);
        Application.context = Context(GlimmerResolverDelegate);
    }
    static addListItem(viewNode) {
        this.listItems.push(viewNode);
    }
    static renderPage(name, containerElement, nextSibling = null, state) {
        //Shouldn't need to do this here - TODO: Look into why
        let component = Compilable(`<${name} @model={{this.model}} @listViewItems={{this.listViewItems}} />`);
        const compiled = component.compile(Application.context);
        // const component = GlimmerResolverDelegate.lookupComponent(name);
        // const compiled = component.compilable.compile(Application.context);
        return Application._renderPage(name, containerElement, nextSibling, compiled, Object.assign(Object.assign({}, state), { listViewItems: [...Application.listItems] }));
    }
    static _renderPage(name, containerElement, nextSibling, compilable, data = {}) {
        let state = State(data);
        const artifact = artifacts(Application.context);
        Application.aotRuntime = AotRuntime(Application.document, artifact, Application.resolver);
        const cursor = { element: containerElement ? containerElement : Application.rootFrame, nextSibling };
        let iterator = renderAot(Application.aotRuntime, compilable, cursor, state);
        try {
            const result = renderSync(Application.aotRuntime.env, iterator);
            console.log(`Page ${name} Rendered`);
            Application.result = result;
            Application.state = state;
            Application._rendered = true;
            let node = result.firstNode();
            while (node && !node._nativeElement) {
                node = node.nextSibling;
            }
            node.parentNode = containerElement;
            containerElement.childNodes.push(node);
            node.component = new NativeComponentResult(name, result, state, Application.aotRuntime);
            Application.renderedPage = node;
            return node;
        }
        catch (error) {
            console.log(`Error rendering page ${name}: ${error}`);
        }
    }
    static _renderComponent(name, cursor, compilable, data) {
        let state = State(data);
        const artifact = artifacts(Application.context);
        const runtime = AotRuntime(Application.document, artifact, Application.resolver);
        let iterator = renderAot(runtime, compilable, cursor, state);
        // const treeBuilder = NewElementBuilder.forInitialRender(runtime.env, cursor);
        // let iterator = renderAotMain(runtime, state, treeBuilder, compilable);
        try {
            const result = renderSync(runtime.env, iterator);
            console.log(`Component ${name} Rendered`);
            let node = result.firstNode();
            while (!node._nativeView) {
                node = node.nextSibling;
            }
            node._meta.component = new NativeComponentResult(name, result, state, runtime);
            return node;
        }
        catch (error) {
            console.log(`Error rendering component ${name}: ${error}`);
        }
    }
    parseTemplates(folder) {
        let templatesFile = folder.getFile('templates.json');
        let templates = templatesFile.readTextSync();
        JSON.parse(templates).forEach((template) => {
            Application.resolverDelegate.registerComponent(template.name, template.handle, template.source, template.capabilities);
        });
    }
    // parseComponents(appFolder) {
    //     let componentsFile = appFolder.getFile('components.json');
    //     let componentsText = componentsFile.readTextSync();
    //     JSON.parse(componentsText).forEach((component) => {
    //         const classFile = require(`~/bundle.js`)[component.name];
    //         Application.resolver.registerComponent(component.name, classFile);
    //     });
    // }
    registerHelpers(helpers) {
        helpers.forEach((helper) => {
            this.registerHelper(helper.name, helper.class);
        });
    }
    registerState(components) {
        return __awaiter(this, void 0, void 0, function* () {
            components.forEach((component) => {
                Application.resolver.registerComponent(component.name, component.class);
            });
        });
    }
    registerNativeComponent(name, value) {
        this.registerNativeElement(name, value);
        const handle = Application.resolver.registerTemplateOnlyComponent();
        Application.resolverDelegate.registerComponent(name, handle, precompile(`<${name.toLowerCase()} ...attributes> {{yield}} </${name.toLowerCase()}>`), TEMPLATE_ONLY_COMPONENT);
    }
    registerHelper(name, func) {
        const helper = buildUserHelper(func);
        const handle = Application.resolver.registerHelper(helper);
        Application.resolverDelegate.registerHelper(name, handle);
    }
    boot(name) {
        const rootFrame = Application.rootFrame;
        const navigation = navigate(name, null, {
            frame: rootFrame.nativeView
        });
        return new Promise((resolve, reject) => {
            //wait for launch
            on(launchEvent, () => {
                resolve(navigation);
            });
            try {
                run({ create: () => rootFrame.nativeView });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    registerNativeElement(elementName, resolver, meta = null) {
        registerElement(elementName, () => new NativeViewElementNode(elementName, resolver(), meta));
    }
    scheduleRerender() {
        if (this._scheduled || !Application._rendered)
            return;
        this._rendering = true;
        this._scheduled = true;
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            this._scheduled = false;
            yield Application._rerender();
            this._rendering = false;
        }), 0);
    }
    static scheduleRerender() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._scheduled || !Application._rendered)
                return;
            this._rendering = true;
            this._scheduled = true;
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                this._scheduled = false;
                yield Application._rerender();
                this._rendering = false;
            }), 0);
        });
    }
    static rerenderForListView() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Application.aotRuntime.env.begin();
                yield Application.result.rerender();
                Application.aotRuntime.env.commit();
                Application._rendered = true;
                console.log('Result Re-rendered');
            }
            catch (error) {
                console.log(`Error in re-render: ${error}`);
            }
        });
    }
    static _rerender() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Application.aotRuntime.env.begin();
                yield Application.result.rerender();
                Application.aotRuntime.env.commit();
                Application._rendered = true;
                console.log('Result Re-rendered');
            }
            catch (error) {
                console.log(`Error in re-render: ${error}`);
            }
        });
    }
}
Application.outsideComponents = [];
Application.listItems = [];
