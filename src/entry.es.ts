import { MenuRootController } from "./menuctrl";
import { MenuItemSubmenuParameter } from "./menumodel";
import Ver from "../res/version.json";

interface HTAContextMenuArguments<CTX> extends Omit<MenuItemSubmenuParameter<CTX>, 'type' | 'label'> {
  type?: 'submenu' | 'popup'
  onunload?: (...args: any) => any
}

DEV: {
  Ver.tag = 'dev';
}

class HTAContextMenu<CTX> extends MenuRootController<CTX> {
  constructor(param: HTAContextMenuArguments<CTX>) {
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
export { HTAContextMenu };
// types
export { HTAContextMenuArguments };
export { MenuItemsCreateParameter } from "./menumodel"
