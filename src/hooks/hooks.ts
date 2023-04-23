import { AppContext } from "./context";
import { App } from "obsidian";
import React from "react";

export const useApp = (): App | undefined => {
	return React.useContext(AppContext);
};
