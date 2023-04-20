(function (HTAContextMenu) {
    'use strict';

    var CheckRecord = { checked: false };
    var menu = new HTAContextMenu({
        skin: 'classic',
        //autoClose: false,
        //fontSize: 20,
        items: [
            {
                type: 'demand',
                ondemand: function (ev, ctx) {
                    if (ctx.nodeName !== 'A')
                        return;
                    return [{
                            type: 'submenu',
                            label: 'edit font',
                            icon: {
                                text: 'J',
                                fontFamily: 'WingDings'
                            },
                            items: [
                                {
                                    label: 'Font size +',
                                    icon: {
                                        text: 'Ù',
                                        fontFamily: 'WingDings'
                                    },
                                    onactivate: function (ev, ctx) {
                                        ctx.style.fontSize = parseInt(ev.ctx.currentStyle.fontSize) * 1.3 + 'px';
                                    }
                                },
                                {
                                    label: 'Font size -',
                                    icon: {
                                        text: 'Ú',
                                        fontFamily: 'WingDings'
                                    },
                                    onclick: function () {
                                        ctx.style.fontSize = parseInt(ev.ctx.currentStyle.fontSize) * 0.7 + 'px';
                                    }
                                },
                                { type: 'separator' },
                                {
                                    type: 'radios',
                                    name: 'editfont',
                                    html: true,
                                    labels: [
                                        ['<font color="black">■black</font>', 'black'],
                                        ['<font color="red">■red</font>', 'red'],
                                        ['<font color="blue">■blue</font>', 'blue'],
                                    ],
                                    selectedIndex: (function () {
                                        var col = ev.ctx.currentStyle.color;
                                        switch (col) {
                                            case 'red':
                                                return 1;
                                            case 'blue':
                                                return 2;
                                            default:
                                                return 0;
                                        }
                                    })(),
                                    onchange: function (ev, ctx) {
                                        ctx.style.color = ev.value;
                                    }
                                }
                            ]
                        }, {
                            type: 'separator'
                        }];
                }
            }, {
                label: 'Internal Skins',
                type: 'submenu',
                items: [{
                        type: 'radios',
                        selectedIndex: 1,
                        global: true,
                        name: 'skinradio',
                        labels: ['default', 'classic', 'xp', 'win7'],
                        onchange: function (ev, ctx) {
                            menu.loadSkin(ev.value);
                        }
                    }]
            },
            {
                label: 'External Skins',
                type: 'submenu',
                items: [{
                        type: 'radio',
                        label: 'chimi',
                        value: 'chimi',
                        global: true,
                        name: 'skinradio',
                        onchange: function (ev) {
                            menu.loadSkin('../skins/chimi/chimi.css');
                        }
                    }, {
                        type: 'radio',
                        label: 'invalid skin',
                        value: 'test',
                        global: true,
                        name: 'skinradio',
                        onchange: function (ev) {
                            menu.loadSkin("test");
                        }
                    }]
            },
            { type: 'separator' },
            {
                type: 'checkbox',
                label: 'this is linked to the checkbox',
                onchange: function (ev, ctx) {
                    Checkbox.checked = !!ev.checked;
                    // @ts-ignore
                    Checkbox.onclick(ev.checked);
                },
                record: CheckRecord
            }
        ]
    });
    document.oncontextmenu = function () {
        menu.open(event.screenX, event.screenY, event.srcElement);
        return false;
    };
    var Checkbox = document.getElementById('checkbox');
    Checkbox.onclick = function () { return changeBackgroundColor(Checkbox.checked); };
    // @ts-ignore
    setTimeout(function () { return Checkbox.onclick(); }, 0);
    function changeBackgroundColor(flag) {
        CheckRecord.checked = flag;
        document.body.style.backgroundColor = !flag ? 'white' : 'gray';
    }

})(HTAContextMenu);
