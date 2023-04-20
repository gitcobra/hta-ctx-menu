/*
  title: hta-ctx-menu
  version: 0.0.15
  github: https://github.com/gitcobra/hta-ctx-menu
*/
var HTAContextMenu = (function () {
    'use strict';

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var _a$1, _b$1, _c;
    /**
     * IE version
     * Trident: 4.0=IE8, 5.0=IE9, 6.0=IE10, 7.0=IE11
     *
     */
    var IE_Version = {
        MSIE: 0,
        Trident: 0,
        real: 0,
        OS: ''
    };
    IE_Version.MSIE = Number((_a$1 = navigator.appVersion.match(/MSIE ([\d.]+)/)) === null || _a$1 === void 0 ? void 0 : _a$1[1]) || 11;
    IE_Version.Trident = Number((_b$1 = navigator.appVersion.match(/Trident\/([\d.]+)/)) === null || _b$1 === void 0 ? void 0 : _b$1[1]);
    IE_Version.OS = (_c = navigator.appVersion.match(/Windows (\d+|CE|NT [\d\.]+)/)) === null || _c === void 0 ? void 0 : _c[1];
    IE_Version.real = (function () {
        switch (IE_Version.Trident | 0) {
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
    var _log = function () { };
    var _console = typeof console !== 'undefined' ? console : {
        log: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _log.apply(void 0, args);
        },
        time: function () { },
        timeEnd: function () { },
        setLogger: function (func) {
            _log = func;
        }
    };
    // IE10 lacks console.time ?
    if (IE_Version.MSIE === 10) {
        _console.time = _console.timeEnd = _console.log;
    }
    // bind this
    function bind(thisObj, func) {
        var args = Array.prototype.slice.call(arguments, 2);
        return function () {
            var funcArgs = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(thisObj, funcArgs);
        };
    }
    // simple queue creator
    var Queue = /** @class */ (function () {
        function Queue(manualStart) {
            this._started = false;
            this._list = [];
            this._manualStart = false;
            this._queueTimeoutId = -1;
            this._manualStart = !!manualStart;
            this._checkAutoStart();
        }
        Queue.prototype.start = function () {
            var _this_1 = this;
            if (this._started)
                return;
            this._started = true;
            this._queueTimeoutId = window.setTimeout(function () { return _this_1._processNext(); }, 0);
            return true;
        };
        Queue.prototype.stop = function () {
            //console.log(`Queue#stop ${this._list.length}`, 'green');
            this._started = false;
            clearTimeout(this._queueTimeoutId);
        };
        Queue.prototype.clear = function () {
            this.stop();
            this._list.length = 0;
        };
        Queue.prototype.isActive = function () {
            return !!(this._started && this._list.length);
        };
        Queue.prototype.next = function (callback) {
            this._list.push({ type: 'next', callback: callback });
            this._checkAutoStart();
            return this;
        };
        Queue.prototype.resolve = function (callback) {
            this._list.push({ type: 'resolve', callback: callback });
            this._checkAutoStart();
            return this;
        };
        Queue.prototype["catch"] = function (callback) {
            this._list.push({ type: 'catch', callback: callback });
            this._checkAutoStart();
            return this;
        };
        Queue.prototype.sleep = function (msec, addFirst) {
            this._list[!addFirst ? 'push' : 'unshift']({ type: 'sleep', delay: msec });
            this._checkAutoStart();
            return this;
        };
        Queue.prototype._checkAutoStart = function () {
            if (!this._manualStart) {
                this.start();
            }
        };
        // process the queue
        Queue.prototype._processNext = function (passedValue) {
            var _this_1 = this;
            var _a;
            //console.log(`Queue#_processNext length:${this._list.length} val:${passedValue}`, 'green');
            var item = this._list.shift();
            if (!item) {
                this.stop();
                return;
            }
            var nextValue;
            var nextDelay = 0;
            var alreadyConsumed = false;
            var repeat = -1;
            var hookNextItem = function (passedValue) {
                if (alreadyConsumed)
                    return;
                // repeat the callback if repeat is greater than or equal 0
                if (repeat >= 0) {
                    _this_1._list.unshift(item);
                    nextDelay = repeat;
                }
                _this_1._queueTimeoutId = window.setTimeout(function () { return _this_1._processNext(passedValue); }, nextDelay);
                alreadyConsumed = true;
            };
            var type = item.type;
            switch (type) {
                case 'next':
                case 'resolve':
                    try {
                        if (type === 'next')
                            nextValue = item.callback(passedValue, function (msec) {
                                if (msec === void 0) { msec = 0; }
                                repeat = msec;
                            });
                        else if (type === 'resolve') {
                            item.callback(passedValue, function (value) {
                                if (!_this_1._started)
                                    return;
                                nextValue = value;
                                hookNextItem(nextValue);
                            });
                            return; // *interrupt here when type is "resolve"
                        }
                    }
                    catch (e) {
                        // search a catch queue when an exception occurs
                        var caughtFlag = false;
                        while (this._list.length) {
                            var citem = this._list.shift();
                            if (citem.type !== 'catch') {
                                continue;
                            }
                            nextValue = (_a = citem.callback) === null || _a === void 0 ? void 0 : _a.call(citem, e, passedValue);
                            caughtFlag = true;
                            break;
                        }
                        // throw an Error if no "catch" items were found
                        if (!caughtFlag) {
                            var message = "".concat(e.message, "\ncallback: ").concat(String(item.callback));
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
                    throw new Error("unexpected Queue type \"".concat(item.type, "\""));
            }
            hookNextItem(nextValue);
        };
        return Queue;
    }());
    // simplify attaching or detaching event listeners
    var EventAttacher = /** @class */ (function () {
        function EventAttacher(element, thisObj, IE11) {
            if (IE11 === void 0) { IE11 = false; }
            this._listeners = [];
            this._IE11 = false; // use addEventListener instead if the element is in IE11 or later
            this._element = element;
            this._this = thisObj || null;
            this._IE11 = IE11;
        }
        EventAttacher.prototype.attach = function (handler, callback) {
            var listener = this._this ? bind(this._this, callback) : callback;
            if (!this._IE11)
                this._element.attachEvent(handler, listener);
            else
                this._element.addEventListener(handler.substring(2), listener);
            this._listeners.push([handler, callback, listener]);
        };
        EventAttacher.prototype.detach = function (handler, target) {
            for (var _i = 0, _a = this._listeners; _i < _a.length; _i++) {
                var _b = _a[_i], handler_1 = _b[0], callback = _b[1], listener = _b[2];
                if (target === callback) {
                    if (!this._IE11)
                        this._element.detachEvent(handler_1, listener);
                    else // @ts-ignore
                        this._element.removeEventListener(handler_1, listener);
                    return true;
                }
            }
            return false;
        };
        EventAttacher.prototype.detachAll = function () {
            for (var _i = 0, _a = this._listeners; _i < _a.length; _i++) {
                var _b = _a[_i], handler = _b[0], listener = _b[2];
                if (!this._IE11)
                    this._element.detachEvent(handler, listener);
                else // @ts-ignore
                    this._element.removeEventListener(handler, listener);
            }
            this._listeners.length = 0;
        };
        EventAttacher.prototype.element = function () {
            return this._element;
        };
        EventAttacher.prototype.dispose = function () {
            this.detachAll();
            this._element = null;
            this._this = null;
        };
        return EventAttacher;
    }());

    var _a, _b;
    var AllMenuTypesList = ['normal', 'radio', 'checkbox', 'separator', 'submenu', 'popup', 'demand', 'radios'];
    function convertCheckableIconPairParam(param) {
        if (param instanceof Array) {
            if (param.length !== 2)
                throw new Error("CheckableIconPair must be [IconSettingType, IconSettingType]");
            return param;
        }
        var icon = param;
        var blank = {};
        if (!icon.path && !icon.text)
            throw new Error("pairIcons parameter must be type CheckableIconPair");
        // copy props 
        for (var p in icon) {
            blank[p] = icon[p];
        }
        // set blank flag for the unchecked icon
        blank.blank = true;
        return [icon, blank];
    }
    var _MenuModel_uniqueId = 0;
    /**
     * base menu item class.
     * all menu items are descended from this.
     * @abstract
     * @class _MenuModelBase
     */
    var _MenuModelBase = /** @class */ (function () {
        function _MenuModelBase(args, parent, demanded) {
            if (demanded === void 0) { demanded = false; }
            this._uniqueId = 'uid_' + String(++_MenuModel_uniqueId);
            this._index = -1;
            this._customClassNames = [];
            this._isDynamicallyProduced = false; // true if it was produced by type demand item
            this._menuModelEventListeners = {};
            this._listenerIdCounter = 0;
            //this._type = args.type || 'normal';
            if (args.type && !RegExp('\\b' + args.type + '\\b', 'i').test(AllMenuTypesList)) {
                this._unexpectedTypeError();
            }
            this._parent = parent;
            //this._name = args.name;
            this._id = args.id;
            if (demanded || (parent === null || parent === void 0 ? void 0 : parent.isDynamicallyProduced())) {
                this._isDynamicallyProduced = true;
            }
            if ('customClass' in args) {
                var classNames = [];
                var cstr = String(args.customClass).replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
                if (!/((^|\s)\S+)$/.test(cstr))
                    throw new Error("classNames parameter must be a space separated string. \"".concat(cstr, "\""));
                var classes = cstr.split(' ');
                for (var _i = 0, classes_1 = classes; _i < classes_1.length; _i++) {
                    var name_1 = classes_1[_i];
                    classNames.push(name_1);
                }
                this._customClassNames = classNames;
            }
        }
        _MenuModelBase.prototype._unexpectedTypeError = function () {
            throw new Error("type \"".concat(this._type, "\" could not be applied to \"").concat(String(this.constructor).replace(/^function\s+([^(]+)[\s\S]+$/, '$1'), "\" class"));
        };
        _MenuModelBase.prototype.getType = function () {
            return this._type;
        };
        _MenuModelBase.prototype.getId = function () {
            return this._id;
        };
        _MenuModelBase.prototype.getUniqueId = function () {
            return this._uniqueId;
        };
        _MenuModelBase.prototype.getCustomClassNames = function () {
            return this._customClassNames;
        };
        _MenuModelBase.prototype.getFlags = function () {
            return {};
        };
        _MenuModelBase.prototype.getIcon = function () { return undefined; };
        _MenuModelBase.prototype.getLabel = function () { };
        _MenuModelBase.prototype.getIndex = function () {
            return this._index;
        };
        _MenuModelBase.prototype.setIndex = function (num) {
            return this._index = num;
        };
        _MenuModelBase.prototype.isDynamicallyProduced = function () {
            return this._isDynamicallyProduced;
        };
        _MenuModelBase.prototype.getRealParentSubmenu = function () {
            return !this._parent ? null : this._parent.isDynamicallyProduced() ? this._parent.getRealParentSubmenu() : this._parent;
        };
        /**
         * set internal model event listeners
         * @param {MenuModelEventNames} handler
         * @param {Function} listener
         * @memberof MenuModel
         */
        _MenuModelBase.prototype.addMenuModelEvent = function (handler, listener) {
            var listeners = this._menuModelEventListeners[handler] = this._menuModelEventListeners[handler] || {};
            listeners[this._listenerIdCounter] = listener;
            return this._listenerIdCounter++;
        };
        _MenuModelBase.prototype.removeMenuModelEvent = function (handler, listenerId) {
            var listeners = this._menuModelEventListeners[handler] = this._menuModelEventListeners[handler] || {};
            if (listeners[listenerId]) {
                delete listeners[listenerId];
                return true;
            }
            return false;
        };
        /**
         * fire events
         * @param {string} handler
         */
        _MenuModelBase.prototype.fireMenuModelEvent = function (handler) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            for (var ename in this._menuModelEventListeners) {
                if (ename !== handler)
                    continue;
                var listeners = this._menuModelEventListeners[ename];
                for (var id in listeners) {
                    listeners[Number(id)].apply(listeners, args);
                }
            }
        };
        // type guards
        _MenuModelBase.prototype.isNormal = function () {
            return this instanceof MenuNormal;
        };
        _MenuModelBase.prototype.isSubmenu = function () {
            return this instanceof MenuSubmenu;
        };
        _MenuModelBase.prototype.isPopup = function () {
            return this instanceof MenuPopup;
        };
        _MenuModelBase.prototype.isCheckable = function () {
            return this instanceof _MenuCheckable;
        };
        _MenuModelBase.prototype.isRadio = function () {
            return this instanceof MenuRadio;
        };
        _MenuModelBase.prototype.isCheckbox = function () {
            return this instanceof MenuCheckbox;
        };
        _MenuModelBase.prototype.isSeparator = function () {
            return this instanceof MenuSeparator;
        };
        _MenuModelBase.prototype.isDemandable = function () {
            return this instanceof MenuDemand;
        };
        _MenuModelBase.prototype.$L = function () {
            if (this._parent)
                return "L(".concat(this._parent.getLayer(), ")i[").concat(this._index, "]");
            else
                return "L(R)";
        };
        _MenuModelBase.prototype.dispose = function () {
            // 
        };
        return _MenuModelBase;
    }());
    /**
     * MenuNormal items have basic menu item functions
     * @class MenuNormal
     * @extends {_MenuModelBase}
     */
    var MenuNormal = /** @class */ (function (_super) {
        __extends(MenuNormal, _super);
        function MenuNormal(args, parent, demanded) {
            var _this = this;
            var _c, _d;
            _this = _super.call(this, args, parent, demanded) || this;
            _this._type = 'normal';
            _this._useHTML = false;
            _this._union = false; // no left and right padding spaces
            _this._unselectable = false; // unselectable items will not be highlighted
            _this._disabled = false; // disabled
            _this._unlistening = false;
            _this._hold = false; // hold on after a clickable item was clicked
            _this._unholdByDblclick = false; // when hold is true, close menu by double click or enter key
            _this._holdParent = false; // when an item is clicked, hold on parent menu
            _this._flash = 0; // flash in some msec after clicking the item
            _this._ignoreGlobalEvents = false;
            _this._ignoreErrors = false;
            _this._selected = false;
            var param = args;
            _this._label = String(args.label);
            _this._icon = 'icon' in args ? args.icon : undefined;
            _this._title = param.title;
            // flags
            _this._union = !!param.union;
            _this._hold = (_d = (_c = param.hold) !== null && _c !== void 0 ? _c : parent === null || parent === void 0 ? void 0 : parent._hold) !== null && _d !== void 0 ? _d : false;
            _this._holdParent = !!param.holdParent;
            _this._unholdByDblclick = !!param.unholdByDblclick;
            _this._disabled = !!param.disabled;
            _this._unselectable = !!param.unselectable;
            _this._unlistening = !!param.unlistening;
            _this._flash = param.flash || 0;
            _this._useHTML = !!param.html;
            // events
            _this.onclick = param.onclick;
            _this.ondblclick = param.ondblclick;
            _this.onhighlight = param.onhighlight;
            _this.onactivate = param.onactivate;
            _this._ignoreGlobalEvents = !!param.ignoreGlobalEvents;
            _this._ignoreErrors = !!param.ignoreErrors;
            return _this;
        }
        /**
         * fire user events such as onclick, onchange, etc
         */
        MenuNormal.prototype.fireUserEvent = function (handler, ctx, eventObj) {
            var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            if (this._unlistening)
                return;
            var notFired = false;
            try {
                switch (handler) {
                    case 'activate':
                        (_c = this.onactivate) === null || _c === void 0 ? void 0 : _c.call(this, eventObj, ctx);
                        break;
                    case 'click':
                        (_d = this.onclick) === null || _d === void 0 ? void 0 : _d.call(this, eventObj, ctx);
                        break;
                    case 'dblclick':
                        (_e = this.ondblclick) === null || _e === void 0 ? void 0 : _e.call(this, eventObj, ctx);
                        break;
                    case 'change': {
                        if (this.isCheckable()) {
                            if (this.getType() === 'radio') {
                                // indivisual onchange
                                (_f = this.onchange) === null || _f === void 0 ? void 0 : _f.call(this, eventObj, ctx);
                            }
                            else
                                (_g = this.onchange) === null || _g === void 0 ? void 0 : _g.call(this, eventObj, ctx);
                        }
                        break;
                    }
                    case 'highlight':
                        (_h = this.onhighlight) === null || _h === void 0 ? void 0 : _h.call(this, eventObj, ctx);
                        break;
                    case 'beforeload':
                        if (this.isSubmenu())
                            (_j = this.onbeforeload) === null || _j === void 0 ? void 0 : _j.call(this, eventObj, ctx);
                        break;
                    case 'load':
                        if (this.isSubmenu())
                            (_k = this.onload) === null || _k === void 0 ? void 0 : _k.call(this, eventObj, ctx);
                        break;
                    case 'unload':
                        if (this.isSubmenu())
                            (_l = this.onunload) === null || _l === void 0 ? void 0 : _l.call(this, eventObj, ctx);
                        break;
                    default:
                        notFired = true;
                }
            }
            catch (e) {
                if (!this._ignoreErrors)
                    alert("an error occurred while firing an user event.\n\nhandler: \"on".concat(handler, "\"\nlayer: ").concat((_m = this._parent) === null || _m === void 0 ? void 0 : _m.getLayer(), "\nindex: ").concat(this._index, "\ntype: ").concat(this._type, "\nlabel: \"").concat(this.getLabel().replace(/[\r\n]/g, ''), "\"\nmessage: ").concat(e.message));
            }
            //if( !notFired )
            //  console.log('FIRED!', 'red');
            // fire global user events
            if (eventObj.cancelGlobal !== true && !this._ignoreGlobalEvents) {
                if (this.isNormal()) {
                    try {
                        (_p = (_o = this._parent) === null || _o === void 0 ? void 0 : _o.getGlobalEvent(handler)) === null || _p === void 0 ? void 0 : _p(eventObj, ctx);
                    }
                    catch (e) {
                        if (!this._ignoreErrors)
                            alert("an error occurred while firing an global user event.\n\nhandler: \"on".concat(handler, "\"\nlayer: ").concat((_q = this._parent) === null || _q === void 0 ? void 0 : _q.getLayer(), "\nindex: ").concat(this._index, "\ntype: ").concat(this._type, "\nlabel: \"").concat(this.getLabel().replace(/[\r\n]/g, ''), "\"\nmessage: ").concat(e.message));
                    }
                }
            }
            // dispose event object
            eventObj.dispose();
        };
        MenuNormal.prototype.setLabel = function (label, asHtml) {
            var beforeLabel = this._label;
            this._label = label;
            this.fireMenuModelEvent('label', label, beforeLabel);
        };
        MenuNormal.prototype.getLabel = function (asHtml) {
            return this._label;
        };
        MenuNormal.prototype.setIcon = function (icon) {
            this._applyIcon(icon);
        };
        MenuNormal.prototype._applyIcon = function (icon) {
            var before = this._icon;
            this._icon = icon;
            this.fireMenuModelEvent('icon', icon, before);
        };
        MenuNormal.prototype.getIcon = function () {
            return this._icon;
        };
        MenuNormal.prototype.hasUsersIcon = function () {
            return !!this._icon;
        };
        /**
         * get item flags
         * @return {*}
         * @memberof MenuNormal
         */
        MenuNormal.prototype.getFlags = function () {
            return {
                union: this._union,
                hold: this._hold,
                unholdByDblclick: this._unholdByDblclick,
                holdParent: this._holdParent,
                flash: this._flash,
                html: this._useHTML,
                unselectable: this._unselectable,
                disabled: this._disabled,
                unlistening: this._unlistening
            };
        };
        MenuNormal.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            //
        };
        return MenuNormal;
    }(_MenuModelBase));
    /**
     * radio or checkbox item
     * @abstract
     * @class MenuCheckable
     * @extends {MenuNormal}
     */
    var _MenuCheckable = /** @class */ (function (_super) {
        __extends(_MenuCheckable, _super);
        function _MenuCheckable(args, parent, demanded) {
            var _this = _super.call(this, args, parent, demanded) || this;
            _this._isNamed = false; // set the flag on if name is set by user
            _this._global = false; // group the same name items in the entire menus
            _this._checked = false; // checked flag for radio or checkbox
            _this._pairIcons = null; // checked, unchecked
            //this._parent = parent;
            //this._type = args.type;
            // set item name for a record
            var name;
            // user specified name
            if (args.name) {
                if (!/^\w/.test(args.name))
                    throw new Error("name parameter must be started with an alphabet. \"".concat(args.name, "\" is invalid."));
                _this._isNamed = true;
                name = String(args.name);
                //this._recordRepository = this.getRealParentSubmenu()!;
            }
            else {
                //throw new Error('a type "radio" or "checkbox" item needs "name" parameter');
                // generate name automatically
                name = args.type === 'radio' ? '!radio_noname' : '!checkbox_' + _MenuModel_uniqueId++;
            }
            _this._name = name;
            // use global repository for the name
            _this._global = !!args.global;
            _this._recordSubmenu = _this._global ? _this._parent.getRoot() : _this._parent;
            _this.onchange = args.onchange;
            _this._checked = !!args.checked;
            // user specified record object
            if (args.record) {
                if (typeof args.record !== 'object')
                    throw new Error("\"record\" parameter must be an object.");
                _this._record = args.record;
            }
            // generate a record
            else {
                _this._record = _this._parent.getNamedCheckableItemRecord(_this._name, _this._global);
            }
            // set item value
            _this._value = args.value;
            return _this;
            // update the icon
            //this.updateCheckableIcon(true);
        }
        _MenuCheckable.prototype.updateCheckableIcon = function (force) {
            var prev = this._previousChecked;
            var current = this._checked;
            if (prev !== current || force) {
                var icon = this._pairIcons || this._parent.getDefaultCheckableIcon(this._type) || this._defaultPairIcons;
                this._applyIcon(current ? icon[0] : icon[1]);
                this.fireMenuModelEvent('checked', current, this._value);
                this._previousChecked = current;
            }
        };
        _MenuCheckable.prototype.getFlags = function () {
            return __assign({ checked: this._checked, usericon: this.hasUsersIcon() }, _super.prototype.getFlags.call(this));
        };
        _MenuCheckable.prototype.getName = function () {
            return this._name;
        };
        _MenuCheckable.prototype.setValue = function (val) {
            this._value = val;
        };
        _MenuCheckable.prototype.getValue = function () {
            return this._value;
        };
        _MenuCheckable.prototype.isChecked = function () {
            return this._checked;
        };
        _MenuCheckable.prototype.isGlobal = function () {
            return this._global;
        };
        _MenuCheckable.prototype.getRecord = function () {
            return this._record;
        };
        _MenuCheckable.prototype.getRecordRopository = function () {
            return this._recordSubmenu;
        };
        _MenuCheckable.prototype.setIcon = function (icon, apply) {
            if (apply === void 0) { apply = true; }
            this._pairIcons = icon ? convertCheckableIconPairParam(icon) : null;
            if (apply)
                this.updateCheckableIcon(true);
        };
        _MenuCheckable.prototype.hasUsersIcon = function () {
            return !!(this._pairIcons || this._parent.getDefaultCheckableIcon(this._type));
        };
        _MenuCheckable.prototype.setChecked = function (flag) {
            var prev = this._checked;
            flag = typeof flag === 'undefined' ? !prev : !!flag; // flip if flag is undefined
            if (flag === prev)
                return false;
            var result = this._setChecked(flag, true); // work for each Checkable type
            if (result) {
                this.updateCheckableIcon();
            }
            return result;
        };
        return _MenuCheckable;
    }(MenuNormal));
    _a = _MenuCheckable;
    // prototype static properties
    (function () {
        _a.prototype._defaultPairIcons = [{ text: '\xfc', fontFamily: 'Wingdings' }, { text: '\xfc', fontFamily: 'Wingdings', blank: true }];
    })();
    var MenuCheckbox = /** @class */ (function (_super) {
        __extends(MenuCheckbox, _super);
        function MenuCheckbox(args, parent, demanded) {
            var _this = _super.call(this, args, parent, demanded) || this;
            _this._type = 'checkbox';
            // set the pair of icons
            if (args.checkboxIcon) {
                _this.setIcon(args.checkboxIcon, false);
            }
            if (typeof _this._record.checked === 'boolean')
                _this._checked = _this._record.checked;
            _this._record.checked = _this._checked;
            // update the icon
            _this.updateCheckableIcon(true);
            return _this;
        }
        MenuCheckbox.prototype._setChecked = function (flag, fromPublic) {
            if (fromPublic === void 0) { fromPublic = false; }
            this._checked = flag;
            if (fromPublic) {
                this._record.checked = flag;
                this._linkOtherCheckboxesInParents(flag);
            }
            this.updateCheckableIcon();
            return true;
        };
        MenuCheckbox.prototype._linkOtherCheckboxesInParents = function (flag) {
            var parent = this._parent;
            var global = this._global;
            while (parent) {
                var list = parent.getItemsByName(this._name);
                for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                    var item_1 = list_1[_i];
                    if (item_1 === this || !item_1.isCheckbox() || global !== item_1._global)
                        continue;
                    item_1._setChecked(flag);
                }
                parent = global ? parent.getParent() : null;
            }
        };
        MenuCheckbox.prototype.updateCheckedStatByRecord = function () {
            this._checked = !!this._record.checked;
            this.updateCheckableIcon();
        };
        return MenuCheckbox;
    }(_MenuCheckable));
    var MenuRadio = /** @class */ (function (_super) {
        __extends(MenuRadio, _super);
        function MenuRadio(args, parent, demanded) {
            var _this = _super.call(this, args, parent, demanded) || this;
            _this._type = 'radio';
            _this._uncheckable = false; // allow unckeck the radio button
            // set the pair of icons
            if (args.radioIcon) {
                _this.setIcon(args.radioIcon, false);
            }
            // initialize radio index
            //this._radioIndex = this._recordSubmenu.countRadioIndex(this._name);
            _this._radioIndex = _this._parent.countRadioIndex(_this._name, _this._global);
            // decide checked status
            if (_this._checked) {
                _this._record.selectedIndex = _this._radioIndex;
            }
            else {
                if (typeof _this._record.selectedIndex !== 'number')
                    _this._record.selectedIndex = 0;
                if (_this._record.selectedIndex === _this._radioIndex)
                    _this._checked = true;
            }
            _this._uncheckable = !!args.uncheckable;
            // update the icon
            _this.updateCheckableIcon(true);
            return _this;
        }
        MenuRadio.prototype.getRadioIndex = function () {
            return this._radioIndex;
        };
        MenuRadio.prototype.isUncheckable = function () {
            return this._uncheckable;
        };
        MenuRadio.prototype._setChecked = function (flag, fromPublic) {
            if (fromPublic === void 0) { fromPublic = false; }
            if (!flag) {
                if (fromPublic && !this._uncheckable)
                    return false;
                this._checked = false;
                if (fromPublic) {
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
        };
        /**
         * clear all other radios with same name
         * @private
         * @param {boolean} [recursive=false]
         * @memberof MenuRadio
         */
        MenuRadio.prototype._clearOtherRadios = function () {
            var parent = this._parent;
            var global = false;
            while (parent) {
                var list = parent.getItemsByName(this._name);
                for (var _i = 0, list_2 = list; _i < list_2.length; _i++) {
                    var item_2 = list_2[_i];
                    if (item_2 === this || !item_2.isRadio() || global && !item_2._global)
                        continue;
                    item_2._setChecked(false);
                }
                global = this._global;
                parent = global ? parent.getParent() : null;
            }
        };
        MenuRadio.prototype.updateCheckedStatByRecord = function () {
            this._checked = this._record.selectedIndex === this._radioIndex;
            this.updateCheckableIcon();
        };
        return MenuRadio;
    }(_MenuCheckable));
    /**
     * a MenuDemand can emit appropriate menu items dynamically on demand.
     * @class MenuDemand
     * @extends {_MenuModelBase}
     */
    var MenuDemand = /** @class */ (function (_super) {
        __extends(MenuDemand, _super);
        function MenuDemand(args, parent, demanded) {
            var _this = _super.call(this, args, parent, demanded) || this;
            _this._type = 'demand';
            if (args.type !== 'demand')
                _this._unexpectedTypeError();
            if (typeof args.ondemand !== 'function')
                throw new Error('type demand item needs ondemand event handler');
            _this.ondemand = args.ondemand;
            return _this;
        }
        /**
         * execute the ondemand callback
         * @param {*} [eventObj]
         * @return {*}  {MenuItemsCreateParameter[]}
         * @memberof MenuDemand
         */
        MenuDemand.prototype.extract = function (eventObj) {
            var _c;
            var resultParameter;
            try {
                var demanded = this.ondemand.call(this._parent, eventObj, eventObj.ctx) || [];
                if (demanded && typeof (demanded) !== 'object')
                    throw new Error('ondemand callback must returns an object type MenuItemsCreateParameter');
                if (demanded instanceof Array)
                    resultParameter = demanded;
                else
                    resultParameter = [demanded];
                for (var _i = 0, resultParameter_1 = resultParameter; _i < resultParameter_1.length; _i++) {
                    var param = resultParameter_1[_i];
                    if ((param === null || param === void 0 ? void 0 : param.type) === 'demand')
                        throw new Error('type "demand" item must returns other type parameter.');
                }
            }
            catch (e) {
                alert("an error occurred while extracting a demandable item\n\nmessage: ".concat(e.message, "\n\nparent label: \"").concat((_c = this._parent) === null || _c === void 0 ? void 0 : _c.getLabel(), "\""));
                resultParameter = [];
            }
            return resultParameter;
        };
        return MenuDemand;
    }(_MenuModelBase));
    /**
     * for a separator
     * @class MenuSeparator
     * @extends {_MenuModelBase}
     */
    var MenuSeparator = /** @class */ (function (_super) {
        __extends(MenuSeparator, _super);
        function MenuSeparator(param, parent, demanded) {
            var _this = _super.call(this, param, parent, demanded) || this;
            _this._type = 'separator';
            if (param.type !== 'separator')
                _this._unexpectedTypeError();
            return _this;
        }
        return MenuSeparator;
    }(_MenuModelBase));
    /**
     * MenuSubmenu contains all other menu items includes MenuSubmenu itself.
     * when it does not have parent MenuSubmenu, it is the root of all menus.
     * @class SubmenuItem
     * @extends {_MenuModelBase}
     */
    var MenuSubmenu = /** @class */ (function (_super) {
        __extends(MenuSubmenu, _super);
        function MenuSubmenu(param, parent /*, inheritOnly:boolean = false*/, demanded) {
            var _this = _super.call(this, param, parent, demanded) || this;
            _this._type = 'submenu';
            _this._items = []; // ready items to use
            _this._layer = 0;
            _this._flashItems = false;
            _this._customDialogClass = '';
            // have records for named child submenus because demandable items lose records after closed
            _this._namedCheckableItemRecords = {}; // records for MenuCheckable items
            _this._globalNamedCheckableItemRecords = null; // global records only for the root menu
            _this._radioCount = {};
            _this._globalRadioCount = null;
            _this._checkablePairIcons = {};
            _this._globalEvents = null;
            // default inheritance settings
            _this._inherit = {
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
                fontFamily: true
            };
            _this.onload = param.onload;
            _this.onbeforeload = param.onbeforeload;
            _this.onunload = param.onunload;
            _this._globalEvents = param.globalEvents;
            _this._skinCSSPath = param.skin;
            _this._cssText = param.cssText;
            _this._fontSize = param.fontSize;
            _this._fontFamily = param.fontFamily;
            _this._childLeftMargin = param.childLeftMargin;
            _this._arrowIcon = param.arrowIcon || _this._arrowIcon;
            if (param.checkboxIcon)
                _this._checkablePairIcons['checkbox'] = convertCheckableIconPairParam(param.checkboxIcon);
            if (param.radioIcon)
                _this._checkablePairIcons['radio'] = convertCheckableIconPairParam(param.radioIcon);
            var className = String(param.customDialogClass || '');
            if (className && !/(^\S+)$/.test(className))
                throw new Error("invalid customDialogClass parameter. \"".concat(className, "\""));
            _this._customDialogClass = className;
            if (typeof param.autoClose === 'boolean')
                _this._disableAutoClose = param.autoClose;
            // set inherit attributes from parent
            if (parent) {
                if (typeof param.inherit !== 'undefined') {
                    var _inherit = _this._inherit;
                    var pinherit = param.inherit;
                    for (var attr in _this._inherit) {
                        var key = attr;
                        if (typeof pinherit === 'boolean') {
                            // set all as the same flag if the value is boolean
                            _inherit[key] = pinherit;
                            continue;
                        }
                        if (key in pinherit === false)
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
            if (parent /*&& !inheritOnly*/) {
                _this._root = parent._root;
                _this._layer = parent._layer + 1;
            }
            else {
                _this._root = _this;
                _this._globalNamedCheckableItemRecords = {};
                _this._globalRadioCount = {};
            }
            _this._pre_items = _this._preCreateItems(param.items);
            return _this;
        }
        /**
         * create pre-items
         * MenuDemand items are not extracted yet at this time
         * @private
         * @param {(MenuItemsCreateParameter | MenuItemsCreateParameter[])} args
         * @memberof MenuSubmenu
         */
        MenuSubmenu.prototype._preCreateItems = function (args, demanded) {
            if (!(args instanceof Array))
                args = [args];
            var resultItems = [];
            for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
                var param = args_1[_i];
                if (!param)
                    continue;
                var type = param.type || 'normal';
                if (!RegExp('\\b' + type + '\\b', 'i').test(AllMenuTypesList))
                    throw new Error('unexpected menu type: ' + type);
                // extract radio group parameter
                else {
                    var item_3 = void 0;
                    var items = null;
                    switch (param.type) {
                        case 'radios':
                            items = this._extractRadiosParameter(param, demanded);
                            break;
                        case 'submenu':
                            item_3 = new MenuSubmenu(param, this, demanded);
                            break;
                        case 'popup':
                            item_3 = new MenuPopup(param, this, demanded);
                            break;
                        case 'checkbox':
                            item_3 = new MenuCheckbox(param, this, demanded);
                            break;
                        case 'radio':
                            item_3 = new MenuRadio(param, this, demanded);
                            break;
                        case 'separator':
                            item_3 = new MenuSeparator(param, this, demanded);
                            break;
                        case 'demand':
                            item_3 = new MenuDemand(param, this, demanded);
                            break;
                        case 'normal':
                        default:
                            item_3 = new MenuNormal(param, this, demanded);
                            break;
                    }
                    resultItems.push.apply(resultItems, (items || [item_3]));
                }
            }
            return resultItems;
        };
        MenuSubmenu.prototype._extractRadiosParameter = function (param, demanded) {
            var _c, _d;
            var list = [];
            if (param.hasOwnProperty('labels')) {
                var labels = param.labels;
                // generate radio names automatically if doesn't exist
                var name_2 = param.name || 'nonameradios_' + _MenuModel_uniqueId++;
                var selectedIndex = param.selectedIndex || -1;
                for (var i = 0; i < labels.length; i++) {
                    var label = void 0, checked = void 0, value = void 0, disabled = void 0, unselectable = void 0, unlistening = void 0;
                    label = labels[i];
                    if (!label)
                        continue;
                    if (label instanceof Array) {
                        _c = label, label = _c[0], value = _c[1], checked = _c[2];
                    }
                    else if (label instanceof Object) {
                        (_d = label, label = _d.label, checked = _d.checked, value = _d.value, unselectable = _d.unselectable, disabled = _d.disabled, unlistening = _d.unlistening);
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
                        name: name_2,
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
                        disabled: disabled,
                        unselectable: unselectable,
                        unlistening: unlistening,
                        radioIcon: param.radioIcon
                    }, this, demanded));
                }
            }
            return list;
        };
        /**
         * extract all MenuDemand items and return completed item list
         * @param {*} [eventObj]
         * @return {*}
         * @memberof MenuSubmenu
         */
        MenuSubmenu.prototype.produceItems = function (eventObj) {
            var preitems = this._pre_items;
            var items = this._items = [];
            var index = 0;
            this.resetRadioIndex();
            for (var _i = 0, preitems_1 = preitems; _i < preitems_1.length; _i++) {
                var pitem = preitems_1[_i];
                // create MenuItems "on demand"
                if (pitem.isDemandable()) {
                    var params = pitem.extract(eventObj);
                    var ditems = this._preCreateItems(params, true);
                    for (var _c = 0, ditems_1 = ditems; _c < ditems_1.length; _c++) {
                        var item_4 = ditems_1[_c];
                        item_4.setIndex(index++);
                        items.push(item_4);
                    }
                }
                else {
                    pitem.setIndex(index++);
                    items.push(pitem);
                }
            }
            return items.concat();
        };
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
        MenuSubmenu.prototype.getNamedCheckableItemRecord = function (name, global) {
            if (global === void 0) { global = false; }
            var repo = global ? this._root._globalNamedCheckableItemRecords : this._namedCheckableItemRecords;
            var records = repo[name] = repo[name] || {
                selectedIndex: undefined,
                checked: undefined
            };
            return records;
        };
        /**
         * set the object as record so that users interact with the record too
         * @param {string} name
         * @param {*} record
         * @memberof MenuSubmenu
         */
        MenuSubmenu.prototype.setUserObjectAsRecord = function (name, record, global) {
            if (global === void 0) { global = false; }
            var repo = global ? this._root._globalNamedCheckableItemRecords : this._namedCheckableItemRecords;
            repo[name] = record;
        };
        MenuSubmenu.prototype.resetRadioIndex = function () {
            this._radioCount = {};
        };
        MenuSubmenu.prototype.countRadioIndex = function (name, global) {
            if (global === void 0) { global = false; }
            var repo = global ? this._root._globalRadioCount : this._radioCount;
            if (!name || typeof name !== 'string') {
                name = '!noname';
            }
            repo[name] = repo[name] || 0;
            return repo[name]++;
        };
        MenuSubmenu.prototype.getItems = function () {
            return this._items.concat();
        };
        MenuSubmenu.prototype.getParent = function () {
            return (this === null || this === void 0 ? void 0 : this._parent) || null;
        };
        MenuSubmenu.prototype.isRoot = function () {
            return !this._parent;
        };
        MenuSubmenu.prototype.getRoot = function () {
            return this._root;
        };
        MenuSubmenu.prototype.getLayer = function () {
            return this._layer;
        };
        MenuSubmenu.prototype.setSkin = function (css) {
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
        };
        // get properties from itself or parent
        MenuSubmenu.prototype.getSkin = function () {
            var _c;
            return this._skinCSSPath || this._inherit.skin && ((_c = this._parent) === null || _c === void 0 ? void 0 : _c.getSkin()) || '';
        };
        MenuSubmenu.prototype.getCSSText = function () {
            var _c;
            return this._cssText || this._inherit.cssText && ((_c = this._parent) === null || _c === void 0 ? void 0 : _c.getCSSText()) || '';
        };
        MenuSubmenu.prototype.getGlobalEvent = function (handler) {
            var _c, _d;
            var key = 'on' + handler;
            return ((_c = this._globalEvents) === null || _c === void 0 ? void 0 : _c[key]) || this._inherit.globalEvents && ((_d = this._parent) === null || _d === void 0 ? void 0 : _d.getGlobalEvent(handler)) || null;
        };
        MenuSubmenu.prototype.getChildLeftMargin = function () {
            var _c;
            return this._childLeftMargin || this._inherit.childLeftMargin && ((_c = this._parent) === null || _c === void 0 ? void 0 : _c.getChildLeftMargin()) || undefined;
        };
        MenuSubmenu.prototype.getArrowIcon = function () {
            var _c;
            return this._inherit.arrowIcon && ((_c = this._parent) === null || _c === void 0 ? void 0 : _c.getArrowIcon()) || this._arrowIcon;
        };
        MenuSubmenu.prototype.getDefaultCheckableIcon = function (type) {
            var _c;
            var result;
            if (type === 'checkbox' && this._inherit.checkboxIcon || type === 'radio' && this._inherit.radioIcon)
                result = (_c = this._parent) === null || _c === void 0 ? void 0 : _c.getDefaultCheckableIcon(type);
            result = result || this._checkablePairIcons[type];
            return result;
        };
        MenuSubmenu.prototype.getAutoClose = function () {
            return typeof this._disableAutoClose === 'boolean' ? this._disableAutoClose : this._inherit.autoClose && this._parent ? this._parent.getAutoClose() : true; // true by default
        };
        MenuSubmenu.prototype.getFontSize = function () {
            return this._fontSize ? this._fontSize : this._inherit.fontSize && this._parent ? this._parent.getFontSize() : undefined;
        };
        MenuSubmenu.prototype.getFontFamily = function () {
            return this._fontFamily ? this._fontFamily : this._inherit.fontFamily && this._parent ? this._parent.getFontFamily() : undefined;
        };
        MenuSubmenu.prototype.setArrowIcon = function (arrow) {
            var before = this._arrowIcon;
            this._arrowIcon = arrow;
            this.fireMenuModelEvent('arrow', arrow, before);
            for (var _i = 0, _c = this._items; _i < _c.length; _i++) {
                var item_5 = _c[_i];
                if (!item_5.isSubmenu())
                    continue;
                item_5.setArrowIcon(arrow);
            }
        };
        MenuSubmenu.prototype.setDefaultCheckableIcon = function (type, icon) {
            this._checkablePairIcons[type] = convertCheckableIconPairParam(icon);
            //this.fireMenuModelEvent(type, arrow, before);
            for (var _i = 0, _c = this._items; _i < _c.length; _i++) {
                var item_6 = _c[_i];
                if (item_6.isSubmenu()) {
                    item_6.setDefaultCheckableIcon(type, icon);
                }
                else if (item_6.isCheckable()) {
                    item_6.updateCheckableIcon(true);
                }
            }
        };
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
        MenuSubmenu.prototype.each = function (callback) {
            var items = this._items;
            var len = items.length;
            for (var i = 0; i < len; i++) {
                var item_7 = items[i];
                //item.setIndex(i);
                callback(item_7, i);
            }
        };
        MenuSubmenu.prototype.getItem = function (index) {
            return this._items[index];
        };
        MenuSubmenu.prototype.getItemCount = function () {
            return this._items.length;
        };
        MenuSubmenu.prototype.getItemById = function (id) {
            for (var i = this._items.length; i--;) {
                if (this._items[i].getId() === id)
                    return this._items[i];
            }
            return null;
        };
        MenuSubmenu.prototype.getItemsByName = function (name) {
            var list = [];
            for (var _i = 0, _c = this._items; _i < _c.length; _i++) {
                var item_8 = _c[_i];
                if (item_8.isCheckable() && item_8.getName() === name)
                    list.push(item_8);
            }
            return list;
        };
        MenuSubmenu.prototype.getPreItems = function () {
            return this._pre_items;
        };
        MenuSubmenu.prototype.getCustomDialogClass = function () {
            return this._customDialogClass;
        };
        MenuSubmenu.prototype.__setSystemUserEvent = function (handler, callback) {
            switch (handler) {
                case '_rootclose':
                    this._onrootclose = callback;
                    break;
                case '_viewready':
                    this._onviewready = callback;
                    break;
            }
        };
        MenuSubmenu.prototype.setGlobalEvent = function (handler, listener) {
            var evobj = this._globalEvents = this._globalEvents || {};
            var key = ('on' + handler);
            if (listener) {
                evobj[key] = listener;
            }
            else
                delete evobj[key];
        };
        MenuSubmenu.prototype.clearGlobalEvents = function () {
            this._globalEvents = null;
        };
        // system user events
        MenuSubmenu.prototype.fireUserEvent = function (handler, ctx, eventObj) {
            var _c, _d;
            if (handler !== '_rootclose' && handler !== '_viewready')
                return _super.prototype.fireUserEvent.call(this, handler, ctx, eventObj);
            if (!this.isRoot()) {
                return;
            }
            switch (handler) {
                case '_rootclose':
                    (_c = this._onrootclose) === null || _c === void 0 ? void 0 : _c.call(this, eventObj, ctx);
                    break;
                case '_viewready':
                    (_d = this._onviewready) === null || _d === void 0 ? void 0 : _d.call(this, eventObj, ctx);
                    break;
            }
        };
        MenuSubmenu.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            for (var _i = 0, _c = this._items; _i < _c.length; _i++) {
                var item_9 = _c[_i];
                item_9.dispose();
            }
            this._items = [];
            for (var _d = 0, _e = this._pre_items; _d < _e.length; _d++) {
                var item_10 = _e[_d];
                item_10.dispose();
            }
            this._pre_items = [];
        };
        return MenuSubmenu;
    }(MenuNormal));
    _b = MenuSubmenu;
    (function () {
        _b.prototype._arrowIcon = { text: '\x38', fontFamily: 'Marlett' };
    })();
    /**
     * EXPERIMENTAL:
     * @class MenuPopup
     * @extends {MenuSubmenu}
     */
    var MenuPopup = /** @class */ (function (_super) {
        __extends(MenuPopup, _super);
        function MenuPopup(param, parent, demanded) {
            var _this = _super.call(this, param, parent, demanded) || this;
            _this._exclusive = true;
            var _c = param.pos || {}, _d = _c.base, base = _d === void 0 ? 'all' : _d, _e = _c.posX, posX = _e === void 0 ? 'x-center' : _e, _f = _c.posY, posY = _f === void 0 ? 'y-center' : _f, _g = _c.marginX, marginX = _g === void 0 ? 0 : _g, _h = _c.marginY, marginY = _h === void 0 ? 0 : _h;
            _this._pos = { base: base, posX: posX, posY: posY, marginX: marginX, marginY: marginY };
            return _this;
        }
        MenuPopup.prototype.getPosObject = function () {
            return this._pos;
        };
        return MenuPopup;
    }(MenuSubmenu));
    // the purpose of this is to reuse a controller as a model directly
    var _MenuModelable = /** @class */ (function () {
        function _MenuModelable() {
        }
        return _MenuModelable;
    }());

    var VDN_Prefix_Real_ID = '_VDN_ID_';
    var VDN_unique_counter = 0;
    /**
     * virtual DOM node to 0.0update at arbitrary timing
     *
     * @class VirtualHTMLElement
     */
    var VirtualDOMNode = /** @class */ (function () {
        function VirtualDOMNode(node, attributes, label) {
            if (attributes === void 0) { attributes = {}; }
            if (label === void 0) { label = ''; }
            this.className = '';
            this._queuedClassNames = [];
            //private _classNameToReserve: string[] = [];
            //private _reservedStack = 0;
            this._lastRealClasses = '';
            this.attributes = {};
            this.childNodes = [];
            this.style = '';
            this._lastRealStyle = '';
            this.id = '';
            this.label = '';
            this._transitions = [];
            this._staticfilters = [];
            this._flipStaticFilters = false;
            this._onfilterchange = null;
            this._onTransitionEnds = [];
            this._linked = false;
            this._updated = {}; // time stamp
            this._hasLinkedVNode = false;
            this._parent = null;
            this._disposed = false;
            if (typeof node === 'string')
                this.nodeName = node.toLowerCase();
            else {
                if (!node || !node.nodeName)
                    throw new Error('node parameter must be a HTMLElement or string');
                this.nodeName = node.nodeName.toLowerCase();
                this.linkRealElement(node, false, true);
            }
            // set DOM attributes
            for (var prop in attributes) {
                if (prop === 'class') {
                    this.addClass(attributes['class']);
                    continue;
                }
                if (prop === 'id') {
                    this.id = attributes[prop];
                    continue;
                }
                this.attributes[prop] = attributes[prop];
            }
            // set label and unique id
            this.label = label;
            this.uniqueId = 'uid_' + VDN_unique_counter;
            // set unique DOM id if not exist
            if (!this.id) {
                this.id = VDN_Prefix_Real_ID + VDN_unique_counter;
            }
            VDN_unique_counter++;
        }
        VirtualDOMNode.prototype.addClass = function (addClasses) {
            var names = normalizeClassText(addClasses).split(' ');
            var classtext = this.className;
            var newclasses = [];
            var added = {};
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var name_1 = names_1[_i];
                if (added[name_1] || !/\w/.test(name_1))
                    continue;
                if (!RegExp('(^|\\s)' + escapeReLetters(name_1) + '(?=\\s|$)', 'i').test(classtext)) {
                    newclasses.push(name_1);
                    added[name_1] = true;
                }
            }
            if (newclasses.length) {
                if (classtext)
                    newclasses.unshift(classtext);
                this.className = newclasses.join(' ');
                this._updated._class = new Date().getTime();
            }
        };
        VirtualDOMNode.prototype.removeClass = function (remClasses, target) {
            var names = escapeReLetters(normalizeClassText(remClasses)).replace(/\s+/g, '|');
            var updatedstr = (target || this.className).replace(RegExp('(^|\\s)(' + names + ')(?=\\s|$)', 'gi'), '').replace(/^\s+/, '');
            if (target)
                return updatedstr;
            if (updatedstr !== this.className) {
                this.className = updatedstr;
                this._updated._class = new Date().getTime();
            }
        };
        VirtualDOMNode.prototype.hasClass = function (className) {
            // check queued classes primarily
            for (var _i = 0, _a = this._queuedClassNames; _i < _a.length; _i++) {
                var item_1 = _a[_i];
                if (item_1.className === className) {
                    return item_1.add;
                }
            }
            // check normal classes secondarily
            return RegExp('(^|\\s)' + className + '(?=\\s|$)', 'i').test(this.className);
        };
        VirtualDOMNode.prototype.queueClass = function (qclass, add) {
            //console.log(`#queueClass "${qclass}", ${add}`, 'blue');
            var i = this._queuedClassNames.length;
            for (; i--;) {
                var item_2 = this._queuedClassNames[i];
                if (qclass === item_2.className) {
                    if (add !== item_2.add) {
                        this._queuedClassNames.splice(i, 1);
                    }
                    break;
                }
            }
            if (i === -1)
                this._queuedClassNames.push({ add: add, className: qclass });
        };
        VirtualDOMNode.prototype.hasQueuedClasses = function () {
            return !!this._queuedClassNames.length;
        };
        VirtualDOMNode.prototype.consumeQueuedClasses = function (onebyone) {
            if (!this._queuedClassNames.length)
                return null;
            var consumedClasses = [];
            while (this._queuedClassNames.length) {
                var item_3 = this._queuedClassNames.shift();
                item_3.add ? this.addClass(item_3.className) : this.removeClass(item_3.className);
                consumedClasses.push(item_3.className);
                if (onebyone)
                    break;
            }
            return consumedClasses;
        };
        VirtualDOMNode.prototype.apply = function () {
            var element = this.getRealElement(true);
            var filters = getAndApplyTransitions(element);
            this._transitions = filters.transitions;
            this._staticfilters = filters.statics;
            this._flipStaticFilters = filters.flip;
            // XXX:
            // When multiple transitions are playing, some transitions are led to unexpected aborts occasionally.
            // The empty onfilterchange event handler seems to prevent the problem for reasons I don't know.
            if (!this._onfilterchange) ;
        };
        VirtualDOMNode.prototype.play = function (ontransitionend) {
            var _this = this;
            var transes = this._transitions;
            var playedFlag = false;
            var transFilter = null;
            var longestDuration = -1;
            for (var _i = 0, transes_1 = transes; _i < transes_1.length; _i++) {
                var fitem = transes_1[_i];
                try {
                    fitem.filter.play();
                    transFilter = fitem.filter;
                    // calculate largest duration of the transitions
                    if (ontransitionend) {
                        var dur = transFilter.duration;
                        if (dur > longestDuration) {
                            longestDuration = dur;
                        }
                        //this._playingCount++;
                    }
                    playedFlag = true;
                }
                catch (e) {
                }
            }
            if (playedFlag) {
                // HACK:
                // Use setTimeout to detect the transition's end because the native onfilterchange event is fired not only when the transition's status change,
                // but also when other static filter properties change.
                // Besides, event.srcFilter property is always null perhaps due to a bug, so it is not able to know which filter object fired the event.
                if (ontransitionend && longestDuration >= 0) {
                    setTimeout(function () {
                        //console.log(`=========trans ends==========`, 'red');
                        ontransitionend(_this);
                    }, longestDuration * 1000);
                }
                // flip static filters
                if (transes.length && this._flipStaticFilters) {
                    this.flipFilters();
                }
            }
            else {
                ontransitionend === null || ontransitionend === void 0 ? void 0 : ontransitionend(this);
            }
            return playedFlag;
        };
        VirtualDOMNode.prototype.getTransitions = function () {
            return this._transitions;
        };
        VirtualDOMNode.prototype.clearTransitions = function () {
            this._transitions.length = 0;
            this._staticfilters.length = 0;
        };
        VirtualDOMNode.prototype.flipFilters = function () {
            for (var i = this._staticfilters.length; i--;) {
                try {
                    var f = this._staticfilters[i];
                    f.enabled = !f.enabled;
                }
                catch (e) {
                }
            }
        };
        VirtualDOMNode.prototype.setAttribute = function (attr, val) {
            this.attributes[attr] = val;
            this._updated[attr] = new Date().getTime();
        };
        VirtualDOMNode.prototype.removeAttribute = function (attr) {
            delete this.attributes[attr];
            this._updated[attr] = new Date().getTime();
        };
        VirtualDOMNode.prototype.setStyle = function (style) {
            if (!style)
                return;
            this.style = style;
            this._updated._style = new Date().getTime();
        };
        VirtualDOMNode.prototype.addStyle = function (style) {
            if (!style)
                return;
            this.style += ';' + style;
            this._updated._style = new Date().getTime();
        };
        // manipulate nodes
        VirtualDOMNode.prototype.append = function () {
            var nodes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nodes[_i] = arguments[_i];
            }
            for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
                var item_4 = nodes_1[_a];
                if (item_4 instanceof VirtualDOMNode) {
                    if (item_4._linked && !this._hasLinkedVNode)
                        this._hasLinkedVNode = true;
                    item_4._parent = this;
                }
                this.childNodes.push(item_4);
            }
            this._updated._html = new Date().getTime();
        };
        VirtualDOMNode.prototype.remove = function () { };
        VirtualDOMNode.prototype.html = function (html, escapeHTML) {
            if (escapeHTML === void 0) { escapeHTML = false; }
            this.childNodes.length = 0;
            if (escapeHTML) {
                html = html
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }
            this.childNodes.push(html);
            this._updated._html = new Date().getTime();
        };
        VirtualDOMNode.prototype.linkRealElement = function (node, parseChildren, readClasses) {
            this._realElement = node;
            this._linked = true;
            this.clearUpdate();
            //this.classNames.length = 0;
            if (readClasses) {
                var cstring = node.className.toLowerCase().replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
                if (cstring) {
                    this.className = cstring;
                }
            }
            if (!parseChildren)
                return;
            for (var _i = 0, _a = this.childNodes; _i < _a.length; _i++) {
                var child = _a[_i];
                if (!(child instanceof VirtualDOMNode))
                    continue;
                var realChildElement = node.all(child.id, 0);
                if (realChildElement) {
                    child.linkRealElement(realChildElement, true, readClasses);
                }
            }
        };
        VirtualDOMNode.prototype.linkRealElementFromParent = function () {
            if (!this._parent)
                throw new Error("need a parent node to link to real DOM element. \"".concat(this.label, "\""));
            var parentElement = this._parent.getRealElement(true);
            if (!parentElement)
                throw new Error("the VirtualDOMNode is not connected to any real DOM tree. ".concat(this._parent.label));
            var childElement = IE_Version.MSIE <= 7 ? parentElement.all(this.id, 0) : parentElement.all(this.id);
            if (!childElement)
                throw new Error("could not found the VirttualDOMNode in the parent node tree. parent:\"".concat(this._parent.label, "\" child:\"").concat(this.label, "\""));
            this.linkRealElement(childElement);
        };
        VirtualDOMNode.prototype.isLinkedRealElement = function () {
            return this._linked;
        };
        /**
         * @param {boolean} [autolink=false]  link to real element automatically if it has not
         * @return {*}  {(HTMLElement | undefined)}
         * @memberof VirtualDOMNode
         */
        VirtualDOMNode.prototype.getRealElement = function (autolink) {
            if (autolink === void 0) { autolink = false; }
            if (autolink && !this._linked) {
                this.linkRealElementFromParent();
            }
            return this._realElement;
        };
        VirtualDOMNode.prototype.updateRealElement = function (force) {
            if (force === void 0) { force = false; }
            if (this._disposed)
                return null;
            var element = this._realElement;
            if (!element) {
                if (!force)
                    return null;
                element = this.getRealElement(true);
            }
            var updatedAttr = {};
            var clearedUpdatedRecord = {};
            for (var attr in this._updated) {
                var timeStamp = this._updated[attr];
                if (!timeStamp)
                    continue;
                switch (attr) {
                    case '_html':
                        if (this._hasLinkedVNode) // prevent unexpected rewrite children of VirtualHTMLElements
                            throw new Error("VirtualHTMLElement#_realElement.innerHTML is not editable because a linked VirtualDOMNode exists in its childNodes.");
                        var html = ( /*this._reservedStack ? this._childNodesForTrans :*/this.childNodes).join('');
                        element.innerHTML = html;
                        updatedAttr['html'] = true;
                        break;
                    case '_class':
                        var cstr = this.className; //this.className.join(' ');//(this._reservedStack ? this._classNamesToReserve : this.classNames).join(' ');
                        if (cstr !== this._lastRealClasses) {
                            element.className = cstr;
                            this._lastRealClasses = cstr;
                            updatedAttr['class'] = true;
                        }
                        break;
                    case '_style':
                        if (this._lastRealStyle !== this.style) {
                            element.style.cssText = this.style;
                            this._lastRealStyle = this.style;
                            updatedAttr['style'] = true;
                        }
                        break;
                    default:
                        this._realElement[attr] = this.attributes[attr];
                        updatedAttr[attr] = true;
                        break;
                }
                // * if timeStamp is not equal to this._updated[attr] this time, _updated[attr] is changed in unexpected timing just before updating this._realElement.
                //   so re-record _updated[attr].
                if (timeStamp !== this._updated[attr]) {
                    clearedUpdatedRecord[attr] = new Date().getTime();
                }
            }
            // clear update record
            this._updated = clearedUpdatedRecord;
            //console.log(`#updateRealElemnt ${updatedAttr} updated.`);
            return updatedAttr;
        };
        VirtualDOMNode.prototype.clearUpdate = function () {
            this._updated = {};
        };
        VirtualDOMNode.prototype.toString = function () {
            var attrs = [];
            var attributes = this.attributes;
            for (var prop in attributes) {
                attrs.push(" ".concat(prop, "=\"").concat(attributes[prop], "\""));
            }
            var classes = this.className.length ? " class=\"".concat(this.className, "\"") : '';
            var style = this.style ? " style=\"".concat(this.style, "\"") : '';
            return "<".concat(this.nodeName, " id=\"").concat(this.id, "\"").concat(classes).concat(attrs.join('')).concat(style, ">").concat(this.childNodes.join(''), "</").concat(this.nodeName, ">");
        };
        VirtualDOMNode.prototype.dispose = function () {
            var _a;
            if (this._disposed)
                return;
            if (this._onfilterchange) {
                (_a = this._realElement) === null || _a === void 0 ? void 0 : _a.detachEvent('onfilterchange', this._onfilterchange);
                this._onfilterchange = null;
            }
            this._realElement = null;
            this._transitions = null;
            this._staticfilters = null;
            for (var _i = 0, _b = this.childNodes; _i < _b.length; _i++) {
                var child = _b[_i];
                if (child instanceof VirtualDOMNode) {
                    child.dispose();
                }
            }
            this.childNodes.length = 0;
            this._disposed = true;
        };
        return VirtualDOMNode;
    }());
    var VirtualNodeUpdater = /** @class */ (function () {
        function VirtualNodeUpdater(delay) {
            if (delay === void 0) { delay = 0; }
            //private _qlist: { [key: number|string]: VNodeUpdaterQueueItem[] } = {};
            this._qlist = [];
            this._delay = 0;
            this._hooked = false;
            this._tid = -1; // timeout id
            this._beforeCallbacks = [];
            this._afterCallbacks = [];
            this._delay = delay;
            this.clear();
        }
        VirtualNodeUpdater.prototype.hook = function () {
            var _this = this;
            // if delay is negative, users should manually call process function
            if (this._delay < 0)
                return;
            if (!this._hooked) {
                this._tid = setTimeout(function () { return _this.process(); }, this._delay);
                this._hooked = true;
            }
        };
        VirtualNodeUpdater.prototype.clear = function () {
            clearTimeout(this._tid);
            this._qlist.length = 0;
        };
        VirtualNodeUpdater.prototype.update = function (vnodes, priority) {
            if (priority === void 0) { priority = 0; }
            if (!(vnodes instanceof Array))
                vnodes = [vnodes];
            for (var _i = 0, vnodes_1 = vnodes; _i < vnodes_1.length; _i++) {
                var node = vnodes_1[_i];
                if (node) {
                    this.queue({ type: 'update', node: node }, priority);
                }
            }
            /*
            if( IE_Version.OS === '98' ) {
              this.update(null, new Function as any);
              return;
            }
            */
            this.hook();
        };
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
        VirtualNodeUpdater.prototype.consumeQueuedClass = function (vnode, onebyone) {
            this.queue({ type: 'consume', node: vnode, onebyone: onebyone });
        };
        VirtualNodeUpdater.prototype.apply = function (vnode) {
            this.queue({ type: 'apply', node: vnode, label: vnode.label });
        };
        VirtualNodeUpdater.prototype.play = function (vnode, ontransitionend) {
            this.queue({ type: 'play', node: vnode, ontransitionend: ontransitionend });
        };
        VirtualNodeUpdater.prototype.callback = function (func) {
            this.queue({ type: 'callback', callback: func });
        };
        VirtualNodeUpdater.prototype.queue = function (qitem, priority) {
            //console.log(`VNodeUpdater#queue (${qitem.type}) p:${priority}`, 'skyblue');
            var list = this._qlist; //[qitem.type];
            list.push(qitem);
            this.hook();
        };
        VirtualNodeUpdater.prototype.process = function () {
            this._hooked = false;
            for (var _i = 0, _a = this._beforeCallbacks; _i < _a.length; _i++) {
                var callback = _a[_i];
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
            var order = ['update', 'apply', 'consume', 'play', 'callback'];
            for (var _b = 0, order_1 = order; _b < order_1.length; _b++) {
                var qtype = order_1[_b];
                //const priority = Number(litem.priority);
                var list = this._qlist; //litem.list;
                //console.log(`VNodeUpdater#update len:${list.length} qtype:${qtype} start ====>`, "cyan");
                list.length;
                var uid_cache = {};
                for (var i = 0; i < list.length; i++) {
                    //while( list.length ) {
                    //const item = list.shift();
                    var item_5 = list[i];
                    if (item_5.type !== qtype)
                        continue;
                    switch (item_5.type) {
                        case 'update': {
                            //console.log(`update(${qtype}): (${item.node.label}) ${/*item.node.isReserved()?'[reserved]':*/''}`, 'cyan');
                            var vnode = item_5.node;
                            vnode.updateRealElement(true);
                            //tmp && tmp['class'] && console.log(`(${item.node.label}): ${vnode.getRealElement()?.className}`, 'cyan');
                            break;
                        }
                        case 'apply':
                            //console.log(`apply(${qtype}) (${item.node.label})`, "purple");
                            if (!uid_cache[item_5.node.uniqueId]) {
                                item_5.node.apply();
                                uid_cache[item_5.node.uniqueId] = true;
                            }
                            break;
                        case 'play': {
                            if (!uid_cache[item_5.node.uniqueId]) {
                                item_5.node.play(item_5.ontransitionend);
                                item_5.node.clearTransitions();
                                uid_cache[item_5.node.uniqueId] = true;
                            }
                            break;
                        }
                        case 'consume':
                            //console.log(`consume(${qtype}) (${item.node.label})`, "purple");
                            if (item_5.node.consumeQueuedClasses(item_5.onebyone)) {
                                item_5.node.updateRealElement(true);
                                //tmp && tmp['class'] && console.log(`(${item.node.label}): ${item.node.getRealElement()?.className}`, 'cyan');
                            }
                            break;
                        case 'callback':
                            item_5.callback();
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
            for (var _c = 0, _d = this._afterCallbacks; _c < _d.length; _c++) {
                var callback = _d[_c];
                callback();
            }
            if (this._qlist.length) {
                this.hook();
            }
        };
        VirtualNodeUpdater.prototype.addListener = function (handler, callback) {
            if (handler === 'before')
                this._beforeCallbacks.push(callback);
            else
                this._afterCallbacks.push(callback);
        };
        return VirtualNodeUpdater;
    }());
    function getAndApplyTransitions(element, switchStaticFilters) {
        var appliedList = [];
        var staticList = [];
        // check if it has a transition filter
        var filters = element.filters;
        var filterText = String(element.currentStyle.filter || '');
        var matches = filterText.match(/DXImageTransform\.Microsoft\.(barn|blinds|checkerboard|fade|gradientwipe|iris|inset|pixelate|strips|stretch|spiral|slide|randombars|radialwipe|randomdissolve|wheel|zigzag|BlendTrans|RevealTrans|Compositor)/gi) || [];
        var flip = /\b_flip\([^)]*\)/i.test(filterText);
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
        for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
            var transName = matches_1[_i];
            try {
                var trans = filters.item(transName);
                if (!trans)
                    continue;
                //if( trans.percent !== 0 || trans.status !== 0 )
                //  continue;
                trans.apply();
                appliedList.push({ filter: trans, type: transName });
            }
            catch (e) {
            }
        }
        if (flip) {
            var transFoundCount = 0;
            var len = filters.length;
            if (len > appliedList.length) {
                for (var i = len; i--;) {
                    var f = filters[i];
                    if (transFoundCount >= appliedList.length || f.status === 0) {
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
            flip: flip
        };
    }
    function normalizeClassText(text) {
        return text.toLowerCase().replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
    }
    function escapeReLetters(text) {
        return text.replace(/(?=[$\\.*+?()\[\]{}|^])/g, '\\');
    }

    var BASE_HTML = "<html><head><meta http-equiv=\"X-UA-Compatible\" content=\"IE=5\"><style>*{padding:0;margin:0;border-width:0}*html{font-size:30px}#container{display:inline-block;position:relative;height:100%}#menu-table{color:WindowText}#menu-table td{white-space:nowrap}#menu-table tr.menuitem-highlight{background-color:highlight;color:highlightText}#menu-table tr.separator td{font-size:1px}#menu-table tr.separator .hr{border-top:1px solid ThreeDShadow;border-bottom:1px solid ThreeDLightShadow}#menu-table tr.separator td.icon-hidden-for-separator{display:none}#menu-table td.icon{text-align:center}#menu-table td.icon .icon-container-alt{display:none}#menu-table td.border{display:none;font-size:1px}#menu-table td.border .border-container{font-size:1px}#menu-table td.content{display:inline-block}#menu-table td.arrow{text-align:center}#menu-table td.arrow .arrow-container{width:1em;font-size:x-small}#menu-table td.arrow .arrow-container-alt{display:none}#deco-frame-table .df-tbl-parts{display:none}.hidden{display:none}</style></head><body onkeydown=\"return false\"></body></html>";

    var tag$4="DIV";var attr$3={id:"container1"};var children$3=[{tag:"SPAN",attr:{id:"container1-deco-box","class":"hidden"},children:[{tag:"SPAN",attr:{id:"container1-deco-box-child1","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco-box-child2","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco-box-child3","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco-box-child4","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco-box-child5","class":"hidden"}}]},{tag:"DIV",attr:{id:"container2"},children:[{tag:"SPAN",attr:{id:"container2-deco-box","class":"hidden"},children:[{tag:"SPAN",attr:{id:"container2-deco-box-child1","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco-box-child2","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco-box-child3","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco-box-child4","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco-box-child5","class":"hidden"}}]},{tag:"DIV",attr:{id:"container3"},children:[{tag:"SPAN",attr:{id:"container3-deco-box","class":"hidden"},children:[{tag:"SPAN",attr:{id:"container3-deco-box-child1","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco-box-child2","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco-box-child3","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco-box-child4","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco-box-child5","class":"hidden"}}]},{tag:"TABLE",attr:{id:"deco-frame",border:"0",cellspacing:"0",cellpadding:"0"},children:[{tag:"TR",attr:{id:"frame-top","class":"deco-frame-parts"},children:[{tag:"TD",attr:{id:"frame-top-left-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-top-left-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-top-left-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-top-left-deco3","class":"hidden"}}]},{tag:"TD",attr:{id:"frame-top-center-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-top-center-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-top-center-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-top-center-deco3","class":"hidden"}}]},{tag:"TD",attr:{id:"frame-top-right-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-top-right-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-top-right-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-top-right-deco3","class":"hidden"}}]}]},{tag:"TR",attr:{id:"frame-middle"},children:[{tag:"TD",attr:{id:"frame-middle-left-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-middle-left-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-middle-left-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-middle-left-deco3","class":"hidden"}}]},{tag:"TD",attr:{id:"frame-middle-center-cell"},children:[{tag:"DIV",attr:{id:"menu-container1"},children:[{tag:"SPAN",attr:{id:"menu-container1-deco-box","class":"hidden"},children:[{tag:"SPAN",attr:{id:"menu-container1-deco-box-child1","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco-box-child2","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco-box-child3","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco-box-child4","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco-box-child5","class":"hidden"}}]},{tag:"DIV",attr:{id:"menu-container2"},children:[{tag:"SPAN",attr:{id:"menu-container2-deco-box","class":"hidden"},children:[{tag:"SPAN",attr:{id:"menu-container2-deco-box-child1","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco-box-child2","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco-box-child3","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco-box-child4","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco-box-child5","class":"hidden"}}]},{tag:"DIV",attr:{id:"menu-container3"},children:[{tag:"SPAN",attr:{id:"menu-container3-deco-box","class":"hidden"},children:[{tag:"SPAN",attr:{id:"menu-container3-deco-box-child1","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco-box-child2","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco-box-child3","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco-box-child4","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco-box-child5","class":"hidden"}}]},{tag:"DIV",attr:{id:"menu-table-container"}},{tag:"SPAN",attr:{id:"menu-container3-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco3","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco4","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container3-deco5","class":"hidden"}}]},{tag:"SPAN",attr:{id:"menu-container2-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco3","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco4","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container2-deco5","class":"hidden"}}]},{tag:"SPAN",attr:{id:"menu-container1-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco3","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco4","class":"hidden"}},{tag:"SPAN",attr:{id:"menu-container1-deco5","class":"hidden"}}]}]},{tag:"TD",attr:{id:"frame-middle-right-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-middle-right-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-middle-right-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-middle-right-deco3","class":"hidden"}}]}]},{tag:"TR",attr:{id:"frame-bottom","class":"deco-frame-parts"},children:[{tag:"TD",attr:{id:"frame-bottom-left-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-bottom-left-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-bottom-left-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-bottom-left-deco3","class":"hidden"}}]},{tag:"TD",attr:{id:"frame-bottom-center-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-bottom-center-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-bottom-center-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-bottom-center-deco3","class":"hidden"}}]},{tag:"TD",attr:{id:"frame-bottom-right-cell","class":"deco-frame-parts"},children:[{tag:"SPAN",attr:{id:"frame-bottom-right-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-bottom-right-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"frame-bottom-right-deco3","class":"hidden"}}]}]}]},{tag:"SPAN",attr:{id:"container3-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco3","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco4","class":"hidden"}},{tag:"SPAN",attr:{id:"container3-deco5","class":"hidden"}}]},{tag:"SPAN",attr:{id:"container2-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco3","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco4","class":"hidden"}},{tag:"SPAN",attr:{id:"container2-deco5","class":"hidden"}}]},{tag:"SPAN",attr:{id:"container1-deco1","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco2","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco3","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco4","class":"hidden"}},{tag:"SPAN",attr:{id:"container1-deco5","class":"hidden"}}];var MENU_CONTAINER_JSON = {tag:tag$4,attr:attr$3,children:children$3};

    var tag$3="TR";var attr$2={"class":"menuitem default"};var children$2=[{tag:"TD",attr:{"class":"icon"},children:[{tag:"SPAN",attr:{"class":"icon-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"icon-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child5 hidden"}}]},{tag:"DIV",attr:{"class":"icon-container"}},{tag:"DIV",attr:{"class":"icon-container-alt"}},{tag:"SPAN",attr:{"class":"icon-deco1 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco2 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco3 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco4 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco5 hidden"}}]},{tag:"TD",attr:{"class":"border"},children:[{tag:"SPAN",attr:{"class":"border-container"}}]},{tag:"TD",attr:{"class":"content"},children:[{tag:"SPAN",attr:{"class":"content-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"content-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child5 hidden"}}]},{tag:"DIV",attr:{"class":"content-container"}},{tag:"SPAN",attr:{"class":"content-deco1 hidden"}},{tag:"SPAN",attr:{"class":"content-deco2 hidden"}},{tag:"SPAN",attr:{"class":"content-deco3 hidden"}},{tag:"SPAN",attr:{"class":"content-deco4 hidden"}},{tag:"SPAN",attr:{"class":"content-deco5 hidden"}}]},{tag:"TD",attr:{"class":"arrow"},children:[{tag:"SPAN",attr:{"class":"arrow-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"arrow-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child5 hidden"}}]},{tag:"DIV",attr:{"class":"arrow-container"}},{tag:"DIV",attr:{"class":"arrow-container-alt"}},{tag:"SPAN",attr:{"class":"arrow-deco1 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco2 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco3 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco4 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco5 hidden"}}]}];var ITEM_DEFAULT_JSON = {tag:tag$3,attr:attr$2,children:children$2};

    var tag$2="TR";var attr$1={"class":"menuitem union"};var children$1=[{tag:"TD",attr:{"class":"content",colspan:"4"},children:[{tag:"SPAN",attr:{"class":"icon-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"icon-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child5 hidden"}}]},{tag:"SPAN",attr:{"class":"icon-deco1 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco2 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco3 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco4 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco5 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"content-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child5 hidden"}}]},{tag:"SPAN",attr:{"class":"content-deco1 hidden"}},{tag:"SPAN",attr:{"class":"content-deco2 hidden"}},{tag:"SPAN",attr:{"class":"content-deco3 hidden"}},{tag:"SPAN",attr:{"class":"content-deco4 hidden"}},{tag:"SPAN",attr:{"class":"content-deco5 hidden"}},{tag:"DIV",attr:{"class":"content-container"}},{tag:"SPAN",attr:{"class":"arrow-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"arrow-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child5 hidden"}}]},{tag:"SPAN",attr:{"class":"arrow-deco1 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco2 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco3 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco4 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco5 hidden"}}]}];var ITEM_UNION_JSON = {tag:tag$2,attr:attr$1,children:children$1};

    var tag$1="TR";var attr={"class":"menuitem separator"};var children=[{tag:"TD",attr:{"class":"icon icon-hidden-for-separator"},children:[{tag:"SPAN",attr:{"class":"icon-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"icon-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco-box-child5 hidden"}}]},{tag:"DIV",attr:{"class":"icon-container"}},{tag:"DIV",attr:{"class":"icon-container-alt"}},{tag:"SPAN",attr:{"class":"icon-deco1 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco2 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco3 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco4 hidden"}},{tag:"SPAN",attr:{"class":"icon-deco5 hidden"}}]},{tag:"TD",attr:{"class":"border"},children:[{tag:"SPAN"}]},{tag:"TD",attr:{"class":"content separator",colspan:"4"},children:[{tag:"SPAN",attr:{"class":"content-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"content-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"content-deco-box-child5 hidden"}}]},{tag:"SPAN",attr:{"class":"arrow-deco-box hidden"},children:[{tag:"SPAN",attr:{"class":"arrow-deco-box-child1 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child2 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child3 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child4 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco-box-child5 hidden"}}]},{tag:"DIV",attr:{"class":"content-container"},children:[{tag:"DIV",attr:{"class":"hr"},children:[{tag:"SPAN",attr:{"class":"separator-deco1 hidden"}},{tag:"SPAN",attr:{"class":"separator-deco2 hidden"}},{tag:"SPAN",attr:{"class":"separator-deco3 hidden"}}]}]},{tag:"SPAN",attr:{"class":"content-deco1 hidden"}},{tag:"SPAN",attr:{"class":"content-deco2 hidden"}},{tag:"SPAN",attr:{"class":"content-deco3 hidden"}},{tag:"SPAN",attr:{"class":"content-deco4 hidden"}},{tag:"SPAN",attr:{"class":"content-deco5 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco1 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco2 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco3 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco4 hidden"}},{tag:"SPAN",attr:{"class":"arrow-deco5 hidden"}}]}];var ITEM_SEPARATOR_JSON = {tag:tag$1,attr:attr,children:children};

    // essential vnode selectors
    var ESLCT_CONTAINER = {
        CONTAINER: '#container1',
        CONTAINER_TABLE: '#menu-table-container'
    };
    var ESLCT_ITEM = {
        ICON: '.icon',
        ICON_CONTAINER: '.icon-container',
        CONTENT: '.content',
        CONTENT_CONTAINER: '.content-container',
        ARROW: '.arrow',
        ARROW_CONTAINER: '.arrow-container'
    };
    var ESLCT_ITEM_LIST = [];
    for (var p in ESLCT_ITEM) {
        ESLCT_ITEM_LIST.push(ESLCT_ITEM[p]);
    }
    // custom user css classes (by "customClass" parameter) are preceded by the prefix
    var CustomClassPrefix = 'custom_';
    var _ViewBase = /** @class */ (function () {
        function _ViewBase() {
            this._statFlags = {};
            this._selectorBank = {};
            this.uid = 'VIEW_UID_' + _CommonUniqueCounter++;
        }
        /**
         * add queues of updating View's class and transition each time before executing VirtualNodeUpdater
         *
         * @static
         * @param {VirtualNodeUpdater} vupdater
         * @memberof _ViewBase
         */
        _ViewBase.hookVnodeUpdater = function (vupdater) {
            vupdater.addListener('before', function () {
                var _a;
                //console.log('<=== viewsWaitingToUpdate ====', 'blue');
                var list = _ViewBase._ViewListWaitingToUpdate;
                for (var uid in list) {
                    var _b = list[uid], view = _b.view, flagNames = _b.flagNames;
                    var waitingAfterLoad = view.isBeWaitingAfterLoad();
                    for (var flagName in flagNames) {
                        var item_1 = flagNames[flagName];
                        if (waitingAfterLoad) {
                            if (flagName !== 'afterload' && flagName !== 'load') {
                                continue;
                            }
                            delete flagNames[flagName];
                            if (flagName === 'afterload')
                                view.clearWaitingAfterLoad();
                        }
                        if (!view.isAvailable()) {
                            // consume ontransitionend callback here
                            (_a = item_1.ontransitionend) === null || _a === void 0 ? void 0 : _a.call(item_1);
                            continue;
                        }
                        view.setClassAndTransitions(flagName, item_1.flag, item_1.ontransitionend);
                    }
                    if (!waitingAfterLoad)
                        delete list[uid];
                }
                //console.log('==========================>', 'blue');
            });
        };
        _ViewBase.prototype._getVNode = function (selector) {
            var vnode = this._selectorBank[selector] || null;
            return vnode;
        };
        _ViewBase.prototype.isAvailable = function () {
            return !this._disposed;
        };
        _ViewBase.prototype._checkIfViewFlagIsInUpdatingList = function (flagName) {
            var _a, _b;
            return typeof ((_b = (_a = _ViewBase._ViewListWaitingToUpdate[this.uid]) === null || _a === void 0 ? void 0 : _a.flagNames[flagName]) === null || _b === void 0 ? void 0 : _b.flag) === 'boolean';
        };
        _ViewBase.prototype._addViewFlagUpdatingList = function (flagName, flag, ontransitionend) {
            // if the flagName is already in the update list, that means the flag is reverted back to the original state before being updated. so remove it from the list.
            if (this._checkIfViewFlagIsInUpdatingList(flagName)) {
                this._removeViewFlagUpdatingList(flagName);
                return;
            }
            var vupdateItem = _ViewBase._ViewListWaitingToUpdate[this.uid] || {
                view: this,
                //flags: {},
                flagNames: {}
            };
            //vupdateItem.flags[flagName] = flag;
            vupdateItem.flagNames[flagName] = {
                flag: flag,
                ontransitionend: ontransitionend
            };
            _ViewBase._ViewListWaitingToUpdate[this.uid] = vupdateItem;
            VNodeUpdater.hook();
        };
        _ViewBase.prototype._removeViewFlagUpdatingList = function (flagName) {
            var _a;
            (_a = _ViewBase._ViewListWaitingToUpdate[this.uid]) === null || _a === void 0 ? true : delete _a.flagNames[flagName];
        };
        _ViewBase.prototype.setViewFlag = function (flagName, flag, ontransitionend) {
            if (Boolean(this._statFlags[flagName]) !== flag) {
                this._statFlags[flagName] = flag;
                this._addViewFlagUpdatingList(String(flagName), flag, ontransitionend);
            }
            else {
                ontransitionend === null || ontransitionend === void 0 ? void 0 : ontransitionend();
            }
        };
        _ViewBase.prototype.getViewFlag = function (flagName) {
            return Boolean(this._statFlags[flagName]);
        };
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
        _ViewBase.prototype.setClassAndTransitions = function (className, flag, ontransitionend) {
            var velement = this._mainNode;
            // direction
            var _a = flag ? ['to', 'from'] : ['from', 'to'], addDir = _a[0], removeDir = _a[1];
            // check transition target elements
            var transTargetCount = 0;
            var transEndedCount = 0;
            var transTargets = this._getTransTargets()[className];
            if (transTargets) {
                // remove all transition classes beforehand
                velement.removeClass("trans-".concat(removeDir, "-").concat(className, " trans-").concat(addDir, "-").concat(className));
                // parse elements to apply transition filters
                for (var _i = 0, transTargets_1 = transTargets; _i < transTargets_1.length; _i++) {
                    var item_2 = transTargets_1[_i];
                    if (item_2.direction !== addDir)
                        continue;
                    var transTargetNode = this._getVNode(item_2.target); // VNode
                    if (transTargetNode) {
                        transTargetCount++;
                        var callback = void 0;
                        if (ontransitionend || addDir === 'from') {
                            // execute the callback when all transitions are finished
                            callback = function () {
                                if (++transEndedCount === transTargetCount) {
                                    ontransitionend === null || ontransitionend === void 0 ? void 0 : ontransitionend();
                                    //console.log(`${this.$L()} completed! trans-${addDir}-${className}${item.target} (${transEndedCount} / ${transTargetCount})`, 'cyan');
                                    // HACK: remove "trans-from-***" class from the element when its transition ends.
                                    // need to find a more elegant way.
                                    if (addDir === 'from') {
                                        velement.removeClass("trans-".concat(addDir, "-").concat(className));
                                        VNodeUpdater.update(velement);
                                    }
                                }
                            };
                        }
                        VNodeUpdater.apply(transTargetNode);
                        VNodeUpdater.play(transTargetNode, callback);
                    }
                }
            }
            // add transition classes
            if (transTargetCount > 0) {
                velement.addClass("trans-".concat(addDir, "-").concat(className));
                VNodeUpdater.update(velement);
            }
            // directly execute the ontransitionend callback when no transitions exist
            else {
                ontransitionend === null || ontransitionend === void 0 ? void 0 : ontransitionend();
            }
            // queue the changed class. it will be applied after apply() and play() if transitions exist.
            velement.queueClass(className, flag);
            VNodeUpdater.consumeQueuedClass(velement);
        };
        _ViewBase.prototype.flashHighlight = function (ftime, onendflashing) {
            var _this = this;
            var startTime = new Date().getTime();
            var callback = function () {
                var dtime = 70;
                if (!_this._checkIfViewFlagIsInUpdatingList('highlight')) {
                    var flag = !_this.getViewFlag('highlight');
                    _this.setViewFlag('highlight', flag);
                }
                else {
                    dtime = 0;
                }
                if (new Date().getTime() - startTime < ftime) {
                    setTimeout(callback, dtime);
                    return;
                }
                // end flashing
                _this.setViewFlag('highlight', true);
                onendflashing === null || onendflashing === void 0 ? void 0 : onendflashing();
            };
            callback();
        };
        _ViewBase.prototype.dispose = function () {
            // clear selector bank
            var bank = this._selectorBank;
            for (var selector in bank) {
                var vnode = bank[selector];
                if (vnode.isLinkedRealElement())
                    vnode.dispose();
            }
            delete _ViewBase._ViewListWaitingToUpdate[this.uid];
        };
        _ViewBase._ViewListWaitingToUpdate = {};
        return _ViewBase;
    }());
    /**
     * modeless dialogs
     * @class MenuDialog
     */
    var MenuDialogView = /** @class */ (function (_super) {
        __extends(MenuDialogView, _super);
        function MenuDialogView(itemNumber, parent, customClass, specifiedParentWindow) {
            var _this = _super.call(this) || this;
            _this._transTargetsForContainer = {};
            _this._transTargetsForItems = {};
            // status
            _this._disposed = false;
            _this._appeared = false; // whther its coordinate are set to the available screen
            _this._items = [];
            _this._indexByUniqueId = {};
            _this._calculatedTableItemMargin = {
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
                tableClientLeft: 0,
                tableClientTop: 0
            };
            _this._layer = 0;
            _this._SkinSystemSettings = {};
            _this._waitingAfterLoad = false;
            _this._layer = parent ? parent._layer + 1 : 0;
            _this._vmenutable = new VirtualDOMNode('table', { id: 'menu-table', border: 0, cellSpacing: 0, cellPadding: 0 }, '#menu-table');
            _this._win = _this._initializeDialog(itemNumber, specifiedParentWindow || (parent === null || parent === void 0 ? void 0 : parent.win()), customClass);
            _this._doc = _this._win.document;
            _this.setDocumentClass('topmost');
            _this._evaWin = new EventAttacher(_this._win);
            _this._evaDoc = new EventAttacher(_this._doc);
            return _this;
        }
        MenuDialogView.prototype._initializeDialog = function (itemNumber, parentWin, customClass) {
            // if less than IE6, always use root window as a context since invoking showmodelessDialog() from modelessDilaog's window doesn't work properly.
            var contextWin = IE_Version.MSIE >= 6 && parentWin || window;
            // create a modeless dialog
            var wintest;
            wintest = contextWin.showModelessDialog('about:<body onkeydown="return false">', null, 'dialogWidth:0px; dialogHeight:0px; dialogLeft:-100000px; dialogTop:-100000px; resizable:0; unadorned:1; scroll:0;');
            wintest.document.write(BASE_HTML);
            wintest.document.close();
            var win = wintest;
            var doc = win.document;
            this._win = win;
            this._doc = doc;
            this._initializeStyleSheet();
            // generate random number classes
            var rnd100Classes = getNumericClassesByNumber((Math.random() * 100 | 0) + 1, 'rnd100-');
            var rnd50Classes = getNumericClassesByNumber((Math.random() * 50 | 0), 'rnd50-');
            var rnd10Classes = getNumericClassesByNumber((Math.random() * 10 | 0) + 1, 'rnd10-');
            // construct container
            this._vbody = new VirtualDOMNode(doc.body, { 'class': ['body', 'beforeload'].join(' ') }, 'body');
            this._mainNode = this._vbody;
            this._vcontainer = createVirtualNodeByJSON(MENU_CONTAINER_JSON, this._selectorBank);
            //doc.body.innerHTML = this._vcontainer.toString();
            this._vbody.append(this._vcontainer);
            this._vbody.updateRealElement(true);
            //this._vcontainer.linkRealElement(doc.getElementById('container1')!);
            this._vtablecontainer = this._getVNode(ESLCT_CONTAINER.CONTAINER_TABLE);
            if (!this._vtablecontainer)
                throw new Error("could not find ".concat(ESLCT_CONTAINER.CONTAINER_TABLE, ". something went wrong."));
            //this._tableContainerElement = this._vtablecontainer.getRealElement(true)!;
            this._vtablecontainer.linkRealElementFromParent();
            this._vtablecontainer.append(this._vmenutable);
            // create classes for documentElement
            var layerNumClasses = getNumericClassesByNumber(this._layer + 1, 'layer-');
            var itemNumClasses = getNumericClassesByNumber(itemNumber, 'index-');
            var docClass = ['layer', layerNumClasses, itemNumClasses, rnd10Classes, rnd50Classes, rnd100Classes];
            if (customClass)
                docClass.push(CustomClassPrefix + customClass);
            this._vdoc = new VirtualDOMNode(doc.documentElement, { 'class': docClass.join(' ') }, '<documentElement>');
            //VNodeUpdater.update([this._vbody, this._vdoc]);
            return win;
        };
        MenuDialogView.prototype._initializeStyleSheet = function () {
            if (this._styleSheet)
                return;
            var newSS = this._doc.createStyleSheet(undefined, 1);
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
            this._styleSheet = newSS; //this._doc.styleSheets[1] as CSSStyleSheet;
            this._activeStyleSheet = newSS;
            return newSS;
        };
        // need to calculate correct margins after rendering
        MenuDialogView.prototype.initLayout = function () {
            this._calculateTableItemMargin();
        };
        MenuDialogView.prototype.loadStyleSheet = function (path) {
            if (/^.+:\/\//.test(path))
                throw new Error("only local files are allowed for StyleSheet: \"".concat(path, "\""));
            this._styleSheet.addImport(path);
            this._activeStyleSheet = this._styleSheet.imports[this._styleSheet.imports.length - 1];
            var cssText = this._activeStyleSheet.cssText;
            this._SkinSystemSettings.empty = /^\s*$/.test(cssText);
            this._parseTransitionTargetsFromCSS(cssText);
            this._parseSystemSettingsFromCSSText(cssText);
        };
        MenuDialogView.prototype.removeStylSheet = function (index) {
            this._styleSheet.removeImport(index || 0);
        };
        MenuDialogView.prototype.setCSSText = function (cssText, getSettings) {
            if (getSettings === void 0) { getSettings = false; }
            this._styleSheet.cssText += '\r\n' + cssText;
            if (getSettings) {
                var txt = this._styleSheet.cssText;
                this._parseTransitionTargetsFromCSS(txt);
                this._parseSystemSettingsFromCSSText(cssText);
            }
        };
        MenuDialogView.prototype.setMenuFontSize = function (fontSize) {
            this._vmenutable.addStyle("font-size: ".concat(fontSize));
            VNodeUpdater.update(this._vmenutable);
        };
        MenuDialogView.prototype.setMenuFontFamily = function (fontFamily) {
            this._vmenutable.addStyle("font-family: ".concat(fontFamily));
            VNodeUpdater.update(this._vmenutable);
        };
        MenuDialogView.prototype.clearStyleSheet = function () {
            this._styleSheet.cssText = '';
            this._activeStyleSheet = this._styleSheet;
            //this._styleSheet.cssText = '';
        };
        // append layer number to the url if it ends with "?"
        MenuDialogView.prototype.tweakAnimatedGIFSuffix = function (suffix) {
            var _a;
            var cssText = (_a = this._activeStyleSheet) === null || _a === void 0 ? void 0 : _a.cssText;
            if (cssText) {
                //suffix = suffix || '-a\\.gif';
                try {
                    //const re = RegExp('(\\burl\\([^)]+?' + suffix + ')', 'gi');
                    //this._activeStyleSheet!.cssText = cssText.replace(re, '$1' + '?' + this._layer);
                    var re = RegExp('(:\\s*url\\([^)]+?\\?)\\s*\\)', 'gi');
                    this._activeStyleSheet.cssText = cssText.replace(re, '$1' + this._layer + ')');
                }
                catch (e) {
                    alert(e);
                }
            }
        };
        MenuDialogView.prototype._parseTransitionTargetsFromCSS = function (cssText) {
            var forContainer = {};
            var forItem = {};
            var checkDup = {};
            cssText.replace(/\.trans-(to|from)-([\w\-]+?)(?:\s+[^,{\s]+)*\s+[a-z]*([.#])([\w\-]+)/ig, function (m, direction, name, targetType, target) {
                var className = name.toLowerCase();
                direction = direction.toLowerCase();
                target = target.toLocaleLowerCase();
                var selector = targetType + target;
                var item = {
                    direction: direction,
                    target: selector
                };
                // detect only one pair of transition target and class
                var id = "{".concat(className, "@").concat(direction, "@").concat(selector, "}");
                if (!checkDup[id]) {
                    var type = targetType === '.' ? forItem : forContainer;
                    var list = type[className] = type[className] || [];
                    list.push(item);
                    checkDup[id] = true;
                }
                return m;
            });
            this._transTargetsForContainer = forContainer;
            this._transTargetsForItems = forItem;
        };
        MenuDialogView.prototype._getTransTargets = function (flagForItem) {
            if (flagForItem === void 0) { flagForItem = false; }
            return !flagForItem ? this._transTargetsForContainer : this._transTargetsForItems;
        };
        MenuDialogView.prototype._parseSystemSettingsFromCSSText = function (cssText) {
            var _a, _b;
            // clear current settings
            var settings = this._SkinSystemSettings;
            // parse setting fields from the css text
            var fields = {};
            cssText.replace(/(?:^|\s)#system---(\w[^{\s]*?)\s*\{([^\}]*)\}/ig, function (m, name, rules) {
                var item = fields[name.toLowerCase()] = {};
                rules.replace(/\b([\-\w]+)\s*:\s*(?:(-?\d+)|url\(([^)\s]+)\)|(\w+))/ig, function (m, name, valNum, valUrl, valStr) {
                    item[name.toLowerCase()] = valNum ? Number(valNum) : (valUrl || valStr).toLowerCase();
                    return m;
                });
                return m;
            });
            // store the settings
            for (var field in fields) {
                switch (field) {
                    // "submenu-dialog-margin" - number
                    case 'submenu-dialog-margin':
                        var margin = (_a = fields[field]) === null || _a === void 0 ? void 0 : _a['margin-left'];
                        if (typeof margin === 'number')
                            settings['submenu-dialog-left-margin'] = margin;
                        margin = (_b = fields[field]) === null || _b === void 0 ? void 0 : _b['margin-right'];
                        if (typeof margin === 'number')
                            settings['submenu-dialog-right-margin'] = margin;
                        break;
                    // "tweak-animated-gif-suffix"
                    // * Animated gifs don't work properly on Trident engine(IE9 or later) with multiple dialogs.
                    //   Appending random suffix on their url fixes the problem. (e.g. "hoge.gif?424981434")
                    case 'tweak-animated-gif-suffix':
                        settings[field] = true;
                        if (IE_Version.real >= 9) {
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
        };
        MenuDialogView.prototype.getSubmenuMarginSettingFromCSS = function (dir) {
            if (dir === void 0) { dir = 'right'; }
            return this._SkinSystemSettings["submenu-dialog-".concat(dir, "-margin")];
        };
        MenuDialogView.prototype.isEmptyCSS = function () {
            return this._SkinSystemSettings.empty;
        };
        MenuDialogView.prototype._calculateTableItemMargin = function () {
            var container = this._vcontainer.getRealElement(); //this._containerElement;
            var table = this._vmenutable.getRealElement(); //this._tableElement;
            var node = table;
            var marginLeft = 0;
            var marginTop = 0;
            do {
                marginLeft += node.offsetLeft + node.clientLeft;
                marginTop += node.offsetTop + node.clientTop;
                node = node.offsetParent;
            } while (node && node !== this._doc.body);
            this._calculatedTableItemMargin = {
                left: marginLeft,
                right: container.offsetWidth - table.clientWidth - marginLeft,
                top: marginTop,
                bottom: container.offsetHeight - table.clientHeight - marginTop,
                tableClientLeft: table.clientLeft,
                tableClientTop: table.clientTop
            };
        };
        MenuDialogView.prototype.getItemMargin = function () {
            return this._calculatedTableItemMargin;
        };
        MenuDialogView.prototype.getDoc = function () {
            return this._doc;
        };
        MenuDialogView.prototype.getLayer = function () {
            return this._layer;
        };
        MenuDialogView.prototype.setDocumentClass = function (cstring, flag, immediate) {
            if (flag === void 0) { flag = true; }
            if (immediate === void 0) { immediate = false; }
            flag ? this._vdoc.addClass(cstring) : this._vdoc.removeClass(cstring);
            immediate ? this._vdoc.updateRealElement() : VNodeUpdater.update(this._vdoc);
        };
        MenuDialogView.prototype.createTableViewItems = function (itemParams) {
            var viewItemList = [];
            var index = 0;
            for (var _i = 0, itemParams_1 = itemParams; _i < itemParams_1.length; _i++) {
                var param = itemParams_1[_i];
                var item_3 = new MenuItemView(this, param, index++);
                this._vmenutable.append(item_3.getVirtualElement());
                viewItemList.push(item_3);
            }
            // construct a whole menu table
            this._vtablecontainer.updateRealElement(true);
            // link real table elements
            this._vmenutable.linkRealElementFromParent();
            // set events
            for (var i = 0; i < viewItemList.length; i++) {
                viewItemList[i].prepareRealElements();
            }
            return viewItemList;
        };
        MenuDialogView.prototype.getMenuElementByUniqueId = function (id) {
            return this._indexByUniqueId[id] || null;
        };
        MenuDialogView.prototype.addWindowEvent = function (name, handler) {
            this._evaWin.attach(name, handler);
        };
        MenuDialogView.prototype.removeWindowEvent = function (name, handler) {
            this._evaWin.detach(name, handler);
        };
        MenuDialogView.prototype.addDocumentEvent = function (name, handler) {
            this._evaDoc.attach(name, handler);
        };
        MenuDialogView.prototype.removeDocumentEvent = function (name, handler) {
            this._evaDoc.detach(name, handler);
        };
        MenuDialogView.prototype.doc = function () {
            return this._doc;
        };
        MenuDialogView.prototype.win = function () {
            return this._win;
        };
        MenuDialogView.prototype.hasFocus = function () {
            var _a;
            return !!((_a = this._doc) === null || _a === void 0 ? void 0 : _a.hasFocus());
        };
        MenuDialogView.prototype.getContentSize = function (callback) {
            var _this = this;
            // synchronous
            if (!callback) {
                VNodeUpdater.process();
                var container = this._vcontainer.getRealElement();
                return {
                    width: Number(container === null || container === void 0 ? void 0 : container.offsetWidth) || 0,
                    height: Number(container === null || container === void 0 ? void 0 : container.offsetHeight) || 0
                };
            }
            // asynchronous
            VNodeUpdater.callback(function () {
                var container = _this._vcontainer.getRealElement();
                callback({
                    width: Number(container === null || container === void 0 ? void 0 : container.offsetWidth) || 0,
                    height: Number(container === null || container === void 0 ? void 0 : container.offsetHeight) || 0
                });
            });
        };
        MenuDialogView.prototype.getDialogPosition = function () {
            var rect = {
                width: parseInt(this._win.dialogWidth, 10) || 0,
                height: parseInt(this._win.dialogHeight, 10) || 0,
                left: parseInt(this._win.dialogLeft, 10) || 0,
                top: parseInt(this._win.dialogTop, 10) || 0,
                right: 0,
                bottom: 0
            };
            rect.right = rect.left + rect.width;
            rect.bottom = rect.top + rect.height;
            return rect;
        };
        MenuDialogView.prototype.resizeDialog = function (w, h) {
            var _this = this;
            VNodeUpdater.callback(function () {
                try {
                    if (!_this._win)
                        throw new Error('no dialog window');
                    _this._win.dialogWidth = w + 'px';
                    _this._win.dialogHeight = h + 'px';
                    return true;
                }
                catch (e) {
                    alert(e.description);
                    return false;
                }
            });
        };
        MenuDialogView.prototype.moveDialog = function (x, y) {
            var _this = this;
            VNodeUpdater.callback(function () {
                if (!_this._win)
                    return;
                if (typeof x === 'number')
                    _this._win.dialogLeft = x + 'px';
                if (typeof y === 'number')
                    _this._win.dialogTop = y + 'px';
                if (x >= 0 || y >= 0) {
                    if (!_this._appeared)
                        _this._appeared = true;
                }
            });
        };
        MenuDialogView.prototype.adjustDialog = function (x, y) {
            var _a = this.getContentSize(), cw = _a.width, ch = _a.height;
            this.moveDialog(x, y);
            this.resizeDialog(cw, ch);
        };
        MenuDialogView.prototype.isReadyToUse = function () {
            return !this._disposed && this._appeared;
        };
        MenuDialogView.prototype.checkExistence = function () {
            var _a;
            try {
                return ((_a = this._win) === null || _a === void 0 ? void 0 : _a._this_is_meaningless_property_) || true;
            }
            catch (e) {
                return false;
            }
        };
        MenuDialogView.prototype.setLoad = function () {
            var _this = this;
            this.setViewFlag('load', true, function () {
                _this._vbody.removeClass('beforeload');
                _this.setViewFlag('afterload', true);
            });
        };
        MenuDialogView.prototype.setBodyViewFlagByItem = function (flagName, flag, itemIndex, customClasses) {
            //this.setClassAndTransitions(flagName, flag);
            this.setViewFlag(flagName, flag);
            // set numelic classes
            var numelics = getNumericClassesByNumber(itemIndex, flagName + '-').split(' ');
            for (var _i = 0, numelics_1 = numelics; _i < numelics_1.length; _i++) {
                var numclass = numelics_1[_i];
                //this.setClassAndTransitions(numclass, flag);
                this.setViewFlag(numclass, flag);
            }
            // set for custom classes
            for (var _a = 0, customClasses_1 = customClasses; _a < customClasses_1.length; _a++) {
                var cclass = customClasses_1[_a];
                //this.setClassAndTransitions(flagName + '-' + CustomClassPrefix + cclass, flag);
                this.setViewFlag(flagName + '-' + CustomClassPrefix + cclass, flag);
            }
        };
        MenuDialogView.prototype.isBeWaitingAfterLoad = function () {
            return this._waitingAfterLoad;
        };
        MenuDialogView.prototype.clearWaitingAfterLoad = function () {
            this._waitingAfterLoad = false;
        };
        MenuDialogView.prototype.dispose = function () {
            var _this = this;
            if (this._disposed) // already disposed
                return;
            this._disposed = true;
            VNodeUpdater.callback(function () { return _this._dispose(); });
        };
        MenuDialogView.prototype._dispose = function () {
            _super.prototype.dispose.call(this);
            try {
                this._evaDoc.dispose();
                this._evaWin.dispose();
                for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
                    var item_4 = _a[_i];
                    item_4.dispose();
                }
            }
            catch (e) {
            }
            this._items.length = 0;
            this._evaDoc = null;
            this._evaWin = null;
            //this._containerElement = null as any;
            this._vdoc.dispose();
            this._vbody.dispose();
            this._vcontainer.dispose();
            this._vmenutable.dispose();
            this._vtablecontainer.dispose();
            this._doc = null;
            // occasionally cause error on Win98SE IE v6 or lower
            if (IE_Version.OS === 98) {
                var retry_1 = 3;
                var _win_1 = this._win;
                (function retryClose() {
                    setTimeout(function () {
                        try {
                            _win_1.close();
                            _win_1 = null;
                        }
                        catch (e) {
                            if (retry_1--)
                                retryClose();
                        }
                    }, 1000);
                })();
            }
            else
                this._win.close();
            this._win = null;
        };
        MenuDialogView.hookBeforeUpdate = function (callback) {
            VNodeUpdater.addListener('before', callback);
        };
        MenuDialogView.hookAfterUpdate = function (callback) {
            VNodeUpdater.addListener('after', callback);
        };
        MenuDialogView.prototype.$L = function () {
            return "L(".concat(this._layer, ")");
        };
        return MenuDialogView;
    }(_ViewBase));
    /**
     * Menu items
     * @class MenuElement
     */
    var MenuItemView = /** @class */ (function (_super) {
        __extends(MenuItemView, _super);
        function MenuItemView(dialog, updateParam, index) {
            var _this = _super.call(this) || this;
            _this._disposed = false;
            //private _filter: DHTMLFilter;
            _this._index = -1;
            _this._itemNumber = -1;
            _this._container = dialog;
            _this._index = index;
            //console.time('trElement');
            //this._trElement = this._createElement(updateParam) as HTMLTableRowElement;
            //console.timeEnd('trElement');
            _this._vrow = _this._createVirtualNodes(updateParam);
            _this._mainNode = _this._vrow;
            //console.log(this._vrow.toString(), "red");
            //this._eva = new EventAttacher(this.toElement(), this);
            //console.time('update');
            //this.update(updateParam);
            //console.timeEnd('update');
            _this.update(updateParam);
            return _this;
            //this._filter = new DHTMLFilter(this._element);
            //this._filter.setLayout("relative")
        }
        /**
        * use virtual DOM nodes because interacting with elements in another windows is terribly slow.
        */
        MenuItemView.prototype._createVirtualNodes = function (_a) {
            var type = _a.type; _a.label; var classNames = _a.classNames, itemNumber = _a.itemNumber, index = _a.index, _b = _a.flags, _c = _b === void 0 ? {} : _b, union = _c.union;
            this._itemNumber = itemNumber;
            //const vtr = new VirtualDOMNode('tr', undefined, 'tr_index_'+this._index);
            // decide base structure for the <TR> by type
            var rawType;
            if (type === 'separator')
                rawType = ITEM_SEPARATOR_JSON;
            else if (union)
                rawType = ITEM_UNION_JSON;
            // default
            else {
                rawType = ITEM_DEFAULT_JSON;
            }
            // create VNode based on each JSON object
            var vitem = createVirtualNodeByJSON(rawType, this._selectorBank, itemNumber);
            // add class name by type
            vitem.addClass(type);
            if (type === 'checkbox' || type === 'radio') {
                vitem.addClass('checkable');
            }
            // set user custom class
            if (classNames) {
                for (var _i = 0, classNames_1 = classNames; _i < classNames_1.length; _i++) {
                    var cname = classNames_1[_i];
                    vitem.addClass(CustomClassPrefix + cname);
                }
            }
            // set number classes
            if (typeof itemNumber === 'number') {
                var numclasses = getNumericClassesByNumber(itemNumber, 'menuitem-');
                vitem.addClass(numclasses);
            }
            if (typeof index === 'number') {
                vitem.addClass('index-' + index);
            }
            return vitem;
        };
        MenuItemView.prototype.getVirtualElement = function () {
            return this._vrow;
        };
        MenuItemView.prototype.prepareRealElements = function () {
            this._eva = new EventAttacher(this._vrow.getRealElement(true), this);
        };
        MenuItemView.prototype.updateVirtualNodes = function () {
            //const priority = this.getLayer();
            //VNodeUpdater.update([this._vcell1_icon!, this._vcontentContainer, this._vcontentDecoContainer, this._viconContainer!, this._varrowContainer!], priority);
            var list = [];
            for (var _i = 0, ESLCT_ITEM_LIST_1 = ESLCT_ITEM_LIST; _i < ESLCT_ITEM_LIST_1.length; _i++) {
                var s = ESLCT_ITEM_LIST_1[_i];
                list.push(this._selectorBank[s]);
            }
            VNodeUpdater.update(list);
        };
        MenuItemView.prototype.update = function (_a) {
            var type = _a.type, label = _a.label, icon = _a.icon, arrow = _a.arrow, _b = _a.flags, _c = _b === void 0 ? {} : _b, unselectable = _c.unselectable, checked = _c.checked, disabled = _c.disabled, html = _c.html, usericon = _c.usericon;
            switch (type) {
                case 'separator':
                    return;
                case 'submenu':
                    // set arrow icon
                    if (arrow) {
                        //this._setIcon(arrow, this._varrowContainer);
                        this._setIcon(arrow, this._selectorBank[ESLCT_ITEM.ARROW_CONTAINER]);
                    }
                default:
                    // set icon
                    if (typeof icon !== 'undefined') {
                        if (typeof checked !== 'undefined') {
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
                            var iconCell = this._getVNode(ESLCT_ITEM.ICON);
                            iconCell[checked ? 'addClass' : 'removeClass']('checked');
                            iconCell[!checked ? 'addClass' : 'removeClass']('unchecked');
                            VNodeUpdater.update(iconCell);
                            this.setViewFlag('checked', checked);
                            if (type === 'radio' || type === 'checkbox')
                                this.setViewFlag(type + '-checked', checked);
                        }
                        this._setIcon(icon);
                    }
                    if (typeof usericon !== 'undefined') {
                        var iconCell = this._getVNode(ESLCT_ITEM.ICON);
                        usericon ? iconCell.addClass('user-icon') : iconCell.removeClass('user-icon');
                        VNodeUpdater.update(iconCell);
                    }
                    // set label
                    if (typeof label !== 'undefined') {
                        //this._vcontentContainer.append(label);
                        this._getVNode(ESLCT_ITEM.CONTENT_CONTAINER).html(label, !html);
                    }
                    // set unselectable
                    if (typeof unselectable === 'boolean') {
                        this._vrow[unselectable ? 'addClass' : 'removeClass']('unselectable');
                    }
                    break;
            }
            // set disabled
            if (typeof disabled === 'boolean') {
                if (disabled)
                    this._vrow.setAttribute('disabled', true);
                else
                    this._vrow.removeAttribute('disabled');
                this._vrow[disabled ? 'addClass' : 'removeClass']('disabled');
            }
            this.updateVirtualNodes();
        };
        MenuItemView.prototype.addEvent = function (name, handler) {
            this._eva.attach(name, handler);
        };
        MenuItemView.prototype.removeEvent = function (name, handler) {
            this._eva.detach(name, handler);
        };
        MenuItemView.prototype._setIcon = function (icon, velement) {
            //console.log(icon);
            if (!velement) {
                velement = this._selectorBank[ESLCT_ITEM.ICON_CONTAINER];
                if (!velement) {
                    return;
                }
            }
            var path = '';
            // image
            if (typeof icon === 'string') {
                path = icon;
                velement.html("<img class=\"icon-img\" src=\"".concat(path, "\">"));
            }
            // image with size
            else if ('path' in icon) {
                path = icon.path;
                var width = icon.width && typeof icon.width === 'string' ? icon.width : Number(icon.width) + 'px';
                var height = icon.height && typeof icon.height === 'string' ? icon.height : Number(icon.height) + 'px';
                velement.html("<img class=\"icon-img\" style=\"".concat(width ? 'width:' + width + ';' : '').concat(height ? 'height:' + height + ';' : '', "\" src=\"").concat(path, "\">"));
            }
            // text
            else {
                var text = icon.text;
                var family = String(icon.fontFamily);
                var size = icon.fontSize && (typeof icon.fontSize === 'number' ? icon.fontSize + 'px' : String(icon.fontSize));
                velement.html(text);
                velement.setStyle("".concat(family ? "font-family:".concat(family, ";") : ''));
                velement.addStyle("".concat(size ? "font-size:".concat(size, ";") : ''));
                velement.addStyle("visibility:".concat(icon.blank ? 'hidden' : 'visible'));
                //console.log(family+":"+size+":"+icon.blank, "lime");
            }
        };
        MenuItemView.prototype._getTransTargets = function () {
            return this._container._getTransTargets(true);
        };
        MenuItemView.prototype.getItemPosition = function () {
            var tr = this._vrow.getRealElement(true);
            var win = this._container.win();
            var width = tr.offsetWidth;
            var height = tr.offsetHeight;
            var margin = this._container.getItemMargin();
            //console.log(margin, 'yellow');
            var left = parseInt(win.dialogLeft || 0, 10) + tr.offsetLeft + tr.clientLeft + margin.left - margin.tableClientLeft;
            var top = parseInt(win.dialogTop || 0, 10) + tr.offsetTop + tr.clientTop + margin.top - margin.tableClientTop;
            //console.log(this._trElement.offsetLeft + "/"+this._trElement.clientLeft + "/"+margin.left, "lime")
            return {
                left: left,
                top: top,
                width: width,
                height: height,
                right: left + width,
                bottom: top + height
            };
        };
        MenuItemView.prototype.getLayer = function () {
            return this._container.getLayer();
        };
        MenuItemView.prototype.getItemNumber = function () {
            return this._itemNumber;
        };
        MenuItemView.prototype.$L = function () {
            return "".concat(this._container.$L(), "i[").concat(this._index, "]");
        };
        MenuItemView.prototype.isBeWaitingAfterLoad = function () {
            return this._container.isBeWaitingAfterLoad();
        };
        MenuItemView.prototype.clearWaitingAfterLoad = function () {
            this._container.clearWaitingAfterLoad();
        };
        MenuItemView.prototype.isAvailable = function () {
            return !this._disposed && this._container.isAvailable();
        };
        MenuItemView.prototype.dispose = function () {
            var _a;
            if (!this._container || this._disposed)
                return;
            this._disposed = true;
            _super.prototype.dispose.call(this);
            try {
                this._eva.dispose();
            }
            catch (e) {
            }
            this._container = null;
            this._vrow.dispose();
            for (var _i = 0, ESLCT_ITEM_LIST_2 = ESLCT_ITEM_LIST; _i < ESLCT_ITEM_LIST_2.length; _i++) {
                var s = ESLCT_ITEM_LIST_2[_i];
                (_a = this._selectorBank[s]) === null || _a === void 0 ? void 0 : _a.dispose();
            }
        };
        return MenuItemView;
    }(_ViewBase));
    function createVirtualNodeByJSON(json, selectorBank, index) {
        var attr = json.attr || {};
        var id = attr.id;
        var classes = (attr['class'] || '').split(' ');
        var vnode = new VirtualDOMNode(json.tag, attr, (id || attr["class"] || '') + (index >= 0 ? '_' + index : ''));
        var selector = id ? '#' + id : classes[0] ? '.' + classes[0] : '';
        if (selector)
            selectorBank[selector] = vnode;
        // parse childNodes
        var children = json.children || [];
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            vnode.append(createVirtualNodeByJSON(child, selectorBank, index));
        }
        return vnode;
    }
    function getNumericClassesByNumber(num, prefix, suffix) {
        if (prefix === void 0) { prefix = ''; }
        if (suffix === void 0) { suffix = ''; }
        var numclasses = [String(num)];
        numclasses.push(num % 2 ? 'odd' : 'even');
        if (num > 0) {
            for (var i = 3; i <= 50; i++) {
                if (i > num)
                    break;
                if (num % i === 0)
                    numclasses.push('multi' + i);
            }
        }
        return prefix + numclasses.join(suffix + ' ' + prefix) + suffix;
    }
    var VNodeUpdater = new VirtualNodeUpdater();
    var _CommonUniqueCounter = 0;
    _ViewBase.hookVnodeUpdater(VNodeUpdater);

    var css_default = "#system---submenu-dialog-margin { margin-right: -4px; margin-left: 4px; } body { background-color: ThreeDHighlight; } #container1 { position: relative; padding: 1px; margin: 0px; border: 2px outset ThreeDHighlight; border-collapse: collapse; border-spacing: 0px; zoom: 1; background-color: ThreeDFace; } #container2 { } #container3 {} #menu-container2 { } #menu-container3 { } #menu-table { color: WindowText; font-size: x-small; } #menu-table tr { padding: 0px; margin: 0px; border-width: 0px; } #menu-table td { white-space: nowrap; padding: 0px; } #menu-table tr.menuitem { white-space: nowrap; } #menu-table tr.highlight { background-color: highlight; color: highlightText; } #menu-table td.icon { text-align: center; padding: 2px; font-size: small; } #menu-table tr.highlight td.icon { /* border-right-width: 0px; padding-right: 4px; */ } #menu-table td.content { display: inline-block; vertical-align: middle; padding-left: 4px; } #menu-table .content-container { } #menu-table td.arrow { text-align: center; font-family: Webdings; } #menu-table .arrow-container { } #menu-table td.icon .icon-container { width: 1em; } #menu-table td.content .content-container { } #menu-table tr.separator .content { font-size: 1px; line-height: 1px; height: 1px; margin: 0px; padding: 0px; } #menu-table tr.separator .hr { border-top: 1px solid ThreeDShadow; border-bottom: 1px solid ThreeDHighlight; } .deco-frame { display: none; } .deco-frame.top-left { } .deco-frame.top-center { } .deco-frame.top-right { } .deco-frame.middle-left { } .deco-frame.middle-right { } .deco-frame.bottom-left { } .deco-frame.bottom-center { } .deco-frame.bottom-right { }";

    var css_xp = "#system---submenu-dialog-margin { margin-right: -4px; margin-left: 4px; } body { position: relative; background-color: rgb(255, 255, 255); } #container1 { position: relative; zoom: 1; padding: 2px; border: 1px solid rgb(172, 168, 153); background-color: rgb(255, 255, 255); } #menu-table { color: rgb(0, 0, 0); font-size: x-small; font-family: Tahoma; } body.trans-to-load #container1 { filter: progid:DXImageTransform.Microsoft.Fade(duration=0.3); position: relative; } #container2 { visibility: hidden; } body.load #container2 { visibility: visible; } #menu-table tr.highlight { background-color: rgb(49, 106, 197); color: rgb(255, 255, 255); } #menu-table td.icon { text-align: center; padding: 2px; font-size: x-small; } #menu-table td.content { padding-left: 0px; } #menu-table td.arrow { text-align: center; font-family: Webdings; padding-left: 0.6em; } #menu-table td.icon .icon-container { width: 1em; } #menu-table tr.separator .content { font-size: 1px; line-height: 1px; height: 1px; margin: 0px; padding: 0px; } #menu-table tr.separator .hr { border-top: 1px solid rgb(172, 168, 153); border-bottom: 1px solid rgb(255, 255, 255); margin: 2px 0px; }";

    var css_classic = "#system---submenu-dialog-margin { margin-right: -4px; margin-left: 4px; } body { background-color: #C0C0C0; } #container1, #container2 { zoom: 1; position: relative; } body.trans-to-load #container1 { filter: progid:DXImageTransform.Microsoft.GradientWipe(gradientSize=1, duration=0.3); } #container2 { visibility: hidden; padding: 2px; border: 2px outset #FFFFFF; filter: progid:DXImageTransform.Microsoft.Gradient(gradientType=1, startColorstr=#FFE0E0E0, endColorstr=#FFA0A0A0); } body.load #container2 { visibility: visible; } #menu-table { color: rgb(0, 0, 0); font-size: x-small; font-family: MS Sans Serif; /*filter: progid:DXImageTransform.Microsoft.Chroma(); /* for IE8 or lower */ } #menu-table tr.highlight { background-color: rgb(0, 0, 128); color: rgb(255, 255, 255); } #menu-table td.icon { text-align: center; padding: 2px; } #menu-table td.content { padding-left: 2px; } #menu-table td.arrow { text-align: center; font-family: Webdings; padding-left: 0.6em; } #menu-table td.icon .icon-container { width: 1em; } #menu-table tr.separator .content { font-size: 1px; line-height: 1px; height: 1px; margin: 0px; padding: 0px; } #menu-table tr.separator .hr { border-top: 1px solid rgb(172, 168, 153); border-bottom: 1px solid rgb(255, 255, 255); margin: 2px 0px; }";

    var css_win7 = "#system---submenu-dialog-margin { margin-right: -4px; margin-left: 4px; } #container1 { background-color: rgb(241, 241, 241); } body.trans-to-load #container1 { filter: progid:DXImageTransform.Microsoft.Fade(duration=0.3); zoom: 1; } body.trans-to-load #menu-table { visibility: hidden; } body.load #menu-table { visibility: visible; } #container1 { padding: 2px; border: 1px solid rgb(151, 151, 151); } #menu-table { color: rgb(0, 0, 0); font-size: x-small; font-family: Tahoma, Geneva, Verdana, sans-serif; } #menu-table td.icon { color: navy; font-size: small; text-align: center; padding: 1px 3px 1px 1px; border-style:solid; border-color: rgb(241, 241, 241); border-width: 1px 0px 1px 1px; vertical-align: middle; } #menu-table td.icon .icon-container { width: 20px; border: 1px solid rgb(241, 241, 241); } #menu-table tr.checkbox .icon-container { padding-top: 2px; } #menu-table tr.radio .icon-container { padding: 1px 0px; } #menu-table td.checked .icon-container { border: 1px solid rgb(174, 207, 247); background-color: rgb(231, 241, 247); } #menu-table tr td.border { display: block; border: 1px solid rgb(224, 224, 224); border-left-color: rgb(224, 224, 224); border-right-color: rgb(255, 255, 255); } #menu-table td.content { border-style:solid; border-color: rgb(241, 241, 241); border-width: 1px 0px; padding-left: 2px; } #menu-table td.arrow { border-style:solid; border-color: rgb(241, 241, 241); border-width: 1px 1px 1px 0px; text-align: center; font-family: Webdings; padding-left: 0.6em; } #menu-table tr.separator .hr { border-top: 1px solid rgb(224, 224, 224); border-bottom: 1px solid rgb(255, 255, 255); margin: 2px 0px; } #menu-table tr.separator td.icon-hidden-for-separator { display: block; } #menu-table tr.highlight { color: rgb(0, 0, 0); background-color: rgb(231, 241, 247); } #menu-table tr.highlight td.icon { border-color: rgb(174, 207, 247) white rgb(174, 207, 247) rgb(174, 207, 247); } #menu-table tr.highlight td.checked .icon-container { border-color: rgb(201, 211, 217); } #menu-table tr.highlight td.border { border-width: 1px 0px; border-top-color: rgb(174, 207, 247); border-bottom-color: rgb(174, 207, 247); } #menu-table tr.highlight td.content { border-color: rgb(174, 207, 247) rgb(241, 241, 241) rgb(174, 207, 247) rgb(241, 241, 241); } #menu-table tr.highlight td.arrow { border-color: rgb(174, 207, 247) rgb(174, 207, 247) rgb(174, 207, 247) rgb(241, 241, 241); }";

    var css_win10 = "#system---submenu-dialog-margin { margin-right: -4px; margin-left: 4px; } #container1 { background-color: rgb(238, 238, 238); zoom: 1; } body.trans-to-load #container1 { filter: progid:DXImageTransform.Microsoft.Fade(duration=0.3); } body.trans-to-load #menu-table { visibility: hidden; } body.load #menu-table { visibility: visible; } #container2 { padding: 4px 2px; border: 1px solid rgb(160, 160, 160); } #menu-table { color: rgb(0, 0, 0); font-size: x-small; font-family:Tahoma, Geneva, Verdana, sans-serif; } #menu-table tr.highlight { color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); } #menu-table td.icon { text-align: center; padding: 2px; font-size: small; } #menu-table td.icon .icon-container { width: 1.5em; } #menu-table td.content { padding-left: 2px; } #menu-table td.arrow { text-align: center; font-family: Webdings; padding-right: 8px; padding-left: 0.6em; } #menu-table tr.separator .content { font-size: 1px; line-height: 1px; height: 1px; margin: 0px; padding: 0px 8px; border-width: 0px; } #menu-table tr.separator .hr { border: 1px solid rgb(145, 145, 145); border-width: 0px 0px 1px 0px; margin: 2px 0px 3px 0px; }";

    var CLOSE_CHILD_MOUSEOUT_TIME = 1200;
    var DblClick_Delay = 250;
    var _RootController = /** @class */ (function (_super) {
        __extends(_RootController, _super);
        function _RootController() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1._locked = 0; // locked stack number
            _this_1._enableOnlyLastChild = false;
            return _this_1;
        }
        _RootController.prototype.setLocked = function (flag) {
            this._locked += (flag ? 1 : -1);
            //console.log(`#setLocked ${flag} (${this._locked})`, 'red');
            if (this._locked < 0) {
                this._locked = 0;
            }
        };
        _RootController.prototype.isLocked = function (ctrl) {
            return !!this._locked || !!(this._enableOnlyLastChild && ctrl && ctrl !== this._lastChild);
        };
        _RootController.prototype.setLastChild = function (ctrl) {
            this._lastChild = ctrl;
        };
        _RootController.prototype.enableOnlyLastChild = function (flag) {
            if (flag === void 0) { flag = true; }
            this._enableOnlyLastChild = flag;
        };
        _RootController.prototype.move = function (x, y) {
        };
        _RootController.prototype.getRootController = function () {
            return this;
        };
        return _RootController;
    }(_MenuModelable));
    var MenuRootController = /** @class */ (function (_super) {
        __extends(MenuRootController, _super);
        function MenuRootController(param /*, inheritAttr?: MenuSubmenu*/) {
            var _this_1 = _super.call(this) || this;
            _this_1._ctrl = null;
            //private _locked: number = 0; // locked stack number
            _this_1._readyToUse = false;
            _this_1._isUpdatingView = false;
            _this_1._model = new MenuSubmenu(param /*, inheritAttr, true*/);
            MenuDialogView.hookBeforeUpdate(function () {
                _this_1.setLocked(true);
                _this_1._isUpdatingView = true;
            });
            MenuDialogView.hookAfterUpdate(function () {
                _this_1.setLocked(false);
                _this_1._isUpdatingView = false;
            });
            return _this_1;
        }
        /**
         * create controller and view
         */
        MenuRootController.prototype.open = function (x, y, ctx, parentWindow) {
            this.close();
            var ctrl = new MenuContainerController(this, ctx, { base: 'screen', marginX: x, marginY: y }, parentWindow);
            if (ctrl === null || ctrl === void 0 ? void 0 : ctrl.getView()) {
                this._ctrl = ctrl;
                this._readyToUse = true;
            }
        };
        /**
         * close View
         * @memberof MenuUserInterface
         */
        MenuRootController.prototype.close = function () {
            var _a;
            (_a = this._ctrl) === null || _a === void 0 ? void 0 : _a.dispose();
        };
        MenuRootController.prototype.isUpdatingView = function () {
            return this._isUpdatingView;
        };
        MenuRootController.prototype.getPosition = function () {
            return {};
        };
        MenuRootController.prototype.getRectangleOfWholeMenus = function () {
            var _a;
            var ctrl = this._ctrl;
            var minLeft = Number.POSITIVE_INFINITY;
            var minTop = Number.POSITIVE_INFINITY;
            var maxRight = -1;
            var maxBottom = -1;
            do {
                var pos = (_a = ctrl === null || ctrl === void 0 ? void 0 : ctrl.getView()) === null || _a === void 0 ? void 0 : _a.getDialogPosition();
                if (!pos)
                    break;
                var left = pos.left, top_1 = pos.top, width = pos.width, height = pos.height;
                if (left < minLeft)
                    minLeft = left;
                if (top_1 < minTop)
                    minTop = top_1;
                if (maxRight < left + width)
                    maxRight = left + width;
                if (maxBottom < top_1 + height)
                    maxBottom = top_1 + height;
                ctrl = (ctrl === null || ctrl === void 0 ? void 0 : ctrl.getChild()) || null;
            } while (ctrl);
            return {
                top: minTop,
                left: minLeft,
                right: maxRight,
                bottom: maxBottom,
                width: maxRight - minLeft,
                height: maxBottom - minTop
            };
        };
        MenuRootController.prototype.getModel = function () {
            return this._model;
        };
        MenuRootController.prototype.loadSkin = function (path) {
            this._model.setSkin(path);
        };
        MenuRootController.prototype.setGlobalEvent = function (handler, listener) {
            this._model.setGlobalEvent(handler, listener);
        };
        MenuRootController.prototype.clearGlobalEvents = function () {
            this._model.clearGlobalEvents();
        };
        /*
        isPopup(): this is PopupController {
          return this instanceof PopupController;
        }
        */
        MenuRootController.prototype.destroy = function () {
            this.close();
            this._model.dispose();
        };
        return MenuRootController;
    }(_RootController));
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
    var _lastDialogViewCreatedTime = 0;
    /**
     * core Menu controller
     * @class MenuContainerController
     */
    var MenuContainerController = /** @class */ (function () {
        /**
         * Creates an instance of MenuContainerController.
         * @param {MenuSubmenu} param
         * @param {(any | MenuItemController)} [ctx] - it is MenuItemController if it is created by parent MenuItemController, otherwise it is a root context.
         * @memberof MenuContainerController
         */
        function MenuContainerController(param, ctx, pos, rootWindow) {
            var _a;
            this._view = null;
            this._items = [];
            this._parent = null;
            this._parentItem = null;
            this._child = null;
            // status
            this._initializingView = false;
            this._openingSubmenu = false;
            //private _x: number = 0;
            //private _y: number = 0;
            this._currentItem = null;
            this._mouseOverItemTimeoutId = 0;
            this._closingCurrentChildTimeoutId = 0;
            this._mouseStayOutSubmenuTimeoutId = 0;
            this._mouseStayTime = 500;
            this._mouseStayoutSubmenuTime = 500;
            this._lastMouseDownedItem = null;
            this._direction = 1;
            this._viewPosition = null;
            this._currentChildPositionClassText = '';
            this._disposed = false;
            // when param is MenuRootController, this is a root menu. otherwise, the MenuItemController is a parent menu item of this.
            if (param instanceof MenuRootController) {
                this._model = param.getModel();
                this._rootCtrl = param;
                this._ctx = ctx;
            }
            // it has a parent container
            else {
                this._parentItem = param;
                this._parent = this._parentItem.getContainer();
                this._model = this._parentItem.getModel();
                this._rootCtrl = this._parent.getRootController();
            }
            this._pos = pos;
            pos = this._model.isPopup() && this._model.getPosObject() || pos || {};
            // only root menu observes window.document's events
            if (!this._parent) {
                this._evaBaseDoc = new EventAttacher((rootWindow === null || rootWindow === void 0 ? void 0 : rootWindow.document) || document, undefined, IE_Version.MSIE === 11); // use addEvenetListener if HTA is running on IE11 mode
            }
            this._modelEventMananger = new MenuModelEventManager(this._model);
            this._model.fireUserEvent('beforeload', ctx, new MenuUserEventObject('beforeload', this));
            // do not to catch window initializing error when dev mode
            // catch an error during initializing the view window when in production mode
            try {
                this._createView(pos, rootWindow);
                this._model.fireUserEvent('load', ctx, new MenuUserEventObject('load', this));
            }
            catch (e) {
                this._parentItem = null;
                this._parent = null;
                this._ctx = null;
                this._rootCtrl = null;
                (_a = this._evaBaseDoc) === null || _a === void 0 ? void 0 : _a.dispose();
                this._model = null;
                this._view = null;
            }
        }
        MenuContainerController.prototype._createView = function (pos, rootWindow) {
            var _a;
            this._currentItem = null;
            // opening dialog without delay causes problems occasionally on IE6 or lower (duplicating dialogs)
            if (IE_Version.real <= 6) {
                var time = new Date().getTime();
                if (time - _lastDialogViewCreatedTime < 500)
                    return;
                _lastDialogViewCreatedTime = time;
            }
            this._initializingView = true;
            if (this._view) {
                this._view.dispose();
                this._view = null;
            }
            // get new view
            try {
                this._view = new MenuDialogView((this._parentItem && this._parentItem.getModel().getIndex() + 1 || 0), (_a = this._parent) === null || _a === void 0 ? void 0 : _a.getView(), this._model.getCustomDialogClass(), rootWindow);
                this._setViewDOMEvents(this._view);
            }
            catch (e) {
                this._initializingView = false;
                this._view = null;
                return;
            }
            // set CSS
            var css = this._model.getSkin();
            if (!css) {
                css = 'default';
            }
            if (css) {
                this.setSkinToCurrentView(css);
            }
            var cssText = this._model.getCSSText();
            if (cssText)
                this.setCSSTextToCurrentView(cssText);
            var fontSize = this._model.getFontSize();
            if (fontSize)
                this._view.setMenuFontSize(fontSize);
            var fontFamily = this._model.getFontFamily();
            if (fontFamily)
                this._view.setMenuFontFamily(fontFamily);
            // create menu items
            this._createItems(this._model);
            // set default control icons for internal skins
            switch (css) {
                case 'default':
                    this._model.setDefaultCheckableIcon('checkbox', { text: '\x62', fontFamily: 'Marlett' });
                    this._model.setDefaultCheckableIcon('radio', { text: '\x69', fontFamily: 'Marlett' });
                    break;
                case 'classic':
                    this._model.setDefaultCheckableIcon('checkbox', [{ text: '\xfe', fontFamily: 'Wingdings' }, { text: '\xa8', fontFamily: 'Wingdings' }]);
                    this._model.setDefaultCheckableIcon('radio', [{ text: '\xa4', fontFamily: 'Wingdings' }, { text: '\xa1', fontFamily: 'Wingdings' }]);
                    break;
                case 'xp':
                    this._model.setDefaultCheckableIcon('checkbox', { text: '\x62', fontFamily: 'Marlett', fontSize: 'x-small' });
                    this._model.setDefaultCheckableIcon('radio', { text: '\x69', fontFamily: 'Marlett', fontSize: 'small' });
                    break;
                case 'win7':
                case 'win10':
                    this._model.setDefaultCheckableIcon('checkbox', { text: '\xfc', fontFamily: 'Wingdings' });
                    this._model.setDefaultCheckableIcon('radio', { text: '\x69', fontFamily: 'Marlett' });
                    break;
            }
            this._view.initLayout();
            var _b = this._calculatePosition(pos), left = _b.left, top = _b.top, posX = _b.posX, posY = _b.posY;
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
        };
        // calculate the position where the view should appear
        MenuContainerController.prototype._calculatePosition = function (pos) {
            var _a;
            var _b = pos.base, base = _b === void 0 ? 'screen' : _b, _c = pos.marginX, marginX = _c === void 0 ? 0 : _c, _d = pos.marginY, marginY = _d === void 0 ? 0 : _d, _e = pos.posX, posX = _e === void 0 ? 'left' : _e, _f = pos.posY, posY = _f === void 0 ? 'top' : _f, _g = pos.marginLeft, marginLeft = _g === void 0 ? 0 : _g, _h = pos.marginRight, marginRight = _h === void 0 ? 0 : _h;
            var _j = window.screen, scrWidth = _j.availWidth, scrHeight = _j.availHeight;
            var _k = this._view.getContentSize(), menuWidth = _k.width, menuHeight = _k.height;
            var left = 0;
            var top = 0;
            var itemMarginLeft = 0;
            var itemMarginTop = 0;
            var itemMarginRight = 0;
            var itemMarginBottom = 0;
            // decide base rectangle
            var baseRect = null;
            do {
                switch (base) {
                    case 'all':
                        baseRect = this.getRootController().getRectangleOfWholeMenus();
                        break;
                    case 'screen':
                        baseRect = { left: 0, top: 0, width: scrWidth, height: scrHeight, right: scrWidth, bottom: scrHeight };
                        break;
                    case 'item': {
                        if (!this._parentItem) {
                            base = 'parent';
                            continue;
                        }
                        baseRect = this._parentItem.getView().getItemPosition();
                        (_a = this._view.getItemMargin(), itemMarginLeft = _a.left, itemMarginTop = _a.top, itemMarginRight = _a.right, itemMarginBottom = _a.bottom);
                        baseRect.left -= itemMarginLeft;
                        baseRect.top -= itemMarginTop;
                        baseRect.bottom += itemMarginBottom;
                        baseRect.right += itemMarginRight;
                        break;
                    }
                    case 'parent':
                        if (!this._parent) {
                            base = 'screen';
                            continue;
                        }
                        baseRect = this._parent.getView().getDialogPosition();
                        break;
                    default:
                        throw new Error("unexpected pos base \"".concat(base, "\""));
                }
                break;
            } while (true);
            // decide x base position
            var rightMargin = marginRight || -marginLeft || marginX;
            var leftMargin = marginLeft || -marginRight || marginX;
            for (var retry = 2; retry--;) {
                //let leftMargin = marginX || 0;
                var margin = 0;
                switch (posX) {
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
                        left = baseRect.left - menuWidth / 2 | 0;
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
                        left = baseRect.right - menuWidth / 2 | 0;
                        margin = rightMargin;
                        break;
                    case 'x-center':
                        left = baseRect.left + (menuWidth > baseRect.width ? baseRect.width - (menuWidth - baseRect.width) / 2 : (baseRect.width - menuWidth) / 2) | 0;
                        break;
                    default:
                        throw new Error("unexpected posX \"".concat(posX, "\""));
                }
                //left += leftMargin;
                left += margin;
                if (left + menuWidth > scrWidth) {
                    if (base === 'screen' || this._model.isPopup()) {
                        left = scrWidth - menuWidth;
                        break;
                    }
                    else {
                        posX = 'left-out';
                    }
                    continue;
                }
                else if (left < 0) {
                    //left = 0;
                    break;
                }
                break;
            }
            // decide y base position
            for (var retry = 2; retry--;) {
                switch (posY) {
                    case 'top':
                        top = baseRect.top;
                        break;
                    case 'top-out':
                        top = baseRect.top - menuHeight;
                        break;
                    case 'top-center':
                        top = baseRect.top - menuHeight / 2 | 0;
                        break;
                    case 'bottom':
                        top = baseRect.bottom - menuHeight;
                        break;
                    case 'bottom-out':
                        top = baseRect.bottom;
                        break;
                    case 'bottom-center':
                        top = baseRect.bottom - menuHeight / 2 | 0;
                        break;
                    case 'y-center':
                        top = baseRect.top + (menuHeight > baseRect.height ? baseRect.height - (menuHeight - baseRect.height) / 2 : (baseRect.height - menuHeight) / 2) | 0;
                        break;
                    default:
                        throw new Error("unexpected posY \"".concat(posY, "\""));
                }
                top += marginY || 0;
                if (top + menuHeight > scrHeight) {
                    if (base === 'screen' || this._model.isPopup()) {
                        top = scrHeight - menuHeight;
                        break;
                    }
                    else {
                        posY = 'bottom';
                    }
                    continue;
                }
                else if (top < 0) {
                    top = 0;
                    break;
                }
                break;
            }
            this._viewPosition = { left: left, top: top, posX: posX, posY: posY, base: base };
            return this._viewPosition;
        };
        MenuContainerController.prototype._createItems = function (submenuModel) {
            var models = this._model.produceItems(new MenuUserEventObject('demand', this));
            this._items.length = 0;
            var itemNumber = 1;
            var paramListForViewItems = [];
            for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
                var model = models_1[_i];
                paramListForViewItems.push({
                    type: model.getType(),
                    label: model.getLabel(),
                    icon: model.getIcon(),
                    classNames: model.getCustomClassNames(),
                    arrow: model.isSubmenu() && model.getArrowIcon() || undefined,
                    flags: model.getFlags(),
                    itemNumber: itemNumber,
                    index: model.getIndex()
                });
                if (model.isNormal())
                    itemNumber++;
            }
            // create views beforehand
            var viewItems = this._view.createTableViewItems(paramListForViewItems);
            for (var _a = 0, models_2 = models; _a < models_2.length; _a++) {
                var model = models_2[_a];
                var item_1 = new MenuItemController(model, this, viewItems.shift());
                this._items.push(item_1);
            }
            /*
            for( const model of models ) {
              const item = new MenuItemController(model, this, itemNumber);
              this._items.push( item );
              if( model.isNormal() )
                itemNumber++;
            };
            */
        };
        MenuContainerController.prototype.setSkinToCurrentView = function (css) {
            switch (css) {
                case 'default':
                    this._view.setCSSText(css_default, true);
                    break;
                case 'xp':
                    this._view.setCSSText(css_xp, true);
                    break;
                case 'classic':
                    this._view.setCSSText(css_classic, true);
                    break;
                case 'win7':
                    this._view.setCSSText(css_win7, true);
                    break;
                case 'win10':
                    this._view.setCSSText(css_win10, true);
                    break;
                case 'plain':
                    break;
                // set skin from CSS file
                default:
                    // ensure the pass is local
                    if (/:\/\//.test(css))
                        throw new Error("use local path for CSS. \"".concat(css, "\" is denied."));
                    this._view.loadStyleSheet(css);
                    if (this._view.isEmptyCSS()) ;
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
        };
        MenuContainerController.prototype.setCSSTextToCurrentView = function (cssText) {
            var _a;
            (_a = this._view) === null || _a === void 0 ? void 0 : _a.setCSSText(cssText);
        };
        MenuContainerController.prototype.resizeView = function (width, height) {
            var _a;
            (_a = this._view) === null || _a === void 0 ? void 0 : _a.resizeDialog(width, height);
        };
        MenuContainerController.prototype.getView = function () {
            return this._view;
        };
        MenuContainerController.prototype.hasView = function () {
            var _a;
            return !!((_a = this._view) === null || _a === void 0 ? void 0 : _a.isAvailable());
        };
        MenuContainerController.prototype.getViewPosition = function () {
            return this._viewPosition;
        };
        MenuContainerController.prototype.getModel = function () {
            return this._model;
        };
        MenuContainerController.prototype.isReadyToUse = function () {
            var _a;
            return (_a = this === null || this === void 0 ? void 0 : this._view) === null || _a === void 0 ? void 0 : _a.isReadyToUse();
        };
        MenuContainerController.prototype.getChild = function () {
            return this._child;
        };
        MenuContainerController.prototype.getRootController = function () {
            return this._rootCtrl;
        };
        MenuContainerController.prototype.getContext = function () {
            return this._parent ? this._parent.getContext() : this._ctx;
        };
        MenuContainerController.prototype.getLayer = function () {
            return this._model.getLayer();
        };
        MenuContainerController.prototype.getBasedItemController = function () {
            return this._parentItem;
        };
        MenuContainerController.prototype.isCurrentOpenedChildSubmenuItem = function (item) {
            var _a;
            return ((_a = this._child) === null || _a === void 0 ? void 0 : _a.isAvailable()) && this._child.getBasedItemController() === item;
        };
        MenuContainerController.prototype.getLastMouseDownedItem = function () {
            return this._lastMouseDownedItem;
        };
        MenuContainerController.prototype.setLastMouseDownedItem = function (item) {
            return this._lastMouseDownedItem = item;
        };
        // forcibly synchronize with other windows
        MenuContainerController.prototype.synchronize = function () {
            var _a, _b;
            (((_b = (_a = this._view) === null || _a === void 0 ? void 0 : _a.doc()) === null || _b === void 0 ? void 0 : _b.body) || {}).dir = 'ltr';
        };
        /**
         * create and open submenu
         *
         * @param {MenuItemController} item
         * @return {*}
         * @memberof MenuContainerController
         */
        MenuContainerController.prototype.openSubmenu = function (item) {
            var _a, _b, _c, _d, _e;
            // check 2 times to make sure that it does not have a child
            if (this._openingSubmenu)
                return;
            if (!this.isAvailable())
                return null;
            // remove current existing child menu
            if ((_a = this._child) === null || _a === void 0 ? void 0 : _a.isAvailable()) {
                if (this.isCurrentOpenedChildSubmenuItem(item)) {
                    return;
                }
                this.disposeChild();
            }
            this._openingSubmenu = true;
            this._view.setDocumentClass('topmost', false);
            clearTimeout(this._mouseStayOutSubmenuTimeoutId);
            this._mouseStayOutSubmenuTimeoutId = 0;
            this.clearClosingCurrentChildTimeout();
            var model = item.getModel();
            if (!(model instanceof MenuSubmenu))
                throw new Error('only MenuSubmenu items can create a submenu');
            // get dialog margin parameter
            var margin = this.getModel().getChildLeftMargin();
            var marginLeft;
            var marginRight;
            if (typeof margin === 'undefined') {
                margin = 0;
                var left = this._view.getSubmenuMarginSettingFromCSS('left');
                var right = this._view.getSubmenuMarginSettingFromCSS('right');
                if (typeof left === 'number') {
                    margin = left;
                    marginLeft = left;
                }
                if (typeof right === 'number') {
                    margin = right;
                    marginRight = right;
                }
            }
            // create child instance
            this.getRootController().setLocked(true);
            var child = new MenuContainerController(item, this._ctx, { base: 'item', posX: 'right-out', marginLeft: marginLeft, marginRight: marginRight });
            if (child instanceof (MenuContainerController)) {
                this._child = child;
                this.getRootController().setLastChild(child);
                var cpos = child.getViewPosition();
                if (cpos) {
                    // remove previous view's classes about child postion
                    if (this._currentChildPositionClassText) {
                        (_b = this._view) === null || _b === void 0 ? void 0 : _b.setDocumentClass(this._currentChildPositionClassText, false);
                        this._currentChildPositionClassText = '';
                    }
                    // add static class about child position
                    var childPositionClassText = "child-".concat(cpos.posX, " child-").concat(cpos.posY);
                    (_c = this._view) === null || _c === void 0 ? void 0 : _c.setDocumentClass(childPositionClassText, true);
                    this._currentChildPositionClassText = childPositionClassText;
                }
            }
            // set open flag
            (_d = item.getView()) === null || _d === void 0 ? void 0 : _d.setViewFlag('open', true);
            this._view.setBodyViewFlagByItem('open', true, ((_e = item.getView()) === null || _e === void 0 ? void 0 : _e.getItemNumber()) || 0, model.getCustomClassNames());
            this._openingSubmenu = false;
            this.getRootController().setLocked(false);
        };
        MenuContainerController.prototype.setTopMost = function () {
            var _a;
            (_a = this._view) === null || _a === void 0 ? void 0 : _a.setDocumentClass('topmost');
        };
        /**
         * check if the controller is alive before firing the callback
         * @private
         * @param {(...args:any[]) => any} callback
         * @return {*}
         * @memberof MenuItemController
         */
        MenuContainerController.prototype.checkAvailabilityBeforeCall = function (callback, _this) {
            var _this_1 = this;
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (!_this_1.isAvailable() || !_this_1.isReadyToUse())
                    return;
                callback.apply(_this || _this_1, args);
                _this = null;
            };
        };
        /*
         * set event listeners for the dialog view
         */
        MenuContainerController.prototype._setViewDOMEvents = function (view) {
            var _this_1 = this;
            var _a;
            (_a = this._evaBaseDoc) === null || _a === void 0 ? void 0 : _a.attach('onmouseup', this.checkAvailabilityBeforeCall(this._onBaseDocClick));
            // when it losed focus by an other window, onfocusout event fires.
            view.addDocumentEvent('onfocusout', this.checkAvailabilityBeforeCall(this._onDocumentFocusOut));
            view.addDocumentEvent('ondragstart', this._onMenuDragStart);
            view.addDocumentEvent('onmousewheel', this._onDocumentMouseWheel);
            view.addDocumentEvent('onkeydown', function (ev) {
                if (_this_1._onPressAltF4(ev))
                    return;
                _this_1.checkAvailabilityBeforeCall(_this_1._onKeyPress)(ev);
            });
            view.addWindowEvent('onbeforeunload', this.checkAvailabilityBeforeCall(this._onUnload));
            /*
            // -----
            view.addWinEvent('onfocus', (...args) => this._onMenuFocus(...args));//
            view.addWinEvent('onblur', (...args) => this._onMenuBlur(...args));//
            view.addDocEvent('onfocusin', (...args) => this._onFocusIn(...args));//
            */
        };
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
        MenuContainerController.prototype._onMenuDragStart = function (ev) {
            ev.returnValue = false;
        };
        /*
         * dialog close events
         */
        MenuContainerController.prototype._onDocumentFocusOut = function (ev) {
            var _a;
            if (!this._view)
                return;
            if (this._model.isPopup() && this.isLocked()) ;
            // current dialog (and probably all other dialogs) loses focus
            else if (!((_a = this._view) === null || _a === void 0 ? void 0 : _a.hasFocus())) {
                if (this._model.getAutoClose()) {
                    this.disposeAll();
                }
            }
        };
        /**
         * always close when HTA's document.body is clicked
         * @private
         * @param {MSEventObj} ev
         * @return {*}
         * @memberof MenuContainerController
         */
        MenuContainerController.prototype._onBaseDocClick = function (ev) {
            if (!this._view || !this._model.getAutoClose()) {
                return;
            }
            this.dispose();
        };
        MenuContainerController.prototype._onUnload = function (ev) {
            if (!this._view)
                return;
            this.dispose();
            //ev.returnValue = 'the dialog is going to be closed by external application';
        };
        /**
         * Keyboard events
         * @private
         * @param {MSEventObj} ev
         * @memberof MenuContainerController
         */
        MenuContainerController.prototype._onKeyPress = function (ev) {
            //if( this._discarded || !this.isAvailable() )
            //  return;
            switch (ev.keyCode) {
                // prevent zoom
                case 107: //+
                case 109: //-
                    if (ev.ctrlKey)
                        ev.returnValue = false;
                    break;
                // prevent alt+F4
                case 115:
                    if (ev.altKey)
                        ev.returnValue = false;
                    break;
                case 27: // ESC
                case 37: // left
                    if (ev.srcElement.type === 'text' || ev.srcElement.nodeName === 'textarea') // fired by text input field
                        break;
                    if (ev.keyCode === 27 || this._model.getLayer() !== 0 /*not to close first menu*/) {
                        //this.disposeFromParent();
                        this.disposeFromParent();
                    }
                    break;
                case 39: // right
                    if (this._currentItem) {
                        if (this._currentItem.getModel().isSubmenu())
                            this._currentItem.activate(ev);
                        break;
                    }
                // if this.currentItem is empty, go below
                case 38: // up
                case 40: // down
                    var item = this.getNextMenuItem(ev.keyCode === 38 ? -1 : 1);
                    if (item) {
                        this.setCurrentItem(item);
                    }
                    break;
                case 32: // space
                    if (this._currentItem) {
                        if (/radio|check/.test(this._currentItem.getModel().getType() || ''))
                            this._currentItem.activate(ev);
                    }
                    break;
                case 13: // enter
                    if (this._currentItem)
                        this._currentItem.activate(ev);
                    break;
            }
        };
        // prevent to close dialog
        MenuContainerController.prototype._onPressAltF4 = function (ev) {
            switch (ev.keyCode) {
                // prevent zoom
                case 107: //+
                case 109: //-
                    if (ev.ctrlKey) {
                        ev.returnValue = false;
                        return true;
                    }
                    break;
                // prevent alt+F4
                case 115:
                    if (ev.altKey) {
                        ev.returnValue = false;
                        return true;
                    }
                    break;
            }
            return false;
        };
        // prevent to zoom document from mouse wheeling
        MenuContainerController.prototype._onDocumentMouseWheel = function (ev) {
            if (ev.wheelDelta && ev.ctrlKey) {
                ev.returnValue = false;
            }
        };
        MenuContainerController.prototype.getElementsByName = function (name) {
            //return this._document?.getElementsByName(name);
        };
        MenuContainerController.prototype.getNextMenuItem = function (plus, current) {
            var items = this._items;
            var startItem = current || this._currentItem;
            var index = startItem ? startItem.getModel().getIndex() : -1;
            var item = null;
            for (var i = items.length; i--;) {
                index += plus;
                if (index === items.length)
                    index = 0;
                else if (index < 0)
                    index = items.length - 1;
                item = items[index];
                var model = item.getModel();
                var flags = model.isNormal() ? model.getFlags() : null;
                if (!flags || flags.unselectable || flags.disabled)
                    continue;
                return item;
            }
            return null;
        };
        MenuContainerController.prototype.setCurrentItem = function (item, activateMouseStay) {
            var _a, _b, _c, _d, _e, _f;
            var model = item === null || item === void 0 ? void 0 : item.getModel();
            if (!((_a = this.getView()) === null || _a === void 0 ? void 0 : _a.isAvailable()))
                return;
            var flags = model.getFlags();
            if (flags.unselectable || flags.disabled)
                return;
            if (this._currentItem !== item) {
                // de-highlight previous highlighted item
                if (this._currentItem) {
                    var citemModel = this._currentItem.getModel();
                    var cview = this._currentItem.getView();
                    cview.setViewFlag('highlight', false);
                    cview.setViewFlag('activate', false);
                    var cNumber = cview.getItemNumber();
                    var cCustomClasses = citemModel.getCustomClassNames();
                    (_b = this._view) === null || _b === void 0 ? void 0 : _b.setBodyViewFlagByItem('highlight', false, cNumber, cCustomClasses);
                    (_c = this._view) === null || _c === void 0 ? void 0 : _c.setBodyViewFlagByItem('activate', false, cNumber, cCustomClasses);
                }
                // highlight normal item
                if (model.isNormal()) {
                    //item.getView()?.deleteViewFlag('activate');
                    (_d = item.getView()) === null || _d === void 0 ? void 0 : _d.setViewFlag('highlight', true);
                    (_e = this._view) === null || _e === void 0 ? void 0 : _e.setBodyViewFlagByItem('highlight', true, ((_f = item.getView()) === null || _f === void 0 ? void 0 : _f.getItemNumber()) || 0, model.getCustomClassNames());
                    model.fireUserEvent('highlight', this.getContext(), new MenuUserEventObject('highlight', this));
                }
                this._hookToCloseCurrentChild(item);
            }
            // set parent's current item
            //this.getRootController().setLocked(true);
            if (!this.getModel().isRoot()) {
                //this.getRootController().setLocked(true);
                try {
                    this.setThisAsParentCurrentItem(this._view);
                }
                catch (e) { }
                //this.getRootController().setLocked(false);
            }
            //this.getRootController().setLocked(false);
            if (this._currentItem === item)
                return;
            this._currentItem = item;
            // calculate mouse staying time
            if (activateMouseStay) {
                this._hookMouseStay(item, this._view);
            }
        };
        MenuContainerController.prototype._hookMouseStay = function (stayingItem, view, time) {
            var _this_1 = this;
            //console.log(`${item.getModel().$L()} mousestay1`, "red");
            this._clearMouseStayTimeout();
            this._mouseOverItemTimeoutId = window.setTimeout(function () {
                var _a;
                //this.synchronize();
                _this_1.isAvailable() && view.isAvailable() && _this_1._currentItem === stayingItem;
                /*
                if( !available ) {
                  console.log(`${this.$L()}#mousestay terminate ${[this.isAvailable(),view.isAvailable(),this._currentItem === stayingItem]}`, 'red');
                  view = null as any;
                  return;
                }
                */
                var result = (_a = _this_1._currentItem) === null || _a === void 0 ? void 0 : _a.fireMouseStay();
                // re execute if failed to fireMouseStay
                if (result === false) {
                    _this_1._hookMouseStay(stayingItem, view, 100);
                    return;
                }
                view = null;
            }, time !== null && time !== void 0 ? time : this._mouseStayTime);
        };
        MenuContainerController.prototype._clearMouseStayTimeout = function () {
            clearTimeout(this._mouseOverItemTimeoutId);
            this._mouseOverItemTimeoutId = 0;
        };
        /**
         * close an opened child menu if the mouse cursor leaves the outside of its submenu item
         * @private
         * @param {MenuItemController} item
         * @return {*}
         * @memberof MenuContainerController
         */
        MenuContainerController.prototype._hookToCloseCurrentChild = function (item) {
            var _this_1 = this;
            if (this.isCurrentOpenedChildSubmenuItem(item) || this._closingCurrentChildTimeoutId)
                return;
            this._closingCurrentChildTimeoutId = setTimeout(function () {
                if (item === _this_1._currentItem) { // prevent mousestay too
                    _this_1._clearMouseStayTimeout();
                }
                _this_1.disposeChild();
                _this_1.clearClosingCurrentChildTimeout();
            }, CLOSE_CHILD_MOUSEOUT_TIME);
        };
        MenuContainerController.prototype.clearClosingCurrentChildTimeout = function () {
            clearTimeout(this._closingCurrentChildTimeoutId);
            this._closingCurrentChildTimeoutId = 0;
        };
        MenuContainerController.prototype.getCurrentItem = function () {
            return this._currentItem;
        };
        /**
         * set parent's currentItem as this submenu item
         * @memberof MenuContainerController
         */
        MenuContainerController.prototype.setThisAsParentCurrentItem = function (view) {
            var _a;
            if (!this._parentItem || !view || !view.isAvailable())
                return;
            // get parent container
            var pcontainer = (_a = this._parentItem) === null || _a === void 0 ? void 0 : _a.getContainer();
            if (!(pcontainer === null || pcontainer === void 0 ? void 0 : pcontainer.hasView()))
                return;
            //!it interacts with another window!
            pcontainer.setCurrentItem(this._parentItem, true);
            pcontainer.clearClosingCurrentChildTimeout();
        };
        /*
        isPopup() {
          return this.getRootController() instanceof PopupController;
        }
        */
        MenuContainerController.prototype.hide = function () {
            var _a, _b;
            if (!((_a = this._view) === null || _a === void 0 ? void 0 : _a.isAvailable()))
                return;
            (_b = this._view) === null || _b === void 0 ? void 0 : _b.moveDialog(-100000, -100000);
            if (this._child)
                this._child.hide();
        };
        MenuContainerController.prototype.isAvailable = function () {
            var _a;
            return !this._disposed && !!((_a = this._view) === null || _a === void 0 ? void 0 : _a.isAvailable()) && !this.isLocked();
        };
        MenuContainerController.prototype.isLocked = function () {
            return this.getRootController().isLocked(this);
        };
        MenuContainerController.prototype.isDisposed = function () {
            return this._disposed;
        };
        MenuContainerController.prototype.disposeAll = function () {
            this._rootCtrl.close();
        };
        MenuContainerController.prototype.disposeFromParent = function () {
            var _a;
            (_a = this._parent) === null || _a === void 0 ? void 0 : _a.disposeChild();
        };
        MenuContainerController.prototype.disposeChild = function () {
            var _b;
            if (this._child) {
                var opendItem = this._child.getBasedItemController();
                if (opendItem) {
                    var model = opendItem.getModel();
                    var openedv = opendItem.getView();
                    var contv = (_b = opendItem.getContainer()) === null || _b === void 0 ? void 0 : _b.getView();
                    var cnumber = (openedv === null || openedv === void 0 ? void 0 : openedv.getItemNumber()) || 0;
                    var customclasses = model.getCustomClassNames();
                    openedv === null || openedv === void 0 ? void 0 : openedv.setViewFlag('open', false);
                    contv === null || contv === void 0 ? void 0 : contv.setBodyViewFlagByItem('open', false, cnumber, customclasses);
                    openedv === null || openedv === void 0 ? void 0 : openedv.setViewFlag('activate', false);
                    contv === null || contv === void 0 ? void 0 : contv.setBodyViewFlagByItem('activate', false, cnumber, customclasses);
                }
                //this.getRootController().setLocked(true);
                this._child.dispose();
                //this.getRootController().setLocked(false);
                this.clearClosingCurrentChildTimeout();
            }
            this._child = null;
        };
        MenuContainerController.prototype.dispose = function () {
            if (this._disposed)
                return;
            this._disposed = true;
            this._dispose();
        };
        MenuContainerController.prototype._dispose = function () {
            var _this_1 = this;
            var _a, _b;
            if (this.isLocked()) {
                setTimeout(function () { return _this_1._dispose(); }, 100);
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
            for (var _i = 0, _c = this._items; _i < _c.length; _i++) {
                var item_2 = _c[_i];
                item_2.dispose();
            }
            // dispose view dialog
            (_a = this._view) === null || _a === void 0 ? void 0 : _a.dispose();
            this._view = null;
            this.getRootController().setLocked(false);
            // destroy model and items
            //if( destroy ) {
            //  this._model.dispose();
            this._items.length = 0;
            try {
                (_b = this._evaBaseDoc) === null || _b === void 0 ? void 0 : _b.dispose();
            }
            catch (e) {
            }
            this._model.fireUserEvent('unload', this.getContext(), new MenuUserEventObject('unload', this));
            if (this._parent) {
                if (!this._parent.isDisposed()) {
                    this._parent.setTopMost();
                }
            }
            else {
                this._model.fireUserEvent('_rootclose', this.getContext(), new MenuUserEventObject('_rootclose', this));
            }
            if (this._model.isPopup()) {
                this.getRootController().enableOnlyLastChild(false);
            }
            this._modelEventMananger.dispose();
            this._ctx = null;
            this._rootCtrl = null;
            this._parentItem = null;
            this._parent = null;
            //}
        };
        MenuContainerController.prototype.getDirection = function () {
            return this._direction;
        };
        MenuContainerController.prototype.$L = function () {
            return "L(".concat(this.getLayer(), ")");
        };
        return MenuContainerController;
    }());
    /*
     * variables for double click
     */
    var prevDblclickItem = null;
    var prevDblclickTime = 0;
    /**
     * controller for each menu item
     * @class MenuItemController
     * @implements {LoggerInterface}
     */
    var MenuItemController = /** @class */ (function () {
        function MenuItemController(model, container, view /*, itemNumber: number*/) {
            var _this_1 = this;
            this._onMouseOverItem = function (ev) { return _this_1._container.setCurrentItem(_this_1, true); };
            this._onMouseDownItem = function (ev) {
                _this_1._container.setLastMouseDownedItem(_this_1);
            };
            this._onMouseUpItem = function (ev) {
                if (ev.button === 1 && _this_1._container.getLastMouseDownedItem() === _this_1) {
                    _this_1._container.setCurrentItem(_this_1);
                    _this_1.activate(ev);
                }
            };
            this._onMouseClickItem = function (ev) {
                _this_1._container.setCurrentItem(_this_1);
                _this_1.activate(ev);
            };
            this._model = model;
            this._modelEventMananger = new MenuModelEventManager(model);
            this._container = container;
            //this._createView(itemNumber);
            this._view = view;
            this._setItemEvents();
            this._prepareModel(model);
        }
        MenuItemController.prototype._prepareModel = function (model) {
            if (model.isCheckable()) {
                model.updateCheckedStatByRecord();
            }
        };
        MenuItemController.prototype.getView = function () {
            return this._view;
        };
        MenuItemController.prototype.isCurrentItem = function () {
            return this._container.getCurrentItem() === this;
        };
        MenuItemController.prototype._setItemEvents = function () {
            var _this_1 = this;
            var _a, _b, _c, _d;
            var model = this._model;
            var type = model.getType();
            switch (type) {
                case 'separator':
                    (_a = this._view) === null || _a === void 0 ? void 0 : _a.addEvent('onmouseover', this._container.checkAvailabilityBeforeCall(this._onMouseOverItem, this));
                    break;
                case 'radio':
                case 'checkbox': {
                    this._modelEventMananger.add('checked', function (flag, value) {
                        var _a, _b;
                        if (!model.isCheckable())
                            return;
                        (_a = _this_1._view) === null || _a === void 0 ? void 0 : _a.update({ type: type, icon: model.getIcon(), flags: { checked: flag } });
                        (_b = _this_1._container.getView()) === null || _b === void 0 ? void 0 : _b.adjustDialog();
                    });
                }
                default: {
                    // set view events
                    (_b = this._view) === null || _b === void 0 ? void 0 : _b.addEvent('onmousemove', this._container.checkAvailabilityBeforeCall(this._onMouseOverItem, this));
                    (_c = this._view) === null || _c === void 0 ? void 0 : _c.addEvent('onmousedown', this._container.checkAvailabilityBeforeCall(this._onMouseDownItem, this));
                    (_d = this._view) === null || _d === void 0 ? void 0 : _d.addEvent('onmouseup', this._container.checkAvailabilityBeforeCall(this._onMouseUpItem, this));
                    // set normal model events
                    this._modelEventMananger.add('label', function (label, beforeLabel) {
                        var _a, _b;
                        (_a = _this_1._view) === null || _a === void 0 ? void 0 : _a.update({ label: label, type: type });
                        (_b = _this_1._container.getView()) === null || _b === void 0 ? void 0 : _b.adjustDialog();
                    });
                    this._modelEventMananger.add('icon', function (icon) {
                        var _a;
                        //this._view?.update({icon, type});
                        (_a = _this_1._container.getView()) === null || _a === void 0 ? void 0 : _a.adjustDialog();
                    });
                    if (type === 'submenu') {
                        this._modelEventMananger.add('arrow', function (icon) {
                            var _a, _b;
                            (_a = _this_1._view) === null || _a === void 0 ? void 0 : _a.update({ type: type, arrow: icon });
                            (_b = _this_1._container.getView()) === null || _b === void 0 ? void 0 : _b.adjustDialog();
                        });
                    }
                    break;
                }
            }
        };
        /**
         * activate the menu item
         * @param {(MSEventObj)} ev
         * @memberof MenuItemController
         */
        MenuItemController.prototype.activate = function (ev) {
            var _this_1 = this;
            var _a, _b, _c, _d, _e;
            if (ev === void 0) { ev = {}; }
            var model = this._model;
            // ignore separators
            if (!model.isNormal()) {
                return;
            }
            if (!((_a = this._container) === null || _a === void 0 ? void 0 : _a.isAvailable()) /*|| !this._selectable*/) {
                return false;
            }
            var queue = new Queue();
            var flags = model.getFlags();
            if (flags.unlistening) {
                return;
            }
            // set activate flag and detect transition's end
            var transitionEnded = false;
            (_b = this._view) === null || _b === void 0 ? void 0 : _b.setViewFlag('activate', true, function () {
                transitionEnded = true;
            });
            (_c = this._container.getView()) === null || _c === void 0 ? void 0 : _c.setBodyViewFlagByItem('activate', true, ((_d = this._view) === null || _d === void 0 ? void 0 : _d.getItemNumber()) || 0, model.getCustomClassNames());
            // check types
            var type = model.getType();
            // open submenu
            if (type === 'submenu' || type === 'popup') {
                if (this._container.isCurrentOpenedChildSubmenuItem(this))
                    return;
                this._container.openSubmenu(this);
            }
            // lock
            var root = this._container.getRootController();
            root.setLocked(true);
            // decide whether click or dblclick
            var doubleClicked = false;
            if (ev.type === 'mouseup') {
                var now = new Date().getTime();
                if (this === prevDblclickItem && now - prevDblclickTime <= DblClick_Delay) {
                    doubleClicked = true;
                    prevDblclickItem = null;
                }
                else {
                    prevDblclickItem = this;
                }
                prevDblclickTime = now;
            }
            else if (ev.type === 'keydown' && ev.keyCode === 13) { // *13 is enter key
                doubleClicked = true;
            }
            var clicktype = doubleClicked ? 'dblclick' : 'click';
            // create event objects beforehand because some events may execute asynchlonously after root menu disposed
            var activateEvObj = new MenuUserEventObject('activate', this);
            var closeEvObj = new MenuUserEventObject('close', this);
            var clickEvObj = new MenuUserEventObject(clicktype, this);
            // execute onchange
            if (type === 'radio' && model.isRadio() || type === 'checkbox' && model.isCheckbox()) {
                if (model.setChecked()) {
                    var changeEvObj_1 = new MenuUserEventObject('change', this);
                    queue.next(function () { return model.fireUserEvent('change', _this_1.getContainer().getContext(), changeEvObj_1); });
                }
            }
            // execute onclick or ondblclick
            model.fireUserEvent(clicktype, this.getContainer().getContext(), clickEvObj);
            var flashing = false;
            if (!model.isSubmenu()) {
                // flash
                var flash = flags.flash && (!flags.hold || doubleClicked);
                if (flash) {
                    flashing = true;
                    (_e = this._view) === null || _e === void 0 ? void 0 : _e.flashHighlight(flags.flash, function () {
                        flashing = false;
                    });
                }
                // close the menu
                if (!flags.hold || flags.unholdByDblclick && doubleClicked) {
                    if (!flash)
                        queue.sleep(100);
                    queue.next(function (val, repeat) {
                        if (!transitionEnded || flashing) {
                            repeat(100);
                            return;
                        }
                        // dispose entire menu or only current menu
                        try {
                            flags.holdParent ? _this_1._container.disposeFromParent() : _this_1._container.disposeAll();
                        }
                        catch (e) {
                        }
                        queue.next(function () { return model.fireUserEvent('close', _this_1.getContainer().getContext(), closeEvObj); });
                    });
                }
            }
            // finally fire onclick (or dblclick)
            queue.next(function (val, repeat) {
                if (!transitionEnded || flashing) {
                    repeat(100);
                    //console.log(transitionEnded+"/"+flashing, "red");
                    return;
                }
                // fire acitvate event
                model.fireUserEvent('activate', _this_1.getContainer().getContext(), activateEvObj);
                root.setLocked(false);
                root = null;
            });
        };
        /**
         * fire if the mouse cursor hover on the item for more than certain time
         * @memberof MenuItemController
         */
        MenuItemController.prototype.fireMouseStay = function () {
            var _a, _b, _c;
            switch (this.getModel().getType()) {
                case 'submenu':
                    //this._container.openSubmenu(this);
                    if ((_a = this._container) === null || _a === void 0 ? void 0 : _a.isAvailable()) {
                        if (!this._container.isCurrentOpenedChildSubmenuItem(this) || !((_b = this._view) === null || _b === void 0 ? void 0 : _b.getViewFlag('activate')))
                            this.activate();
                    }
                    else
                        return false;
                    break;
                case 'popup':
                    if ((_c = this._container.getChild()) === null || _c === void 0 ? void 0 : _c.getBasedItemController()) {
                        break;
                    }
                    this._container.disposeChild();
                    break;
            }
        };
        MenuItemController.prototype.getModel = function () {
            return this._model;
        };
        MenuItemController.prototype.getContainer = function () {
            return this._container;
        };
        MenuItemController.prototype.dispose = function (destroy) {
            var _a;
            (_a = this._view) === null || _a === void 0 ? void 0 : _a.dispose();
            this._view = null;
            this._modelEventMananger.dispose();
            if (destroy) {
                this._model.dispose();
                this._model = null;
                this._container = null;
            }
        };
        return MenuItemController;
    }());
    var MenuModelEventManager = /** @class */ (function () {
        function MenuModelEventManager(model) {
            this._hookedModelEventIds = [];
            this._model = model;
        }
        MenuModelEventManager.prototype.add = function (handler, callback) {
            var id = this._model.addMenuModelEvent(handler, callback);
            this._hookedModelEventIds.push({ handler: handler, id: id });
        };
        MenuModelEventManager.prototype.dispose = function () {
            for (var _i = 0, _a = this._hookedModelEventIds; _i < _a.length; _i++) {
                var _b = _a[_i], handler = _b.handler, id = _b.id;
                this._model.removeMenuModelEvent(handler, id);
            }
            this._model = null;
            this._hookedModelEventIds.length = 0;
        };
        return MenuModelEventManager;
    }());
    /**
     * each user event interacts with menu items through this wrapper.
     * this event object is passed as a first argument to each event handler.
     */
    var MenuUserEventObject = /** @class */ (function () {
        function MenuUserEventObject(type, ctrl) {
            this.cancelGlobal = false;
            this.type = type;
            var model = ctrl.getModel();
            if (ctrl instanceof MenuItemController) {
                this.ctx = ctrl.getContainer().getContext();
                this.srcContext = this.ctx;
                this.target = new MenuItemUI(ctrl);
                this.id = model.getId();
                this.index = model.getIndex();
                if (model.isCheckable()) {
                    this.value = model.getValue();
                    this.name = model.getName() || undefined;
                    this.radioIndex = model.isRadio() ? model.getRadioIndex() : undefined;
                    this.checked = model.isChecked();
                }
            }
            else {
                this.ctx = ctrl.getContext();
                this.srcContext = this.ctx;
                this.target = new MenuContainerUI(ctrl);
            }
        }
        MenuUserEventObject.prototype.dispose = function () {
            if (!this.target)
                return; // disposed already
            this.ctx = null;
            this.srcContext = null;
            this.target.dispose();
            this.target = null;
            this.value = null;
        };
        return MenuUserEventObject;
    }());
    var _MenuUI = /** @class */ (function () {
        function _MenuUI(ctrl) {
            this._ctrl = ctrl;
        }
        _MenuUI.prototype.dispose = function () {
            this._ctrl = null;
        };
        return _MenuUI;
    }());
    var MenuContainerUI = /** @class */ (function (_super) {
        __extends(MenuContainerUI, _super);
        function MenuContainerUI(ctrl) {
            return _super.call(this, ctrl) || this;
        }
        MenuContainerUI.prototype.loadSkin = function (css, root) {
            if (root === void 0) { root = false; }
            root ? this._ctrl.getRootController().getModel().setSkin(css) : this._ctrl.getModel().setSkin(css);
        };
        /**
         * create stand alone popup dialog
         */
        MenuContainerUI.prototype.popup = function (args /*PopupControllerParameter*/, marginX, marginY) {
            /*
            if( !this._ctrl!.getView() )
              return;
            console.log('#start_confirm', "orange")
            new PopupController(args, this._ctrl, marginX, marginY);
            console.log('#end_confirm', "orange")
            */
        };
        return MenuContainerUI;
    }(_MenuUI));
    var MenuItemUI = /** @class */ (function (_super) {
        __extends(MenuItemUI, _super);
        function MenuItemUI(ctrl) {
            return _super.call(this, ctrl) || this;
        }
        MenuItemUI.prototype.getContainer = function () {
            return new MenuContainerUI(this._ctrl.getContainer());
        };
        MenuItemUI.prototype.setLabel = function (text, asHtml) {
            var model = this._ctrl.getModel();
            model.isNormal() && model.setLabel(text);
        };
        MenuItemUI.prototype.getLabel = function () {
            return this._ctrl.getModel().getLabel();
        };
        MenuItemUI.prototype.setIcon = function (icon) {
            var model = this._ctrl.getModel();
            if (model.isNormal())
                model.setIcon(icon);
            else
                throw new Error("could not set the icon to the item. type:\"".concat(model.getType(), "\""));
        };
        MenuItemUI.prototype.remove = function () { };
        return MenuItemUI;
    }(_MenuUI));

    var major=0;var minor=0;var build=15;var tag="";var Ver = {major:major,minor:minor,build:build,tag:tag};

    var HTAContextMenu = /** @class */ (function (_super) {
        __extends(HTAContextMenu, _super);
        function HTAContextMenu(param) {
            return _super.call(this, param) || this;
        }
        HTAContextMenu.prototype.getVersion = function () {
            return "".concat(Ver.major, ".").concat(Ver.minor, ".").concat(Ver.build).concat(Ver.tag);
        };
        HTAContextMenu.prototype.showVersion = function () {
            alert("HTAContextMenu v" + this.getVersion());
        };
        return HTAContextMenu;
    }(MenuRootController));

    return HTAContextMenu;

})();
