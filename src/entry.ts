import { MenuRootController } from "./menuctrl";
import { MenuItemCreateParameter, MenuItemCreateParameterList, MenuItemSubmenuParameter } from "./menumodel";
import Ver from "../res/version.json";

interface HtaContextMenuArguments<CTX> extends Omit<MenuItemSubmenuParameter<CTX>, 'type' | 'label'> {
  type?: 'submenu' | 'popup'
  onunload?: (...args: any) => any
}

DEV: {
  Ver.tag = 'dev';
}

export default class HtaContextMenu<CTX> extends MenuRootController<CTX> {
  Types: {
    MenuParameter: HtaContextMenuArguments<CTX>
    MenuParameterList: MenuItemCreateParameterList<CTX>
    MenuItemParameter: MenuItemCreateParameter<CTX>
    OndemandResult: MenuItemCreateParameter<CTX> | MenuItemCreateParameterList<CTX> | null | undefined
  } = {} as any;

  constructor(param: HtaContextMenuArguments<CTX>) {
    super(param as MenuItemSubmenuParameter<CTX>);
  }
  getVersion() {
    return `${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
  }
  showVersion() {
    alert(`HTAContextMenu v` + this.getVersion());
  }
}

// constructor
//export default HtaContextMenu;
/*
// types
export { HtaContextMenuArguments };
export { MenuItemsCreateParameter } from "./menumodel"
*/