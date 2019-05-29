var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Context } from '@glimmer/opcode-compiler';
import { artifacts } from '@glimmer/program';
import { AotRuntime, renderAot, renderSync } from '@glimmer/runtime';
import { launchEvent, on, run } from 'tns-core-modules/application';
import DocumentNode from './src/dom/nodes/DocumentNode';
import ElementNode from './src/dom/nodes/ElementNode';
import { registerElements } from './src/dom/setup-registry';
import GlimmerResolverDelegate from './src/glimmer/context';
import setupGlimmer from './src/glimmer/setup';
// import { setPropertyDidChange } from '@glimmer/component';
//Exports
export { ResolverDelegate } from './src/glimmer/context';
export { registerElements } from './src/dom/setup-registry';
export { default as DocumentNode } from './src/dom/nodes/DocumentNode';
export { default as ElementNode } from './src/dom/nodes/ElementNode';
export { default as Resolver } from './src/glimmer/resolver';
export { default as NativeCapabilities } from './src/glimmer/native-capabilities';
export { NativeModifier, NativeModifierDefinitionState } from './src/glimmer/native-modifier-manager';
// setPropertyDidChange(() => {
//     NativescriptGlimmer.scheduleRerender();
// });
export default class Application {
    // public static result: any;
    // public static env: any;
    // public static aotRuntime: any;
    // public static rootFrame: ElementNode;
    // static _scheduled: boolean = false;
    // static _rendered: boolean = false;
    // static _rendering: boolean = false;
    // static context: any;
    // static document: DocumentNode;
    // static resolver: any;
    constructor(rootName, resolverDelegate, resolver) {
        registerElements();
        setupGlimmer(resolverDelegate, resolver);
        this.document = new DocumentNode();
        this.rootFrame = new ElementNode('frame');
        this.rootFrame.setAttribute('id', 'app-root-frame');
        this.document.appendChild(this.rootFrame);
        this.context = Context(GlimmerResolverDelegate);
        this.artifacts = artifacts(this.context);
        this.aotRuntime = AotRuntime(this.document, this.artifacts, resolver);
        this.rootName = rootName;
        this.resolver = resolver;
        this.resolverDelegate = resolverDelegate;
    }
    setup(folder) {
        this.addTemplates(folder);
        this.addComponents(folder);
    }
    addTemplates(appFolder) {
        let templatesFile = appFolder.getFile('templates.json');
        let templates = templatesFile.readTextSync();
        // console.log(`Templates: ${templates}`);
        JSON.parse(templates).forEach((template) => {
            this.resolverDelegate.registerComponent(template.name, template.handle, template.source, template.capabilities);
        });
    }
    addComponents(appFolder) {
        let componentsFile = appFolder.getFile('components.json');
        let components = componentsFile.readTextSync();
        console.log(`About to resolve require`);
        JSON.parse(components).forEach((component) => {
            console.log(`About to resolve require`);
            const classFile = require(`../src/ui/components/${component.name}/component.ts`);
            this.resolver.registerComponent(component.name, classFile.default);
        });
    }
    renderComponent(name, containerElement) {
        const cursor = { element: containerElement, nextSibling: null };
        const main = GlimmerResolverDelegate.lookupComponent(name).compilable.compile(this.context);
        let iterator = renderAot(this.aotRuntime, main, cursor);
        try {
            const result = renderSync(this.aotRuntime.env, iterator);
            this.result = result;
            this._rendered = true;
        }
        catch (error) {
            console.log(`Error rendering component ${name}: ${error}`);
        }
    }
    boot() {
        return new Promise((resolve, reject) => {
            //wait for launch
            on(launchEvent, () => {
                // this.renderComponent(this.rootName, this.rootFrame);
                // This is super hacky and likely needs to be abstracted away.
                this.rootFrame.nativeView.navigate({
                    create: () => {
                        return this.rootFrame.firstElement().nativeView;
                    }
                });
            });
            try {
                run({
                    create() {
                        return this.rootFrame.nativeView;
                    }
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    scheduleRerender() {
        if (this._scheduled || !this._rendered)
            return;
        this._rendering = true;
        this._scheduled = true;
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            this._scheduled = false;
            yield this._rerender();
            this._rendering = false;
        }), 0);
    }
    _rerender() {
        return __awaiter(this, void 0, void 0, function* () {
            let { aotRuntime, result } = this;
            try {
                aotRuntime.env.begin();
                yield result.rerender();
                aotRuntime.env.commit();
                this._rendered = true;
            }
            catch (error) {
                console.log(`Error in re-render: ${error}`);
            }
        });
    }
}
