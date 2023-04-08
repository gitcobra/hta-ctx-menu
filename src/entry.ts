import { MenuRootController } from "./menuctrl";
import { MenuItemSubmenuParameter } from "./menumodel";
import Ver from "../res/version.json";

interface HTAContextMenuArguments extends Omit<MenuItemSubmenuParameter, 'type' | 'label'> {
  type?: 'submenu' | 'popup'
  onunload?: (...args: any) => any
}

DEV: {
  Ver.tag = 'dev';
}

export default class HTAContextMenu extends MenuRootController {
  constructor(param: HTAContextMenuArguments) {
    super(param as MenuItemSubmenuParameter);
  }
  getVersion() {
    return `${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
  }
  showVersion() {
    alert(`HTAContextMenu v` + this.getVersion());
  }
}
