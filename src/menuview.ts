import { EventAttacher, IE_Version, console } from "./utils";
import { VirtualDOMNode, VirtualNodeUpdater } from "./vnode";
import { IconSettingType, MenuItemTypes, MenuItemFlagsType } from "./menumodel";

// load base HTML text for the modeless dialogs
import BASE_HTML from "../res/dialog-base.html";
// load menu HTML structure as JSON
import MENU_CONTAINER_JSON from "../res/menu-container.html.json";
import ITEM_DEFAULT_JSON from "../res/item-default.html.json";
import ITEM_UNION_JSON from "../res/item-union.html.json";
import ITEM_SEPARATOR_JSON from "../res/item-separator.html.json";




// essential vnode selectors
const ESLCT_CONTAINER = {
  CONTAINER: '#container1',
  CONTAINER_TABLE: '#menu-table-container',
} as const;
const ESLCT_ITEM = {
  ICON: '.icon',
  ICON_CONTAINER: '.icon-container',
  CONTENT: '.content',
  CONTENT_CONTAINER: '.content-container',
  ARROW: '.arrow',
  ARROW_CONTAINER: '.arrow-container',
} as const;
const ESLCT_ITEM_LIST: string[] = [];
for( const p in ESLCT_ITEM ) {
  ESLCT_ITEM_LIST.push( ESLCT_ITEM[p as keyof typeof ESLCT_ITEM] );
}


// custom user css classes (by "customClass" parameter) are preceded by the prefix
const CustomClassPrefix = 'custom_';





type TransTypes = 'highlight' | 'checked' | 'radio-checked' | 'checkbox-checked' | 'activate' | 'open';
type TransTargets = {
  [key in TransTypes]?: {
    direction: 'to' | 'from' | 'change'
    target: string // target element's single selector (e.g. "#container" or ".content")
  }[]
};

type MenuViewDialogStatFlagType = {
  [key: string]: boolean
};
type MenuViewItemStatFlagType = {
  [key in TransTypes]?: boolean
};


abstract class _ViewBase<TView> {
  private static _ViewListWaitingToUpdate: {
    [uid: string]: {
      view: _ViewBase<any>
      flagNames: {
        [flagName: string]: {
          flag: boolean
          ontransitionend?: Function
        }
      }
      /*
      flags: {
        [flagName: string]: boolean
      }
      */
    }
  } = {};
  
  /**
   * add queues of updating View's class and transition each time before executing VirtualNodeUpdater
   *
   * @static
   * @param {VirtualNodeUpdater} vupdater
   * @memberof _ViewBase
   */
  static hookVnodeUpdater(vupdater: VirtualNodeUpdater) {
    vupdater.addListener('before', () => {
      //console.log('<=== viewsWaitingToUpdate ====', 'blue');
      const list = _ViewBase._ViewListWaitingToUpdate;
      for( const uid in list ) {
        const {view, flagNames} = list[uid];
        const waitingAfterLoad = view.isBeWaitingAfterLoad();
        
        for( const flagName in flagNames ) {
          const item = flagNames[flagName];

          if( waitingAfterLoad ) {
            if( flagName !== 'afterload' && flagName !== 'load' ) {
              continue;
            }
            delete flagNames[flagName];
            if( flagName === 'afterload' )
              view.clearWaitingAfterLoad();
          }
          if( !view.isAvailable() ) {
            // consume ontransitionend callback here
            item.ontransitionend?.();
            continue;
          }
          view.setClassAndTransitions(flagName, item.flag, item.ontransitionend);
        }

        if( !waitingAfterLoad )
          delete list[uid];
      }
      //console.log('==========================>', 'blue');
    });
  }

  readonly uid: string;
  private _statFlags: TView extends MenuItemView ? MenuViewItemStatFlagType : MenuViewDialogStatFlagType = {};
  
  protected abstract _mainNode: VirtualDOMNode;
  protected abstract _disposed: boolean;

  protected abstract $L(): string;
  protected abstract getLayer(): number;
  protected abstract _getTransTargets(): TransTargets;
  protected abstract isBeWaitingAfterLoad(): boolean;
  protected abstract clearWaitingAfterLoad(): void;

  constructor() {
    this.uid = 'VIEW_UID_' + _CommonUniqueCounter++;
  }
  
  protected _selectorBank: { [key: string]: VirtualDOMNode } = {};
  protected _getVNode(selector: string): VirtualDOMNode | null {
    const vnode = this._selectorBank[selector] || null;
    if( !vnode ) {
      // throw new Error(`unexpected selector "${selector}"`);
      console.log(`unexpected selector "${selector}"`, 'red');
    }
    
    return vnode;
  }
  isAvailable() {
    return !this._disposed;
  }
  private _checkIfViewFlagIsInUpdatingList(flagName: string) {
    return typeof _ViewBase._ViewListWaitingToUpdate[this.uid]?.flagNames[flagName]?.flag === 'boolean';
  }
  private _addViewFlagUpdatingList(flagName: string, flag: boolean, ontransitionend?: Function) {
    // if the flagName is already in the update list, that means the flag is reverted back to the original state before being updated. so remove it from the list.
    if( this._checkIfViewFlagIsInUpdatingList(flagName) ) {
      this._removeViewFlagUpdatingList(flagName);
      return;
    }

    const vupdateItem = _ViewBase._ViewListWaitingToUpdate[this.uid] || {
      view: this,
      //flags: {},
      flagNames: {},
    };
    //vupdateItem.flags[flagName] = flag;
    vupdateItem.flagNames[flagName] = {
      flag,
      ontransitionend
    };

    _ViewBase._ViewListWaitingToUpdate[this.uid] = vupdateItem;
    
    VNodeUpdater.hook();
  }
  private _removeViewFlagUpdatingList(flagName: string) {
    delete _ViewBase._ViewListWaitingToUpdate[this.uid]?.flagNames[flagName];
  }

  setViewFlag(flagName: keyof (TView extends MenuItemView ? MenuViewItemStatFlagType : MenuViewDialogStatFlagType), flag: boolean, ontransitionend?: Function) {
    console.log(`${this.$L()}#setViewFlag "${String(flagName)}" : ${flag}`, 'darkcyan');
    if( Boolean(this._statFlags[flagName]) !== flag ) {
      this._statFlags[flagName] = flag as any;
      this._addViewFlagUpdatingList(String(flagName), flag, ontransitionend);
    }
    else {
      ontransitionend?.();
    }
  }
  getViewFlag(flagName: keyof (TView extends MenuItemView ? MenuViewItemStatFlagType : MenuViewDialogStatFlagType)): boolean {
    return Boolean(this._statFlags[flagName]);
  }
  /*
  // simply disable the flag and remove its related classes from the view without transitions
  deleteViewFlag(flagName: keyof MenuViewItemStatFlagType, vnode?: VirtualDOMNode) {
    console.log(`${this.$L()}#removeViewFlag "${flagName}"`, 'darkcyan');
    
    const velement = vnode || this._mainNode;
    this._statFlags[flagName] = false;
    this._removeViewFlagUpdatingList(flagName);
    velement.removeClass(`${flagName} trans-to-${flagName} trans-from-${flagName}`);
  }
  */
  setClassAndTransitions(className: string, flag: boolean, ontransitionend?: Function) {
    let velement = this._mainNode;
    console.log(`${this.$L()}#setClassAndTransitions "${className}" : ${flag} (${velement.label})`, 'darkcyan');
    
    // direction
    const [addDir, removeDir] = flag ? ['to', 'from'] : ['from', 'to'];

    // check transition target elements
    let transTargetCount = 0;
    let transEndedCount = 0;
    const transTargets = this._getTransTargets()[className as TransTypes];
    console.log(transTargets, 'purple');
    if( transTargets ) {
      // remove all transition classes beforehand
      velement.removeClass(`trans-${removeDir}-${className} trans-${addDir}-${className}`);

      // parse elements to apply transition filters
      for( const item of transTargets ) {
        if( item.direction !== addDir )
          continue;
        const transTargetNode = this._getVNode(item.target); // VNode
        if( transTargetNode ) {
          console.log(`${this.$L()} trans-${addDir}-${className} ${item.target}`, 'darkcyan');
          transTargetCount++;
          
          let callback;
          if( ontransitionend || addDir === 'from' ) {
            // execute the callback when all transitions are finished
            callback = () => {
              if( ++transEndedCount === transTargetCount ) {
                ontransitionend?.();
                //console.log(`${this.$L()} completed! trans-${addDir}-${className}${item.target} (${transEndedCount} / ${transTargetCount})`, 'cyan');
                
                // HACK: remove "trans-from-***" class from the element when its transition ends.
                // need to find a more elegant way.
                if( addDir === 'from' ) {
                  velement!.removeClass(`trans-${addDir}-${className}`);
                  VNodeUpdater.update(velement!);
                }
              }
              else {
                //console.log(`${this.$L()} ended trans-${addDir}-${className}${item.target} (${transEndedCount} / ${transTargetCount})`, 'cyan');
              }
            };
          }

          VNodeUpdater.apply(transTargetNode);
          VNodeUpdater.play(transTargetNode, callback);
        }
      }
      
      if( ontransitionend ) {
        console.log(`${this.$L()} trans-${addDir}-${className} trans-targets: ${transTargetCount}`, 'cyan');
      }
    }

    // add transition classes
    if( transTargetCount > 0 ) {
      velement.addClass(`trans-${addDir}-${className}`);
      VNodeUpdater.update(velement);
    }
    // directly execute the ontransitionend callback when no transitions exist
    else {
      ontransitionend?.();
    }
    
    // queue the changed class. it will be applied after apply() and play() if transitions exist.
    velement.queueClass(className, flag);
    VNodeUpdater.consumeQueuedClass(velement);
  }

  flashHighlight(ftime: number, onendflashing?: Function) {
    const startTime = new Date().getTime();
    const callback = () => {
      let dtime = 70;
      if( !this._checkIfViewFlagIsInUpdatingList('highlight') ) {
        const flag = !this.getViewFlag('highlight');
        this.setViewFlag('highlight', flag);
      }
      else {
        dtime = 0;
      }
      if( new Date().getTime() - startTime < ftime ) {
        setTimeout(callback, dtime);
        return;
      }
      
      // end flashing
      this.setViewFlag('highlight', true);
      onendflashing?.();
    };
    callback();
  }

  dispose() {
    // clear selector bank
    const bank = this._selectorBank;
    for( const selector in bank ) {
      const vnode = bank[selector];
      if( vnode.isLinkedRealElement() )
        vnode.dispose();
    }
    delete _ViewBase._ViewListWaitingToUpdate[this.uid];
  }
}

/**
 * modeless dialogs
 * @class MenuDialog
 */
class MenuDialogView extends _ViewBase<MenuDialogView> {
  private _win: MSWindowModeless;
  private _doc: Document;
  //private _containerElement!: HTMLElement;
  //private _tableElement!: HTMLTableElement;
  //private _tableContainerElement!: HTMLElement;

  protected _mainNode!: VirtualDOMNode;
  private _vdoc!: VirtualDOMNode;
  private _vbody!: VirtualDOMNode;
  private _vmenutable: VirtualDOMNode;
  private _vcontainer!: VirtualDOMNode;
  private _vtablecontainer!: VirtualDOMNode;
  
  private _transTargetsForContainer: TransTargets = {};
  private _transTargetsForItems: TransTargets = {};

  // status
  protected _disposed = false;
  private _appeared = false; // whther its coordinate are set to the available screen

  private _items: MenuItemView[] = [];
  private _indexByUniqueId: {[key:string]: MenuItemView} = {};

  private _evaWin: EventAttacher;
  private _evaDoc: EventAttacher;
  private _styleSheet!: CSSStyleSheet;
  private _activeStyleSheet?: CSSStyleSheet;

  private _calculatedTableItemMargin = {
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    tableClientLeft: 0,
    tableClientTop: 0,
  };

  private _layer = 0;
  private _SkinSystemSettings: {
    // "submenu-dialog-margin" - number
    'submenu-dialog-right-margin'?: number
    'submenu-dialog-left-margin'?: number
    
    // "tweak-animated-gif-suffix" - RegExp
    // * Animated gifs don't work properly on Trident engine(IE9 or later) with multiple dialogs.
    //   Appending random suffix on their url fixes the problem. (e.g. "hoge.gif?424981434")
    'tweak-animated-gif-suffix'?: boolean
    
    'wait-afterload'?: boolean

    empty?: boolean
  } = {};
  
  constructor(itemNumber: number, parent?: MenuDialogView | null, customClass?: string, specifiedParentWindow?: Window) {
    super();
    this._layer = parent ? parent._layer + 1 : 0;

    this._vmenutable = new VirtualDOMNode('table', {id:'menu-table', border:0, cellSpacing:0, cellPadding:0}, '#menu-table');

    this._win = this._initializeDialog(itemNumber, specifiedParentWindow || parent?.win(), customClass);
    this._doc = this._win.document;
    this.setDocumentClass('topmost');

    this._evaWin = new EventAttacher(this._win);
    this._evaDoc = new EventAttacher(this._doc);

  }

  private _initializeDialog(itemNumber: number, parentWin?: Window, customClass?: string): MSWindowModeless {
    console.log(`${this.$L()}#_initializeDialog`, 'darkcyan');
    
    // if less than IE6, always use root window as a context since invoking showmodelessDialog() from modelessDilaog's window doesn't work properly.
    const contextWin = IE_Version.MSIE >= 6 && parentWin || window;

    // create a modeless dialog
    let wintest: MSWindowModeless;
    wintest = contextWin.showModelessDialog('about:<body onkeydown="return false">', null, 'dialogWidth:0px; dialogHeight:0px; dialogLeft:-100000px; dialogTop:-100000px; resizable:0; unadorned:1; scroll:0;');
    wintest.document.write(BASE_HTML);
    wintest.document.close();

    const win = wintest;
    const doc = win.document;
    this._win = win;
    this._doc = doc;
    
    this._initializeStyleSheet();
    
    // generate random number classes
    const rnd100Classes = getNumericClassesByNumber((Math.random()*100 |0) + 1, 'rnd100-');
    const rnd50Classes = getNumericClassesByNumber((Math.random()*50 |0), 'rnd50-');
    const rnd10Classes = getNumericClassesByNumber((Math.random()*10 |0) + 1, 'rnd10-');
    
    // construct container
    this._vbody = new VirtualDOMNode(doc.body, {'class': ['body', 'beforeload'].join(' ')}, 'body');
    this._mainNode = this._vbody;

    this._vcontainer = createVirtualNodeByJSON(MENU_CONTAINER_JSON, this._selectorBank);
    //doc.body.innerHTML = this._vcontainer.toString();
    this._vbody.append(this._vcontainer);
    this._vbody.updateRealElement(true);

    //this._vcontainer.linkRealElement(doc.getElementById('container1')!);
    this._vtablecontainer = this._getVNode(ESLCT_CONTAINER.CONTAINER_TABLE)!;
    if( !this._vtablecontainer )
      throw new Error(`could not find ${ESLCT_CONTAINER.CONTAINER_TABLE}. something went wrong.`);
    //this._tableContainerElement = this._vtablecontainer.getRealElement(true)!;

    this._vtablecontainer.linkRealElementFromParent();
    this._vtablecontainer.append(this._vmenutable);
    
    // create classes for documentElement
    const layerNumClasses = getNumericClassesByNumber(this._layer+1, 'layer-');
    const itemNumClasses = getNumericClassesByNumber(itemNumber, 'index-');
    
    const docClass = ['layer', layerNumClasses, itemNumClasses, rnd10Classes, rnd50Classes, rnd100Classes];
    if( customClass )
      docClass.push(CustomClassPrefix + customClass);
    this._vdoc = new VirtualDOMNode(doc.documentElement, {'class': docClass.join(' ')}, '<documentElement>');
    
    //VNodeUpdater.update([this._vbody, this._vdoc]);

    return win;
  }

  private _initializeStyleSheet() {
    if( this._styleSheet )
      return;
    
    let newSS = this._doc.createStyleSheet(undefined, 1);
    //this._styleSheet = newSS;
    /*
    if( baseSS ) {
      // IE6's createStyleSheet creates ss at index 0(low priority). so switch old CSS with new one.
      if( IE_Version.real <= 6 ) {
        //newSS.cssText = baseSS.cssText;
        //[newSS.cssText, baseSS.cssText] = [baseSS.cssText, newSS.cssText];
        newSS = baseSS;
        //newSS.cssText = '';
      }
    }
    */
    this._styleSheet = newSS;//this._doc.styleSheets[1] as CSSStyleSheet;
    this._activeStyleSheet = newSS;
    return newSS;
  }
  // need to calculate correct margins after rendering
  initLayout() {
    console.log(`${this.$L()}#initLayout`, 'darkcyan');
    this._calculateTableItemMargin();
  }

  loadStyleSheet(path: string) {
    if( /^.+:\/\//.test(path) )
      throw new Error(`only local files are allowed for StyleSheet: "${path}"`);
    
    this._styleSheet.addImport(path);
    this._activeStyleSheet = this._styleSheet.imports[this._styleSheet.imports.length - 1] as CSSStyleSheet;
    
    const cssText = this._activeStyleSheet.cssText;
    this._SkinSystemSettings.empty = /^\s*$/.test(cssText);
    this._parseTransitionTargetsFromCSS(cssText);
    this._parseSystemSettingsFromCSSText(cssText);
  }
  removeStylSheet(index?: number) {
    this._styleSheet.removeImport(index || 0);
  }
  setCSSText(cssText: string, getSettings: boolean = false) {
    console.log(`${this.$L()}#setCSSText`, 'darkcyan');
    this._styleSheet.cssText += '\r\n' + cssText;
    
    if( getSettings ) {
      const txt = this._styleSheet.cssText;
      this._parseTransitionTargetsFromCSS(txt);
      this._parseSystemSettingsFromCSSText(cssText);
    }
  }
  setMenuFontSize(fontSize: number | string) {
    this._vmenutable.addStyle(`font-size: ${fontSize}`);
    VNodeUpdater.update(this._vmenutable);
  }
  setMenuFontFamily(fontFamily: string) {
    this._vmenutable.addStyle(`font-family: ${fontFamily}`);
    VNodeUpdater.update(this._vmenutable);
  }
  clearStyleSheet() {
    console.log(`${this.$L()}#clearStyleSheet`, 'darkcyan');
    this._styleSheet.cssText = '';
    this._activeStyleSheet = this._styleSheet;
    //this._styleSheet.cssText = '';
  }
  // append layer number to the url if it ends with "?"
  tweakAnimatedGIFSuffix(suffix?: string) {
    const cssText = this._activeStyleSheet?.cssText;
    if( cssText ) {
      //suffix = suffix || '-a\\.gif';
      try {
        //const re = RegExp('(\\burl\\([^)]+?' + suffix + ')', 'gi');
        //this._activeStyleSheet!.cssText = cssText.replace(re, '$1' + '?' + this._layer);
        const re = RegExp('(:\\s*url\\([^)]+?\\?)\\s*\\)', 'gi');
        this._activeStyleSheet!.cssText = cssText.replace(re, '$1' + this._layer + ')');
      } catch(e) {
        alert(e);
      }
    }
  }
  private _parseTransitionTargetsFromCSS(cssText: string) {
    console.log(`${this.$L()}#setTransitionTagetsByCSS`, 'darkcyan');
    const forContainer: TransTargets = {};
    const forItem: TransTargets = {};

    const checkDup = {} as any;
    cssText.replace(/\.trans-(to|from)-([\w\-]+?)(?:\s+[^,{\s]+)*\s+[a-z]*([.#])([\w\-]+)/ig, function(m, direction:string, name:string, targetType:string, target:string) {
      const className = name.toLowerCase() as TransTypes;
      direction = direction.toLowerCase();
      target = target.toLocaleLowerCase();

      const selector = targetType + target;
      const item = {
        direction,
        target: selector,
      };
      
      // detect only one pair of transition target and class
      const id = `{${className}@${direction}@${selector}}`;
      console.log(id);
      if( !checkDup[id] ) {
        const type = targetType === '.' ? forItem : forContainer;
        const list: typeof item[] = type[className] = type[className] || [];
        list.push(item);
        checkDup[id] = true;
      }

      return m;
    });

    console.log(forContainer, 'purple');
    console.log(forItem, 'purple');
    this._transTargetsForContainer = forContainer;
    this._transTargetsForItems = forItem;
  }
  _getTransTargets(flagForItem: boolean = false) {
    return !flagForItem ? this._transTargetsForContainer : this._transTargetsForItems;
  }
  private _parseSystemSettingsFromCSSText(cssText: string) {
    // clear current settings
    const settings = this._SkinSystemSettings;

    // parse setting fields from the css text
    const fields: { [key: string] : {[key:string]:string | number} } = {};
    cssText.replace(/(?:^|\s)#system---(\w[^{\s]*?)\s*\{([^\}]*)\}/ig, function(m, name:string, rules:string) {
      const item: {[key:string]: string | number} = fields[name.toLowerCase()] = {};
      rules.replace(/\b([\-\w]+)\s*:\s*(?:(-?\d+)|url\(([^)\s]+)\)|(\w+))/ig, function(m, name:string, valNum:string, valUrl:string, valStr:string) {
        item[name.toLowerCase()] = valNum ? Number(valNum) : (valUrl || valStr).toLowerCase();
        return m;
      });
      return m;
    });

    // store the settings
    for( const field in fields ) {
      switch( field ) {
        // "submenu-dialog-margin" - number
        case 'submenu-dialog-margin':
          let margin = fields[field]?.['margin-left'];
          if( typeof margin === 'number' )
            settings['submenu-dialog-left-margin'] = margin;
          
          margin = fields[field]?.['margin-right'];
          if( typeof margin === 'number' )
            settings['submenu-dialog-right-margin'] = margin;
          break;
        
        // "tweak-animated-gif-suffix"
        // * Animated gifs don't work properly on Trident engine(IE9 or later) with multiple dialogs.
        //   Appending random suffix on their url fixes the problem. (e.g. "hoge.gif?424981434")
        case 'tweak-animated-gif-suffix':
          settings[field] = true;
          if( IE_Version.real >= 9 ) {
            this.tweakAnimatedGIFSuffix();
          }
          break;
        // 'wait-afterload'
        //  wait to set viewflags until "afterload" class is appended to body tag
        case 'wait-afterload':
          settings[field] = true;
          this._waitingAfterLoad = true;
          break;
      }
    }
  }

  getSubmenuMarginSettingFromCSS(dir: 'left' | 'right' = 'right') {
    return this._SkinSystemSettings[`submenu-dialog-${dir}-margin`];
  }
  isEmptyCSS() {
    return this._SkinSystemSettings.empty;
  }

  private _calculateTableItemMargin() {
    const container = this._vcontainer.getRealElement()!; //this._containerElement;
    const table = this._vmenutable.getRealElement()!; //this._tableElement;
    
    let node: HTMLElement = table;
    let marginLeft = 0;
    let marginTop = 0;
    let marginBottom = 0;
    let marginRight = 0;

    do {
      marginLeft += node.offsetLeft + node.clientLeft;
      marginTop += node.offsetTop + node.clientTop;
      node = node.offsetParent as HTMLElement;
    } while( node && node !== this._doc.body )

    this._calculatedTableItemMargin = {
      left: marginLeft,
      right: container.offsetWidth - table.clientWidth - marginLeft,
      top: marginTop,
      bottom: container.offsetHeight - table.clientHeight - marginTop,
      
      tableClientLeft: table.clientLeft,
      tableClientTop: table.clientTop,
    };

    console.log(this.getItemMargin(), "purple");
  }
  getItemMargin() {
    return this._calculatedTableItemMargin;
  }

  getDoc() {
    return this._doc;
  }
  getLayer() {
    return this._layer;
  }
  focus() {
    VNodeUpdater.callback(() => this._win.focus());
  }
  
  setDocumentClass(cstring: string, flag = true, immediate = false) {
    flag? this._vdoc.addClass(cstring) : this._vdoc.removeClass(cstring);
    immediate? this._vdoc.updateRealElement() : VNodeUpdater.update(this._vdoc);
  }

  createTableViewItems(itemParams: UpdateItemType[]): MenuItemView[] {
    console.log(`${this.$L()}#createTableViewItems`, 'darkcyan');
    const viewItemList: MenuItemView[] = [];
    let index = 0;
    for( const param of itemParams ) {
      const item = new MenuItemView(this, param, index++);
      this._vmenutable.append(item.getVirtualElement());
      viewItemList.push(item);
    }
    
    // construct a whole menu table
    console.time('putHTMLTable');
    this._vtablecontainer.updateRealElement(true);
    // link real table elements
    this._vmenutable.linkRealElementFromParent();
    
    console.timeEnd('putHTMLTable');
    
    // set events
    for( let i=0; i < viewItemList.length; i++ ) {
      viewItemList[i].prepareRealElements();
    }

    return viewItemList;
  }

  getMenuElementByUniqueId(id: string): MenuItemView | null {
    return this._indexByUniqueId[id] || null;
  }

  addWindowEvent(name: string, handler: EventListener) {
    this._evaWin.attach(name, handler);
  }
  removeWindowEvent(name: string, handler: EventListener) {
    this._evaWin.detach(name, handler);
  }
  addDocumentEvent(name: string, handler: EventListener) {
    this._evaDoc.attach(name, handler);
  }
  removeDocumentEvent(name: string, handler: EventListener) {
    this._evaDoc.detach(name, handler);
  }

  doc(): Document {
    return this._doc as Document;
  }
  win(): MSWindowModeless {
    return this._win as MSWindowModeless;
  }
  hasFocus(): boolean {
    return !!this._doc?.hasFocus();
  }
  
  getContentSize(): {width:number, height:number};
  getContentSize(callback?: Function): void;
  getContentSize(callback?: Function) {
    console.log(`${this.$L()}#getContentSize`, 'darkcyan');
    
    // synchronous
    if( !callback ) {
      VNodeUpdater.process();
      const container = this._vcontainer.getRealElement();
      return {
        width: Number(container?.offsetWidth) || 0,
        height: Number(container?.offsetHeight) || 0,
      };
    }

    // asynchronous
    VNodeUpdater.callback(() => {
      const container = this._vcontainer.getRealElement();
      callback({
        width: Number(container?.offsetWidth) || 0,
        height: Number(container?.offsetHeight) || 0,
      });
    });
  }
  getDialogPosition(): ClientRect {;
    const rect: ClientRect = {
      width: parseInt(this._win.dialogWidth, 10) || 0,
      height: parseInt(this._win.dialogHeight, 10) || 0,
      left: parseInt(this._win.dialogLeft, 10) || 0,
      top: parseInt(this._win.dialogTop, 10) || 0,
      right: 0,
      bottom: 0,
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;

    return rect;
  }
  resizeDialog( w: number, h: number ) {
    console.log(`${this.$L()}#resizeDialog: `+[w,h], 'darkcyan');
    VNodeUpdater.callback(() => {
      try {
        if( !this._win )
          throw new Error('no dialog window');
        this._win.dialogWidth = w + 'px';
        this._win.dialogHeight = h + 'px';
        
        return true;
      } catch( e: any ) {
        alert(e.description);
        return false;
      }
    });
  }
  moveDialog(x?:number, y?:number) {
    console.log(`${this.$L()}#moveDialog: `+[x, y], 'darkcyan');
    VNodeUpdater.callback(() => {
      if( !this._win )
        return;
      if( typeof x === 'number' )
        this._win.dialogLeft = x + 'px';
      if( typeof y === 'number' )
        this._win.dialogTop = y + 'px';
      
      if( x as number >= 0 || y as number >= 0 ) {
        if( !this._appeared )
          this._appeared = true;
      }
    });
  }
  adjustDialog(x?: number, y?: number) {
    const {width: cw, height: ch} = this.getContentSize();
    console.log(`${this.$L()}#adjustDialog ${[cw, ch]}`, 'darkcyan');
    this.moveDialog(x, y);
    this.resizeDialog(cw, ch);
  }

  isReadyToUse() {
    return !this._disposed && this._appeared;
  }
  checkExistence() {
    try {
      return (this._win as any)?._this_is_meaningless_property_ || true;
    } catch(e) {
      return false;
    }
  }

  setLoad() {
    console.log(`${this.$L()}#setBodyLoadTransition`, 'darkcyan');
    this.setViewFlag('load', true, () => {
      this._vbody.removeClass('beforeload');
      this.setViewFlag('afterload', true);
    });
  }
  setBodyViewFlagByItem(flagName: string, flag: boolean, itemIndex: number, customClasses: string[]) {
    console.log(`${this.$L()}#setBodyViewFlag ${flagName} ${flag} ${itemIndex}`, 'darkcyan');
    
    //this.setClassAndTransitions(flagName, flag);
    this.setViewFlag(flagName, flag);
    
    // set numelic classes
    const numelics = getNumericClassesByNumber(itemIndex, flagName+'-').split(' ');
    for( const numclass of numelics ) {
      //this.setClassAndTransitions(numclass, flag);
      this.setViewFlag(numclass, flag);
    }

    // set for custom classes
    for( const cclass of customClasses ) {
      //this.setClassAndTransitions(flagName + '-' + CustomClassPrefix + cclass, flag);
      this.setViewFlag(flagName + '-' + CustomClassPrefix + cclass, flag);
    }
  }
  
  private _waitingAfterLoad = false;
  isBeWaitingAfterLoad() {
    return this._waitingAfterLoad;
  }
  clearWaitingAfterLoad() {
    this._waitingAfterLoad = false;
  }

  dispose() {
    if( this._disposed ) // already disposed
      return;
    this._disposed = true;
    
    VNodeUpdater.callback(() => this._dispose());
  }
  private _dispose() {
    super.dispose();

    try {
      this._evaDoc.dispose();
      this._evaWin.dispose();
      for( const item of this._items ) {
        item.dispose();
      }
    } catch(e: any) {
      DEV: {
        alert(`an error occured during detaching view events\n` + e.message);
      }
    }

    this._items.length = 0;

    this._evaDoc = null as any;
    this._evaWin = null as any;
    
    //this._containerElement = null as any;
    
    this._vdoc.dispose();
    this._vbody.dispose();
    this._vcontainer.dispose();
    this._vmenutable.dispose();
    this._vtablecontainer.dispose();

    this._doc = null as any;

    // occasionally cause error on Win98SE IE v6 or lower
    if( IE_Version.OS as any === 98 ) {
      let retry = 3;
      let _win = this._win;
      (function retryClose(){
        setTimeout(()=>{
          try {
            _win.close();
            _win = null as any; 
          } catch(e) {
            if( retry-- )
              retryClose();
          }
        }, 1000);
      })();
    }
    else
      this._win.close();

    this._win = null as any;
  }
  static hookBeforeUpdate(callback: Function) {
    VNodeUpdater.addListener('before', callback);
  }
  static hookAfterUpdate(callback: Function) {
    VNodeUpdater.addListener('after', callback);
  }
  $L() {
    return `L(${this._layer})`;
  }
}











type UpdateItemType = {
  type: MenuItemTypes,
  label?: string | void
  icon?: IconSettingType
  arrow?: IconSettingType
  flags?: MenuItemFlagsType

  classNames?: string[]
  itemNumber?: number // menu index except separators; start with 1
  index?: number // menu index include separators; start with 0
};
/**
 * Menu items
 * @class MenuElement
 */
class MenuItemView extends _ViewBase<MenuItemView> {
  private _container: MenuDialogView

  protected _mainNode!: VirtualDOMNode;
  private _vrow!: VirtualDOMNode;

  private _eva!: EventAttacher
  protected _disposed = false;
  //private _filter: DHTMLFilter;
  private _index = -1;
  private _itemNumber = -1;

  constructor(dialog: MenuDialogView, updateParam: UpdateItemType, index: number) {
    super();
    this._container = dialog;
    this._index = index;
    
    //console.time('trElement');
    //this._trElement = this._createElement(updateParam) as HTMLTableRowElement;
    //console.timeEnd('trElement');

    this._vrow = this._createVirtualNodes(updateParam);
    this._mainNode = this._vrow;
    //console.log(this._vrow.toString(), "red");

    //this._eva = new EventAttacher(this.toElement(), this);
    
    //console.time('update');
    //this.update(updateParam);
    //console.timeEnd('update');

    this.update(updateParam);

    //this._filter = new DHTMLFilter(this._element);
    //this._filter.setLayout("relative")
  }
  
  /**
  * use virtual DOM nodes because interacting with elements in another windows is terribly slow.
  */
  private _createVirtualNodes({type, label, classNames, itemNumber, index, flags:{union} = {}}:UpdateItemType): VirtualDOMNode {
    this._itemNumber = itemNumber as number;
    //const vtr = new VirtualDOMNode('tr', undefined, 'tr_index_'+this._index);

    // decide base structure for the <TR> by type
    let rawType: any;
    if( type === 'separator' )
      rawType = ITEM_SEPARATOR_JSON;
    else if( union )
      rawType = ITEM_UNION_JSON;
    // default
    else {
      rawType = ITEM_DEFAULT_JSON;
    }
    // create VNode based on each JSON object
    const vitem = createVirtualNodeByJSON(rawType, this._selectorBank, itemNumber);

    // add class name by type
    vitem.addClass(type);
    if( type === 'checkbox' || type === 'radio' ) {
      vitem.addClass('checkable');
    }

    // set user custom class
    if( classNames ) {
      for( const cname of classNames ) {
        vitem.addClass(CustomClassPrefix + cname);
      }
    }

    // set number classes
    if( typeof itemNumber === 'number' ) {
      const numclasses = getNumericClassesByNumber(itemNumber, 'menuitem-');      
      vitem.addClass(numclasses);
    }

    if( typeof index === 'number' ) {
      vitem.addClass('index-' + index);
    }
    
    
    return vitem;
  }
  getVirtualElement(): VirtualDOMNode {
    return this._vrow;
  }
  prepareRealElements() {
    this._eva = new EventAttacher(this._vrow.getRealElement(true)!, this);
  }
  updateVirtualNodes() {
    console.log(`${this.$L()}#updateRealElements`, 'darkcyan');
    //const priority = this.getLayer();
    //VNodeUpdater.update([this._vcell1_icon!, this._vcontentContainer, this._vcontentDecoContainer, this._viconContainer!, this._varrowContainer!], priority);
    const list: VirtualDOMNode[] = [];
    for( const s of ESLCT_ITEM_LIST ) {
      list.push(this._selectorBank[s]);
    }
    VNodeUpdater.update(list);
  }
  update({type, label, icon, arrow, flags:{unselectable, checked, disabled, html, usericon, nowrap}={}}: UpdateItemType) {
    console.log(`${this.$L()}#update label:${label} icon:${icon}`, 'darkcyan');
    switch(type) {
      case 'separator':
        return;
      case 'submenu':
        // set arrow icon
        if( arrow ) {
          //this._setIcon(arrow, this._varrowContainer);
          this._setIcon(arrow, this._selectorBank[ESLCT_ITEM.ARROW_CONTAINER]!);
        }
      default:
        // set icon
        if( typeof icon !== 'undefined' ) {
          if( typeof checked !== 'undefined' ) {
            /*
            // transition
            if( this._vcell1_icon!.isLinkedRealElement() ) {
              this.setItemClass('checked', checked, this._vcell1_icon!);
            }
            else {
              this._vcell1_icon?.[checked ? 'addClass' : 'removeClass']('checked');
            }
            
            this._vcell1_icon?.[!checked ? 'addClass' : 'removeClass']('unchecked');
            */
            
            const iconCell = this._getVNode(ESLCT_ITEM.ICON)!;
            iconCell[checked ? 'addClass' : 'removeClass']('checked');
            iconCell[!checked ? 'addClass' : 'removeClass']('unchecked');
            VNodeUpdater.update(iconCell);
            
            this.setViewFlag('checked', checked);
            if( type === 'radio' || type === 'checkbox' )
              this.setViewFlag(type+'-checked' as any, checked);
          }
          
          this._setIcon(icon);
        }

        if( typeof usericon !== 'undefined' ) {
          const iconCell = this._getVNode(ESLCT_ITEM.ICON)!;
          usericon ? iconCell.addClass('user-icon') : iconCell.removeClass('user-icon');
          VNodeUpdater.update(iconCell);
        }
        
        // set label
        if( typeof label !== 'undefined' ) {
          if( typeof nowrap === 'boolean') {
            // change white-space
            this._getVNode(ESLCT_ITEM.CONTENT)!.addStyle('white-space:' + (nowrap ? 'nowrap':'normal'));
          }
          this._getVNode(ESLCT_ITEM.CONTENT_CONTAINER)!.html(label, !html);
        }
        
        // set unselectable
        if( typeof unselectable === 'boolean' ) {
          this._vrow[unselectable ? 'addClass' : 'removeClass']('unselectable');
        }

        break;
    }
    
    // set disabled
    if( typeof disabled === 'boolean' ) {
      if( disabled )
        this._vrow.setAttribute('disabled', true);
      else
        this._vrow.removeAttribute('disabled');
      
      this._vrow[disabled ? 'addClass' : 'removeClass']('disabled');
    }
    
    this.updateVirtualNodes();
  }

  addEvent(name: string, handler: EventListener) {
    this._eva.attach(name, handler);
  }
  removeEvent(name: string, handler: EventListener) {
    this._eva.detach(name, handler);
  }

  private _setIcon(icon: IconSettingType, velement?: VirtualDOMNode) {
    console.log(`${this.$L()}#_setIcon`, 'darkcyan');
    //console.log(icon);
    if( !velement ) {
      velement = this._selectorBank[ESLCT_ITEM.ICON_CONTAINER];
      if( !velement ) {
        console.log(`${ESLCT_ITEM.ICON_CONTAINER} is not found`);
        return;
      }
    }
    
    let path = '';
    // image
    if( typeof icon === 'string' ) {
      path = icon;
      velement.html(`<img class="icon-img" src="${path}">`);
    }
    // image with size
    else if( 'path' in icon ) {
      path = icon.path;
      const width = icon.width && typeof icon.width === 'string' ? icon.width : Number(icon.width) + 'px';
      const height = icon.height && typeof icon.height === 'string' ? icon.height : Number(icon.height) + 'px';
      velement.html(`<img class="icon-img" style="${width? 'width:'+width+';':''}${height? 'height:'+height+';':''}" src="${path}">`);
    }
    // text
    else {
      const text = icon.text;
      const family = String(icon.fontFamily);
      const size = icon.fontSize && (typeof icon.fontSize === 'number' ? icon.fontSize + 'px' : String(icon.fontSize));
      velement.html(text);
      velement.setStyle(`${family ? `font-family:${family};` : ''}`);
      velement.addStyle(`${size ? `font-size:${size};` : 'font-size:130%;'}`);
      velement.addStyle(`visibility:${icon.blank ? 'hidden' : 'visible'}`);
      console.log(family+":"+size+":"+icon.blank, "cyan");
    }
  }

  _getTransTargets() {
    return this._container._getTransTargets(true);
  }

  getItemPosition(): ClientRect {
    const tr = this._vrow.getRealElement(true)!;
    const win = this._container.win();
    const width = tr.offsetWidth;
    const height = tr.offsetHeight;
    
    const margin = this._container.getItemMargin();
    //console.log(margin, 'yellow');
    const left = parseInt(win.dialogLeft || 0, 10) + tr.offsetLeft + tr.clientLeft + margin.left - margin.tableClientLeft;
    const top = parseInt(win.dialogTop || 0, 10) + tr.offsetTop + tr.clientTop + margin.top - margin.tableClientTop;

    //console.log(this._trElement.offsetLeft + "/"+this._trElement.clientLeft + "/"+margin.left, "lime")
    
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  }
  getLayer() {
    return this._container.getLayer();
  }
  getItemNumber() {
    return this._itemNumber;
  }

  $L() {
    return `${this._container.$L()}i[${this._index}]`;
  }
  isBeWaitingAfterLoad() {
    return this._container.isBeWaitingAfterLoad();
  }
  protected clearWaitingAfterLoad(): void {
    this._container.clearWaitingAfterLoad();
  }

  isAvailable() {
    return !this._disposed && this._container.isAvailable();
  }
  dispose() {
    if( !this._container || this._disposed )
      return;
    
    this._disposed = true;
    super.dispose();
    try {
      this._eva.dispose();
    } catch(e: any) {
      DEV: {
        alert(`an error occured during detaching view item events\n` + e.message);
      }
    }

    this._container = null as any;
    
    this._vrow!.dispose();
    for( const s of ESLCT_ITEM_LIST ) {
      this._selectorBank[s]?.dispose();
    }
  }
}



function createVirtualNodeByJSON(json: any, selectorBank: {[key:string]: VirtualDOMNode}, index?: number) {
  const attr = json.attr || {};
  const id = attr.id;
  const classes = (attr['class'] || '').split(' ');
  const vnode = new VirtualDOMNode(json.tag, attr, (id || attr.class || '') + (index as number >= 0 ? '_' + index : ''));

  let selector = id ? '#'+id : classes[0] ? '.' + classes[0] : '';
  if( selector )
    selectorBank[selector] = vnode;

  // parse childNodes
  const children = json.children || [];
  for( const child of children ) {
    vnode.append( createVirtualNodeByJSON(child, selectorBank, index) );
  }

  return vnode;
}

function getNumericClassesByNumber(num: number, prefix = '', suffix = ''): string {
  const numclasses: string[] = [String(num)];
  
  numclasses.push(num % 2 ? 'odd' : 'even');
  
  if( num > 0 ) {
    for( let i = 3; i <= 50; i++ ) {
      if( i > num )
        break;
      if( num % i === 0 )
        numclasses.push('multi' + i);
    }
  }

  return prefix + numclasses.join(suffix + ' ' + prefix) + suffix;
}




const VNodeUpdater = new VirtualNodeUpdater();
let _CommonUniqueCounter = 0;
_ViewBase.hookVnodeUpdater(VNodeUpdater);




export { MenuDialogView, MenuItemView, UpdateItemType };
