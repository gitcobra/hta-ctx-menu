import { MenuSubmenu, MenuModelItem, MenuItemSubmenuParameter, PopupPosition, IconSettingType, _MenuModelable } from "./menumodel";
import { MenuItemUserEventNames, MenuUserEventObjectModel, MenuGlobalEventNames, UserEventListener } from "./menumodel";
import { MenuDialogView, MenuItemView, UpdateItemType as UpdateViewItemType } from "./menuview";
import { Queue, EventAttacher, IE_Version, console } from "./utils";

import css_default from '../res/default.css';
import css_xp from '../res/xp.css';
import css_classic from '../res/classic.css';
import css_win7 from '../res/win7.css';
import css_win10 from '../res/win10.css';

type ViewPosition = {
  left:number
  top:number
  posX:PopupPosition["posX"]
  posY:PopupPosition["posY"]
  base:PopupPosition["base"]
};

const CLOSE_CHILD_MOUSEOUT_TIME = 1200;
const DblClick_Delay = 250;
let _CommonUniqueCounter = 0;

abstract class _RootController extends _MenuModelable {
  protected _locked = 0; // locked stack number
  protected _lastChild?: MenuContainerController;
  protected _enableOnlyLastChild: boolean = false;

  abstract open(...args:any): void
  
  setLocked(flag: boolean) {
    this._locked += (flag ? 1 : -1);
    //console.log(`#setLocked ${flag} (${this._locked})`, 'red');
    if( this._locked < 0 ) {
      console.log(`#setLocked cleared negative _locked count.`, 'red');
      this._locked = 0;
    }
  }
  isLocked(ctrl?: MenuContainerController): boolean {
    return !!this._locked || !!(this._enableOnlyLastChild && ctrl && ctrl !== this._lastChild);
  }
  setLastChild(ctrl: MenuContainerController) {
    this._lastChild = ctrl;
  }
  enableOnlyLastChild(flag: boolean = true) {
    this._enableOnlyLastChild = flag;
  }

  move(x:number, y:number) {

  }
  getRootController() {
    return this;
  }
  abstract close(): void
}

class MenuRootController extends _RootController {
  protected _model: MenuSubmenu;
  protected _ctrl: MenuContainerController | null = null;
  //private _locked: number = 0; // locked stack number
  protected _readyToUse = false;
  protected _isUpdatingView = false;
  protected _openedPos = {
    x: 0,
    y: 0,
  };

  constructor(param: MenuItemSubmenuParameter/*, inheritAttr?: MenuSubmenu*/) {
    super();
    this._model = new MenuSubmenu(param/*, inheritAttr, true*/);
    
    MenuDialogView.hookBeforeUpdate(() => {
      this.setLocked(true);
      this._isUpdatingView = true;
    });
    MenuDialogView.hookAfterUpdate(() => {
      this.setLocked(false);
      this._isUpdatingView = false;
    });
  }
  /**
   * create controller and view
   */
  open(x:number, y:number, ctx:any, parentWindow?: Window) {
    console.log('MenuRootController#open', 'yellow');
    if( this._locked )
      return;
    this.close();
    
    this._openedPos.x = x;
    this._openedPos.y = y;
    const ctrl = new MenuContainerController(this, ctx, {base:'screen', marginX:x, marginY:y}, parentWindow);
    if( ctrl?.getView() ) {
      this._ctrl = ctrl;
      this._readyToUse = true;
    }
  }
  /**
   * close View
   * @memberof MenuUserInterface
   */
  close() {
    console.log('MenuRootController#close', 'yellow');
    this._ctrl?.dispose();
  }
  isUpdatingView() {
    return this._isUpdatingView;
  }

  getLastPosition(): {x:number, y:number} {
    return { ...this._openedPos };
  }
  getRectangleOfWholeMenus(): ClientRect {
    let ctrl = this._ctrl;
    let minLeft = Number.POSITIVE_INFINITY;
    let minTop = Number.POSITIVE_INFINITY;
    let maxRight = -1;
    let maxBottom = -1;
    do {
      const pos = ctrl?.getView()?.getDialogPosition();
      if( !pos )
        break;
      
      const {left, top, width, height} = pos;
      if( left < minLeft )
        minLeft = left;
      if( top < minTop )
        minTop = top;
      if( maxRight < left + width )
        maxRight = left + width;
      if( maxBottom < top + height )
        maxBottom = top + height;

      ctrl = ctrl?.getChild() || null;
    } while(ctrl)

    return {
      top: minTop,
      left: minLeft,
      right: maxRight,
      bottom: maxBottom,
      width: maxRight - minLeft,
      height: maxBottom - minTop,
    };
  }

  getModel() {
    return this._model;
  }

  loadSkin(path: string) {
    this._model.setSkin(path);
  }
  setGlobalEvent(handler: MenuGlobalEventNames, listener: UserEventListener | null) {
    this._model.setGlobalEvent(handler, listener);
  }
  clearGlobalEvents() {
    this._model.clearGlobalEvents();
  }
  focus() {
    this._ctrl?.getView()?.focus();
  }

  /*
  isPopup(): this is PopupController {
    return this instanceof PopupController;
  }
  */
  destroy() {
    this.close();
    this._model.dispose();
  }
}

/*
class PopupController extends _RootController {
  private _baseView: MenuDialogView;
  //private _parentRootCtrl: MenuRootController;
  private _autoClose: boolean = true;
  constructor(param: PopupControllerParameter, parent: MenuContainerController, marginX?: number, marginY?: number) {
    super();
    //super(param, parent.getModel());
    this._baseView = parent.getView()!;
    //this._parentRootCtrl = parent.getRootController();
    if( typeof param.autoClose === 'boolean' )
      this._autoClose = param.autoClose;

    // lock parent
    //this._parentRootCtrl.setLocked(true);
    
    // open popup
    const { base, id, posX, posY } = param;
    const posobj: PopupPosition = { base, id, posX, posY, marginX, marginY };
    const callback = () => {
      this._open(posobj);
      _lastDialogViewCreatedTime = new Date().getTime();
    };
    if( IE_Version.real > 6 || new Date().getTime() - _lastDialogViewCreatedTime > 800 )
      callback();
    else // delay for IE6 or lower
      setTimeout(callback, 800);
  }
  open() {}
  private _open(posobj: PopupBase) {
    /*
    console.log("#open start", "green");
    
    // hook to unlock parent
    this._model.__setSystemUserEvent('_rootclose', () => {
      console.log('#hookonclose', "purple")
      this._parentRootCtrl.setLocked(false);
      if( this._parentRootCtrl instanceof PopupController && this._parentRootCtrl._autoClose ) {
        //try {
          this._parentRootCtrl.close();
        //} catch(e: any) {
        //  console.log('failed to _parentRootCtrl.close'+e.message, 'red');
        //}
      }
    });

    // SAFEGUARD in case of lost the view window accidentally.
    // it is imperfect.
    setTimeout(() => {
      if( !this._ctrl?.isDisposed() && !this._ctrl?.getView()?.checkExistence() ) {
        console.log("!!lost control!! exit popup", "red");
        // manually fire "_rootclose" event to unlock parent menu
        this._model.fireUserEvent('_rootclose');
      }
    }, 3000);
    
    //const {height, top, width, left} = this._baseView.getDialogPosition();
    const ctrl = new MenuContainerController(this, this._baseView, posobj);
    if( ctrl?.getView() ) {
      this._ctrl = ctrl;
    }

    if( this._ctrl?.getView() ) {
      console.log("confirmation success?:treu", "purple");
      this._readyToUse = true;
      //if( args.length )
      //  ctrl.getCtrl()?.confirm(args);
    }
    else {
      console.log("failure init dialog. close the confirmation.", "red")
      if( !this._ctrl ) {
        this._model.fireUserEvent('_rootclose');
      }
      this.close();
    }
    console.log("#open END", "green");
    
  }
  getCtrl() {
    //return this._ctrl;
  }
  getBaseView() {
    return this._baseView;
  }
  close(){}
}
*/









let _lastDialogViewCreatedTime = 0;
/**
 * core Menu controller
 * @class MenuContainerController
 */
class MenuContainerController {
  private _model: MenuSubmenu;
  private _view: MenuDialogView | null = null;
  private _items: MenuItemController[] = [];
  private _ctx: any;

  private _parent: MenuContainerController | null = null;
  private _rootCtrl: MenuRootController;
  private _parentItem: MenuItemController | null = null;
  private _child: MenuContainerController | null = null;
  
  // status
  private _initializingView = false;
  private _openingSubmenu = false;

  private _evaBaseDoc?: EventAttacher;

  //private _x: number = 0;
  //private _y: number = 0;
  
  private _currentItem: MenuItemController | null = null;
  private _mouseOverItemTimeoutId: any = 0;
  private _closingCurrentChildTimeoutId: any = 0;
  private _mouseStayOutSubmenuTimeoutId: number = 0;
  private _mouseStayTime = 500;
  private _mouseStayoutSubmenuTime = 500;
  private _lastMouseDownedItem: MenuItemController | null = null;

  private _direction = 1;
  private _pos?: PopupPosition;
  private _viewPosition: ViewPosition | null = null;
  private _currentChildPositionClassText: string = '';

  private _modelEventMananger: MenuModelEventManager;
  private _disposed = false;
  /**
   * Creates an instance of MenuContainerController.
   * @param {MenuSubmenu} param
   * @param {(any | MenuItemController)} [ctx] - it is MenuItemController if it is created by parent MenuItemController, otherwise it is a root context.
   * @memberof MenuContainerController
   */
  constructor(param: MenuRootController | MenuItemController, ctx: any, pos?: PopupPosition, rootWindow?: Window) {
    // when param is MenuRootController, this is a root menu. otherwise, the MenuItemController is a parent menu item of this.
    if( param instanceof MenuRootController ) {
      this._model = param.getModel();
      this._rootCtrl = param;
      this._ctx = ctx;
    }
    // it has a parent container
    else {
      this._parentItem = param;
      this._parent = this._parentItem.getContainer();
      this._model = this._parentItem.getModel() as MenuSubmenu;
      this._rootCtrl = this._parent!.getRootController();
    }
    this._pos = pos;

    pos = this._model.isPopup() && this._model.getPosObject() || pos || {};

    // only root menu observes window.document's events
    if( !this._parent ) {
      this._evaBaseDoc = new EventAttacher(rootWindow?.document || document, undefined, IE_Version.MSIE === 11); // use addEvenetListener if HTA is running on IE11 mode
    }

    this._modelEventMananger = new MenuModelEventManager(this._model);
    
    this._model.fireUserEvent('beforeload', ctx, new MenuUserEventObject('beforeload', this));

    // do not to catch window initializing error when dev mode
    DEV: {
      console.time('createView');
      this._createView(pos, rootWindow);
      console.timeEnd('createView');
      this._model.fireUserEvent('load', ctx, new MenuUserEventObject('load', this));
      return;
    }
    
    // catch an error during initializing the view window when in production mode
    PROD:
    try {
      this._createView(pos!, rootWindow);
      this._model.fireUserEvent('load', ctx, new MenuUserEventObject('load', this));
    } catch(e: any) {
      console.log(`failed to initialize a new modeless window\n${e.message}`, 'red');
      this._parentItem = null as any;
      this._parent = null as any;
      this._ctx = null as any;
      this._rootCtrl = null as any;
      this._evaBaseDoc?.dispose();
      this._model = null as any;
      this._view = null as any;
    }
  }

  private _createView(pos: PopupPosition, rootWindow?: Window): void {
    console.log(`${this.$L()}#_createView`, 'green');
    this._currentItem = null;
    
    // opening dialog without delay causes problems occasionally on IE6 or lower (duplicating dialogs)
    if( IE_Version.real <= 6 ) {
      const time = new Date().getTime();
      if( time - _lastDialogViewCreatedTime < 500 )
        return;
      _lastDialogViewCreatedTime = time;
    }

    this._initializingView = true;

    if( this._view ) {
      this._view.dispose();
      this._view = null;
    }
    
    // get new view
    console.time('testTime');
    try {
      this._view = new MenuDialogView((this._parentItem && this._parentItem.getModel().getIndex() + 1 || 0), this._parent?.getView(), this._model.getCustomDialogClass(), rootWindow);
      this._setViewDOMEvents(this._view);
    } catch(e: any) {
      DEV: {
        alert(`an error occured during create new MenuDialogView\n` + e.message);
      }
      this._initializingView = false;
      this._view = null;
      return;
    }

    // set CSS
    let css = this._model.getSkin();
    console.log(`${this.$L()} css: ${css}`, 'green');
    if( !css ) {
      css = 'default';
    }
    if( css ) {
      this.setSkinToCurrentView(css);
    }

    const cssText = this._model.getCSSText();
    if( cssText )
      this.setCSSTextToCurrentView(cssText);
    
    const fontSize = this._model.getFontSize();
    if( fontSize )
      this._view.setMenuFontSize(fontSize);
    const fontFamily = this._model.getFontFamily();
    if( fontFamily )
      this._view.setMenuFontFamily(fontFamily);

    // create menu items
    this._createItems(this._model);

    console.timeEnd('testTime');

    // set default control icons for internal skins
    switch(css) {
      case 'default':
        this._model.setDefaultCheckableIcon('checkbox', {text:'\x62', fontFamily:'Marlett'});
        this._model.setDefaultCheckableIcon('radio', {text:'\x69', fontFamily:'Marlett'});
        break;
      case 'classic':
        this._model.setDefaultCheckableIcon('checkbox', [{text:'\xfe', fontFamily:'Wingdings'}, {text:'\xa8', fontFamily:'Wingdings'}]);
        this._model.setDefaultCheckableIcon('radio', [{text:'\xa4', fontFamily:'Wingdings'}, {text:'\xa1', fontFamily:'Wingdings'}]);
        break;
      case 'xp':
        this._model.setDefaultCheckableIcon('checkbox', {text:'\x62', fontFamily:'Marlett', fontSize:'x-small'});
        this._model.setDefaultCheckableIcon('radio', {text:'\x69', fontFamily:'Marlett', fontSize:'small'});
        break;
      case 'win7':
      case 'win10':
        this._model.setDefaultCheckableIcon('checkbox', {text:'\xfc', fontFamily:'Wingdings'});
        this._model.setDefaultCheckableIcon('radio', {text:'\x69', fontFamily:'Marlett'});
        break;
    }

    
    DEV: {
    if( this._disposed ) {
      alert("already disposed!")
      this._disposed = false;
      this.dispose();
      return;
    }
    }

    this._view.initLayout();
    const {left, top, posX, posY} = this._calculatePosition(pos);
    this._view.setDocumentClass(posX + ' ' + posY);

    // show the dialog
    //if( IE_Version.real < 9 )
    this._view.adjustDialog();
    this._view.setLoad();
    this._view.adjustDialog(left, top);

    // changing CSS on current view dynamically causes a problem on win 9x
    /*
    this._modelEventMananger.add('css', (css: string) => {
      this._view?.clearStyleSheet();
      this.setCSS(css);
      this._view?.initLayout();

      let left, top;
      if( this._pos && this._view ) {
        ({left, top} = this._calculatePosition(this._pos));
      }
      this._view?.adjustDialog(left, top);
    });
    */

    this._initializingView = false;
  }

  // calculate the position where the view should appear
  private _calculatePosition(pos: PopupPosition): ViewPosition {
    console.log(`${this.$L()}#_calculatePosition`, 'green');
    console.log(pos);
    
    let {base = 'screen', marginX = 0, marginY = 0, posX = 'left', posY = 'top', marginLeft = 0, marginRight = 0} = pos;
    const {availWidth:scrWidth, availHeight:scrHeight} = window.screen;
    const {width:menuWidth, height:menuHeight} = this._view!.getContentSize();

    let left = 0;
    let top = 0;
    
    let itemMarginLeft = 0;
    let itemMarginTop = 0;
    let itemMarginRight = 0;
    let itemMarginBottom = 0;


    // decide base rectangle
    let baseRect: ClientRect | null = null;
    do {
      switch( base ) {
        case 'all':
          baseRect = this.getRootController().getRectangleOfWholeMenus();
          break;
        
        case 'screen':
          baseRect = { left:0, top:0, width:scrWidth, height:scrHeight, right:scrWidth, bottom:scrHeight };
          break;
        
        case 'item': {
          if( !this._parentItem ) {
            base = 'parent';
            continue;
          }
          
          baseRect = this._parentItem.getView()!.getItemPosition();
          ({left:itemMarginLeft, top:itemMarginTop, right:itemMarginRight, bottom:itemMarginBottom} = this._view!.getItemMargin());
          baseRect.left -= itemMarginLeft;
          baseRect.top -= itemMarginTop;
          baseRect.bottom += itemMarginBottom;
          baseRect.right += itemMarginRight;

          console.log(baseRect,"orange");

          break;
        }
        
        case 'parent':
          if( !this._parent ) {
            base = 'screen';
            continue;
          }
          baseRect = this._parent.getView()!.getDialogPosition();
          break;
        
        default:
          throw new Error(`unexpected pos base "${base}"`);
      }
      break;
    } while( true )


    // decide x base position
    const rightMargin = marginRight || -marginLeft || marginX;
    const leftMargin = marginLeft || -marginRight || marginX;
    for( let retry=2; retry--; ) {
      //let leftMargin = marginX || 0;
      let margin = 0;
      switch( posX ) {
        case 'left':
          left = baseRect.left;
          //if( base !== 'screen' )
          //  leftMargin = -leftMargin;
          margin = leftMargin;
          break;
        case 'left-out':
          left = baseRect.left - menuWidth;
          //if( base !== 'screen' )
          //  leftMargin = -leftMargin;
          margin = leftMargin;
          break;
        case 'left-center':
          left = baseRect.left - menuWidth / 2 |0;
          //if( base !== 'screen' )
          //  leftMargin = -leftMargin;
          margin = leftMargin;
          break;
        case 'right':
          left = baseRect.right - menuWidth;
          margin = rightMargin;
          break;
        case 'right-out':
          left = baseRect.right;
          margin = rightMargin;
          break;
        case 'right-center':
          left = baseRect.right - menuWidth / 2 |0;
          margin = rightMargin;
          break;
        case 'x-center':
          left = baseRect.left + (menuWidth > baseRect.width ? baseRect.width - (menuWidth - baseRect.width) / 2 : (baseRect.width - menuWidth) / 2) |0;
          break;
        default:
          throw new Error(`unexpected posX "${posX}"`);
      }
      
      //left += leftMargin;
      left += margin;

      if( left + menuWidth > scrWidth ) {
        if( base === 'screen' || this._model.isPopup() ) {
          left = scrWidth - menuWidth;
          break;
        }
        else {
          posX = 'left-out';
        }
        
        continue;
      }
      else if( left < 0 ) {
        //left = 0;
        break;
      }

      break;
    }

    // decide y base position
    for( let retry=2; retry--; ) {
      switch( posY ) {
        case 'top':
          top = baseRect.top;
          break;
        case 'top-out':
          top = baseRect.top - menuHeight;
          break;
        case 'top-center':
          top = baseRect.top - menuHeight / 2 |0;
          break;
        case 'bottom':
          top = baseRect.bottom - menuHeight;
          break;
        case 'bottom-out':
          top = baseRect.bottom;
          break;
        case 'bottom-center':
          top = baseRect.bottom - menuHeight / 2 |0;
          break;
        case 'y-center':
          top = baseRect.top + (menuHeight > baseRect.height ? baseRect.height - (menuHeight - baseRect.height) / 2 : (baseRect.height - menuHeight) / 2) |0;
          break;
        default:
          throw new Error(`unexpected posY "${posY}"`);
      }
      top += marginY || 0;

      if( top + menuHeight > scrHeight ) {
        if( base === 'screen' || this._model.isPopup() ) {
          top = scrHeight - menuHeight;
          break;
        }
        else {
          posY = 'bottom';
        }
        continue;
      }
      else if( top < 0 ) {
        top = 0;
        break;
      }
      break;
    }

    this._viewPosition = {left, top, posX, posY, base};
    return this._viewPosition;
  }

  private _createItems(submenuModel: MenuSubmenu) {
    console.log(`${this.$L()}#_createItems`, 'green');
    const models = this._model.produceItems(new MenuUserEventObject('demand', this));
    this._items.length = 0;
    let itemNumber = 1;

    const paramListForViewItems: UpdateViewItemType[] = [];
    for( const model of models ) {
      paramListForViewItems.push({
        type: model.getType(),
        label: model.getLabel(),
        icon: model.getIcon(),
        classNames: model.getCustomClassNames(),
        arrow: model.isSubmenu() && model.getArrowIcon() || undefined,
        flags: model.getFlags(),
        itemNumber,
        index: model.getIndex(),
      });
      
      if( model.isNormal() )
        itemNumber++;
    }
    
    // create views beforehand
    const viewItems = this._view!.createTableViewItems(paramListForViewItems);

    for( const model of models ) {
      const item = new MenuItemController(model, this, viewItems.shift());
      this._items.push( item );
    }
    
    /*
    for( const model of models ) {
      const item = new MenuItemController(model, this, itemNumber);
      this._items.push( item );
      if( model.isNormal() )
        itemNumber++;
    };
    */
  }

  setSkinToCurrentView(css: string) {
    console.log(`${this.$L()}#loadSkin`, "green");
    let settings = null;
    switch(css) {
      case 'default':
        settings = this._view!.setCSSText(css_default, true);
        break;
      case 'xp':
        settings = this._view!.setCSSText(css_xp, true);
        break;
      case 'classic':
        settings = this._view!.setCSSText(css_classic, true);
        break;
      case 'win7':
        settings = this._view!.setCSSText(css_win7, true);
        break;
      case 'win10':
        settings = this._view!.setCSSText(css_win10, true);
        break;
      case 'plain':
        break;
      
      // set skin from CSS file
      default:
        // ensure the pass is local
        if( /:\/\//.test(css) )
          throw new Error(`use local path for CSS. "${css}" is denied.`);
        
        this._view!.loadStyleSheet(css);
        if( this._view!.isEmptyCSS() ) {
          // current active style sheet is empty!
        }
        
        break;
    }
    
    /*
    if( settings ) {
      this._submenuMarginByCSS = settings['submenu-dialog-left-margin'];
      
      if( settings['tweak-animated-gif-suffix'] && IE_Version.real >= 9 ) {
        this._view!.tweakAnimatedGIFSuffix();
      }
    }
    */
  }
  setCSSTextToCurrentView(cssText: string) {
    console.log(`${this.$L()}#setCSSText`, 'green');
    this._view?.setCSSText(cssText);
  }

  resizeView(width: number, height: number) {
    this._view?.resizeDialog(width, height);
  }
  getView(): MenuDialogView | null {
    return this._view;
  }
  hasView(): boolean {
    return !!this._view?.isAvailable();
  }
  getViewPosition(): ViewPosition | null {
    return this._viewPosition;
  }
  getDialogPosition(): ClientRect | null {
    const pos = this._view?.getDialogPosition();
    return pos ? {...pos} : null;
  }
  getModel() {
    return this._model;
  }
  isReadyToUse() {
    return this?._view?.isReadyToUse();
  }
  getChild(): MenuContainerController | null {
    return this._child;
  }

  getRootController() {
    return this._rootCtrl;
  }
  getContext(): any {
    return this._parent? this._parent.getContext() : this._ctx;
  }
  getLayer() {
    return this._model.getLayer();
  }

  getBasedItemController() {
    return this._parentItem;
  }
  isCurrentOpenedChildSubmenuItem(item: MenuItemController) {
    return this._child?.isAvailable() && this._child.getBasedItemController() === item;
  }
  getLastMouseDownedItem() {
    return this._lastMouseDownedItem;
  }
  setLastMouseDownedItem(item: MenuItemController) {
    return this._lastMouseDownedItem = item;
  }

  // forcibly synchronize with other windows
  synchronize() {
    (this._view?.doc()?.body as HTMLElement || {}).dir = 'ltr';
  }

  /**
   * create and open submenu
   *
   * @param {MenuItemController} item
   * @return {*} 
   * @memberof MenuContainerController
   */
  openSubmenu(item: MenuItemController) {
    console.log(`${this.$L()}#openSubmenu`, "green");
    
    // check 2 times to make sure that it does not have a child
    if( this._openingSubmenu )
      return;
    if( !this.isAvailable() )
      return null;

    // remove current existing child menu
    if( this._child?.isAvailable() ) {
      if( this.isCurrentOpenedChildSubmenuItem(item) ) {
        console.log('already opened the child');
        return;
      }
      
      this.disposeChild();
    }
    
    console.log(`do createSubmenu`, "lime");
    this._openingSubmenu = true;
    this._view!.setDocumentClass('topmost', false);

    clearTimeout(this._mouseStayOutSubmenuTimeoutId);
    this._mouseStayOutSubmenuTimeoutId = 0;
    this.clearClosingCurrentChildTimeout();

    const model = item.getModel();
    if( !(model instanceof MenuSubmenu) )
      throw new Error('only MenuSubmenu items can create a submenu');
    
    // get dialog margin parameter
    let margin = this.getModel().getChildLeftMargin();
    let marginLeft: number | undefined;
    let marginRight: number | undefined;
    if( typeof margin === 'undefined' ) {
      margin = 0;
      const left = this._view!.getSubmenuMarginSettingFromCSS('left');
      const right = this._view!.getSubmenuMarginSettingFromCSS('right');
      
      if( typeof left === 'number' ) {
        margin = left;
        marginLeft = left;
      }
      if( typeof right === 'number' ) {
        margin = right;
        marginRight = right;
      }
    }
    
    // create child instance
    this.getRootController().setLocked(true);
    const child = new MenuContainerController(item, this._ctx, {base:'item', posX:'right-out', marginLeft, marginRight});
    if( child instanceof MenuContainerController ) {
      this._child = child;
      this.getRootController().setLastChild(child);
      const cpos = child.getViewPosition();
      if( cpos ) {
        // remove previous view's classes about child postion
        if( this._currentChildPositionClassText ) {
          this._view?.setDocumentClass(this._currentChildPositionClassText, false);
          this._currentChildPositionClassText = '';
        }
        // add static class about child position
        const childPositionClassText = `child-${cpos.posX} child-${cpos.posY}`;
        this._view?.setDocumentClass(childPositionClassText, true);
        this._currentChildPositionClassText = childPositionClassText;
      }
    }

    // set open flag
    item.getView()?.setViewFlag('open', true);
    this._view!.setBodyViewFlagByItem('open', true, item.getView()?.getItemNumber()||0, model.getCustomClassNames());

    this._openingSubmenu = false;
    this.getRootController().setLocked(false);
  }
  setTopMost() {
    console.log(`${this.$L()} setTopMost`, 'green');
    this._view?.setDocumentClass('topmost');
  }

  /**
   * check if the controller is alive before firing the callback
   * @private
   * @param {(...args:any[]) => any} callback
   * @return {*} 
   * @memberof MenuItemController
   */
  checkAvailabilityBeforeCall(callback: (...args:any[]) => any, _this?: MenuItemController) {
    return (...args: any[]) => {
      if( !this.isAvailable() || !this.isReadyToUse() )
        return;
      callback.apply(_this || this, args);
      _this = null as any;
    };
  }
  /*
   * set event listeners for the dialog view
   */
  private _setViewDOMEvents( view: MenuDialogView ) {
    console.log(`${this.$L()}#_setViewEvents`, 'green');

    this._evaBaseDoc?.attach('onmouseup', this.checkAvailabilityBeforeCall(this._onBaseDocClick));
    
    // when it losed focus by an other window, onfocusout event fires.
    view.addDocumentEvent('onfocusout', this.checkAvailabilityBeforeCall(this._onDocumentFocusOut));

    view.addDocumentEvent('ondragstart', this._onMenuDragStart as EventListener);
    view.addDocumentEvent('onmousewheel', this._onDocumentMouseWheel as EventListener);
    
    view.addDocumentEvent('onkeydown', (ev) => {
      if( this._onPressAltF4(ev as MSEventObj) )
        return;
      this.checkAvailabilityBeforeCall(this._onKeyPress)(ev);
    });

    view.addWindowEvent('onbeforeunload', this.checkAvailabilityBeforeCall(this._onUnload));

    /*
    // -----
    view.addWinEvent('onfocus', (...args) => this._onMenuFocus(...args));//
    view.addWinEvent('onblur', (...args) => this._onMenuBlur(...args));//
    view.addDocEvent('onfocusin', (...args) => this._onFocusIn(...args));//
    */
  }
  
  /*
  private _onFocusIn(ev: MSEventObj) {
    console.log('_onFocusIn', 'orange');
  }
  private _onMenuBlur(ev: MSEventObj) {
    console.log('onMenuWinBlur', 'orange');
  }
  private _onMenuFocus(ev: MSEventObj) {
    console.log('onMenuWinFocus', 'orange');
  }
  */

  // prevent mouse drag
  private _onMenuDragStart(ev: MSEventObj) {
    ev.returnValue = false;
  }

  /*
   * dialog close events
   */
  private _onDocumentFocusOut(ev: MSEventObj) {
    console.log(`${this.$L()}#_onDocumentFocusOut[l${this._model.getLayer()}]`, 'green');
    if( !this._view )
      return;
    
    if( this._model.isPopup() && this.isLocked() ) {
      //console.log("focus dialog:"+this.getModel().getUniqueId());
      //this.getView()!.win().focus();
    }
    // current dialog (and probably all other dialogs) loses focus
    else if( !this._view?.hasFocus() ) {
      console.log('close from _onDocumentFocusOut', 'red');
      if( this._model.getAutoClose() ) {
        this.disposeAll();
      }
    }
  }
  /**
   * always close when HTA's document.body is clicked
   * @private
   * @param {MSEventObj} ev
   * @return {*} 
   * @memberof MenuContainerController
   */
  private _onBaseDocClick(ev: MSEventObj) {
    console.log(`${this.$L()}#_onBaseDocClick`, 'green');
    if( !this._view || !this._model.getAutoClose() ) {
      return;
    }
    this.dispose();
  }
  private _onUnload(ev: MSEventObj) {
    if( !this._view )
      return;
    this.dispose()
    //ev.returnValue = 'the dialog is going to be closed by external application';
  }
  
  /**
   * Keyboard events
   * @private
   * @param {MSEventObj} ev
   * @memberof MenuContainerController
   */
  private _onKeyPress(ev: MSEventObj) {
    console.log(`${this.$L()}#_onKeyPress: `+ev.keyCode);
    //if( this._discarded || !this.isAvailable() )
    //  return;
    
    switch(ev.keyCode) {
      // prevent zoom
      case 107: //+
      case 109: //-
        if( ev.ctrlKey )
          ev.returnValue = false;
        break;
      
      // prevent alt+F4
      case 115:
        if( ev.altKey )
          ev.returnValue = false;
        break;
      
      case 27: // ESC
      case 37: // left
        if( (ev.srcElement as unknown as HTMLInputElement).type === 'text' || ev.srcElement.nodeName === 'textarea' ) // fired by text input field
          break;
        if( ev.keyCode === 27 || this._model.getLayer() !== 0 /*not to close first menu*/ ) {
          //this.disposeFromParent();
          this.disposeFromParent();
        }
        break;
      case 39: // right
        if( this._currentItem ) {
          if( this._currentItem.getModel().isSubmenu() )
            this._currentItem.activate(ev);
          break;
        }
      // if this.currentItem is empty, go below
      case 38: // up
      case 40: // down
        var item = this.getNextMenuItem(ev.keyCode === 38? -1 : 1);
        if( item ) {
          this.setCurrentItem(item);
        }
        break;
      
      case 32: // space
        if( this._currentItem ) {
          if( /radio|check/.test(this._currentItem.getModel().getType() || '') )
            this._currentItem.activate(ev);
        }
        break;
      case 13: // enter
        if( this._currentItem )
          this._currentItem.activate(ev);
        break;
    }

    DEV: switch(ev.keyCode) {
      case 17: //CTRL
        console.log(`${this._currentItem?.getModel().$L()} className: ${this._currentItem?.getView()?.getVirtualElement().getRealElement()?.className}`);
        console.log(`${this._currentItem?.getView()?.getVirtualElement().getRealElement()?.outerHTML}`);
        break;
      case 16: //SHIFT
        console.log('body.className: ' + this.getView()?.getDoc().body.className);
        console.log('doc.className: ' + this.getView()?.getDoc().documentElement.className);
        break;
      case 18: //ALT
        console.log('table: ' + this.getView()?.getDoc().documentElement.outerHTML);
        break;
    }
  }
  // prevent to close dialog
  private _onPressAltF4(ev: MSEventObj) {
    switch(ev.keyCode) {
      // prevent zoom
      case 107: //+
      case 109: //-
        if( ev.ctrlKey ) {
          ev.returnValue = false;
          return true;
        }
        break;
      
      // prevent alt+F4
      case 115:
        if( ev.altKey ) {
          ev.returnValue = false;
          return true;
        }
        break;
    }
    return false;
  }
  // prevent to zoom document from mouse wheeling
  private _onDocumentMouseWheel(ev: MSEventObj) {
    if( ev.wheelDelta && ev.ctrlKey ) {
      ev.returnValue = false;
    }
  }

  getElementsByName(name: string) {
    //return this._document?.getElementsByName(name);
  }
  getNextMenuItem(plus: number, current?: MenuItemController): MenuItemController | null {
    var items = this._items;
    
    var startItem = current || this._currentItem;
    
    var index = startItem? startItem.getModel().getIndex() : -1;
    var item = null;
    for( var i=items.length; i--; ) {
      console.log('index:'+index+" plus:"+plus);
      index += plus;
      if( index === items.length )
        index = 0;
      else if( index < 0 )
        index = items.length - 1;
      console.log('!index:'+index);
      item = items[index];
      const model = item.getModel();
      const flags = model.isNormal() ? model.getFlags() : null;
      if( !flags || flags.unselectable || flags.disabled )
        continue;
      
      console.log('index:'+index);
      return item;
    }
    return null;
  }

  setCurrentItem(item: MenuItemController, activateMouseStay?: boolean) {
    const model = item?.getModel();

    if( !this.getView()?.isAvailable() )
      return;

    const flags = model.getFlags();
    if( flags.unselectable || flags.disabled )
      return;
    
    console.log(`${this.$L()}#setCurrentItem => ${item.getModel().$L()}`, 'green');
    if( this._currentItem !== item ) {
      // de-highlight previous highlighted item
      if( this._currentItem ) {
        const citemModel = this._currentItem.getModel();

        const cview = this._currentItem.getView()!;
        cview.setViewFlag('highlight', false);
        cview.setViewFlag('activate', false);
        
        const cNumber = cview.getItemNumber();
        const cCustomClasses = citemModel.getCustomClassNames();
        this._view?.setBodyViewFlagByItem('highlight', false, cNumber, cCustomClasses);
        this._view?.setBodyViewFlagByItem('activate', false, cNumber, cCustomClasses);
      }

      // highlight normal item
      if( model.isNormal() ) {
        //item.getView()?.deleteViewFlag('activate');
        item.getView()?.setViewFlag('highlight', true);
        this._view?.setBodyViewFlagByItem('highlight', true, item.getView()?.getItemNumber()||0, model.getCustomClassNames());
        
        model.fireUserEvent('highlight', this.getContext(), new MenuUserEventObject('highlight', this));
      }
      this._hookToCloseCurrentChild(item);
    }

    // set parent's current item
    //this.getRootController().setLocked(true);
    if( !this.getModel().isRoot() ) {
      //this.getRootController().setLocked(true);
      try {
        this.setThisAsParentCurrentItem(this._view);
      } catch(e) {}
      //this.getRootController().setLocked(false);
    }
    //this.getRootController().setLocked(false);
    
    if( this._currentItem === item )
      return;
    
    console.log(`${this.$L()}#setCurrentItem3 => ${item.getModel().$L()}`, 'green');
    this._currentItem = item;

    // calculate mouse staying time
    if( activateMouseStay ) {
      this._hookMouseStay(item, this._view!);
    }
  }
  private _hookMouseStay(stayingItem: MenuItemController, view: MenuDialogView, time?: number) {
    //console.log(`${item.getModel().$L()} mousestay1`, "red");
    this._clearMouseStayTimeout();
    this._mouseOverItemTimeoutId = window.setTimeout(() => {
      //this.synchronize();
      console.log(`${this.$L()}#mousestay ${stayingItem.getModel().$L()}`, "red");
      const available = this.isAvailable() && view.isAvailable() && this._currentItem === stayingItem;
      /*
      if( !available ) {
        console.log(`${this.$L()}#mousestay terminate ${[this.isAvailable(),view.isAvailable(),this._currentItem === stayingItem]}`, 'red');
        view = null as any;
        return;
      }
      */
      
      const result = this._currentItem?.fireMouseStay();

      // re execute if failed to fireMouseStay
      if( result === false ) {
        console.log(`${this.$L()}#mousestay recall`, 'red');
        this._hookMouseStay(stayingItem, view, 100);
        return;
      }
      view = null as any;
    }, time ?? this._mouseStayTime);
  }
  private _clearMouseStayTimeout() {
    clearTimeout(this._mouseOverItemTimeoutId);
    this._mouseOverItemTimeoutId = 0;
  }
  /**
   * close an opened child menu if the mouse cursor leaves the outside of its submenu item
   * @private
   * @param {MenuItemController} item
   * @return {*} 
   * @memberof MenuContainerController
   */
  private _hookToCloseCurrentChild(item: MenuItemController) {
    if( this.isCurrentOpenedChildSubmenuItem(item) || this._closingCurrentChildTimeoutId )
      return;

    this._closingCurrentChildTimeoutId = setTimeout(() => {
      console.log(`${this.$L()}#_closingCurrentChildTimeoutId`, 'red');
      if( item === this._currentItem ) {// prevent mousestay too
        console.log('_clearMouseStayTimeout', 'red');
        this._clearMouseStayTimeout(); 
      }
      this.disposeChild();
      this.clearClosingCurrentChildTimeout();
    }, CLOSE_CHILD_MOUSEOUT_TIME);
  }
  clearClosingCurrentChildTimeout() {
    clearTimeout(this._closingCurrentChildTimeoutId);
    this._closingCurrentChildTimeoutId = 0;
  }

  getCurrentItem() {
    return this._currentItem;
  }
  
  /**
   * set parent's currentItem as this submenu item
   * @memberof MenuContainerController
   */
  setThisAsParentCurrentItem(view: MenuDialogView | null) {
    if( !this._parentItem || !view || !view.isAvailable() )
      return;
    
    // get parent container
    const pcontainer = this._parentItem?.getContainer();
    if( !pcontainer?.hasView() )
      return;
    
    console.log(`${this.$L()}#setThisAsParentCurrentItem`, 'green');
    //!it interacts with another window!
    pcontainer.setCurrentItem(this._parentItem!, true);
    pcontainer.clearClosingCurrentChildTimeout();
  }

  /*
  isPopup() {
    return this.getRootController() instanceof PopupController;
  }
  */

  
  hide() {
    if( !this._view?.isAvailable() )
      return;
    this._view?.moveDialog(-100000, -100000);
    if( this._child )
      this._child.hide();
  }

  isAvailable(): boolean {
    return !this._disposed && !!(this._view?.isAvailable()) && !this.isLocked();
  }
  isLocked(): boolean {
    return this.getRootController().isLocked(this);
  }
  isDisposed(): boolean {
    return this._disposed;
  }
  disposeAll() {
    this._rootCtrl.close();
  }
  disposeFromParent() {
    this._parent?.disposeChild();
  }
  disposeChild() {
    if( this._child ) {
      console.log(`do diposeChild[chl${this._child?.getLayer()}]`, "green");

      const opendItem = this._child.getBasedItemController();
      if( opendItem ) {
        const model = opendItem.getModel();
        const openedv = opendItem.getView();
        const contv = opendItem.getContainer()?.getView();
        const cnumber = openedv?.getItemNumber() || 0;
        const customclasses = model.getCustomClassNames();
        
        openedv?.setViewFlag('open', false);
        contv?.setBodyViewFlagByItem('open', false, cnumber, customclasses);
        
        openedv?.setViewFlag('activate', false);
        contv?.setBodyViewFlagByItem('activate', false, cnumber, customclasses);
      }
      //this.getRootController().setLocked(true);
      this._child.dispose();
      //this.getRootController().setLocked(false);

      this.clearClosingCurrentChildTimeout();
    }
    this._child = null;
  }
  dispose() {
    if( this._disposed )
      return;
    console.log(`${this.$L()}#dispose`, 'green');
    this._disposed = true;
    this._dispose();
  }
  private _dispose() {
    if( this.isLocked() ) {

      setTimeout(() => this._dispose(), 100);
      return;
    }

    this._currentItem = null;
    this._lastMouseDownedItem = null;
    clearTimeout(this._mouseOverItemTimeoutId);
    clearTimeout(this._mouseStayOutSubmenuTimeoutId);
    
    // dispose child containers
    this.disposeChild();

    this.getRootController().setLocked(true);

    // dispose items
    for( const item of this._items ) {
      item.dispose();
    }
    
    // dispose view dialog
    this._view?.dispose();
    this._view = null as any;

    this.getRootController().setLocked(false);

    // destroy model and items
    //if( destroy ) {
    //  this._model.dispose();
    this._items.length = 0;
    
    try {
      this._evaBaseDoc?.dispose();
    } catch(e: any) {
      DEV: {
        alert(`an error occured during detaching _evaBaseDoc\n` + e.message);
      }
    }

    this._model.fireUserEvent('unload', this.getContext(), new MenuUserEventObject('unload', this));
    if( this._parent ) {
      if( !this._parent.isDisposed() ) {
        this._parent.setTopMost();
      }
    }
    else {
      this._model.fireUserEvent('_rootclose', this.getContext(), new MenuUserEventObject('_rootclose', this));
    }

    if( this._model.isPopup() ) {
      this.getRootController().enableOnlyLastChild(false);
    }

    this._modelEventMananger.dispose();

    this._ctx = null;
    this._rootCtrl = null as any;
    this._parentItem = null as any;
    this._parent = null as any;
    //}
  }

  getDirection() {
    return this._direction;
  }
  $L() {
    return `L(${this.getLayer()})`;
  }
}











/*
 * variables for double click
 */
let prevDblclickItem: MenuItemController | null = null;
let prevDblclickTime = 0;

/**
 * controller for each menu item
 * @class MenuItemController
 * @implements {LoggerInterface}
 */
class MenuItemController {
  private _model: MenuModelItem;
  private _container: MenuContainerController;
  private _view?: MenuItemView;
  private _modelEventMananger: MenuModelEventManager;
  
  constructor(model: MenuModelItem, container: MenuContainerController, view: MenuItemView /*, itemNumber: number*/) {
    this._model = model;
    this._modelEventMananger = new MenuModelEventManager(model);
    this._container = container;

    //this._createView(itemNumber);
    this._view = view;
    this._setItemEvents();
    this._prepareModel(model);
  }
  private _prepareModel(model: MenuModelItem) {
    if( model.isCheckable() ) {
      model.updateCheckedStatByRecord();
    }
  }
  getView() {
    return this._view;
  }
  isCurrentItem():boolean {
    return this._container.getCurrentItem() === this;
  }

  private _setItemEvents() {
    const model = this._model;
    const type = model.getType();
    switch( type ) {
      case 'separator':
        this._view?.addEvent('onmouseover', this._container.checkAvailabilityBeforeCall(this._onMouseOverItem, this));
        break;
      
      case 'radio':
      case 'checkbox': {
        this._modelEventMananger.add('checked', (flag: boolean, value?: any) => {
          if( !model.isCheckable() )
            return;
          this._view?.update({type, icon: model.getIcon(), flags:{checked: flag}});
          this._container.getView()?.adjustDialog();
        });
      }
      default: {
        // set view events
        this._view?.addEvent('onmousemove', this._container.checkAvailabilityBeforeCall(this._onMouseOverItem, this));
        this._view?.addEvent('onmousedown', this._container.checkAvailabilityBeforeCall(this._onMouseDownItem, this));
        this._view?.addEvent('onmouseup', this._container.checkAvailabilityBeforeCall(this._onMouseUpItem, this));

        // set normal model events
        this._modelEventMananger.add('label', (label:string, beforeLabel:string) => {
          this._view?.update({label, type});
          this._container.getView()?.adjustDialog();
        });

        this._modelEventMananger.add('icon', (icon: IconSettingType) => {
          //this._view?.update({icon, type});
          this._container.getView()?.adjustDialog();
        });

        if( type === 'submenu' ) {
          this._modelEventMananger.add('arrow', (icon: IconSettingType) => {
            this._view?.update({type, arrow:icon});
            this._container.getView()?.adjustDialog();
          });
        }
        break;
      }
    }
  }
  private _onMouseOverItem = (ev: MSEventObj) => this._container.setCurrentItem(this, true);
  
  private _onMouseDownItem = (ev: MSEventObj) => {
    console.log(`${this._model.$L()}#_onMouseDownItem`, 'green');
    this._container.setLastMouseDownedItem(this);
  }
  private _onMouseUpItem = (ev: MSEventObj) => {
    console.log(`${this._model.$L()}#_onMouseUpItem`, 'green');
    if( ev.button === 1 && this._container.getLastMouseDownedItem() === this ) {
      this._container.setCurrentItem(this);
      this.activate(ev);
    }
  }
  private _onMouseClickItem = (ev: MSEventObj) => {
    this._container.setCurrentItem(this);
    this.activate(ev);
  }
  
  /**
   * activate the menu item
   * @param {(MSEventObj)} ev
   * @memberof MenuItemController
   */
  activate(ev: MSEventObj = {} as MSEventObj) {
    console.log(`${this._model.$L()}#activate: ${ev.type}`, 'green');
    
    const model = this._model;
    // ignore separators
    if( !model.isNormal() ) {
      return;
    }
    if( !this._container?.isAvailable() /*|| !this._selectable*/ ) {
      console.log('container is not available', 'red');
      return false;
    }
    
    const queue = new Queue();

    const flags = model.getFlags();
    if( flags.unlistening ) {
      return;
    }



    // set activate flag and detect transition's end
    let transitionEnded = false;
    this._view?.setViewFlag('activate', true, () => {
      transitionEnded = true;
    });
    this._container.getView()?.setBodyViewFlagByItem('activate', true, this._view?.getItemNumber()||0, model.getCustomClassNames());
    
    // check types
    const type = model.getType();

    // open submenu
    if( type === 'submenu' || type === 'popup' ) {
      if( this._container.isCurrentOpenedChildSubmenuItem(this) )
        return;
      this._container.openSubmenu(this);
    }

    // lock
    let root = this._container.getRootController();
    root.setLocked(true);
    
    // decide whether click or dblclick
    let doubleClicked = false;
    if( ev.type === 'mouseup' ) {
      const now = new Date().getTime();
      if( this === prevDblclickItem && now - prevDblclickTime <= DblClick_Delay ) {
        doubleClicked = true;
        prevDblclickItem = null;
      }
      else {
        prevDblclickItem = this;
      }
      prevDblclickTime = now;
    }
    else if( ev.type === 'keydown' && ev.keyCode === 13 ) { // *13 is enter key
      doubleClicked = true;
    }
    const clicktype = doubleClicked ? 'dblclick' : 'click';

    // create event objects beforehand because some events may execute asynchlonously after root menu disposed
    const activateEvObj = new MenuUserEventObject('activate', this);
    const closeEvObj = new MenuUserEventObject('close', this);
    const clickEvObj = new MenuUserEventObject(clicktype, this);
    
    
    // execute onchange
    if( type === 'radio' && model.isRadio() || type === 'checkbox' && model.isCheckbox() ) {
      if( model.setChecked() ) {
        const changeEvObj = new MenuUserEventObject('change', this);
        queue.next(() => model.fireUserEvent('change', this.getContainer().getContext(), changeEvObj));
      }
    }
    
    // execute onclick or ondblclick
    model.fireUserEvent(clicktype, this.getContainer().getContext(), clickEvObj);

    let flashing = false;
    if( !model.isSubmenu() ) {
      // flash
      const flash = flags.flash && (!flags.hold || doubleClicked);
      if( flash ) {
        flashing = true;
        this._view?.flashHighlight(flags.flash as number, () => {
          flashing = false;
        });
      }

      // close the menu
      if( !flags.hold || flags.unholdByDblclick && doubleClicked ) {
        if( !flash )
          queue.sleep(100);
        queue.next((val, repeat) => {
          if( !transitionEnded || flashing ) {
            repeat(100);
            return;
          }
          
          // dispose entire menu or only current menu
          try {
            flags.holdParent ? this._container.disposeFromParent() : this._container.disposeAll();
          } catch(e) {
            DEV: {
            console.log(e, 'red');
            alert(e);
            }
          }

          queue.next(() => model.fireUserEvent('close', this.getContainer().getContext(), closeEvObj));
        });
      }
    }

    // finally fire onclick (or dblclick)
    queue.next((val, repeat) => {
      if( !transitionEnded || flashing ) {
        repeat(100);
        //console.log(transitionEnded+"/"+flashing, "red");
        return;
      }

      // fire acitvate event
      model.fireUserEvent('activate', this.getContainer().getContext(), activateEvObj);
      root.setLocked(false);
      root = null as any;
    });
  }

  /**
   * fire if the mouse cursor hover on the item for more than certain time
   * @memberof MenuItemController
   */
  fireMouseStay() {
    console.log(`${this._model.$L()}#fireMouseStay`, 'green');
    
    switch( this.getModel().getType() ) {
      case 'submenu':
        //this._container.openSubmenu(this);
        if( this._container?.isAvailable() ) {
          if( !this._container.isCurrentOpenedChildSubmenuItem(this) || !this._view?.getViewFlag('activate') ) {
            // disable opening submenu by mouse-staying at this time because of the problem that it opens parentless child
            //this.activate();
          }
        }
        else
          return false;
        break;
      case 'popup':
        if( this._container.getChild()?.getBasedItemController() ) {
          break;
        }
        this._container.disposeChild();
        break;
      default:
        //this._container.disposeChild();
        break;
    }
  }

  getModel() {
    return this._model;
  }
  getContainer() {
    return this._container;
  }

  dispose(destroy?: boolean) {
    this._view?.dispose();
    this._view = null as any;
    this._modelEventMananger.dispose();
    
    if( destroy ) {
      this._model.dispose();
      this._model = null as any;
      this._container = null as any;
    }
  }
}



class MenuModelEventManager {
  private _model: MenuModelItem;
  private _hookedModelEventIds: {handler: string, id: number}[] = [];
  constructor(model: MenuModelItem) {
    this._model = model;
  }
  add(handler:Parameters<MenuModelItem["addMenuModelEvent"]>[0], callback: Function) {
    const id = this._model.addMenuModelEvent(handler, callback);
    this._hookedModelEventIds.push({handler, id});
  }
  dispose() {
    for( const {handler, id} of this._hookedModelEventIds ) {
      this._model.removeMenuModelEvent(handler as any, id);
    }
    this._model = null as any;
    this._hookedModelEventIds.length = 0;
  }
}







/**
 * each user event interacts with menu items through this wrapper.
 * this event object is passed as a first argument to each event handler.
 */
class MenuUserEventObject implements MenuUserEventObjectModel {
  ctx: any;
  srcContext: any;
  target: MenuContainerUI | MenuItemUI;

  readonly type: MenuItemUserEventNames;
  readonly index?: number;
  readonly id?: string;
  readonly name?: string;
  readonly radioIndex?: number;
  readonly selectedIndex?: number;
  readonly checked?: boolean;
  readonly rootX: number;
  readonly rootY: number;
  value?: any;
  cancelGlobal: boolean = false;

  constructor(type: MenuItemUserEventNames, ctrl: MenuContainerController | MenuItemController) {
    this.type = type;
    
    const model = ctrl.getModel();
    let container: MenuContainerController;
    if( ctrl instanceof MenuItemController ) {
      this.ctx = ctrl.getContainer().getContext();
      this.srcContext = this.ctx;
      this.target = new MenuItemUI(ctrl);
      this.id = model.getId();
      this.index = model.getIndex();
      
      if( model.isCheckable() ) {
        this.value = model.getValue();
        this.name = model.getName() || undefined;
        this.radioIndex = model.isRadio() ? model.getRadioIndex() : undefined;
        this.selectedIndex = this.radioIndex;
        this.checked = model.isChecked();
      }
      container = ctrl.getContainer();
    }
    else {
      this.ctx = ctrl.getContext();
      this.srcContext = this.ctx;
      this.target = new MenuContainerUI(ctrl);
      
      container = ctrl;
    }
    
    const pos = container.getRootController().getLastPosition();
    this.rootX = pos.x;
    this.rootY = pos.y;
  }

  dispose() {
    if( !this.target )
      return; // disposed already
    this.ctx = null as any;
    this.srcContext = null as any;
    this.target.dispose();
    this.target = null as any;
    this.value = null as any;
  }
}

abstract class _MenuUI<T> {
  protected _ctrl: T;
  constructor(ctrl: T) {
    this._ctrl = ctrl;
  }
  dispose() {
    this._ctrl = null as any;
  }
}
class MenuContainerUI extends _MenuUI<MenuContainerController> {
  constructor(ctrl: MenuContainerController) {
    super(ctrl);
  }
  loadSkin(css: string, root = false) {
    root ? this._ctrl.getRootController().getModel().setSkin(css) : this._ctrl.getModel().setSkin(css);
  }
  /**
   * create stand alone popup dialog
   */
  popup(args: any/*PopupControllerParameter*/, marginX?: number, marginY?: number): any {
    console.log('#confirm', "red");
    /*
    if( !this._ctrl!.getView() )
      return;
    console.log('#start_confirm', "orange")
    new PopupController(args, this._ctrl, marginX, marginY);
    console.log('#end_confirm', "orange")
    */
  }
}
class MenuItemUI extends _MenuUI<MenuItemController> {
  constructor(ctrl: MenuItemController) {
    super(ctrl);
  }
  getContainer(): MenuContainerUI {
    return new MenuContainerUI(this._ctrl.getContainer());
  }
  setLabel(text: string, asHtml?: boolean) {
    const model = this._ctrl.getModel();
    model.isNormal() && model.setLabel(text);
  }
  getLabel() {
    return this._ctrl.getModel().getLabel();
  }
  setIcon(icon: IconSettingType) {
    const model = this._ctrl.getModel();
    if( model.isNormal() )
      model.setIcon(icon);
    else
      throw new Error(`could not set the icon to the item. type:"${model.getType()}"`);
  }
  remove() {}
}










export { MenuRootController, MenuUserEventObject }
