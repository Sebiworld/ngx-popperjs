// tslint:disable:no-input-rename
import {
    ChangeDetectorRef,
    ComponentFactoryResolver,
    ComponentRef,
    Directive,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewContainerRef
} from "@angular/core";
import {NgxPopperjsContentComponent} from "../ngx-popperjs-content/ngx-popper-content.component";
import {NgxPopperjsOptions} from "../models/ngx-popperjs-options.model";
import {NgxPopperjsPlacements} from "../models/ngx-popperjs-placements.model";
import {NgxPopperjsTriggers} from "../models/ngx-popperjs-triggers.model";
import {NGX_POPPERJS_DEFAULTS} from "../models/ngx-popperjs-defaults.model";
import {NgxPopperjsUtils} from "../models/ngx-popperjs-utils.class";
//
import {Modifier} from "@popperjs/core";

@Directive({
    // tslint:disable-next-line:directive-selector
    selector: "[popper]",
    exportAs: "popper"
})
export class NgxPopperjsDirective implements OnInit, OnDestroy {

    static baseOptions: NgxPopperjsOptions = {
        showDelay: 0,
        placement: NgxPopperjsPlacements.AUTO,
        hideOnClickOutside: true,
        hideOnMouseLeave: false,
        hideOnScroll: false,
        appendTo: undefined,
        ariaRole: "popper",
        ariaDescribe: "",
        styles: {},
        trigger: NgxPopperjsTriggers.click
    };

    @Input("popperApplyClass")
    set applyClass(newValue: string) {
        if (newValue === this._applyClass) {
            return;
        }
        this._applyClass = newValue;
        this._checkExisting("applyClass", newValue);
    }

    get applyClass(): string {
        return this._applyClass;
    }

    @Input("popperAriaDescribeBy")
    ariaDescribe: string | void;

    @Input("popperAriaRole")
    ariaRole: string | void;

    @Input("popperBoundaries")
    boundariesElement: string;

    @Input("popperCloseOnClickOutside")
    closeOnClickOutside: boolean;

    @Input("popper")
    set content(newValue: string | NgxPopperjsContentComponent) {
        if (newValue === this._content) {

            return;
        }
        this._content = newValue;
        if (this._popperContent) {
            if (typeof newValue === "string") {
                this._popperContent.text = newValue;
            }
            else {
                this._popperContent = newValue;
            }
        }
    }

    get content(): string | NgxPopperjsContentComponent {
        return this._content;
    }


    @Input("popperDisableAnimation")
    disableAnimation: boolean;

    @Input("popperDisabled")
    set disabled(newValue: boolean) {
        if (newValue === this._disabled) {
            return;
        }
        this._disabled = !!newValue;
        if (this._shown) {
            this.hide();
        }
    }

    get disabled(): boolean {
        return this._disabled;
    }

    @Input("popperDisableStyle")
    disableStyle: boolean;

    @Input("popperHideOnClickOutside")
    hideOnClickOutside: boolean | void;

    @Input("popperHideOnMouseLeave")
    hideOnMouseLeave: boolean | void;

    @Input("popperHideOnScroll")
    hideOnScroll: boolean | void;

    @Input("popperTimeout")
    hideTimeout: number = 0;

    @Input("popperPlacement")
    set placement(newValue: NgxPopperjsPlacements) {
        this._popperPlacement = newValue;
        this._checkExisting("placement", newValue);
    }

    get placement(): NgxPopperjsPlacements {

        return this._popperPlacement;
    }

    @Input()
    popperAppendTo: string;

    @Input()
    set popperApplyArrowClass(newValue: string) {
        if (newValue === this._popperApplyArrowClass) {
            return;
        }
        this._popperApplyArrowClass = newValue;
        if (this._popperContent) {
            this._popperContent.popperOptions.applyArrowClass = newValue;
            if (!this._shown) {
                return;
            }
            this._popperContent.popperInstance.setOptions(this._popperContent.popperOptions);
        }
    }

    get popperApplyArrowClass(): string {
        return this._popperApplyArrowClass;
    }

    @Input()
    popperModifiers: Partial<Modifier<any, any>>[];

    @Output()
    popperOnHidden: EventEmitter<NgxPopperjsDirective> = new EventEmitter<NgxPopperjsDirective>();

    @Output()
    popperOnShown: EventEmitter<NgxPopperjsDirective> = new EventEmitter<NgxPopperjsDirective>();

    @Output()
    popperOnUpdate: EventEmitter<any> = new EventEmitter<any>();

    @Input("popperPositionFixed")
    positionFixed: boolean;

    @Input("popperPreventOverflow")
    set preventOverflow(newValue: boolean) {
        this._popperPreventOverflow = NgxPopperjsUtils.coerceBooleanProperty(newValue);
        this._checkExisting("preventOverflow", this._popperPreventOverflow);
    }

    get preventOverflow(): boolean {
        return this._popperPreventOverflow;
    }

    @Input("popperDelay")
    showDelay: number | undefined;

    @Input("popperShowOnStart")
    showOnStart: boolean;

    @Input("popperTrigger")
    showTrigger: NgxPopperjsTriggers | undefined;

    @Input("popperStyles")
    styles: object;

    @Input("popperTarget")
    targetElement: HTMLElement;

    @Input("popperTimeoutAfterShow")
    timeoutAfterShow: number = 0;

    private _applyClass: string;
    private _content: string | NgxPopperjsContentComponent;
    private _disabled: boolean;
    private _eventListeners: any[] = [];
    private _globalEventListeners: any[] = [];
    private _popperApplyArrowClass: string;
    private _popperContent: NgxPopperjsContentComponent;
    private _popperContentClass = NgxPopperjsContentComponent;
    private _popperContentRef: ComponentRef<NgxPopperjsContentComponent>;
    private _popperPlacement: NgxPopperjsPlacements;
    private _popperPreventOverflow: boolean;
    private _scheduledHideTimeout: any;
    private _scheduledShowTimeout: any;
    private _shown: boolean = false;
    private _subscriptions: any[] = [];

    constructor(private _viewContainerRef: ViewContainerRef,
                private _changeDetectorRef: ChangeDetectorRef,
                private _resolver: ComponentFactoryResolver,
                private _elementRef: ElementRef,
                private _renderer: Renderer2,
                @Inject(NGX_POPPERJS_DEFAULTS) private _popperDefaults: NgxPopperjsOptions = {}) {
        NgxPopperjsDirective.baseOptions = {...NgxPopperjsDirective.baseOptions, ...this._popperDefaults};
    }

    static assignDefined(target: any, ...sources: any[]) {
        for (const source of sources) {
            for (const key of Object.keys(source)) {
                const val = source[key];
                if (val !== undefined) {
                    target[key] = val;
                }
            }
        }

        return target;
    }

    applyTriggerListeners() {
        switch (this.showTrigger) {
            case NgxPopperjsTriggers.click:
                this._pushListener("click", this.toggle.bind(this));
                break;
            case NgxPopperjsTriggers.mousedown:
                this._pushListener("mousedown", this.toggle.bind(this));
                break;
            case NgxPopperjsTriggers.hover:
                this._pushListener("mouseenter", this.scheduledShow.bind(this, this.showDelay));
                ["touchend", "touchcancel", "mouseleave"].forEach((eventName) => {
                    this._pushListener(eventName, this.scheduledHide.bind(this, null, this.hideTimeout));
                });
                break;
        }
        if (this.showTrigger !== NgxPopperjsTriggers.hover && this.hideOnMouseLeave) {
            ["touchend", "touchcancel", "mouseleave"].forEach((eventName) => {
                this._pushListener(eventName, this.scheduledHide.bind(this, null, this.hideTimeout));
            });
        }
    }

    getRefElement() {
        return this.targetElement || this._viewContainerRef.element.nativeElement;
    }

    hide() {
        if (this.disabled) {
            return;
        }
        if (!this._shown) {
            this._overrideShowTimeout();

            return;
        }

        this._shown = false;
        if (this._popperContentRef) {
            this._popperContentRef.instance.hide();
        }
        else {
            this._popperContent.hide();
        }
        this.popperOnHidden.emit(this);
        this._clearGlobalEventListeners();
    }

    hideOnClickOutsideHandler($event: MouseEvent): void {
        // TODO: check if $event.target is a better alternative here
        if (this.disabled || !this.hideOnClickOutside || $event.srcElement &&
            $event.srcElement === this._popperContent.elRef.nativeElement ||
            this._popperContent.elRef.nativeElement.contains($event.srcElement)) {
            return;
        }
        this.scheduledHide($event, this.hideTimeout);
    }

    hideOnScrollHandler($event: MouseEvent): void {
        if (this.disabled || !this.hideOnScroll) {
            return;
        }
        this.scheduledHide($event, this.hideTimeout);
    }

    ngOnDestroy() {
        this._subscriptions.forEach(sub => sub.unsubscribe && sub.unsubscribe());
        this._subscriptions.length = 0;
        this._clearEventListeners();
        this._clearGlobalEventListeners();
        this._scheduledShowTimeout && clearTimeout(this._scheduledShowTimeout);
        this._scheduledHideTimeout && clearTimeout(this._scheduledHideTimeout);
        this._popperContent && this._popperContent.clean();
    }

    ngOnInit() {
        // Support legacy prop
        this.hideOnClickOutside = typeof this.hideOnClickOutside === "undefined" ?
            this.closeOnClickOutside : this.hideOnClickOutside;

        if (typeof this.content === "string") {
            this._popperContent = this._constructContent();
            this._popperContent.text = this.content;
        }
        else if (typeof this.content === typeof void 0) {
            this._popperContent = this._constructContent();
            this._popperContent.text = "";
        }
        else {
            this._popperContent = this.content;
        }
        const popperRef = this._popperContent;
        popperRef.referenceObject = this.getRefElement();
        this._setContentProperties(popperRef);
        this._setDefaults();
        this.applyTriggerListeners();
        if (this.showOnStart) {
            this.scheduledShow();
        }
    }

    scheduledHide($event: any = null, delay: number = this.hideTimeout) {
        if (this.disabled) {
            return;
        }
        this._overrideShowTimeout();
        this._scheduledHideTimeout = setTimeout(() => {
            // TODO: check
            const toElement = $event ? $event.toElement : null;
            const popperContentView = this._popperContent.popperViewRef ? this._popperContent.popperViewRef.nativeElement : false;
            if (!popperContentView ||
                popperContentView === toElement ||
                popperContentView.contains(toElement) ||
                (this.content && (this.content as NgxPopperjsContentComponent).isMouseOver)) {

                return;
            }
            this.hide();
            this._applyChanges();
        }, delay);
    }

    scheduledShow(delay: number = this.showDelay) {
        if (this.disabled) {
            return;
        }
        this._overrideHideTimeout();
        this._scheduledShowTimeout = setTimeout(() => {
            this.show();
            this._applyChanges();
        }, delay);
    }

    show() {
        if (this._shown) {
            this._overrideHideTimeout();

            return;
        }

        this._shown = true;
        const popperRef = this._popperContent;
        const element = this.getRefElement();
        if (popperRef.referenceObject !== element) {
            popperRef.referenceObject = element;
        }
        this._setContentProperties(popperRef);
        popperRef.show();
        this.popperOnShown.emit(this);
        if (this.timeoutAfterShow > 0) {
            this.scheduledHide(null, this.timeoutAfterShow);
        }
        this._globalEventListeners.push(this._renderer.listen("document", "touchend", this.hideOnClickOutsideHandler.bind(this)));
        this._globalEventListeners.push(this._renderer.listen("document", "click", this.hideOnClickOutsideHandler.bind(this)));
        // tslint:disable-next-line:max-line-length
        this._globalEventListeners.push(this._renderer.listen(this._getScrollParent(this.getRefElement()), "scroll", this.hideOnScrollHandler.bind(this)));
    }

    toggle() {
        if (this.disabled) {
            return;
        }
        this._shown ? this.scheduledHide(null, this.hideTimeout) : this.scheduledShow();
    }

    private _applyChanges() {
        this._changeDetectorRef.markForCheck();
        this._changeDetectorRef.detectChanges();
    }

    private _checkExisting(key: string, newValue: string | number | boolean | NgxPopperjsPlacements): void {
        if (this._popperContent) {
            this._popperContent.popperOptions[key] = newValue;
            if (!this._shown) {
                return;
            }
            this._popperContent.popperInstance.setOptions(this._popperContent.popperOptions);
        }
    }

    private _clearEventListeners() {
        this._eventListeners.forEach(evt => {
            evt && typeof evt === "function" && evt();
        });
        this._eventListeners.length = 0;
    }

    private _clearGlobalEventListeners() {
        this._globalEventListeners.forEach(evt => {
            evt && typeof evt === "function" && evt();
        });
        this._globalEventListeners.length = 0;
    }

    private _constructContent(): NgxPopperjsContentComponent {
        this._popperContentRef = this._viewContainerRef.createComponent(this._popperContentClass);

        return this._popperContentRef.instance as NgxPopperjsContentComponent;
    }

    private _getScrollParent(node) {
        const isElement = node instanceof HTMLElement;
        const overflowY = isElement && window.getComputedStyle(node).overflowY;
        const isScrollable = overflowY !== "visible" && overflowY !== "hidden";

        if (!node) {
            return null;
        }
        else if (isScrollable && node.scrollHeight >= node.clientHeight) {
            return node;
        }

        return this._getScrollParent(node.parentNode) || document;
    }

    private _onPopperUpdate(event) {
        this.popperOnUpdate.emit(event);
    }

    private _overrideHideTimeout() {
        if (this._scheduledHideTimeout) {
            clearTimeout(this._scheduledHideTimeout);
            this._scheduledHideTimeout = 0;
        }
    }

    private _overrideShowTimeout() {
        if (this._scheduledShowTimeout) {
            clearTimeout(this._scheduledShowTimeout);
            this._scheduledHideTimeout = 0;
        }
    }

    private _pushListener(name: string, cb: () => void): void {
        this._eventListeners.push(this._renderer.listen(this._elementRef.nativeElement, name, cb));
    }

    private _setContentProperties(popperRef: NgxPopperjsContentComponent) {
        popperRef.popperOptions = NgxPopperjsDirective.assignDefined(popperRef.popperOptions, NgxPopperjsDirective.baseOptions, {
            showDelay: this.showDelay,
            disableAnimation: this.disableAnimation,
            disableDefaultStyling: this.disableStyle,
            placement: this.placement,
            boundariesElement: this.boundariesElement,
            trigger: this.showTrigger,
            positionFixed: this.positionFixed,
            popperModifiers: this.popperModifiers,
            ariaDescribe: this.ariaDescribe,
            ariaRole: this.ariaRole,
            applyClass: this.applyClass,
            applyArrowClass: this.popperApplyArrowClass,
            hideOnMouseLeave: this.hideOnMouseLeave,
            styles: this.styles,
            appendTo: this.popperAppendTo,
            preventOverflow: this.preventOverflow,
        });
        popperRef.onUpdate = this._onPopperUpdate.bind(this);
        this._subscriptions.push(popperRef.onHidden.subscribe(this.hide.bind(this)));
    }

    private _setDefaults() {
        ["showDelay", "hideOnScroll", "hideOnMouseLeave", "hideOnClickOutside", "ariaRole", "ariaDescribe"].forEach((key) => {
            this[key] = this[key] === void 0 ? NgxPopperjsDirective.baseOptions[key] : this[key];
        });
        this.showTrigger = this.showTrigger || NgxPopperjsDirective.baseOptions.trigger;
        this.styles = this.styles === void 0 ? {...NgxPopperjsDirective.baseOptions.styles} : this.styles;
    }

}
