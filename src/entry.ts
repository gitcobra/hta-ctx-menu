import { MenuRootController } from "./menuctrl";
import { MenuItemCreateParameter, MenuItemCreateParameterList, MenuItemSubmenuParameter } from "./menumodel";
import Ver from "../res/version.json";

interface HtaContextMenuArguments extends Omit<MenuItemSubmenuParameter, 'type' | 'label'> {
  type?: 'submenu' | 'popup'
  onunload?: (...args: any) => any
}

DEV: {
  Ver.tag = 'dev';
}

export default class HtaContextMenu extends MenuRootController {
  Types: {
    MenuParameter: HtaContextMenuArguments
    MenuParameterList: MenuItemCreateParameterList
    MenuItemParameter: MenuItemCreateParameter
    OndemandResult: MenuItemCreateParameter | MenuItemCreateParameterList | null | undefined
  } = {} as any;

  constructor(param: HtaContextMenuArguments) {
    super(param as MenuItemSubmenuParameter);
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