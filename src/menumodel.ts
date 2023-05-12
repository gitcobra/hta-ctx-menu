import { MenuUserEventObject } from "./menuctrl";
import { console } from "./utils";


// menu model events. they are fired from models. controllers use them to observe internal changes.
type MenuModelEventNames = 'label' | 'icon' | 'arrow' | 'class' | 'checked' | 'disabled' | 'unselectable' | 'css';
// user defined events. they are fired from controllers. users set the handlers by parameter when create controllers.
type MenuItemUserEventNames = 'activate' | 'click' | 'close' | 'change' | 'dblclick' | 'highlight' | 'beforeload' | 'load' | 'unload' | '_rootclose' | '_viewready' | 'demand';
type MenuGlobalEventNames = 'highlight' | 'click' | 'dblclick' | 'activate';
type MenuGlobalEventsTypeForUser = {[P in MenuGlobalEventNames as `on${P}`]?: UserEventListener};
type MenuGlobalEventNamesForUser = keyof MenuGlobalEventsTypeForUser;

const AllMenuTypesList = ['normal', 'radio', 'checkbox', 'separator', 'submenu', 'popup', 'demand', 'radios'] as const;
type AllMenuTypes = typeof AllMenuTypesList[number];
const MenuItemTypesList = ['normal', 'radio', 'checkbox', 'separator', 'submenu', 'popup'] as const;
type MenuItemTypes = typeof MenuItemTypesList[number];

// each single MenuItem parameter types
type MenuItemParameter = MenuItemNormalParameter | MenuItemCheckboxParameter | MenuItemRadioParameter | MenuItemSubmenuParameter | MenuItemSeparatorParameter | MenuItemPopupParameter;

type UserEventListener = (ev:MenuUserEventObject, ctx:any) => any;

interface MenuItemNormalParameter {
  type?: 'normal'
  label: string
  html?: boolean
  icon?: IconSettingType
  customClass?: string
  title?: string

  id?: string

  onclick?: UserEventListener
  ondblclick?: UserEventListener
  onhighlight?: UserEventListener
  onactivate?: UserEventListener
  ignoreGlobalEvents?: boolean
  ignoreErrors?: boolean
  
  disabled?: boolean
  unselectable?: boolean
  unlistening?: boolean

  union?: boolean
  hold?: boolean
  unholdByDblclick?: boolean
  holdParent?: boolean
  flash?: number
}

interface _MenuItemCheckableParameter extends Omit<MenuItemNormalParameter, 'icon' | 'type'> {
  name?: string
  global?: boolean
  checked?: boolean
  value?: any
  record?: CheckableRecord
  onchange?: UserEventListener
}
interface MenuItemCheckboxParameter extends _MenuItemCheckableParameter {
  type: 'checkbox'
  checkboxIcon?: CheckableIconPairParam
}
interface MenuItemRadioParameter extends _MenuItemCheckableParameter {
  type: 'radio'
  radioIcon?: CheckableIconPairParam
  uncheckable?: boolean
}
interface MenuItemRadioGroupParameter extends Omit<MenuItemRadioParameter, 'type' | 'value' | 'checked' | 'label'> {
  type: 'radios'
  selectedIndex?: number,
  serialId?: boolean,
  labels:
    string[] | // labels
    [string, any?, boolean?][] | // [label, value, checked]
    Omit<MenuItemRadioParameter, 'type' | 'name'>[]
}
// record about whether the item is checked
type CheckableRecord = {
  checked?: boolean
  value?: any
  selectedIndex?: number
};



interface MenuItemSubmenuParameter extends Omit<MenuItemNormalParameter, 'type'> {
  type: 'submenu'
  items: MenuItemCreateParameterList
  customDialogClass?: string

  skin?: string
  cssText?: string
  fontSize?: number | string
  fontFamily?: string
  
  checkboxIcon?: CheckableIconPairParam
  radioIcon?: CheckableIconPairParam
  arrowIcon?: IconSettingType
  
  flashItems?: boolean | number
  leftMargin?: number
  childLeftMargin?: number

  onload?: UserEventListener
  onbeforeload?: UserEventListener
  onunload?: UserEventListener
  globalEvents?: MenuGlobalEventsTypeForUser

  autoClose?: boolean
  inherit?: SubmenuInheritanceFlags | boolean
}

interface SubmenuInheritanceFlags {
  skin?: boolean
  cssText?: boolean
  globalEvents?: boolean /*| {
    [key in keyof MenuItemSubmenuParameter["globalEvents"]]?: boolean
  }*/
  checkboxIcon?: boolean
  radioIcon?: boolean
  arrowIcon?: boolean
  flashItems?: boolean
  childLeftMargin?: boolean
  autoClose?: boolean
  
  fontSize?: boolean
  fontFamily?: boolean
}

const PopupXPos = ['left' , 'left-out' , 'left-center', 'right' , 'right-out' , 'right-center', 'x-center'] as const;
const PopupYPos = ['top' , 'top-out' , 'top-center', 'bottom' , 'bottom-out', 'bottom-center', 'y-center'] as const;
interface PopupBase {
  base?: 'item' | 'parent' | 'all' | 'screen' | string /*id*/
  posX?: typeof PopupXPos[number]
  posY?: typeof PopupYPos[number]
}
interface PopupMargin {
  marginX?: number
  marginY?: number
  marginLeft?: number
  marginRight?: number
}
interface PopupPosition extends PopupBase, PopupMargin {}
interface MenuItemPopupParameter extends Omit<MenuItemSubmenuParameter, 'type'> {
  type: 'popup'
  pos?: PopupPosition
  exclusive?: boolean
}

interface MenuItemSeparatorParameter {
  type: 'separator'
  id?: string
  customClass?: string

  //separatorPos?: 'all' | 'right' | 'left'
}

type MenuItemCreateParameter = MenuItemParameter | MenuItemDemandParameter | MenuItemRadioGroupParameter;
type MenuItemCreateParameterList = (MenuItemCreateParameter | undefined | null)[];
interface MenuItemDemandParameter {
  type: 'demand'
  id?: string
  ondemand: (ev:MenuUserEventObject, ctx:any) => MenuItemCreateParameter | MenuItemCreateParameterList | null | undefined
}


// icon types
type IconSettingType = string | {
  // image file
  path: string,
  width?: string | number,
  height?: string | number,
  blank?: boolean,
} | {
  // text icon using Wingdings, etc
  text: string,
  fontFamily?: string,
  fontSize?: string | number,
  blank?: boolean,
};
// for MenuCheckable icons. [checked icon, unchecked icon] | checked
// when it is an IconSettingType, automatically set blank flag for unchecked state
type CheckableIconPair = [IconSettingType, IconSettingType];
type CheckableIconPairParam = CheckableIconPair | IconSettingType;

function convertCheckableIconPairParam(param: CheckableIconPairParam): CheckableIconPair {
  if( param instanceof Array ) {
    if( param.length !== 2 )
      throw new Error(`CheckableIconPair must be [IconSettingType, IconSettingType]`);
    return param;
  }
  
  const icon = param as any;
  const blank = {} as any;
  if( !icon.path && !icon.text )
    throw new Error(`pairIcons parameter must be type CheckableIconPair`);
  
  // copy props 
  for( const p in icon ) {
    blank[p] = icon[p];
  }
  // set blank flag for the unchecked icon
  blank.blank = true;

  return [icon as IconSettingType, blank as IconSettingType];
}









interface MenuUserEventObjectModel {
  cancelGlobal: boolean
  dispose(): void
}

// various flags for the items
type MenuItemFlagsType = {
  union?: boolean
  hold?: boolean
  unholdByDblclick?: boolean
  holdParent?: boolean
  unselectable?: boolean
  unlistening?: boolean
  disabled?: boolean
  flash?: number
  html?: boolean
  
  checked?: boolean
  usericon?: boolean
  //separatorPos?: MenuItemSeparatorParameter['separatorPos']
};


let _MenuModel_uniqueId = 0;

/**
 * base menu item class.
 * all menu items are descended from this.
 * @abstract
 * @class _MenuModelBase
 */
abstract class _MenuModelBase {
  /**
   * @type {AllMenuTypes}
   */
  protected abstract _type: AllMenuTypes;
  protected readonly _uniqueId: string = 'uid_'+String(++_MenuModel_uniqueId);
  protected readonly _id?: string; // specify any id if needed. it's used by getMenuItemById.
  protected _parent?: MenuSubmenu;
  protected _index: number = -1;
  
  protected _customClassNames: string[] = [];
  protected _isDynamicallyProduced: boolean = false; // true if it was produced by type demand item

  constructor(args: MenuItemCreateParameter, parent?: MenuSubmenu, demanded: boolean = false) {
    //this._type = args.type || 'normal';
    if( args.type && !RegExp('\\b'+args.type+'\\b', 'i').test(AllMenuTypesList as any) ) {
      this._unexpectedTypeError();
    }

    this._parent = parent;
    //this._name = args.name;
    this._id = args.id;

    if( demanded || parent?.isDynamicallyProduced() ) {
      this._isDynamicallyProduced = true;
    }

    if( 'customClass' in args ) {
      const classNames = [];
      const cstr = String(args.customClass).replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
      if( !/((^|\s)\S+)$/.test(cstr) )
        throw new Error(`classNames parameter must be a space separated string. "${cstr}"`);
      const classes = cstr.split(' ');
      for( const name of classes ) {
        classNames.push(name);
      }
      this._customClassNames = classNames;
    }
  }
  
  protected _unexpectedTypeError() {
    throw new Error(`type "${this._type}" could not be applied to "${String(this.constructor).replace(/^function\s+([^(]+)[\s\S]+$/, '$1')}" class`);
  }
  
  getType(this: MenuModelItem): MenuItemTypes
  getType() {
    return this._type;
  }
  getId() {
    return this._id;
  }
  getUniqueId(): string {
    return this._uniqueId;
  }
  getCustomClassNames(): string[] {
    return this._customClassNames;
  }

  getFlags(): MenuItemFlagsType {
    return {};
  }
  getIcon(): IconSettingType | undefined { return undefined }
  getLabel() {}

  getIndex() {
    return this._index;
  }
  setIndex(num: number) {
    return this._index = num;
  }
  isDynamicallyProduced() {
    return this._isDynamicallyProduced;
  }
  protected getRealParentSubmenu(): MenuSubmenu | null {
    return !this._parent ? null : this._parent.isDynamicallyProduced() ? this._parent.getRealParentSubmenu() : this._parent;
  }

  private _menuModelEventListeners: {
    [key in MenuModelEventNames]? : {
      [id: number]: Function
    }
  } = {};
  
  private _listenerIdCounter = 0;
  /**
   * set internal model event listeners
   * @param {MenuModelEventNames} handler
   * @param {Function} listener
   * @memberof MenuModel
   */
  addMenuModelEvent(handler: MenuModelEventNames, listener: Function) {
    const listeners = this._menuModelEventListeners[handler] = this._menuModelEventListeners[handler] || {};
    listeners[this._listenerIdCounter] = listener;
    return this._listenerIdCounter++;
  }
  removeMenuModelEvent(handler: MenuModelEventNames, listenerId: number) {
    const listeners = this._menuModelEventListeners[handler] = this._menuModelEventListeners[handler] || {};
    if( listeners[listenerId] ) {
      delete listeners[listenerId];
      return true;
    }
    return false;
  }
  /**
   * fire events
   * @param {string} handler
   */
  fireMenuModelEvent(handler: MenuModelEventNames, ...args:any) {
    console.log(`${this.$L()}#fireMenuModelEvent: ${handler}`, 'olive');
    for( const ename in this._menuModelEventListeners ) {
      if( ename !== handler )
        continue;
      const listeners = this._menuModelEventListeners[ename];
      for( const id in listeners ) {
        listeners[Number(id)](...args);
      }
    }
  }

  // type guards
  isNormal(): this is MenuNormal {
    return this instanceof MenuNormal;
  }
  isSubmenu(): this is MenuSubmenu {
    return this instanceof MenuSubmenu;
  }
  isPopup(): this is MenuPopup {
    return this instanceof MenuPopup;
  }
  isCheckable(): this is _MenuCheckable {
    return this instanceof _MenuCheckable;
  }
  isRadio(): this is MenuRadio {
    return this instanceof MenuRadio;
  }
  isCheckbox(): this is MenuCheckbox {
    return this instanceof MenuCheckbox;
  }
  isSeparator(): this is MenuSeparator {
    return this instanceof MenuSeparator;
  }
  isDemandable(): this is MenuDemand {
    return this instanceof MenuDemand;
  }

  $L(): string {
    if( this._parent )
      return `L(${this._parent.getLayer()})i[${this._index}]`;
    else
      return `L(R)`;
  }

  dispose() {
    // 
  }
}






/**
 * MenuNormal items have basic menu item functions
 * @class MenuNormal
 * @extends {_MenuModelBase}
 */
class MenuNormal extends _MenuModelBase {
  protected readonly _type: AllMenuTypes = 'normal';
  protected _label: string; // html or text for its label
  protected _useHTML: boolean = false;
  protected _union = false; // no left and right padding spaces
  protected _icon?: IconSettingType; // icon path
  protected _title?: string;
  
  protected _unselectable: boolean = false; // unselectable items will not be highlighted
  protected _disabled: boolean = false; // disabled
  protected _unlistening: boolean = false;

  protected _hold = false // hold on after a clickable item was clicked
  protected _unholdByDblclick = false; // when hold is true, close menu by double click or enter key
  protected _holdParent = false; // when an item is clicked, hold on parent menu
  protected _flash: number = 0; // flash in some msec after clicking the item

  protected onclick?: UserEventListener;
  protected ondblclick?: UserEventListener;
  protected onhighlight?: UserEventListener;
  protected onactivate?: UserEventListener;
  protected _ignoreGlobalEvents = false;
  protected _ignoreErrors = false;

  protected _selected: boolean = false;
  
  constructor(args: MenuItemNormalParameter, parent?: MenuSubmenu, demanded?: boolean) {
    super(args, parent, demanded);
    // get all possible keys from union type
    type GetKeys<T> = T extends any ? keyof T : never;
    const param = args as { [key in GetKeys<MenuItemParameter>] : any };

    this._label = String((<any>args).label);
    this._icon = 'icon' in args ? args.icon : undefined;

    this._title = param.title;
    // flags
    this._union = !!param.union;
    this._hold = param.hold ?? parent?._hold ?? false;
    this._holdParent = !!param.holdParent;
    this._unholdByDblclick = !!param.unholdByDblclick;
    this._disabled = !!param.disabled;
    this._unselectable = !!param.unselectable;
    this._unlistening = !!param.unlistening;
    this._flash = param.flash || 0;
    this._useHTML = !!param.html;

    // events
    this.onclick = param.onclick;
    this.ondblclick = param.ondblclick;
    this.onhighlight = param.onhighlight;
    this.onactivate = param.onactivate;
    this._ignoreGlobalEvents = !!param.ignoreGlobalEvents;
    this._ignoreErrors = !!param.ignoreErrors;
  }

  /**
   * fire user events such as onclick, onchange, etc
   */
  fireUserEvent(handler: MenuItemUserEventNames, ctx:any, eventObj: MenuUserEventObject) {
    console.log(`${this.$L()}#MenuNormal#fireUserEvent:"${handler}"`, 'olive');
    if( this._unlistening )
      return;
    
    let notFired = false;
    try {
      switch(handler) {
        case 'activate':
          this.onactivate?.(eventObj, ctx);
          break;
        case 'click':
          this.onclick?.(eventObj, ctx);
          break;
        case 'dblclick':
          this.ondblclick?.(eventObj, ctx);
          break;
        case 'change': {
          if( this.isCheckable() ) {
            if( this.getType() === 'radio' ) {
              // indivisual onchange
              this.onchange?.(eventObj, ctx);
            }
            else
              this.onchange?.(eventObj, ctx);
          }
          break;
        }
        case 'highlight':
          this.onhighlight?.(eventObj, ctx);
          break;
        case 'beforeload':
          if( this.isSubmenu() )
            this.onbeforeload?.(eventObj, ctx);
          break;
        case 'load':
          if( this.isSubmenu() )
            this.onload?.(eventObj, ctx);
          break;
        case 'unload':
          if( this.isSubmenu() )
            this.onunload?.(eventObj, ctx);
          break;
        default:
          notFired = true;
      }
    } catch(e: any) {
      if( !this._ignoreErrors )
        alert(`an error occurred while firing an user event.\n\nhandler: "on${handler}"\nlayer: ${this._parent?.getLayer()}\nindex: ${this._index}\ntype: ${this._type}\nlabel: "${this.getLabel().replace(/[\r\n]/g, '')}"\nmessage: ${e.message}`);
    }
    
    //if( !notFired )
    //  console.log('FIRED!', 'red');

    // fire global user events
    if( eventObj.cancelGlobal !== true && !this._ignoreGlobalEvents ) {
      if( this.isNormal() ) {
        try {
          this._parent?.getGlobalEvent(handler)?.(eventObj, ctx);
        } catch(e: any) {
          if( !this._ignoreErrors )
            alert(`an error occurred while firing an global user event.\n\nhandler: "on${handler}"\nlayer: ${this._parent?.getLayer()}\nindex: ${this._index}\ntype: ${this._type}\nlabel: "${this.getLabel().replace(/[\r\n]/g, '')}"\nmessage: ${e.message}`);
        }
      }
    }

    // dispose event object
    eventObj.dispose();
  }
 
  setLabel(label: string, asHtml?: boolean) {
    console.log('MenuNormal#setLabel ' + label);
    const beforeLabel = this._label;
    this._label = label;
    this.fireMenuModelEvent('label', label, beforeLabel);
  }
  getLabel(asHtml?:boolean): string {
    return this._label;
  }

  setIcon(icon: IconSettingType) {
    this._applyIcon(icon);
  }
  protected _applyIcon(icon: IconSettingType) {
    const before = this._icon;
    this._icon = icon;
    this.fireMenuModelEvent('icon', icon, before);
  }
  getIcon(): IconSettingType | undefined {
    return this._icon;
  }
  hasUsersIcon() {
    return !!this._icon;
  }
  
  /**
   * get item flags
   * @return {*}
   * @memberof MenuNormal
   */
  getFlags(): MenuItemFlagsType {
    return {
      union: this._union,
      hold: this._hold,
      unholdByDblclick: this._unholdByDblclick,
      holdParent: this._holdParent,
      flash: this._flash,
      html: this._useHTML,

      unselectable: this._unselectable,
      disabled: this._disabled,
      unlistening: this._unlistening,
    };
  }

  dispose() {
    super.dispose();
    //
  }
}



/**
 * radio or checkbox item
 * @abstract
 * @class MenuCheckable
 * @extends {MenuNormal}
 */
abstract class _MenuCheckable extends MenuNormal {
  protected abstract readonly _type: 'checkbox' | 'radio';
  // prototype static properties
  static {
    this.prototype._defaultPairIcons = [{text:'\xfc', fontFamily:'Wingdings'}, {text:'\xfc', fontFamily:'Wingdings', blank:true}];
  }
  
  protected _parent!: MenuSubmenu;

  protected _name: string; // name for record
  protected _isNamed: boolean = false; // set the flag on if name is set by user
  protected _global: boolean = false; // group the same name items in the entire menus
  
  protected _recordSubmenu: MenuSubmenu; // record's submenu
  protected _record: CheckableRecord; // record whether the item is checked

  protected _checked: boolean = false; // checked flag for radio or checkbox
  protected _value?: any; // each item's value if needed

  protected _previousChecked?: boolean;
  
  protected _defaultPairIcons!: CheckableIconPair; // checked, unchecked
  protected _pairIcons: CheckableIconPair | null = null; // checked, unchecked

  onchange?: UserEventListener;
  
  constructor(args: MenuItemRadioParameter | MenuItemCheckboxParameter, parent: MenuSubmenu, demanded?: boolean) {
    super(args as Omit<typeof args, 'type'>, parent, demanded);
    //this._parent = parent;
    //this._type = args.type;

    // set item name for a record
    let name: string;
    // user specified name
    if( args.name ) {
      if( !/^\w/.test(args.name) )
       throw new Error(`name parameter must be started with an alphabet. "${args.name}" is invalid.`);
      
      this._isNamed = true;
      name = String(args.name)
      //this._recordRepository = this.getRealParentSubmenu()!;
    }
    else {
      //throw new Error('a type "radio" or "checkbox" item needs "name" parameter');
      // generate name automatically
      name = args.type === 'radio' ? '!radio_noname' : '!checkbox_' + _MenuModel_uniqueId++;
    }
    this._name = name;

    // use global repository for the name
    this._global = !!args.global;
    this._recordSubmenu = this._global ? this._parent.getRoot() : this._parent;

    this.onchange = args.onchange;
    
    this._checked = !!args.checked;

    // user specified record object
    if( args.record ) {
      if( typeof args.record !== 'object' )
        throw new Error(`"record" parameter must be an object.`);
      
      this._record = args.record;
    }
    // generate a record
    else {
      this._record = this._parent.getNamedCheckableItemRecord(this._name, this._global);
    }

    // set item value
    this._value = args.value;
    
    // update the icon
    //this.updateCheckableIcon(true);
  }
  
  updateCheckableIcon(force?: boolean) {
    const prev = this._previousChecked;
    const current = this._checked;
    console.log(`${this.$L()}#updateCheckableIcon ${prev} => ${current}`, 'olive');
    if( prev !== current || force ) {
      const icon = this._pairIcons || this._parent.getDefaultCheckableIcon(this._type) || this._defaultPairIcons;
      
      this._applyIcon(current ? icon[0] : icon[1]);
      this.fireMenuModelEvent('checked', current, this._value);
      this._previousChecked = current;
    }
  }
  abstract updateCheckedStatByRecord(): void;

  getFlags(): MenuItemFlagsType {
    return {
      checked: this._checked,
      usericon: this.hasUsersIcon(),
      ...super.getFlags(),
    };
  }
  getName() {
    return this._name;
  }
  setValue(val: any) {
    this._value = val;
  }
  getValue() {
    return this._value;
  }
  isChecked() {
    return this._checked;
  }
  isGlobal() {
    return this._global;
  }
  getRecord() {
    return this._record;
  }
  getRecordRopository(): MenuSubmenu {
    return this._recordSubmenu;
  }
  setIcon(icon: CheckableIconPairParam | null, apply = true) {
    this._pairIcons = icon ? convertCheckableIconPairParam(icon) : null;
    if( apply )
      this.updateCheckableIcon(true);
  }
  hasUsersIcon() {
    return !!(this._pairIcons || this._parent.getDefaultCheckableIcon(this._type));
  }

  protected abstract _setChecked(flag?: boolean, fromPublic?: boolean): boolean;
  setChecked(flag?: boolean): boolean {
    const prev = this._checked;
    console.log(`${this.$L()}#setChecked ${prev} => ${flag}`, 'olive');

    flag = typeof flag === 'undefined' ? !prev : !!flag; // flip if flag is undefined
    if( flag === prev )
      return false;
    
    const result = this._setChecked(flag, true); // work for each Checkable type
    if( result ) {
      this.updateCheckableIcon();
    }
    
    return result;
  }
}

class MenuCheckbox extends _MenuCheckable {
  protected readonly _type = 'checkbox';
  constructor(args: MenuItemCheckboxParameter, parent: MenuSubmenu, demanded?: boolean) {
    super(args, parent, demanded);
    
    // set the pair of icons
    if( args.checkboxIcon ) {
      this.setIcon(args.checkboxIcon, false);
    }

    if( typeof this._record.checked === 'boolean' )
      this._checked = this._record.checked;
    this._record.checked = this._checked;

    // update the icon
    this.updateCheckableIcon(true);
  }
  protected _setChecked(flag: boolean, fromPublic = false) {
    this._checked = flag;
    if( fromPublic ) {
      this._record.checked = flag;
      this._linkOtherCheckboxesInParents(flag);
    }
    this.updateCheckableIcon();
    return true;
  }
  private _linkOtherCheckboxesInParents(flag: boolean) {
    let parent: MenuSubmenu | null = this._parent;
    let global = this._global;
    while( parent ) {
      const list = parent.getItemsByName(this._name);
      for( const item of list ) {
        if( item === this || !item.isCheckbox() || global !== item._global )
          continue;
        item._setChecked(flag);
      }

      parent = global ? parent.getParent() : null;
    }
  }
  updateCheckedStatByRecord() {
    console.log(`${this.$L()}#updateCheckedStatByRecord "${this._name}"`, 'olive');
    this._checked = !!this._record.checked;
    this.updateCheckableIcon();
  }
}

class MenuRadio extends _MenuCheckable {
  protected readonly _type = 'radio';
  readonly _radioIndex: number; // index in the radio group
  private _uncheckable: boolean = false; // allow unckeck the radio button
  
  constructor(args: MenuItemRadioParameter, parent: MenuSubmenu, demanded?: boolean) {
    super(args, parent, demanded);
    
    // set the pair of icons
    if( args.radioIcon ) {
      this.setIcon(args.radioIcon, false);
    }

    // initialize radio index
    //this._radioIndex = this._recordSubmenu.countRadioIndex(this._name);
    this._radioIndex = this._parent.countRadioIndex(this._name, this._global, this._id);
    console.log([this._radioIndex, this._label]);

    // decide checked status
    if( this._checked ) {
      this._record.selectedIndex = this._radioIndex;
    }
    else {
      if( typeof this._record.selectedIndex !== 'number' )
        this._record.selectedIndex = 0;
      if( this._record.selectedIndex === this._radioIndex )
        this._checked = true;
    }

    this._uncheckable = !!args.uncheckable;

    // update the icon
    this.updateCheckableIcon(true);
  }

  getRadioIndex() {
    return this._radioIndex;
  }
  isUncheckable() {
    return this._uncheckable;
  }
  protected _setChecked(flag: boolean, fromPublic = false): boolean {
    if( !flag ) {
      if( fromPublic && !this._uncheckable )
        return false;

      this._checked = false;

      if( fromPublic ) {
        this._record.selectedIndex = -1;
      }
      this.updateCheckableIcon();
      return true;
    }
    
    this._checked = true;
    this._record.selectedIndex = this._radioIndex;
    this.updateCheckableIcon();

    this._clearOtherRadios();
    return true;
  }
  /**
   * clear all other radios with same name
   * @private
   * @param {boolean} [recursive=false]
   * @memberof MenuRadio
   */
  private _clearOtherRadios() {
    let parent: MenuSubmenu | null = this._parent;
    let global = false;
    while( parent ) {
      const list = parent.getItemsByName(this._name);
      for( const item of list ) {
        if( item === this || !item.isRadio() || global && !item._global )
          continue;
        item._setChecked(false);
      }

      global = this._global;
      parent = global ? parent.getParent() : null;
    }
  }
  updateCheckedStatByRecord() {
    console.log(`${this.$L()}#updateCheckedStatByRecord "${this._name}"`, 'olive');
    this._checked = this._record.selectedIndex === this._radioIndex;
    this.updateCheckableIcon();
  }
}






/**
 * a MenuDemand can emit appropriate menu items dynamically on demand.
 * @class MenuDemand
 * @extends {_MenuModelBase}
 */
class MenuDemand extends _MenuModelBase {
  protected readonly _type = 'demand';
  protected readonly ondemand: MenuItemDemandParameter["ondemand"]
  
  constructor(args: MenuItemDemandParameter, parent?: MenuSubmenu, demanded?: boolean) {
    super(args, parent, demanded);
    if( args.type !== 'demand')
      this._unexpectedTypeError();
    
    if( typeof args.ondemand !== 'function' )
      throw new Error('type demand item needs ondemand event handler');
    
    this.ondemand = args.ondemand;
  }
  /**
   * execute the ondemand callback
   * @param {*} [eventObj]
   * @return {*}  {MenuItemsCreateParameter[]}
   * @memberof MenuDemand
   */
  extract(eventObj: MenuUserEventObject): MenuItemCreateParameterList {
    let resultParameter: MenuItemCreateParameterList;
    try {
      const demanded = this.ondemand.call(this._parent, eventObj, eventObj.ctx) || [];

      if( demanded && typeof(demanded) !== 'object' )
        throw new Error('ondemand callback must returns an object type MenuItemsCreateParameter');

      if( demanded instanceof Array )
        resultParameter = demanded;
      else
        resultParameter = [demanded];
      
      for( const param of resultParameter ) {
        if( param?.type === 'demand' )
          throw new Error('type "demand" item must returns other type parameter.')
      }
    } catch(e: any) {
      alert(`an error occurred while extracting a demandable item\n\nmessage: ${e.message}\n\nparent label: "${this._parent?.getLabel()}"`);
      resultParameter = [];
    }

    return resultParameter;
  }
}






/**
 * for a separator
 * @class MenuSeparator
 * @extends {_MenuModelBase}
 */
class MenuSeparator extends _MenuModelBase {
  protected readonly _type = 'separator';
  constructor(param: MenuItemSeparatorParameter, parent?: MenuSubmenu, demanded?: boolean) {
    super(param, parent, demanded);
    if( param.type !== 'separator')
      this._unexpectedTypeError();
  }
}

// radio index
type RadioItemIndexRecords = {
  [name: string]: {
    index: number
    ids: {
      [id: string]: number
    }
  }
};

/**
 * MenuSubmenu contains all other menu items includes MenuSubmenu itself.
 * when it does not have parent MenuSubmenu, it is the root of all menus.
 * @class SubmenuItem
 * @extends {_MenuModelBase}
 */
class MenuSubmenu extends MenuNormal {
  protected readonly _type = 'submenu';
  private _pre_items: _MenuModelBase[]; // this list contains type "demand" parameter objects
  private _items: MenuModelItem[] = []; // ready items to use
  
  protected _layer: number = 0;
  //private _direction: -1 | 1 = 1; // submenu default direction: (1 = right | -1 = left)
  private _root: MenuSubmenu;
  
  private _flashItems = false;
  private _customDialogClass: string = '';
  

  // have records for named child submenus because demandable items lose records after closed
  private _namedCheckableItemRecords: { [key:string]: CheckableRecord } = {}; // records for MenuCheckable items
  private _globalNamedCheckableItemRecords: { [key:string]: CheckableRecord } | null = null; // global records only for the root menu
  private _radioCount: RadioItemIndexRecords = {};
  private _globalRadioCount: RadioItemIndexRecords | null = null;

  private _childLeftMargin?: number;

  private _skinCSSPath?: string;
  private _cssText?: string;
  private _fontSize?: number | string
  private _fontFamily?: string

  private _checkablePairIcons: { [key in 'checkbox' | 'radio']?: CheckableIconPair } = {};
  //private _checkboxIcon?: CheckableIconPair;
  //private _radioIcon?: CheckableIconPair;
  private _arrowIcon!: IconSettingType;
  static {
    this.prototype._arrowIcon = {text:'\x38', fontFamily:'Marlett'};
  }
  
  onload?: UserEventListener;
  onbeforeload?: UserEventListener;
  onunload?: UserEventListener;
  _onrootclose?: UserEventListener;
  _onviewready?: UserEventListener;
  private _globalEvents?: MenuGlobalEventsTypeForUser | null = null;
  private _disableAutoClose?: boolean;

  // default inheritance settings
  private _inherit: SubmenuInheritanceFlags = {
    skin: true,
    cssText: true,
    globalEvents: true,
    checkboxIcon: true,
    radioIcon: true,
    arrowIcon: true,
    flashItems: true,
    childLeftMargin: true,
    autoClose: true,
    fontSize: true,
    fontFamily: true,
  };

  constructor(param: MenuItemSubmenuParameter | MenuItemPopupParameter, parent?: MenuSubmenu/*, inheritOnly:boolean = false*/, demanded?: boolean) {
    super(param as Omit<typeof param, 'type'>, parent, demanded);

    this.onload = param.onload;
    this.onbeforeload = param.onbeforeload;
    this.onunload = param.onunload;
    this._globalEvents = param.globalEvents;

    this._skinCSSPath = param.skin;
    this._cssText = param.cssText;
    this._fontSize = param.fontSize;
    this._fontFamily = param.fontFamily;
    
    this._childLeftMargin = param.childLeftMargin;

    this._arrowIcon = param.arrowIcon || this._arrowIcon;

    if( param.checkboxIcon )
      this._checkablePairIcons['checkbox'] = convertCheckableIconPairParam(param.checkboxIcon);
    if( param.radioIcon )
      this._checkablePairIcons['radio'] = convertCheckableIconPairParam(param.radioIcon);
    
    const className = String(param.customDialogClass||'');
    if( className && !/(^\S+)$/.test(className) )
      throw new Error(`invalid customDialogClass parameter. "${className}"`);
    this._customDialogClass = className;

    if( typeof param.autoClose === 'boolean' )
      this._disableAutoClose = param.autoClose;
    
    // set inherit attributes from parent
    if( parent ) {
      if( typeof param.inherit !== 'undefined' ) {
        const _inherit = this._inherit as SubmenuInheritanceFlags;
        const pinherit = param.inherit as SubmenuInheritanceFlags;
        for( const attr in this._inherit ) {
          const key = attr as keyof SubmenuInheritanceFlags;
          if( typeof pinherit === 'boolean' ) {
            // set all as the same flag if the value is boolean
            _inherit[key] = pinherit;
            continue;
          }
          if( key in pinherit === false )
            continue;

          _inherit[key] = pinherit[key];
        }
      }
    }

    /*
    if( typeof this._childLeftMargin === 'undefined' )
      this._childLeftMargin = 0;
    */

    // decide whether this is the root 
    if( parent /*&& !inheritOnly*/ ) {
      this._root = parent._root;
      this._layer = parent._layer + 1;
    }
    else {
      this._root = this;
      this._globalNamedCheckableItemRecords = {};
      this._globalRadioCount = {};
    }

    this._pre_items = this._preCreateItems(param.items);
  }
  
  /**
   * create pre-items
   * MenuDemand items are not extracted yet at this time
   */
  private _preCreateItems(args: MenuItemCreateParameter | MenuItemCreateParameterList, demanded?: boolean): _MenuModelBase[] {
    if( !(args instanceof Array) )
      args = [args];

    const resultItems = [];
    for( let param of args ) {
      if( !param )
        continue;
      const type = param.type || 'normal';
      
      if( !RegExp('\\b'+type+'\\b', 'i').test(AllMenuTypesList as any) )
        throw new Error('unexpected menu type: ' + type);
      // extract radio group parameter
      else {
        let item!: _MenuModelBase;
        let items: _MenuModelBase[] | null = null;
        switch(param.type) {
          case 'radios':
            items = this._extractRadiosParameter(param as MenuItemRadioGroupParameter, demanded);
            break;
          case 'submenu':
            item = new MenuSubmenu(param as MenuItemSubmenuParameter, this, demanded);
            break;
          case 'popup':
            item = new MenuPopup(param as MenuItemPopupParameter, this, demanded);
            break;
          case 'checkbox':
            item = new MenuCheckbox(param as MenuItemCheckboxParameter, this, demanded);
            break;
          case 'radio':
            item = new MenuRadio(param as MenuItemRadioParameter, this, demanded);
            break;
          case 'separator':
            item = new MenuSeparator(param as MenuItemSeparatorParameter, this, demanded);
            break;
          case 'demand':
            item = new MenuDemand(param as MenuItemDemandParameter, this, demanded);
            break;
          case 'normal':
          default:
            item = new MenuNormal(param as MenuItemNormalParameter, this, demanded);
            break;
        }
        resultItems.push(...(items || [item]));
      }
    }
    
    return resultItems;
  }
  private _extractRadiosParameter(param: MenuItemRadioGroupParameter, demanded?: boolean): _MenuCheckable[] {
    const list = [];
    if( param.hasOwnProperty('labels') ) {
      const labels = param.labels;

      // generate radio names automatically if doesn't exist
      const name = param.name || 'nonameradios_' + _MenuModel_uniqueId++;
      const serialId = param.serialId;
      const selectedIndex = param.selectedIndex || -1;
      
      for( let i = 0; i < labels.length; i++ ) {
        let label, checked, value, disabled, unselectable, unlistening, id;
        label = labels[i];
        if( !label )
          continue;
        
        // set id automatically
        if( serialId ) {
          id = name + '_serialID_' + i;
        }

        if( label instanceof Array ) {
          [label, value, checked] = label;
        }
        else if( label instanceof Object ) {
          let id2;
          ({label, checked, value, unselectable, disabled, unlistening, id:id2} = label);
          id = id2 || id;
        }
        else {
          label = String(label);
          value = label;
        }
        
        checked = !!checked;
        disabled = !!disabled;
        unselectable = !!unselectable;

        // create a MenuCheckable
        list.push(new MenuRadio({
          type: 'radio',
          label: label,
          html: param.html,
          id: id,
          name,
          record: param.record,
          global: param.global,
          value: typeof value !== 'undefined' ? value : i,
          checked: checked || selectedIndex === i,
          onchange: param.onchange,
          onclick: param.onclick,
          ondblclick: param.ondblclick,
          onhighlight: param.onhighlight,
          flash: param.flash,
          hold: param.hold,
          disabled,
          unselectable,
          unlistening,
          radioIcon: param.radioIcon,
        }, this, demanded));
      }
    }
    return list;
  }
  /**
   * extract all MenuDemand items and return complete item list
   * @param {*} [eventObj]
   * @return {*} 
   * @memberof MenuSubmenu
   */
  produceItems(eventObj: MenuUserEventObject): MenuModelItem[] {
    const preitems = this._pre_items;
    const items: MenuModelItem[] = this._items = [];
    let index = 0;
    this.resetRadioIndex();
    for( const pitem of preitems ) {
      // create MenuItems "on demand"
      if( pitem.isDemandable() ) {
        const params = pitem.extract(eventObj);
        const ditems = this._preCreateItems(params as MenuItemCreateParameterList, true) as MenuModelItem[];
        for( const item of ditems ) {
          item.setIndex(index++);
          items.push(item);
        }
      }
      else {
        pitem.setIndex(index++);
        items.push(pitem as MenuModelItem);
      }
    }

    return items.concat();
  }



  /**
   * set records for MenuCheckable items.
   * @param {string} name
   * @param {boolean} checked
   * @memberof MenuSubmenu
   */
   /*
  setCheckedRecord(name: string, checked: boolean, value?: any) {
    const records = this.getCheckedRecord(name);
    records.checked = checked;
    //if( typeof value !== 'undefined' )
    records.value = value;
  }
  */
  getNamedCheckableItemRecord(name: string, global = false): CheckableRecord {
    const repo = global ? this._root._globalNamedCheckableItemRecords! : this._namedCheckableItemRecords;
    const records = repo[name] = repo[name] || {
      selectedIndex: undefined,
      checked: undefined,
    };
    return records;
  }
  /**
   * set the object as record so that users interact with the record too
   * @param {string} name
   * @param {*} record
   * @memberof MenuSubmenu
   */
  setUserObjectAsRecord(name: string, record: CheckableRecord, global = false) {
    const repo = global ? this._root._globalNamedCheckableItemRecords! : this._namedCheckableItemRecords;
    repo[name] = record;
  }
  resetRadioIndex() {
    this._radioCount = {};
  }
  countRadioIndex(name?: string, global = false, id?: string): number {
    const repo = global ? this._root._globalRadioCount! : this._radioCount;
    
    if( !name || typeof name !== 'string' ) {
      name = '!noname';
    }
    
    const dat = repo[name] = repo[name] || {
      index: 0,
      ids: {}
    };
    
    if( id ) {
      console.log(id);
      if( typeof dat.ids[id] === 'number' )
        return dat.ids[id];
      
      dat.ids[id] = dat.index;
    }
    
    return dat.index++;
  }

  protected getItems(): MenuModelItem[] {
    return this._items.concat();
  }
  getParent(): MenuSubmenu | null {
    return this?._parent || null;
  }
  isRoot(): boolean {
    return !this._parent;
  }
  getRoot(): MenuSubmenu {
    return this._root;
  }
  getLayer() {
    return this._layer;
  }
  setSkin(css: string) {
    console.log(`${this.$L()}#setCSS ${css}`, 'olive');
    this._skinCSSPath = css;
    this.fireMenuModelEvent('css', css);
    /*
    this.each(item => {
      if( !item.isSubmenu() )
        return;
      if( !item._inherit || item._inherit.skin === false )
        return;
      item.setSkin(css);
    });
    */
  }


  
  // get properties from itself or parent
  getSkin(): string {
    return this._skinCSSPath || this._inherit.skin && this._parent?.getSkin() || '';
  }
  getCSSText(): string {
    return this._cssText || this._inherit.cssText && this._parent?.getCSSText() || '';
  }
  getGlobalEvent(handler: MenuItemUserEventNames): UserEventListener | null {
    const key = 'on' + handler;
    return this._globalEvents?.[key as keyof typeof this._globalEvents] || this._inherit.globalEvents && this._parent?.getGlobalEvent(handler) || null;
  }
  getChildLeftMargin(): number | undefined {
    return this._childLeftMargin || this._inherit.childLeftMargin && this._parent?.getChildLeftMargin() || undefined;
  }
  getArrowIcon(): IconSettingType {
    return this._inherit.arrowIcon && this._parent?.getArrowIcon() || this._arrowIcon;
  }
  getDefaultCheckableIcon(type:'checkbox' | 'radio'): CheckableIconPair | undefined {
    let result;
    
    if( type === 'checkbox' && this._inherit.checkboxIcon || type === 'radio' && this._inherit.radioIcon )
      result = this._parent?.getDefaultCheckableIcon(type);
    result = result || this._checkablePairIcons[type];
    
    return result;
  }
  getAutoClose(): boolean {
    return typeof this._disableAutoClose === 'boolean' ? this._disableAutoClose : this._inherit.autoClose && this._parent ? this._parent.getAutoClose() : true; // true by default
  }
  getFontSize(): number | string | undefined {
    return this._fontSize ? this._fontSize : this._inherit.fontSize && this._parent ? this._parent.getFontSize() : undefined;
  }
  getFontFamily(): string | undefined {
    return this._fontFamily ? this._fontFamily : this._inherit.fontFamily && this._parent ? this._parent.getFontFamily() : undefined;
  }


  setArrowIcon(arrow: IconSettingType) {
    const before = this._arrowIcon;
    this._arrowIcon = arrow;
    this.fireMenuModelEvent('arrow', arrow, before);
    for( const item of this._items ) {
      if( !item.isSubmenu() )
        continue;
      item.setArrowIcon(arrow);
    }
  }
  setDefaultCheckableIcon(type:'checkbox' | 'radio', icon: CheckableIconPairParam) {
    this._checkablePairIcons[type] = convertCheckableIconPairParam(icon);
    //this.fireMenuModelEvent(type, arrow, before);
    for( const item of this._items ) {
      if( item.isSubmenu() ) {
        item.setDefaultCheckableIcon(type, icon);
      }
      else if( item.isCheckable() ) {
        item.updateCheckableIcon(true);
      }
    }
  }


  /*
   * manipulate MenuItems 
   */
  /*
  protected addItem(...items: MenuModel[]) {
    for( const item of items ) {
      //item.setIndex(this._items.length);
      this._items.push(item);
    }
    //this.table.appendChild(item.getElement());
  }
  */
  /**
   * enumerate items
   */
  each( callback: (item: MenuModelItem, index?:number) => void ) {
    const items = this._items;
    const len = items.length;
    for( let i = 0; i < len; i++ ) {
      const item = items[i];
      //item.setIndex(i);
      callback(item, i);
    }
  }
  getItem(index: number) {
    return this._items[index];
  }
  getItemCount(): number {
    return this._items.length;
  }
  getItemById(id: any) {
    for( var i=this._items.length; i--; ) {
      if( this._items[i].getId() === id )
        return this._items[i];
    }
    return null;
  }
  getItemsByName(name: string): _MenuCheckable[] {
    const list = [];
    for( const item of this._items ) {
      if( item.isCheckable() && item.getName() === name )
        list.push(item);
    }
    return list;
  }
  getPreItems() {
    return this._pre_items;
  }

  getCustomDialogClass(): string {
    return this._customDialogClass;
  }

  __setSystemUserEvent(handler: '_rootclose' | '_viewready', callback: UserEventListener) {
    switch(handler) {
      case '_rootclose':
        console.log("hooked _rootclose", "red")
        this._onrootclose = callback;
        break;
      case '_viewready':
        console.log("set _viewready");
        this._onviewready = callback;
        break;
    }
    
  }


  setGlobalEvent(handler: MenuGlobalEventNames, listener: UserEventListener | null) {
    const evobj = this._globalEvents = this._globalEvents || {};
    const key = ('on' + handler) as MenuGlobalEventNamesForUser;
    if( listener ) {
      evobj[key] = listener;
    }
    else
      delete evobj[key];
  }
  clearGlobalEvents() {
    this._globalEvents = null;
  }
  
  // system user events
  fireUserEvent(handler: '_rootclose' | '_viewready' | MenuItemUserEventNames, ctx:any, eventObj: MenuUserEventObject) {
    if( handler !== '_rootclose' && handler !== '_viewready' )
      return super.fireUserEvent(handler, ctx, eventObj);
    if( !this.isRoot() ) {
      console.log("PARENT EXISTS:" + handler, "RED")
      return;
    }
    
    switch(handler) {
      case '_rootclose':
        console.log('fire onrootclose', "yellow");
        this._onrootclose?.(eventObj, ctx);
        break;
      case '_viewready':
        console.log('fire onviewready', "yellow");
        this._onviewready?.(eventObj, ctx);
        break;
    }
  }

  dispose() {
    super.dispose();
    for( const item of this._items ) {
      item.dispose();
    }
    this._items = [];

    for( const item of this._pre_items ) {
      item.dispose();
    }
    this._pre_items = [];
  }
}

/**
 * EXPERIMENTAL:
 * @class MenuPopup
 * @extends {MenuSubmenu}
 */
class MenuPopup extends MenuSubmenu {
  private _pos: PopupPosition;
  private _exclusive: boolean = true;
  
  constructor(param: MenuItemPopupParameter, parent?: MenuSubmenu, demanded?: boolean) {
    super(param, parent, demanded);
    const {base = 'all', posX = 'x-center', posY = 'y-center', marginX = 0, marginY = 0} = param.pos || {};
    this._pos = {base, posX, posY, marginX, marginY};
  }

  getPosObject() {
    return this._pos;
  }
}

// the purpose of this is to reuse a controller as a model directly
abstract class _MenuModelable {
  abstract getModel(): MenuSubmenu;
}


type MenuModelItem = MenuNormal | MenuSeparator;

export {MenuModelItem, MenuSubmenu, PopupPosition};
export {IconSettingType}
export {MenuItemParameter, MenuItemSubmenuParameter, MenuItemCreateParameter, MenuItemCreateParameterList};
export {MenuItemTypes, MenuItemFlagsType}
export {MenuItemUserEventNames, MenuUserEventObjectModel, MenuGlobalEventNames}
export {_MenuModelable, UserEventListener}
