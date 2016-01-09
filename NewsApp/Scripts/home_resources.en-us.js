var resources = {
    get_pageTitle: function () { return "Home"; },
    get_pagesHeaderTitle: function () { return "Pages"; },
    get_listsHeaderTitle: function () { return "Lists"; },

    get_recycleBinLinkText: function () { return "RECYCLE BIN"; },
    get_calloutLinkTitle: function () { return "Click for more information."; },
    get_calloutIconAlt: function () { return "Open Menu"; },
    get_settingsActionText: function () { return "SETTINGS"; },
    get_settingsActionTooltip: function () { return "Settings"; },

    get_permissionsWarningText: function () { return "App permissions are not set. <a href='Permissions.aspx'>(Manage permissions)</a>"; },

    get_pages: function () {
        return [
            {
                title: "News",
                description: "Use this page to view published news.",
                onclick: "window.open('News.aspx')"
            },
            {
                title: "Manage permissions",
                description: "Use this page to manage app permissions.",
                href: "Permissions.aspx",
                permissionKinds: [SP.PermissionKind.manageWeb]
            }
        ];
    },

    get_lists: function () {
        return [
            { url: "/Lists/News/", iconSrc: "/_layouts/15/images/ltgen.png?rev=33", permissionKinds: [SP.PermissionKind.addListItems, SP.PermissionKind.editListItems, SP.PermissionKind.deleteListItems] },
            { url: "/Assets/", iconSrc: "/_layouts/15/images/ltdl.png?rev=39", permissionKinds: [SP.PermissionKind.addListItems, SP.PermissionKind.editListItems, SP.PermissionKind.deleteListItems] },
            { url: "/Lists/Likes/", iconSrc: "/_layouts/15/images/ltgen.png?rev=33", permissionKinds: [SP.PermissionKind.manageWeb] },
            { url: "/Lists/Comments/", iconSrc: "/_layouts/15/images/ltgen.png?rev=33", permissionKinds: [SP.PermissionKind.manageWeb] }
        ];
    },

    getListItemsCountText: function (itemsCount) {
        if (itemsCount == 1) {
            return "1 item";
        }
        else {
            return itemsCount + " items";
        }
    }
};