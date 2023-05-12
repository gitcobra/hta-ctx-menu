import HtaContextMenu from "../dist/hta-ctx-menu.esm";


const CheckRecord = { checked: false };

const menu = new HtaContextMenu<HTMLElement>({
  skin: 'classic',
  //autoClose: false,
  //fontSize: 20,
  items: [
    {
      type: 'demand',
      ondemand(ev, ctx) {
        if( ctx.nodeName !== 'A' )
          return;
        
        return [{
          type: 'submenu',
          label: 'edit font',
          icon: {
            text: 'J',
            fontFamily: 'WingDings',
          },
          items: [
            {
              label: 'Font size +',
              icon: {
                text: 'Ù',
                fontFamily: 'WingDings',
              },
              onactivate(ev, ctx) {
                ctx.style.fontSize = parseInt(ev.ctx.currentStyle.fontSize) * 1.3 + 'px';
              }
            },
            {
              label: 'Font size -',
              icon: {
                text: 'Ú',
                fontFamily: 'WingDings',
              },
              onclick() {
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
              selectedIndex: (() => {
                const col = ev.ctx.currentStyle.color;
                switch(col) {
                  case 'red':
                    return 1;
                  case 'blue':
                    return 2;
                  default:
                    return 0;
                }
              })(),
              onchange(ev, ctx) {
                ctx.style.color = ev.value;
              }
            }
          ],
        }, {
          type: 'separator'
        }];
      },
    }, {
      label: 'Internal Skins',
      type: 'submenu',
      items: [{
        type: 'radios',
        selectedIndex: 1,
        global: true,
        name: 'skinradio',
        labels: ['default', 'classic', 'xp', 'win7'],
        onchange(ev, ctx: HTMLElement) {
          menu.loadSkin(ev.value);
        }
      }],
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
        onchange(ev) {
          menu.loadSkin('../skins/chimi/chimi.css');
        },
      }, {
        type: 'radio',
        label: 'invalid skin',
        value: 'test',
        global: true,
        name: 'skinradio',
        onchange(ev) {
          menu.loadSkin("test");
        },
      }],
    },
    { type: 'separator' },
    {
      type: 'checkbox',
      label: 'this is linked to the checkbox',
      onchange(ev, ctx) {
        Checkbox.checked = !!ev.checked;
        // @ts-ignore
        Checkbox.onclick(ev.checked);
      },
      record: CheckRecord,
    },
    {
      type: 'demand',
      ondemand() {
        return [
          {
            type: 'submenu',
            label: 'damandable radio',
            items: [
              {
                type: 'radios',
                global: true,
                name: 'demandableradio',
                labels: [
                  {label: 'A', id:'A1'},
                  {label: 'B', id:'B1'},
                  {label: 'C', id:'C1'},
                ]
              }
            ]
          }
        ]
      }
    }
  ]
});


document.oncontextmenu = () => {
  menu.open(event.screenX, event.screenY, event.srcElement as HTMLElement);
  return false;
};

const Checkbox = document.getElementById('checkbox')! as HTMLInputElement;
Checkbox.onclick = () => changeBackgroundColor(Checkbox.checked);
// @ts-ignore
setTimeout(() => Checkbox.onclick(), 0);

function changeBackgroundColor(flag: boolean) {
  CheckRecord.checked = flag;
  document.body.style.backgroundColor = !flag ? 'white' : 'gray';
}
