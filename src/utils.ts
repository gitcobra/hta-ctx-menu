/** 
 * IE version
 * Trident: 4.0=IE8, 5.0=IE9, 6.0=IE10, 7.0=IE11
 *
 */
const IE_Version = {
  MSIE: 0,
  Trident: 0,
  real: 0,
  OS: '',
};
IE_Version.MSIE = Number( navigator.appVersion.match(/MSIE ([\d.]+)/)?.[1] ) || 11;
IE_Version.Trident = Number( navigator.appVersion.match(/Trident\/([\d.]+)/)?.[1] );
IE_Version.OS = navigator.appVersion.match(/Windows (\d+|CE|NT [\d\.]+)/)?.[1];
IE_Version.real = (() => {
  switch(IE_Version.Trident|0) {
    case 4:
      return 8;
    case 5:
      return 9;
    case 6:
      return 10;
    case 7:
      return 11;
    default:
      return IE_Version.MSIE;
  }
})();



// logger
let _log: Function = function(){};
const _console = typeof console !== 'undefined' ? console : {
  log (...args: any) {
    _log(...args);
  },
  time () {},
  timeEnd() {},
  setLogger(func: Function) {
    _log = func;
  }
};
// IE10 lacks console.time ?
if( IE_Version.MSIE === 10 ) {
  _console.time = _console.timeEnd = _console.log;
}


// bind this
function bind(thisObj: object | null, func: Function): (...args:any) => any {
  var args = Array.prototype.slice.call(arguments, 2);
  return function(){
    var funcArgs = args.concat(Array.prototype.slice.call(arguments))
    return func.apply(thisObj, funcArgs);
  };
}

// simple queue creator
class Queue {
  private _started: boolean = false;
  private _list: {
    type: "next" | "resolve" | "catch" | "sleep",
    [key: string]: any,
    callback?: Function,
  }[] = [];
  private _manualStart: boolean = false;
  private _queueTimeoutId: number = -1;
  
	constructor(manualStart?: boolean) {
    this._manualStart = !!manualStart;
    this._checkAutoStart();
	}
  
  start() {
    if( this._started )
      return;
    
    this._started = true;
    this._queueTimeoutId = window.setTimeout(() => this._processNext(), 0);
    return true;
  }
  stop() {
    //console.log(`Queue#stop ${this._list.length}`, 'green');
    this._started = false;
    clearTimeout(this._queueTimeoutId);
  }
  clear() {
		this.stop();
    this._list.length = 0;
	}
  isActive(): boolean {
    return !!(this._started && this._list.length);
  }

  next(callback: (value: any, repeat:(msec:number)=>void) => void|any): this {
    this._list.push({type:'next', callback});
    this._checkAutoStart();
    return this;
  }
  resolve(callback: (value: any, resolve:(value:any)=>void) => void): this {
    this._list.push({type:'resolve', callback});
    this._checkAutoStart();
    return this;
  }

  catch(callback: (...args:any) => any): Queue {
    this._list.push({type:'catch', callback});
    this._checkAutoStart();
    return this;
  }
	sleep(msec: number, addFirst?: boolean) {
    this._list[!addFirst ? 'push' : 'unshift']({type:'sleep', delay: msec});
    this._checkAutoStart();
    return this;
  }

  private _checkAutoStart() {
    if( !this._manualStart ) {
      this.start();
    }
  }
  // process the queue
  private _processNext(passedValue?: any) {
    //console.log(`Queue#_processNext length:${this._list.length} val:${passedValue}`, 'green');
    const item = this._list.shift();
    if( !item ) {
      this.stop();
      return;
    }
    
    let nextValue;
    let nextDelay = 0;
    let alreadyConsumed = false;
    let repeat = -1;
    
    const hookNextItem = (passedValue: any) => {
      if( alreadyConsumed )
        return;
      
      // repeat the callback if repeat is greater than or equal 0
      if( repeat >= 0 ) {
        this._list.unshift(item);
        nextDelay = repeat;
      }

      this._queueTimeoutId = window.setTimeout(() => this._processNext(passedValue), nextDelay);
      alreadyConsumed = true;
    };
    
    const type = item.type;
    switch( type ) {
      case 'next':
      case 'resolve':
        try {
          if( type === 'next' )
            nextValue = item.callback!(passedValue, (msec: number = 0) => {repeat = msec});
          else if( type === 'resolve' ) {
            item.callback!(passedValue, (value: any) => {
              if( !this._started )
                return;
              nextValue = value;
              hookNextItem(nextValue);
            });
            return; // *interrupt here when type is "resolve"
          }
        } catch(e) {
          // search a catch queue when an exception occurs
          let caughtFlag = false;
          while( this._list.length ) {
            const citem = this._list.shift();
            if( citem.type !== 'catch' ) {
              continue;
            }
            nextValue = citem.callback?.(e, passedValue);
            caughtFlag = true;
            break;
          }
          // throw an Error if no "catch" items were found
          if( !caughtFlag ) {
            const message = `${(e as any).message}\ncallback: ${String(item.callback)}`;
            throw new Error(message);
          }
        }
        break;
      case 'sleep':
        nextDelay = item.delay;
        nextValue = passedValue;
        break;
      case 'catch':
        nextValue = passedValue;
        // just get rid of the catch queue
        break;
      default:
        throw new Error(`unexpected Queue type "${item.type}"`);
    }
    
    hookNextItem(nextValue);
  }
}






// simplify attaching or detaching event listeners
class EventAttacher {
  private _element: HTMLElement | Window | Document;
  private _this: object | null;
  private _listeners: [string, EventListener, EventListener][] = [];
  private _IE11 = false; // use addEventListener instead if the element is in IE11 or later
  constructor(element: EventAttacher['_element'], thisObj?: object, IE11 = false) {
    this._element = element;
    this._this = thisObj || null;
    this._IE11 = IE11;
  }
  attach(handler:string, callback:EventListener) {
    const listener = this._this ? bind(this._this, callback) : callback;
    if( !this._IE11 )
      this._element.attachEvent(handler, listener);
    else
      this._element.addEventListener(handler.substring(2), listener);
    
    this._listeners.push([handler, callback, listener]);
  }
  detach(handler:string, target:EventListener) {
    for( const [handler, callback, listener] of this._listeners ) {
      if( target === callback ) {
        if( !this._IE11 )
          this._element.detachEvent(handler, listener);
        else // @ts-ignore
          this._element.removeEventListener(handler, listener);
        return true;
      }
    }
    return false;
  }
  detachAll() {
    for( const [handler, ,listener] of this._listeners ) {
      if( !this._IE11 )
        this._element.detachEvent(handler, listener);
      else // @ts-ignore
        this._element.removeEventListener(handler, listener);
    }
    this._listeners.length = 0;
  }
  element() {
    return this._element;
  }
  dispose() {
    this.detachAll();
    this._element = null as any;
    this._this = null;
  }
}














export { Queue, EventAttacher }
export { _console as console, IE_Version, bind }
