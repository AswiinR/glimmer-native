var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class NativeComponentResult {
    constructor(name, result, state, runtime) {
        this.name = name;
        this.result = result;
        this.state = state;
        this.runtime = runtime;
    }
    update(state) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.update(state);
            this.runtime.env.begin();
            yield this.result.rerender();
            this.runtime.env.commit();
        });
    }
    toJSON() {
        return { GlimmerDebug: `<component-result name="${this.name}">` };
    }
}
