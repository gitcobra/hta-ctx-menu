import { console, IE_Version } from "./utils";

const VDN_Prefix_Real_ID = '_VDN_ID_';
let VDN_unique_counter = 0;
/**
 * virtual DOM node to 0.0update at arbitrary timing
 *
 * @class VirtualHTMLElement
 */
class VirtualDOMNode {
  readonly nodeName: string;
  
  className: string = '';
  private _queuedClassNames: {add: boolean, className: string}[] = [];
  //private _classNameToReserve: string[] = [];
  //private _reservedStack = 0;
  private _lastRealClasses = '';
  
  readonly attributes: { [key:string]: string } = {};
  readonly childNodes: (VirtualDOMNode | string)[] = [];
  style: string = '';
  private _lastRealStyle = '';
  readonly id: string = '';
  
  readonly uniqueId: string;
  label: string = '';

  private _transitions: {filter: TransitionFilterType, type: string}[] = [];
  private _staticfilters: any[] = [];
  private _flipStaticFilters = false;
  private _onfilterchange: Function | null = null;
  private _onTransitionEnds: Function[] = [];

  private _realElement?: HTMLElement;
  private _linked = false;
  private _updated: { [key:string]: number } = {}; // time stamp
  private _hasLinkedVNode: boolean = false;
  private _parent: VirtualDOMNode | null = null;

  private _disposed = false;

  constructor(node: string | HTMLElement, attributes: {[key:string]: any} = {}, label:string = '') {
    if( typeof node === 'string' )
      this.nodeName = node.toLowerCase();
    else {
      if( !node || !node.nodeName )
        throw new Error('node parameter must be a HTMLElement or string');
      
      this.nodeName = node.nodeName.toLowerCase();
      this.linkRealElement(node, false, true);
    }

    // set DOM attributes
    for( let prop in attributes ) {
      if( prop === 'class' ) {
        this.addClass(attributes['class']);
        continue;
      }
      if( prop === 'id' ) {
        this.id = attributes[prop];
        continue;
      }
      this.attributes[prop] = attributes[prop];
    }
    
    // set label and unique id
    this.label = label;
    this.uniqueId = 'uid_' + VDN_unique_counter;

    // set unique DOM id if not exist
    if( !this.id ) {
      this.id = VDN_Prefix_Real_ID + VDN_unique_counter;
    }
    
    VDN_unique_counter++;
  }

  addClass(addClasses: string) {
    const names = normalizeClassText(addClasses).split(' ');
    let classtext = this.className;
    const newclasses = [];
    const added: any = {};
    for( const name of names ) {
      if( added[name] || !/\w/.test(name) )
        continue;
      if( !RegExp('(^|\\s)'+ escapeReLetters(name) +'(?=\\s|$)', 'i').test(classtext) ) {
        newclasses.push(name);
        added[name] = true;
      }
    }

    if( newclasses.length ) {
      if( classtext )
        newclasses.unshift(classtext);
      this.className = newclasses.join(' ');
      this._updated._class = new Date().getTime();
    }
  }
  removeClass(remClasses: string, target?: string) {
    const names = escapeReLetters( normalizeClassText(remClasses) ).replace(/\s+/g, '|');
    const updatedstr = (target || this.className).replace(RegExp('(^|\\s)('+names+')(?=\\s|$)', 'gi'), '').replace(/^\s+/, '');
    
    if( target )
      return updatedstr;
    
    if( updatedstr !== this.className ) {
      this.className = updatedstr;
      this._updated._class = new Date().getTime();
    }
  }
  hasClass(className: string) {
    // check queued classes primarily
    for( const item of this._queuedClassNames ) {
      if( item.className === className ) {
        return item.add;
      }
    }
    // check normal classes secondarily
    return RegExp('(^|\\s)'+className+'(?=\\s|$)', 'i').test(this.className);
  }
  queueClass(qclass: string, add: boolean) {
    //console.log(`#queueClass "${qclass}", ${add}`, 'blue');
    let i = this._queuedClassNames.length;
    for(; i--;) {
      const item = this._queuedClassNames[i];
      if( qclass === item.className ) {
        if( add !== item.add ) {
          this._queuedClassNames.splice(i, 1);
        }
        break;
      }
    }

    if( i === -1 )
      this._queuedClassNames.push({add, className:qclass});
  }
  hasQueuedClasses() {
    return !!this._queuedClassNames.length;
  }
  consumeQueuedClasses(onebyone?: boolean) {
    if( !this._queuedClassNames.length )
      return null;
    
    console.log(`VNode#consumeQueuedClasses [${this.label}] ${this._queuedClassNames.length}`, 'blue');
    const consumedClasses = [];
    while( this._queuedClassNames.length ) {
      const item = this._queuedClassNames.shift();
      item.add? this.addClass(item.className) : this.removeClass(item.className);
      consumedClasses.push(item.className);
      if( onebyone )
        break;
    }
    return consumedClasses;
  }

  apply() {
    console.log(`VNode#apply [${this.label}]`, 'blue');
    
    let element = this.getRealElement(true)!;
    const filters = getAndApplyTransitions(element);
    this._transitions = filters.transitions;
    this._staticfilters = filters.statics;
    this._flipStaticFilters = filters.flip;
    
    // XXX:
    // When multiple transitions are playing, some transitions are led to unexpected aborts occasionally.
    // The empty onfilterchange event handler seems to prevent the problem for reasons I don't know.
    if( !this._onfilterchange ) {
      //this._onfilterchange = new Function;
      //this.getRealElement()!.attachEvent('onfilterchange', this._onfilterchange as EventListener);
      //this.getRealElement(true)!.onfilterchange = this._onfilterchange as EventListener;
    }
  }
  play(ontransitionend?: Function) {
    const transes = this._transitions;
 
    let playedFlag = false;
    let transFilter: any = null;
    let longestDuration = -1;
    for( const fitem of transes ) {
      console.log(`VNode#play [${this.label}] "${fitem.type}"`, 'blue');
      try {
        fitem.filter.play();
        transFilter = fitem.filter;
        // calculate largest duration of the transitions
        if( ontransitionend ) {
          const dur = transFilter.duration;
          if( dur > longestDuration ) {
            longestDuration = dur;
          }
          //this._playingCount++;
        }
        playedFlag = true;
      } catch(e) {
        console.log((e as any).message, "red");
      }
    }

    if( playedFlag ) {
      // HACK:
      // Use setTimeout to detect the transition's end because the native onfilterchange event is fired not only when the transition's status change,
      // but also when other static filter properties change.
      // Besides, event.srcFilter property is always null perhaps due to a bug, so it is not able to know which filter object fired the event.
      if( ontransitionend && longestDuration >= 0 ) {
        setTimeout(() => {
          //console.log(`=========trans ends==========`, 'red');
          ontransitionend(this);
        }, longestDuration * 1000);
      }

      // flip static filters
      if( transes.length && this._flipStaticFilters ) {
        this.flipFilters();
      }
    }
    else {
      ontransitionend?.(this);
    }

    return playedFlag;
  }
  getTransitions() {
    return this._transitions;
  }
  clearTransitions() {
    this._transitions.length = 0;
    this._staticfilters.length = 0;
  }
  flipFilters() {
    for( let i=this._staticfilters.length; i--; ) {
      try {
        const f = this._staticfilters[i];
        f.enabled = !f.enabled;
      } catch(e) {
        console.log((e as any).message, 'red');
      }
    }
  }
  
  setAttribute(attr: string, val: any) {
    this.attributes[attr] = val;
    this._updated[attr] = new Date().getTime();
  }
  removeAttribute(attr: string) {
    delete this.attributes[attr];
    this._updated[attr] = new Date().getTime();
  }

  setStyle(style: string) {
    if( !style )
      return;
    this.style = style;
    this._updated._style = new Date().getTime();
  }
  addStyle(style: string) {
    if( !style )
      return;
    this.style += ';' + style;
    this._updated._style = new Date().getTime();
  }

  // manipulate nodes
  append(...nodes: (VirtualDOMNode | string)[]) {
    for( const item of nodes ) {
      if( item instanceof VirtualDOMNode ) {
        if( item._linked && !this._hasLinkedVNode )
          this._hasLinkedVNode = true;
        item._parent = this;
      }
      this.childNodes.push(item);
    }
    this._updated._html = new Date().getTime();
  }
  remove() {}

  html(html: string, escapeHTML = false) {
    this.childNodes.length = 0;
    if( escapeHTML ) {
      html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    this.childNodes.push(html);
    this._updated._html = new Date().getTime();
  }

  linkRealElement(node: HTMLElement, parseChildren?: boolean, readClasses?: boolean) {
    this._realElement = node;
    this._linked = true;
    this.clearUpdate();

    //this.classNames.length = 0;
    if( readClasses ) {
      const cstring = node.className.toLowerCase().replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
      if( cstring ) {
        this.className = cstring;
      }
    }

    if( !parseChildren )
      return;
    
    for( const child of this.childNodes ) {
      if( !(child instanceof VirtualDOMNode) )
        continue;
      
      const realChildElement = node.all(child.id, 0);
      if( realChildElement ) {
        child.linkRealElement(realChildElement as HTMLElement, true, readClasses);
      }
    }
  }
  linkRealElementFromParent() {
    if( !this._parent )
      throw new Error(`need a parent node to link to real DOM element. "${this.label}"`);
    
    const parentElement = this._parent.getRealElement(true);
    if( !parentElement )
      throw new Error(`the VirtualDOMNode is not connected to any real DOM tree. ${this._parent.label}`);
    
    const childElement = IE_Version.MSIE <= 7 ? parentElement.all(this.id, 0) : parentElement.all(this.id);
    if( !childElement )
      throw new Error(`could not found the VirttualDOMNode in the parent node tree. parent:"${this._parent.label}" child:"${this.label}"`);
    
    this.linkRealElement(childElement as HTMLElement);
  }
  isLinkedRealElement() {
    return this._linked;
  }
  /**
   * @param {boolean} [autolink=false]  link to real element automatically if it has not
   * @return {*}  {(HTMLElement | undefined)}
   * @memberof VirtualDOMNode
   */
  getRealElement(autolink = false): HTMLElement | undefined {
    if( autolink && !this._linked ) {
      this.linkRealElementFromParent();
    }
    return this._realElement;
  }
  updateRealElement(force = false): null | {[key: string]: boolean} {
    if( this._disposed )
      return null;
    let element = this._realElement;
    if( !element ) {
      if( !force )
        return null;
      element = this.getRealElement(true)!;
    }
    
    const updatedAttr: {[key: string]: boolean} = {};
    const clearedUpdatedRecord: { [key:string]: number } = {};
    for( const attr in this._updated ) {
      const timeStamp = this._updated[attr];
      if( !timeStamp )
        continue;

      console.log(`VNode#updateRealElement[${this.label}] "${attr}"`, 'blue');
      switch( attr ) {
        case '_html':
          if( this._hasLinkedVNode ) // prevent unexpected rewrite children of VirtualHTMLElements
            throw new Error(`VirtualHTMLElement#_realElement.innerHTML is not editable because a linked VirtualDOMNode exists in its childNodes.`);
          const html = (/*this._reservedStack ? this._childNodesForTrans :*/ this.childNodes).join('');
          element.innerHTML = html;
          updatedAttr['html'] = true;
          break;
        case '_class':
          const cstr = this.className;//this.className.join(' ');//(this._reservedStack ? this._classNamesToReserve : this.classNames).join(' ');
          if( cstr !== this._lastRealClasses ) {
            element.className = cstr;
            this._lastRealClasses = cstr;
            updatedAttr['class'] = true;
          }
          break;
        case '_style':
          if( this._lastRealStyle !== this.style ) {
            element.style.cssText = this.style;
            this._lastRealStyle = this.style;
            updatedAttr['style'] = true;
          }
          break;
        default:
          (this._realElement as any)[attr] = this.attributes[attr];
          updatedAttr[attr] = true;
          break;
      }

      // * if timeStamp is not equal to this._updated[attr] this time, _updated[attr] is changed in unexpected timing just before updating this._realElement.
      //   so re-record _updated[attr].
      if( timeStamp !== this._updated[attr] ) {
        clearedUpdatedRecord[attr] = new Date().getTime();
      }
    }
    // clear update record
    this._updated = clearedUpdatedRecord;
    
    //console.log(`#updateRealElemnt ${updatedAttr} updated.`);
    return updatedAttr;
  }
  clearUpdate() { 
    this._updated = {};
  }
  toString(): string {
    const attrs: string[] = [];
    const attributes = this.attributes;
    for( const prop in attributes ) {
      attrs.push(` ${prop}="${attributes[prop]}"`);
    }
    const classes = this.className.length ? ` class="${this.className}"` : '';
    const style = this.style ? ` style="${this.style}"` : '';

    return `<${this.nodeName} id="${this.id}"${classes}${attrs.join('')}${style}>${this.childNodes.join('')}</${this.nodeName}>`;
  }

  dispose() {
    if( this._disposed )
      return;
    
    if( this._onfilterchange ) {
      this._realElement?.detachEvent('onfilterchange', this._onfilterchange as EventListener);
      this._onfilterchange = null as any;
    }
    this._realElement = null as any;
    this._transitions = null as any;
    this._staticfilters = null as any;
    
    for( const child of this.childNodes ) {
      if( child instanceof VirtualDOMNode ) {
        child.dispose();
      }
    }
    this.childNodes.length = 0;
    this._disposed = true;
  }
}


type VNodeUpdaterQueueItem = {
  type: 'update' | 'consume' | 'apply' | 'play' | 'unreserve'
  node: VirtualDOMNode
  reservedNode?: VirtualDOMNode
  flip?: boolean
  label?: string
  onebyone?: boolean
  ontransitionend?: Function
} | {
  type: 'callback'
  callback: Function
};

class VirtualNodeUpdater {
  //private _qlist: { [key: number|string]: VNodeUpdaterQueueItem[] } = {};
  private _qlist: VNodeUpdaterQueueItem[] = [];

  private _delay = 0;
  private _hooked = false;
  private _tid: any = -1; // timeout id
  
  private _beforeCallbacks: Function[] = [];
  private _afterCallbacks: Function[] = [];

  constructor(delay: number = 0) {
    this._delay = delay;
    this.clear();
  }
  
  hook() {
    // if delay is negative, users should manually call process function
    if( this._delay < 0 )
      return;
    
    if( !this._hooked ) {
      this._tid = setTimeout(() => this.process(), this._delay);
      this._hooked = true;
    }
  }
  clear() {
    clearTimeout(this._tid);
    this._qlist.length = 0;
  }
  update(vnodes: VirtualDOMNode | (VirtualDOMNode | undefined)[], priority: number = 0) {
    if( !(vnodes instanceof Array) )
      vnodes = [vnodes];
    for( const node of vnodes ) {
      if( node ) {
        this.queue({type:'update', node}, priority);
      }
    }

    /*
    if( IE_Version.OS === '98' ) {
      this.update(null, new Function as any);
      return;
    }
    */

    this.hook();
  }
  /*
  reserve(vnode: VirtualDOMNode, flag: boolean = true, priority: number = 0) {
    if( flag ) {
      console.log('VNodeUpdater#reserve: true', 'skyblue');
      vnode.reserve(true);
    }
    else
      this.queue({type:'unreserve', node:vnode, label:vnode.label}, priority);
  }
  */
  consumeQueuedClass(vnode: VirtualDOMNode, onebyone?: boolean) {
    this.queue({type:'consume', node:vnode, onebyone});
  }
  apply(vnode: VirtualDOMNode) {
    this.queue({type:'apply', node:vnode, label:vnode.label});
  }
  play(vnode: VirtualDOMNode, ontransitionend?:Function) {
    this.queue({type: 'play', node:vnode, ontransitionend});
  }
  callback(func: Function) {
    this.queue({type: 'callback', callback:func});
  }
  queue(qitem: VNodeUpdaterQueueItem, priority?: number) {
    //console.log(`VNodeUpdater#queue (${qitem.type}) p:${priority}`, 'skyblue');
    const list = this._qlist;//[qitem.type];
    list.push(qitem);
    this.hook();
  }

  process() {
    this._hooked = false;

    for( const callback of this._beforeCallbacks ) {
      callback();
    }
    
    /*
    // sort list by priority
    const allList = [];
    for( const priority in this._qlist ) {
      allList.push({priority, list:this._qlist[priority]});
    }
    //allList.sort((a:any, b:any) => a.piority - b.piority);
    */
    const order: VNodeUpdaterQueueItem["type"][] = ['update', 'apply', 'consume', 'play', 'callback'];
    
    for( const qtype of order ) {
      //const priority = Number(litem.priority);
      const list = this._qlist;//litem.list;
      //console.log(`VNodeUpdater#update len:${list.length} qtype:${qtype} start ====>`, "cyan");
      const len = list.length;
      const uid_cache = {} as any;
      for( let i=0; i < list.length; i++ ) {
      //while( list.length ) {
        //const item = list.shift();
        const item = list[i];
        if( item.type !== qtype )
          continue;
        
        switch(item.type) {
          case 'update': {
            //console.log(`update(${qtype}): (${item.node.label}) ${/*item.node.isReserved()?'[reserved]':*/''}`, 'cyan');
            const vnode = item.node;
            
            const tmp = vnode.updateRealElement(true);
            //tmp && tmp['class'] && console.log(`(${item.node.label}): ${vnode.getRealElement()?.className}`, 'cyan');
            break;
          }
          case 'apply':
            //console.log(`apply(${qtype}) (${item.node.label})`, "purple");
            if( !uid_cache[item.node.uniqueId] ) {
              item.node.apply();
              uid_cache[item.node.uniqueId] = true;
            }
            break;
          case 'play': {
            if( !uid_cache[item.node.uniqueId] ) {
              item.node.play(item.ontransitionend);
              item.node.clearTransitions();

              uid_cache[item.node.uniqueId] = true;
            }

            break;
          }
          case 'consume':
            //console.log(`consume(${qtype}) (${item.node.label})`, "purple");
            if( item.node.consumeQueuedClasses(item.onebyone) ) {
              const tmp = item.node.updateRealElement(true);
              //tmp && tmp['class'] && console.log(`(${item.node.label}): ${item.node.getRealElement()?.className}`, 'cyan');
            }
            break;
          case 'callback':
            item.callback();
            break;
          default:
            continue;
        }

        list.splice(i--, 1);
      }
      //console.log(`VNodeUpdater#update priority:${qtype} <============ end`, "cyan");
      
      /*
      else
        delete this._qlist[priority as any];
      */
    }
    
    for( const callback of this._afterCallbacks ) {
      callback();
    }

    if( this._qlist.length ) {
      console.log(`queue remain ${this._qlist.length}`, 'skyblue');
      this.hook();
    }
  }

  addListener(handler:'before' | 'after', callback: Function) {
    if( handler === 'before' )
      this._beforeCallbacks.push(callback);
    else
      this._afterCallbacks.push(callback);
  }
}


type TransitionFilterType = {
  play:(d?:number)=>{}
  apply:()=>{}
  stop:()=>{}
  enabled:boolean
  duration:number
  percent:number
  status:number
};
function getAndApplyTransitions(element: HTMLElement, switchStaticFilters: boolean = false): {transitions:{filter:TransitionFilterType, type:string}[], statics:TransitionFilterType[], flip: boolean} {
  const appliedList: {filter:TransitionFilterType, type:string}[] = [];
  const staticList: TransitionFilterType[] = [];

  // check if it has a transition filter
  const filters = element.filters;
  const filterText = String(element.currentStyle.filter || '');
  const matches = filterText.match(/DXImageTransform\.Microsoft\.(barn|blinds|checkerboard|fade|gradientwipe|iris|inset|pixelate|strips|stretch|spiral|slide|randombars|radialwipe|randomdissolve|wheel|zigzag|BlendTrans|RevealTrans|Compositor)/gi) || [];
  const flip = /\b_flip\([^)]*\)/i.test(filterText);
  
  /*
  // apply transitions
  for( const filter of filters ) {
    try {
      filter.apply();
      appliedList.push({filter: filter, type: '_transName'});
    } catch(e) {
      staticList.push(filter);
    }
  }
  */

  for( const transName of matches ) {
    try {
      const trans = filters.item(transName) as TransitionFilterType;
      if( !trans )
        continue;
      //if( trans.percent !== 0 || trans.status !== 0 )
      //  continue;
      trans.apply();
      appliedList.push({filter:trans, type:transName});
    } catch(e) {
      console.log(`unexpected filter name "${transName}"`, 'red');
    }
  }
  
  if( flip ) {
    let transFoundCount = 0;
    const len = filters.length;
    if( len > appliedList.length ) {
      for( let i = len; i--; ) {
        const f = filters[i];
        if( transFoundCount >= appliedList.length || f.status === 0 ) {
          staticList.push(f);
        }
        else
          transFoundCount++;
      }
    }
  }
  
  return {
    transitions: appliedList,
    statics: staticList,
    flip
  };
}

function normalizeClassText(text: string): string {
  return text.toLowerCase().replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
}
function escapeReLetters(text: string) {
  return text.replace(/(?=[$\\.*+?()\[\]{}|^])/g, '\\');
}

export { VirtualDOMNode, VirtualNodeUpdater }
