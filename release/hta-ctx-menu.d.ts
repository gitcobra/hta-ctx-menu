declare type MenuModelEventNames = 'label' | 'icon' | 'arrow' | 'class' | 'checked' | 'disabled' | 'unselectable' | 'css';
declare type MenuItemUserEventNames = 'activate' | 'click' | 'close' | 'change' | 'dblclick' | 'highlight' | 'beforeload' | 'load' | 'unload' | '_rootclose' | '_viewready' | 'demand';
declare type MenuGlobalEventNames = 'highlight' | 'click' | 'dblclick' | 'activate';
declare type MenuGlobalEventsTypeForUser<CTX> = {
    [P in MenuGlobalEventNames as `on${P}`]?: UserEventListener<CTX>;
};
declare const AllMenuTypesList: readonly ["normal", "radio", "checkbox", "separator", "submenu", "popup", "demand", "radios"];
declare type AllMenuTypes = typeof AllMenuTypesList[number];
declare const MenuItemTypesList: readonly ["normal", "radio", "checkbox", "separator", "submenu", "popup"];
declare type MenuItemTypes = typeof MenuItemTypesList[number];
declare type MenuItemParameter<CTX> = MenuItemNormalParameter<CTX> | MenuItemCheckboxParameter<CTX> | MenuItemRadioParameter<CTX> | MenuItemSubmenuParameter<CTX> | MenuItemSeparatorParameter | MenuItemPopupParameter<CTX>;
declare type UserEventListener<CTX> = (ev: MenuUserEventObject<CTX>, ctx: CTX) => any;
interface MenuItemNormalParameter<CTX> {
    type?: 'normal';
    label: string;
    html?: boolean;
    icon?: IconSettingType;
    customClass?: string;
    title?: string;
    id?: string;
    onclick?: UserEventListener<CTX>;
    ondblclick?: UserEventListener<CTX>;
    onhighlight?: UserEventListener<CTX>;
    onactivate?: UserEventListener<CTX>;
    ignoreGlobalEvents?: boolean;
    ignoreErrors?: boolean;
    disabled?: boolean;
    unselectable?: boolean;
    unlistening?: boolean;
    union?: boolean;
    hold?: boolean;
    unholdByDblclick?: boolean;
    holdParent?: boolean;
    flash?: number;
}
interface _MenuItemCheckableParameter<CTX> extends Omit<MenuItemNormalParameter<CTX>, 'icon' | 'type'> {
    name?: string;
    global?: boolean;
    checked?: boolean;
    value?: any;
    record?: CheckableRecord;
    onchange?: UserEventListener<CTX>;
}
interface MenuItemCheckboxParameter<CTX> extends _MenuItemCheckableParameter<CTX> {
    type: 'checkbox';
    checkboxIcon?: CheckableIconPairParam;
}
interface MenuItemRadioParameter<CTX> extends _MenuItemCheckableParameter<CTX> {
    type: 'radio';
    radioIcon?: CheckableIconPairParam;
    uncheckable?: boolean;
}
interface MenuItemRadioGroupParameter<CTX> extends Omit<MenuItemRadioParameter<CTX>, 'type' | 'value' | 'checked' | 'label'> {
    type: 'radios';
    selectedIndex?: number;
    labels: string[] | // labels
    [
        string,
        any?,
        boolean?
    ][] | // [label, value, checked]
    Omit<MenuItemRadioParameter<CTX>, 'type' | 'name'>[];
}
declare type CheckableRecord = {
    checked?: boolean;
    value?: any;
    selectedIndex?: number;
};
interface MenuItemSubmenuParameter<CTX> extends Omit<MenuItemNormalParameter<CTX>, 'type'> {
    type: 'submenu';
    items: MenuItemsCreateParameter<CTX>[];
    customDialogClass?: string;
    skin?: string;
    cssText?: string;
    fontSize?: number | string;
    fontFamily?: string;
    checkboxIcon?: CheckableIconPairParam;
    radioIcon?: CheckableIconPairParam;
    arrowIcon?: IconSettingType;
    flashItems?: boolean | number;
    leftMargin?: number;
    childLeftMargin?: number;
    onload?: UserEventListener<CTX>;
    onbeforeload?: UserEventListener<CTX>;
    onunload?: UserEventListener<CTX>;
    globalEvents?: MenuGlobalEventsTypeForUser<CTX>;
    autoClose?: boolean;
    inherit?: SubmenuInheritanceFlags | boolean;
}
interface SubmenuInheritanceFlags {
    skin?: boolean;
    cssText?: boolean;
    globalEvents?: boolean;
    checkboxIcon?: boolean;
    radioIcon?: boolean;
    arrowIcon?: boolean;
    flashItems?: boolean;
    childLeftMargin?: boolean;
    autoClose?: boolean;
    fontSize?: boolean;
    fontFamily?: boolean;
}
declare const PopupXPos: readonly ["left", "left-out", "left-center", "right", "right-out", "right-center", "x-center"];
declare const PopupYPos: readonly ["top", "top-out", "top-center", "bottom", "bottom-out", "bottom-center", "y-center"];
interface PopupBase {
    base?: 'item' | 'parent' | 'all' | 'screen' | string;
    posX?: typeof PopupXPos[number];
    posY?: typeof PopupYPos[number];
}
interface PopupMargin {
    marginX?: number;
    marginY?: number;
    marginLeft?: number;
    marginRight?: number;
}
interface PopupPosition extends PopupBase, PopupMargin {
}
interface MenuItemPopupParameter<CTX> extends Omit<MenuItemSubmenuParameter<CTX>, 'type'> {
    type: 'popup';
    pos?: PopupPosition;
    exclusive?: boolean;
}
interface MenuItemSeparatorParameter {
    type: 'separator';
    id?: string;
    customClass?: string;
}
declare type MenuItemsCreateParameter<CTX> = MenuItemParameter<CTX> | MenuItemDemandParameter<CTX> | MenuItemRadioGroupParameter<CTX>;
interface MenuItemDemandParameter<CTX> {
    type: 'demand';
    id?: string;
    ondemand: (ev: MenuUserEventObject<CTX>, ctx: CTX) => MenuItemsCreateParameter<CTX> | MenuItemsCreateParameter<CTX>[] | null | undefined;
}
declare type IconSettingType = string | {
    path: string;
    width?: string | number;
    height?: string | number;
    blank?: boolean;
} | {
    text: string;
    fontFamily?: string;
    fontSize?: string | number;
    blank?: boolean;
};
declare type CheckableIconPair = [IconSettingType, IconSettingType];
declare type CheckableIconPairParam = CheckableIconPair | IconSettingType;
interface MenuUserEventObjectModel {
    cancelGlobal: boolean;
    dispose(): void;
}
declare type MenuItemFlagsType = {
    union?: boolean;
    hold?: boolean;
    unholdByDblclick?: boolean;
    holdParent?: boolean;
    unselectable?: boolean;
    unlistening?: boolean;
    disabled?: boolean;
    flash?: number;
    html?: boolean;
    checked?: boolean;
    usericon?: boolean;
};
/**
 * base menu item class.
 * all menu items are descended from this.
 * @abstract
 * @class _MenuModelBase
 */
declare abstract class _MenuModelBase<CTX> {
    /**
     * @type {AllMenuTypes}
     */
    protected abstract _type: AllMenuTypes;
    protected readonly _uniqueId: string;
    protected readonly _id?: string;
    protected _parent?: MenuSubmenu<CTX>;
    protected _index: number;
    protected _customClassNames: string[];
    protected _isDynamicallyProduced: boolean;
    constructor(args: MenuItemsCreateParameter<CTX>, parent?: MenuSubmenu<CTX>, demanded?: boolean);
    protected _unexpectedTypeError(): void;
    getType(this: MenuModelItem<CTX>): MenuItemTypes;
    getId(): string | undefined;
    getUniqueId(): string;
    getCustomClassNames(): string[];
    getFlags(): MenuItemFlagsType;
    getIcon(): IconSettingType | undefined;
    getLabel(): void;
    getIndex(): number;
    setIndex(num: number): number;
    isDynamicallyProduced(): boolean;
    protected getRealParentSubmenu(): MenuSubmenu<CTX> | null;
    private _menuModelEventListeners;
    private _listenerIdCounter;
    /**
     * set internal model event listeners
     * @param {MenuModelEventNames} handler
     * @param {Function} listener
     * @memberof MenuModel
     */
    addMenuModelEvent(handler: MenuModelEventNames, listener: Function): number;
    removeMenuModelEvent(handler: MenuModelEventNames, listenerId: number): boolean;
    /**
     * fire events
     * @param {string} handler
     */
    fireMenuModelEvent(handler: MenuModelEventNames, ...args: any): void;
    isNormal(): this is MenuNormal<CTX>;
    isSubmenu(): this is MenuSubmenu<CTX>;
    isPopup(): this is MenuPopup<CTX>;
    isCheckable(): this is _MenuCheckable<CTX>;
    isRadio(): this is MenuRadio<CTX>;
    isCheckbox(): this is MenuCheckbox<CTX>;
    isSeparator(): this is MenuSeparator<CTX>;
    isDemandable(): this is MenuDemand<CTX>;
    $L(): string;
    dispose(): void;
}
/**
 * MenuNormal items have basic menu item functions
 * @class MenuNormal
 * @extends {_MenuModelBase}
 */
declare class MenuNormal<CTX> extends _MenuModelBase<CTX> {
    protected readonly _type: AllMenuTypes;
    protected _label: string;
    protected _useHTML: boolean;
    protected _union: boolean;
    protected _icon?: IconSettingType;
    protected _title?: string;
    protected _unselectable: boolean;
    protected _disabled: boolean;
    protected _unlistening: boolean;
    protected _hold: boolean;
    protected _unholdByDblclick: boolean;
    protected _holdParent: boolean;
    protected _flash: number;
    protected onclick?: UserEventListener<CTX>;
    protected ondblclick?: UserEventListener<CTX>;
    protected onhighlight?: UserEventListener<CTX>;
    protected onactivate?: UserEventListener<CTX>;
    protected _ignoreGlobalEvents: boolean;
    protected _ignoreErrors: boolean;
    protected _selected: boolean;
    constructor(args: MenuItemNormalParameter<CTX>, parent?: MenuSubmenu<CTX>, demanded?: boolean);
    /**
     * fire user events such as onclick, onchange, etc
     */
    fireUserEvent(handler: MenuItemUserEventNames, ctx: CTX, eventObj: MenuUserEventObject<CTX>): void;
    setLabel(label: string, asHtml?: boolean): void;
    getLabel(asHtml?: boolean): string;
    setIcon(icon: IconSettingType): void;
    protected _applyIcon(icon: IconSettingType): void;
    getIcon(): IconSettingType | undefined;
    hasUsersIcon(): boolean;
    /**
     * get item flags
     * @return {*}
     * @memberof MenuNormal
     */
    getFlags(): MenuItemFlagsType;
    dispose(): void;
}
/**
 * radio or checkbox item
 * @abstract
 * @class MenuCheckable
 * @extends {MenuNormal}
 */
declare abstract class _MenuCheckable<CTX> extends MenuNormal<CTX> {
    protected abstract readonly _type: 'checkbox' | 'radio';
    protected _parent: MenuSubmenu<CTX>;
    protected _name: string;
    protected _isNamed: boolean;
    protected _global: boolean;
    protected _recordSubmenu: MenuSubmenu<CTX>;
    protected _record: CheckableRecord;
    protected _checked: boolean;
    protected _value?: any;
    protected _previousChecked?: boolean;
    protected _defaultPairIcons: CheckableIconPair;
    protected _pairIcons: CheckableIconPair | null;
    onchange?: UserEventListener<CTX>;
    constructor(args: MenuItemRadioParameter<CTX> | MenuItemCheckboxParameter<CTX>, parent: MenuSubmenu<CTX>, demanded?: boolean);
    updateCheckableIcon(force?: boolean): void;
    abstract updateCheckedStatByRecord(): void;
    getFlags(): MenuItemFlagsType;
    getName(): string;
    setValue(val: any): void;
    getValue(): any;
    isChecked(): boolean;
    isGlobal(): boolean;
    getRecord(): CheckableRecord;
    getRecordRopository(): MenuSubmenu<CTX>;
    setIcon(icon: CheckableIconPairParam | null, apply?: boolean): void;
    hasUsersIcon(): boolean;
    protected abstract _setChecked(flag?: boolean, fromPublic?: boolean): boolean;
    setChecked(flag?: boolean): boolean;
}
declare class MenuCheckbox<CTX> extends _MenuCheckable<CTX> {
    protected readonly _type = "checkbox";
    constructor(args: MenuItemCheckboxParameter<CTX>, parent: MenuSubmenu<CTX>, demanded?: boolean);
    protected _setChecked(flag: boolean, fromPublic?: boolean): boolean;
    private _linkOtherCheckboxesInParents;
    updateCheckedStatByRecord(): void;
}
declare class MenuRadio<CTX> extends _MenuCheckable<CTX> {
    protected readonly _type = "radio";
    readonly _radioIndex: number;
    private _uncheckable;
    constructor(args: MenuItemRadioParameter<CTX>, parent: MenuSubmenu<CTX>, demanded?: boolean);
    getRadioIndex(): number;
    isUncheckable(): boolean;
    protected _setChecked(flag: boolean, fromPublic?: boolean): boolean;
    /**
     * clear all other radios with same name
     * @private
     * @param {boolean} [recursive=false]
     * @memberof MenuRadio
     */
    private _clearOtherRadios;
    updateCheckedStatByRecord(): void;
}
/**
 * a MenuDemand can emit appropriate menu items dynamically on demand.
 * @class MenuDemand
 * @extends {_MenuModelBase}
 */
declare class MenuDemand<CTX> extends _MenuModelBase<CTX> {
    protected readonly _type = "demand";
    protected readonly ondemand: MenuItemDemandParameter<CTX>["ondemand"];
    constructor(args: MenuItemDemandParameter<CTX>, parent?: MenuSubmenu<CTX>, demanded?: boolean);
    /**
     * execute the ondemand callback
     * @param {*} [eventObj]
     * @return {*}  {MenuItemsCreateParameter[]}
     * @memberof MenuDemand
     */
    extract(eventObj: MenuUserEventObject<CTX>): MenuItemsCreateParameter<CTX>[];
}
/**
 * for a separator
 * @class MenuSeparator
 * @extends {_MenuModelBase}
 */
declare class MenuSeparator<CTX> extends _MenuModelBase<CTX> {
    protected readonly _type = "separator";
    constructor(param: MenuItemSeparatorParameter, parent?: MenuSubmenu<CTX>, demanded?: boolean);
}
/**
 * MenuSubmenu contains all other menu items includes MenuSubmenu itself.
 * when it does not have parent MenuSubmenu, it is the root of all menus.
 * @class SubmenuItem
 * @extends {_MenuModelBase}
 */
declare class MenuSubmenu<CTX> extends MenuNormal<CTX> {
    protected readonly _type = "submenu";
    private _pre_items;
    private _items;
    protected _layer: number;
    private _root;
    private _flashItems;
    private _customDialogClass;
    private _namedCheckableItemRecords;
    private _globalNamedCheckableItemRecords;
    private _radioCount;
    private _globalRadioCount;
    private _childLeftMargin?;
    private _skinCSSPath?;
    private _cssText?;
    private _fontSize?;
    private _fontFamily?;
    private _checkablePairIcons;
    private _arrowIcon;
    onload?: UserEventListener<CTX>;
    onbeforeload?: UserEventListener<CTX>;
    onunload?: UserEventListener<CTX>;
    _onrootclose?: UserEventListener<CTX>;
    _onviewready?: UserEventListener<CTX>;
    private _globalEvents?;
    private _disableAutoClose?;
    private _inherit;
    constructor(param: MenuItemSubmenuParameter<CTX> | MenuItemPopupParameter<CTX>, parent?: MenuSubmenu<CTX>, demanded?: boolean);
    /**
     * create pre-items
     * MenuDemand items are not extracted yet at this time
     * @private
     * @param {(MenuItemsCreateParameter | MenuItemsCreateParameter[])} args
     * @memberof MenuSubmenu
     */
    private _preCreateItems;
    private _extractRadiosParameter;
    /**
     * extract all MenuDemand items and return completed item list
     * @param {*} [eventObj]
     * @return {*}
     * @memberof MenuSubmenu
     */
    produceItems(eventObj: MenuUserEventObject<CTX>): MenuModelItem<CTX>[];
    /**
     * set records for MenuCheckable items.
     * @param {string} name
     * @param {boolean} checked
     * @memberof MenuSubmenu
     */
    getNamedCheckableItemRecord(name: string, global?: boolean): CheckableRecord;
    /**
     * set the object as record so that users interact with the record too
     * @param {string} name
     * @param {*} record
     * @memberof MenuSubmenu
     */
    setUserObjectAsRecord(name: string, record: CheckableRecord, global?: boolean): void;
    resetRadioIndex(): void;
    countRadioIndex(name?: string, global?: boolean): number;
    protected getItems(): MenuModelItem<CTX>[];
    getParent(): MenuSubmenu<CTX> | null;
    isRoot(): boolean;
    getRoot(): MenuSubmenu<CTX>;
    getLayer(): number;
    setSkin(css: string): void;
    getSkin(): string;
    getCSSText(): string;
    getGlobalEvent(handler: MenuItemUserEventNames): UserEventListener<CTX> | null;
    getChildLeftMargin(): number | undefined;
    getArrowIcon(): IconSettingType;
    getDefaultCheckableIcon(type: 'checkbox' | 'radio'): CheckableIconPair | undefined;
    getAutoClose(): boolean;
    getFontSize(): number | string | undefined;
    getFontFamily(): string | undefined;
    setArrowIcon(arrow: IconSettingType): void;
    setDefaultCheckableIcon(type: 'checkbox' | 'radio', icon: CheckableIconPairParam): void;
    /**
     * enumerate items
     */
    each(callback: (item: MenuModelItem<CTX>, index?: number) => void): void;
    getItem(index: number): MenuModelItem<CTX>;
    getItemCount(): number;
    getItemById(id: any): MenuModelItem<CTX> | null;
    getItemsByName(name: string): _MenuCheckable<CTX>[];
    getPreItems(): _MenuModelBase<CTX>[];
    getCustomDialogClass(): string;
    __setSystemUserEvent(handler: '_rootclose' | '_viewready', callback: UserEventListener<CTX>): void;
    setGlobalEvent(handler: MenuGlobalEventNames, listener: UserEventListener<CTX> | null): void;
    clearGlobalEvents(): void;
    fireUserEvent(handler: '_rootclose' | '_viewready' | MenuItemUserEventNames, ctx: CTX, eventObj: MenuUserEventObject<CTX>): void;
    dispose(): void;
}
/**
 * EXPERIMENTAL:
 * @class MenuPopup
 * @extends {MenuSubmenu}
 */
declare class MenuPopup<CTX> extends MenuSubmenu<CTX> {
    private _pos;
    private _exclusive;
    constructor(param: MenuItemPopupParameter<CTX>, parent?: MenuSubmenu<CTX>, demanded?: boolean);
    getPosObject(): PopupPosition;
}
declare abstract class _MenuModelable<CTX> {
    abstract getModel(): MenuSubmenu<CTX>;
}
declare type MenuModelItem<CTX> = MenuNormal<CTX> | MenuSeparator<CTX>;

/**
 * virtual DOM node to 0.0update at arbitrary timing
 *
 * @class VirtualHTMLElement
 */
declare class VirtualDOMNode {
    readonly nodeName: string;
    className: string;
    private _queuedClassNames;
    private _lastRealClasses;
    readonly attributes: {
        [key: string]: string;
    };
    readonly childNodes: (VirtualDOMNode | string)[];
    style: string;
    private _lastRealStyle;
    readonly id: string;
    readonly uniqueId: string;
    label: string;
    private _transitions;
    private _staticfilters;
    private _flipStaticFilters;
    private _onfilterchange;
    private _onTransitionEnds;
    private _realElement?;
    private _linked;
    private _updated;
    private _hasLinkedVNode;
    private _parent;
    private _disposed;
    constructor(node: string | HTMLElement, attributes?: {
        [key: string]: any;
    }, label?: string);
    addClass(addClasses: string): void;
    removeClass(remClasses: string, target?: string): string | undefined;
    hasClass(className: string): boolean;
    queueClass(qclass: string, add: boolean): void;
    hasQueuedClasses(): boolean;
    consumeQueuedClasses(onebyone?: boolean): string[] | null;
    apply(): void;
    play(ontransitionend?: Function): boolean;
    getTransitions(): {
        filter: TransitionFilterType;
        type: string;
    }[];
    clearTransitions(): void;
    flipFilters(): void;
    setAttribute(attr: string, val: any): void;
    removeAttribute(attr: string): void;
    setStyle(style: string): void;
    addStyle(style: string): void;
    append(...nodes: (VirtualDOMNode | string)[]): void;
    remove(): void;
    html(html: string, escapeHTML?: boolean): void;
    linkRealElement(node: HTMLElement, parseChildren?: boolean, readClasses?: boolean): void;
    linkRealElementFromParent(): void;
    isLinkedRealElement(): boolean;
    /**
     * @param {boolean} [autolink=false]  link to real element automatically if it has not
     * @return {*}  {(HTMLElement | undefined)}
     * @memberof VirtualDOMNode
     */
    getRealElement(autolink?: boolean): HTMLElement | undefined;
    updateRealElement(force?: boolean): null | {
        [key: string]: boolean;
    };
    clearUpdate(): void;
    toString(): string;
    dispose(): void;
}
declare type VNodeUpdaterQueueItem = {
    type: 'update' | 'consume' | 'apply' | 'play' | 'unreserve';
    node: VirtualDOMNode;
    reservedNode?: VirtualDOMNode;
    flip?: boolean;
    label?: string;
    onebyone?: boolean;
    ontransitionend?: Function;
} | {
    type: 'callback';
    callback: Function;
};
declare class VirtualNodeUpdater {
    private _qlist;
    private _delay;
    private _hooked;
    private _tid;
    private _beforeCallbacks;
    private _afterCallbacks;
    constructor(delay?: number);
    hook(): void;
    clear(): void;
    update(vnodes: VirtualDOMNode | (VirtualDOMNode | undefined)[], priority?: number): void;
    consumeQueuedClass(vnode: VirtualDOMNode, onebyone?: boolean): void;
    apply(vnode: VirtualDOMNode): void;
    play(vnode: VirtualDOMNode, ontransitionend?: Function): void;
    callback(func: Function): void;
    queue(qitem: VNodeUpdaterQueueItem, priority?: number): void;
    process(): void;
    addListener(handler: 'before' | 'after', callback: Function): void;
}
declare type TransitionFilterType = {
    play: (d?: number) => {};
    apply: () => {};
    stop: () => {};
    enabled: boolean;
    duration: number;
    percent: number;
    status: number;
};

declare type TransTypes = 'highlight' | 'checked' | 'radio-checked' | 'checkbox-checked' | 'activate' | 'open';
declare type TransTargets = {
    [key in TransTypes]?: {
        direction: 'to' | 'from' | 'change';
        target: string;
    }[];
};
declare type MenuViewDialogStatFlagType = {
    [key: string]: boolean;
};
declare type MenuViewItemStatFlagType = {
    [key in TransTypes]?: boolean;
};
declare abstract class _ViewBase<TView> {
    private static _ViewListWaitingToUpdate;
    /**
     * add queues of updating View's class and transition each time before executing VirtualNodeUpdater
     *
     * @static
     * @param {VirtualNodeUpdater} vupdater
     * @memberof _ViewBase
     */
    static hookVnodeUpdater(vupdater: VirtualNodeUpdater): void;
    readonly uid: string;
    private _statFlags;
    protected abstract _mainNode: VirtualDOMNode;
    protected abstract _disposed: boolean;
    protected abstract $L(): string;
    protected abstract getLayer(): number;
    protected abstract _getTransTargets(): TransTargets;
    protected abstract isBeWaitingAfterLoad(): boolean;
    protected abstract clearWaitingAfterLoad(): void;
    constructor();
    protected _selectorBank: {
        [key: string]: VirtualDOMNode;
    };
    protected _getVNode(selector: string): VirtualDOMNode | null;
    isAvailable(): boolean;
    private _checkIfViewFlagIsInUpdatingList;
    private _addViewFlagUpdatingList;
    private _removeViewFlagUpdatingList;
    setViewFlag(flagName: keyof (TView extends MenuItemView ? MenuViewItemStatFlagType : MenuViewDialogStatFlagType), flag: boolean, ontransitionend?: Function): void;
    getViewFlag(flagName: keyof (TView extends MenuItemView ? MenuViewItemStatFlagType : MenuViewDialogStatFlagType)): boolean;
    setClassAndTransitions(className: string, flag: boolean, ontransitionend?: Function): void;
    flashHighlight(ftime: number, onendflashing?: Function): void;
    dispose(): void;
}
/**
 * modeless dialogs
 * @class MenuDialog
 */
declare class MenuDialogView extends _ViewBase<MenuDialogView> {
    private _win;
    private _doc;
    protected _mainNode: VirtualDOMNode;
    private _vdoc;
    private _vbody;
    private _vmenutable;
    private _vcontainer;
    private _vtablecontainer;
    private _transTargetsForContainer;
    private _transTargetsForItems;
    protected _disposed: boolean;
    private _appeared;
    private _items;
    private _indexByUniqueId;
    private _evaWin;
    private _evaDoc;
    private _styleSheet;
    private _activeStyleSheet?;
    private _calculatedTableItemMargin;
    private _layer;
    private _SkinSystemSettings;
    constructor(itemNumber: number, parent?: MenuDialogView | null, customClass?: string, specifiedParentWindow?: Window);
    private _initializeDialog;
    private _initializeStyleSheet;
    initLayout(): void;
    loadStyleSheet(path: string): void;
    removeStylSheet(index?: number): void;
    setCSSText(cssText: string, getSettings?: boolean): void;
    setMenuFontSize(fontSize: number | string): void;
    setMenuFontFamily(fontFamily: string): void;
    clearStyleSheet(): void;
    tweakAnimatedGIFSuffix(suffix?: string): void;
    private _parseTransitionTargetsFromCSS;
    _getTransTargets(flagForItem?: boolean): TransTargets;
    private _parseSystemSettingsFromCSSText;
    getSubmenuMarginSettingFromCSS(dir?: 'left' | 'right'): number | undefined;
    isEmptyCSS(): boolean | undefined;
    private _calculateTableItemMargin;
    getItemMargin(): {
        left: number;
        right: number;
        bottom: number;
        top: number;
        tableClientLeft: number;
        tableClientTop: number;
    };
    getDoc(): Document;
    getLayer(): number;
    setDocumentClass(cstring: string, flag?: boolean, immediate?: boolean): void;
    createTableViewItems(itemParams: UpdateItemType[]): MenuItemView[];
    getMenuElementByUniqueId(id: string): MenuItemView | null;
    addWindowEvent(name: string, handler: EventListener): void;
    removeWindowEvent(name: string, handler: EventListener): void;
    addDocumentEvent(name: string, handler: EventListener): void;
    removeDocumentEvent(name: string, handler: EventListener): void;
    doc(): Document;
    win(): MSWindowModeless;
    hasFocus(): boolean;
    getContentSize(): {
        width: number;
        height: number;
    };
    getContentSize(callback?: Function): void;
    getDialogPosition(): ClientRect;
    resizeDialog(w: number, h: number): void;
    moveDialog(x?: number, y?: number): void;
    adjustDialog(x?: number, y?: number): void;
    isReadyToUse(): boolean;
    checkExistence(): any;
    setLoad(): void;
    setBodyViewFlagByItem(flagName: string, flag: boolean, itemIndex: number, customClasses: string[]): void;
    private _waitingAfterLoad;
    isBeWaitingAfterLoad(): boolean;
    clearWaitingAfterLoad(): void;
    dispose(): void;
    private _dispose;
    static hookBeforeUpdate(callback: Function): void;
    static hookAfterUpdate(callback: Function): void;
    $L(): string;
}
declare type UpdateItemType = {
    type: MenuItemTypes;
    label?: string | void;
    icon?: IconSettingType;
    arrow?: IconSettingType;
    flags?: MenuItemFlagsType;
    classNames?: string[];
    itemNumber?: number;
    index?: number;
};
/**
 * Menu items
 * @class MenuElement
 */
declare class MenuItemView extends _ViewBase<MenuItemView> {
    private _container;
    protected _mainNode: VirtualDOMNode;
    private _vrow;
    private _eva;
    protected _disposed: boolean;
    private _index;
    private _itemNumber;
    constructor(dialog: MenuDialogView, updateParam: UpdateItemType, index: number);
    /**
    * use virtual DOM nodes because interacting with elements in another windows is terribly slow.
    */
    private _createVirtualNodes;
    getVirtualElement(): VirtualDOMNode;
    prepareRealElements(): void;
    updateVirtualNodes(): void;
    update({ type, label, icon, arrow, flags: { unselectable, checked, disabled, html, usericon } }: UpdateItemType): void;
    addEvent(name: string, handler: EventListener): void;
    removeEvent(name: string, handler: EventListener): void;
    private _setIcon;
    _getTransTargets(): TransTargets;
    getItemPosition(): ClientRect;
    getLayer(): number;
    getItemNumber(): number;
    $L(): string;
    isBeWaitingAfterLoad(): boolean;
    protected clearWaitingAfterLoad(): void;
    isAvailable(): boolean;
    dispose(): void;
}

declare type ViewPosition = {
    left: number;
    top: number;
    posX: PopupPosition["posX"];
    posY: PopupPosition["posY"];
    base: PopupPosition["base"];
};
declare abstract class _RootController<CTX> extends _MenuModelable<CTX> {
    protected _locked: number;
    protected _lastChild?: MenuContainerController<CTX>;
    protected _enableOnlyLastChild: boolean;
    abstract open(...args: any): void;
    setLocked(flag: boolean): void;
    isLocked(ctrl?: MenuContainerController<CTX>): boolean;
    setLastChild(ctrl: MenuContainerController<CTX>): void;
    enableOnlyLastChild(flag?: boolean): void;
    move(x: number, y: number): void;
    getRootController(): this;
    abstract close(): void;
}
declare class MenuRootController<CTX> extends _RootController<CTX> {
    protected _model: MenuSubmenu<CTX>;
    protected _ctrl: MenuContainerController<CTX> | null;
    protected _readyToUse: boolean;
    protected _isUpdatingView: boolean;
    constructor(param: MenuItemSubmenuParameter<CTX>);
    /**
     * create controller and view
     */
    open(x: number, y: number, ctx: CTX, parentWindow?: Window): void;
    /**
     * close View
     * @memberof MenuUserInterface
     */
    close(): void;
    isUpdatingView(): boolean;
    getPosition(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    getRectangleOfWholeMenus(): ClientRect;
    getModel(): MenuSubmenu<CTX>;
    loadSkin(path: string): void;
    setGlobalEvent(handler: MenuGlobalEventNames, listener: UserEventListener<CTX> | null): void;
    clearGlobalEvents(): void;
    destroy(): void;
}
/**
 * core Menu controller
 * @class MenuContainerController
 */
declare class MenuContainerController<CTX> {
    private _model;
    private _view;
    private _items;
    private _ctx;
    private _parent;
    private _rootCtrl;
    private _parentItem;
    private _child;
    private _initializingView;
    private _openingSubmenu;
    private _evaBaseDoc?;
    private _currentItem;
    private _mouseOverItemTimeoutId;
    private _closingCurrentChildTimeoutId;
    private _mouseStayOutSubmenuTimeoutId;
    private _mouseStayTime;
    private _mouseStayoutSubmenuTime;
    private _lastMouseDownedItem;
    private _direction;
    private _pos?;
    private _viewPosition;
    private _currentChildPositionClassText;
    private _modelEventMananger;
    private _disposed;
    /**
     * Creates an instance of MenuContainerController.
     * @param {MenuSubmenu} param
     * @param {(any | MenuItemController)} [ctx] - it is MenuItemController if it is created by parent MenuItemController, otherwise it is a root context.
     * @memberof MenuContainerController
     */
    constructor(param: MenuRootController<CTX> | MenuItemController<CTX>, ctx: CTX, pos?: PopupPosition, rootWindow?: Window);
    private _createView;
    private _calculatePosition;
    private _createItems;
    setSkinToCurrentView(css: string): void;
    setCSSTextToCurrentView(cssText: string): void;
    resizeView(width: number, height: number): void;
    getView(): MenuDialogView | null;
    hasView(): boolean;
    getViewPosition(): ViewPosition | null;
    getModel(): MenuSubmenu<CTX>;
    isReadyToUse(): boolean | undefined;
    getChild(): MenuContainerController<CTX> | null;
    getRootController(): MenuRootController<CTX>;
    getContext(): any;
    getLayer(): number;
    getBasedItemController(): MenuItemController<CTX> | null;
    isCurrentOpenedChildSubmenuItem(item: MenuItemController<CTX>): boolean | undefined;
    getLastMouseDownedItem(): MenuItemController<CTX> | null;
    setLastMouseDownedItem(item: MenuItemController<CTX>): MenuItemController<CTX>;
    synchronize(): void;
    /**
     * create and open submenu
     *
     * @param {MenuItemController} item
     * @return {*}
     * @memberof MenuContainerController
     */
    openSubmenu(item: MenuItemController<CTX>): null | undefined;
    setTopMost(): void;
    /**
     * check if the controller is alive before firing the callback
     * @private
     * @param {(...args:any[]) => any} callback
     * @return {*}
     * @memberof MenuItemController
     */
    checkAvailabilityBeforeCall(callback: (...args: any[]) => any, _this?: MenuItemController<CTX>): (...args: any[]) => void;
    private _setViewDOMEvents;
    private _onMenuDragStart;
    private _onDocumentFocusOut;
    /**
     * always close when HTA's document.body is clicked
     * @private
     * @param {MSEventObj} ev
     * @return {*}
     * @memberof MenuContainerController
     */
    private _onBaseDocClick;
    private _onUnload;
    /**
     * Keyboard events
     * @private
     * @param {MSEventObj} ev
     * @memberof MenuContainerController
     */
    private _onKeyPress;
    private _onPressAltF4;
    private _onDocumentMouseWheel;
    getElementsByName(name: string): void;
    getNextMenuItem(plus: number, current?: MenuItemController<CTX>): MenuItemController<CTX> | null;
    setCurrentItem(item: MenuItemController<CTX>, activateMouseStay?: boolean): void;
    private _hookMouseStay;
    private _clearMouseStayTimeout;
    /**
     * close an opened child menu if the mouse cursor leaves the outside of its submenu item
     * @private
     * @param {MenuItemController} item
     * @return {*}
     * @memberof MenuContainerController
     */
    private _hookToCloseCurrentChild;
    clearClosingCurrentChildTimeout(): void;
    getCurrentItem(): MenuItemController<CTX> | null;
    /**
     * set parent's currentItem as this submenu item
     * @memberof MenuContainerController
     */
    setThisAsParentCurrentItem(view: MenuDialogView | null): void;
    hide(): void;
    isAvailable(): boolean;
    isLocked(): boolean;
    isDisposed(): boolean;
    disposeAll(): void;
    disposeFromParent(): void;
    disposeChild(): void;
    dispose(): void;
    private _dispose;
    getDirection(): number;
    $L(): string;
}
/**
 * controller for each menu item
 * @class MenuItemController
 * @implements {LoggerInterface}
 */
declare class MenuItemController<CTX> {
    private _model;
    private _container;
    private _view?;
    private _modelEventMananger;
    constructor(model: MenuModelItem<CTX>, container: MenuContainerController<CTX>, view: MenuItemView);
    private _prepareModel;
    getView(): MenuItemView | undefined;
    isCurrentItem(): boolean;
    private _setItemEvents;
    private _onMouseOverItem;
    private _onMouseDownItem;
    private _onMouseUpItem;
    private _onMouseClickItem;
    /**
     * activate the menu item
     * @param {(MSEventObj)} ev
     * @memberof MenuItemController
     */
    activate(ev?: MSEventObj): false | undefined;
    /**
     * fire if the mouse cursor hover on the item for more than certain time
     * @memberof MenuItemController
     */
    fireMouseStay(): false | undefined;
    getModel(): MenuModelItem<CTX>;
    getContainer(): MenuContainerController<CTX>;
    dispose(destroy?: boolean): void;
}
/**
 * each user event interacts with menu items through this wrapper.
 * this event object is passed as a first argument to each event handler.
 */
declare class MenuUserEventObject<CTX> implements MenuUserEventObjectModel {
    ctx: CTX;
    srcContext: CTX;
    target: MenuContainerUI<CTX> | MenuItemUI<CTX>;
    readonly type: MenuItemUserEventNames;
    readonly index?: number;
    readonly id?: string;
    readonly name?: string;
    readonly radioIndex?: number;
    readonly checked?: boolean;
    value?: any;
    cancelGlobal: boolean;
    constructor(type: MenuItemUserEventNames, ctrl: MenuContainerController<CTX> | MenuItemController<CTX>);
    dispose(): void;
}
declare abstract class _MenuUI<T> {
    protected _ctrl: T;
    constructor(ctrl: T);
    dispose(): void;
}
declare class MenuContainerUI<CTX> extends _MenuUI<MenuContainerController<CTX>> {
    constructor(ctrl: MenuContainerController<CTX>);
    loadSkin(css: string, root?: boolean): void;
    /**
     * create stand alone popup dialog
     */
    popup(args: any, marginX?: number, marginY?: number): any;
}
declare class MenuItemUI<CTX> extends _MenuUI<MenuItemController<CTX>> {
    constructor(ctrl: MenuItemController<CTX>);
    getContainer(): MenuContainerUI<CTX>;
    setLabel(text: string, asHtml?: boolean): void;
    getLabel(): string | void;
    setIcon(icon: IconSettingType): void;
    remove(): void;
}

interface HTAContextMenuArguments<CTX> extends Omit<MenuItemSubmenuParameter<CTX>, 'type' | 'label'> {
    type?: 'submenu' | 'popup';
    onunload?: (...args: any) => any;
}
declare class HTAContextMenu<CTX> extends MenuRootController<CTX> {
    constructor(param: HTAContextMenuArguments<CTX>);
    getVersion(): string;
    showVersion(): void;
}

export { HTAContextMenu as default };
