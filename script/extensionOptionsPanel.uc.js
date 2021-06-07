// ==UserScript==
// @name           Extension Options Panel
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This script creates a toolbar button that opens a popup panel where extensions can be configured, disabled, uninstalled, etc. Each extension gets its own button in the panel. Clicking an extension's button leads to a subview where you can jump to the extension's options, disable or enable the extension, uninstall it, view its source code in whatever program is associated with .xpi files, open the extension's homepage, or copy the extension's ID. Based on a similar script by xiaoxiaoflood, but will not be compatible with xiaoxiaoflood's loader. This one requires fx-autoconfig or Alice0775's loader. It opens a panel instead of a menupopup, for more consistency with other toolbar widgets. There are configuration options directly below.
// ==/UserScript==

class ExtensionOptionsWidget {
    // user configuration
    static config = {
        "Show version": false, // show the addon version next to its name in the list

        "Show hidden extensions": false, // show system extensions?

        "Show disabled extensions": true, // show extensions that you've disabled?

        "Show enabled extensions first": true, // show enabled extensions at the top of the list and disabled extensions at the bottom?

        "Addon ID blacklist": [], // put addon IDs in this list, separated by commas, to exclude them from the list, e.g. ["screenshots@mozilla.org", "dark-theme@mozilla.org"]

        "Icon URL": `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity" viewBox="0 0 16 16"><path d="M0 9.026c0 1.132.919 2.051 2.051 2.051v3.274c0 .903.738 1.641 1.641 1.641H6.81c0-2.207 1.772-2.453 2.215-2.453.443 0 2.215.238 2.215 2.462h3.118A1.647 1.647 0 0016 14.359v-3.118c-2.224 0-2.462-1.772-2.462-2.215 0-.443.238-2.215 2.462-2.215V3.692c0-.903-.738-1.641-1.641-1.641h-3.282a2.052 2.052 0 00-4.103 0H3.692c-.903 0-1.641.738-1.641 1.641v3.282A2.052 2.052 0 000 9.026z"/></svg>`, // if you want to change the button's icon for some reason, you can replace this string with any URL or data URL that leads to an image.

        "Button label": "Extension Options Panel", // what should the button's label be when it's in the overflow panel or customization palette?

        "Button tooltip": "Extension options", // what should the button's tooltip be? I use sentence case since that's the convention.
    };

    /**
     * create a DOM node with given parameters
     * @param {object} aDoc (which doc to create the element in)
     * @param {string} tag (an HTML tag name, like "button" or "p")
     * @param {object} props (an object containing attribute name/value pairs, e.g. class: ".bookmark-item")
     * @param {boolean} isHTML (if true, create an HTML element. if omitted or false, create a XUL element. generally avoid HTML when modding the UI, most UI elements are actually XUL elements.)
     * @returns the created DOM node
     */
    create(aDoc, tag, props, isHTML = false) {
        let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
        for (let prop in props) {
            el.setAttribute(prop, props[prop]);
        }
        return el;
    }

    /**
     * make a valid ID for a DOM node based on an extension's ID.
     * @param {string} id (an extension's ID)
     * @returns an ID with crap removed so it can be used in a DOM node's ID.
     */
    makeWidgetId(id) {
        id = id.toLowerCase();
        return id.replace(/[^a-z0-9_-]/g, "_");
    }

    // where panelviews are hiding when we're not looking
    get viewCache() {
        return document.getElementById("appMenu-viewCache");
    }

    constructor() {
        this.viewId = "PanelUI-eom";
        this.config = ExtensionOptionsWidget.config;
        if (
            /^chrome:\/\/browser\/content\/browser.(xul||xhtml)$/i.test(location) &&
            !CustomizableUI.getPlacementOfWidget("eom-button", true)
        )
            CustomizableUI.createWidget({
                id: "eom-button",
                viewId: this.viewId,
                type: "view",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                removable: true,
                label: this.config["Button label"],
                tooltiptext: this.config["Button tooltip"],
                // if the button is middle-clicked, open the addons page instead of the panel
                onClick: (event) => {
                    if (event.button == 1) BrowserOpenAddonsMgr("addons://list/extension");
                },
                // create the panelview before the toolbar button
                onBeforeCreated: (aDoc) => {
                    let view = this.create(aDoc, "panelview", {
                        id: this.viewId,
                        class: "PanelUI-subView cui-widget-panelview",
                        flex: "1",
                    });
                    aDoc.getElementById("appMenu-viewCache").appendChild(view);
                    aDoc.defaultView.extensionOptionsPanel.panelview = view;

                    let body = this.create(aDoc, "vbox", {
                        id: view.id + "-body",
                        class: "panel-subview-body",
                    });
                    view.appendChild(body);
                },
                // populate the panel before it's shown
                onViewShowing: (event) => {
                    if (
                        event.originalTarget ===
                        event.target.ownerGlobal.extensionOptionsPanel.panelview
                    )
                        event.target.ownerGlobal.extensionOptionsPanel.getAddonsAndPopulate(event);
                },
                // delete the panel if the widget node is destroyed
                onDestroyed: (aDoc) => {
                    let view = aDoc.getElementById(this.viewId);
                    if (view) {
                        CustomizableUI.hidePanelForNode(view);
                        view.remove();
                    }
                },
            });
        this.loadStylesheet(); // load the stylesheet
    }

    /**
     * grab all addons and populate the panel with them.
     * @param {object} e (a ViewShowing event)
     */
    getAddonsAndPopulate(e) {
        AddonManager.getAddonsByTypes(["extension"]).then((addons) =>
            this.populatePanelBody(e, addons)
        );
    }

    /**
     * create everything inside the panel
     * @param {object} e (a ViewShowing event - its target is the panelview node)
     * @param {array} addons (an array of addons)
     */
    populatePanelBody(e, addons) {
        let prevState;
        let view = e?.target || this.panelview;
        let body = view.querySelector(".panel-subview-body");
        let enabledFirst = this.config["Show enabled extensions first"];
        let showVersion = this.config["Show version"];
        let showDisabled = this.config["Show disabled extensions"];
        let blackListArray = this.config["Addon ID blacklist"];

        // clear all the panel items and subviews before rebuilding them.
        while (body.hasChildNodes()) body.removeChild(body.firstChild);
        Array.from(this.viewCache.children).forEach((panel) => {
            if (panel.id.includes("PanelUI-eom-addon-")) panel.remove();
        });

        // all addons...
        addons
            .sort((a, b) => {
                // get sorted by enabled state...
                let ka = (enabledFirst ? (a.isActive ? "0" : "1") : "") + a.name.toLowerCase();
                let kb = (enabledFirst ? (b.isActive ? "0" : "1") : "") + b.name.toLowerCase();
                return ka < kb ? -1 : 1;
            })
            .forEach((addon) => {
                // then get excluded if config wills it...
                if (
                    !blackListArray.includes(addon.id) &&
                    (!addon.hidden || this.config["Show hidden extensions"]) &&
                    (!addon.userDisabled || showDisabled)
                ) {
                    // then get built into subviewbuttons...
                    if (showDisabled && enabledFirst && prevState && addon.isActive != prevState)
                        body.appendChild(document.createXULElement("toolbarseparator"));
                    prevState = addon.isActive;

                    let subviewbutton = this.create(document, "toolbarbutton", {
                        label: addon.name + (showVersion ? " " + addon.version : ""),
                        class: "subviewbutton subviewbutton-nav",
                        image: addon.iconURL || this.config["Icon URL"],
                        oncommand: "extensionOptionsPanel.showSubView(event, this)",
                        "widget-type": "view",
                    });
                    subviewbutton._Addon = addon;

                    this.setDisableStyle(subviewbutton, addon, false);

                    body.appendChild(subviewbutton);
                    this.buildSubView(addon, subviewbutton); // and subviews...
                }
            });

        // if no addons are shown, display a "Download Addons" button that leads to AMO.
        let getAddonsButton = this.create(document, "toolbarbutton", {
            id: "eom-get-addons-button",
            class: "subviewbutton",
            label: "Download Addons",
            oncommand: `switchToTabHavingURI("https://addons.mozilla.org", true, {
                    inBackground: false,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });`,
        });
        body.appendChild(getAddonsButton);

        body.appendChild(document.createXULElement("toolbarseparator"));

        // make a footer button that leads to about:addons
        let allAddonsButton = this.create(document, "toolbarbutton", {
            label: "Addons Page",
            class: "subviewbutton",
            oncommand: `BrowserOpenAddonsMgr("addons://list/extension")`,
        });
        body.appendChild(allAddonsButton);
        getAddonsButton.hidden = body.children.length > 3;
    }

    /**
     * show the subview for a given extension
     * @param {object} event (a triggering command/click event)
     * @param {object} anchor (the subviewbutton that was clicked — dictates the title of the subview)
     */
    showSubView(event, anchor) {
        if (!("_Addon" in anchor)) return;
        PanelUI.showSubView(
            "PanelUI-eom-addon-" + this.makeWidgetId(anchor._Addon.id),
            anchor,
            event
        );
    }

    /**
     * for a given addon, build a panel subview
     * @param {object} addon (an addon object provided by the AddonManager, with all the data we need)
     */
    buildSubView(addon, subviewbutton) {
        let view = this.create(document, "panelview", {
            id: "PanelUI-eom-addon-" + this.makeWidgetId(addon.id), // turn the extension ID into a DOM node ID
            flex: "1",
            class: "PanelUI-subView cui-widget-panelview",
        });
        document.createXULElement("panelview");
        this.viewCache.appendChild(view); // put it in the panel view cache, showSubView will pull it out later

        // create options button
        if (addon.optionsURL) {
            let optionsButton = this.create(document, "toolbarbutton", {
                label: "Addon Options",
                class: "subviewbutton",
            });
            optionsButton.addEventListener("command", (e) => this.openAddonOptions(addon));
            view.appendChild(optionsButton);
        }

        // disable button
        let disableButton = this.create(document, "toolbarbutton", {
            label: addon.userDisabled ? "Enable Addon" : "Disable Addon",
            class: "subviewbutton",
            closemenu: "none",
            oncommand: `PanelMultiView.forNode(this.parentElement).node.panelMultiView.goBack()`,
        });
        disableButton.addEventListener("command", (e) => {
            addon.userDisabled ? addon.enable() : addon.disable();
            this.getAddonsAndPopulate();
        });
        view.appendChild(disableButton);

        // uninstall button, and so on...
        let uninstallButton = this.create(document, "toolbarbutton", {
            label: "Uninstall Addon",
            class: "subviewbutton",
        });
        uninstallButton.addEventListener("command", (e) => {
            if (Services.prompt.confirm(null, null, `Delete ${addon.name} permanently?`))
                addon.pendingOperations & AddonManager.PENDING_UNINSTALL
                    ? addon.cancelUninstall()
                    : addon.uninstall();
        });
        view.appendChild(uninstallButton);

        let viewSrcButton = this.create(document, "toolbarbutton", {
            label: "View Source",
            class: "subviewbutton",
        });
        viewSrcButton.addEventListener("command", (e) => this.openArchive(addon));
        view.appendChild(viewSrcButton);

        if (addon.homepageURL) {
            let homePageButton = this.create(document, "toolbarbutton", {
                label: "Open Homepage",
                class: "subviewbutton",
            });
            homePageButton.addEventListener("command", (e) => {
                switchToTabHavingURI(addon.homepageURL, true, {
                    inBackground: false,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
            });
            view.appendChild(homePageButton);
        }

        let copyIdButton = this.create(document, "toolbarbutton", {
            label: "Copy ID",
            class: "subviewbutton panel-subview-footer-button",
        });
        copyIdButton.addEventListener("command", (e) =>
            Cc["@mozilla.org/widget/clipboardhelper;1"]
                .getService(Ci.nsIClipboardHelper)
                .copyString(addon.id)
        );
        view.appendChild(copyIdButton);
    }

    /**
     * for a given subviewbutton-addon pair, decide whether the button should be styled as a disabled button
     * @param {object} subviewbutton (an addon button in the list)
     * @param {object} addon (an addon object from AddonManager)
     */
    setDisableStyle(subviewbutton, addon) {
        let cls = subviewbutton.classList;
        if (addon.operationsRequiringRestart) {
            if (addon.userDisabled && addon.isActive) cls.add("disabling");
            else if (!addon.userDisabled && !addon.isActive) cls.add("enabling");
        }
        if (!addon.isActive) cls.add("disabled");
        if (!addon.optionsURL) cls.add("noOptions");
    }

    /**
     * open a given addon's options page
     * @param {object} addon (an addon object)
     */
    openAddonOptions(addon) {
        if (!addon.isActive || !addon.optionsURL) return;

        switch (Number(addon.optionsType)) {
            case 5:
                BrowserOpenAddonsMgr(
                    "addons://detail/" + encodeURIComponent(addon.id) + "/preferences"
                );
                break;
            case 3:
                switchToTabHavingURI(addon.optionsURL, true);
                break;
            case 1:
                let windows = Services.wm.getEnumerator(null);
                while (windows.hasMoreElements()) {
                    let win2 = windows.getNext();
                    if (win2.closed) continue;
                    if (win2.document.documentURI == addon.optionsURL) {
                        win2.focus();
                        return;
                    }
                }
                let features = "chrome,titlebar,toolbar,centerscreen";
                if (Services.prefs.getBoolPref("browser.preferences.instantApply"))
                    features += ",dialog=no";
                openDialog(addon.optionsURL, addon.id, features);
        }
    }

    /**
     * open a given addon's source xpi file
     * @param {object} addon (an addon object)
     */
    openArchive(addon) {
        let dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        dir.append("extensions");
        dir.append(addon.id + ".xpi");
        dir.launch();
    }

    // generate and load a stylesheet
    loadStylesheet() {
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
            Ci.nsIStyleSheetService
        );
        let uri = makeURI(
            "data:text/css;charset=UTF=8," +
                encodeURIComponent(`#eom-button {
                        list-style-image: url('${this.config["Icon URL"]}');
                    }
                    #PanelUI-eom .subviewbutton[image] .toolbarbutton-icon {
                        height: 16px;
                        width: 16px;
                    }
                    #PanelUI-eom .enabling label:after {
                        content: "+" !important;
                    }
                    #PanelUI-eom .disabling label:after {
                        content: "-" !important;
                    }
                    #PanelUI-eom .uninstalling label:after {
                        content: "!" !important;
                    }
                    #PanelUI-eom .disabled label {
                        opacity: 0.6;
                        font-style: italic;
                    }`)
        );
        if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }
}

window.extensionOptionsPanel = new ExtensionOptionsWidget();